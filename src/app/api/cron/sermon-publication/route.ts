import "server-only";

import { revalidatePath } from "next/cache";
import {
  checkSermonReadyToPublish,
  isValidPrivateSermonAudioAsset,
  type PublicationRow,
} from "@/lib/sermon-publication";
import {
  checkVideoSermonReadyToPublish,
  type VideoPublicationRow,
} from "@/lib/sermon-video-publication";
import {
  isValidSchedulerAuthorization,
  schedulerClaimMatches,
} from "@/lib/sermon-scheduler";
import { createSupabaseStorageServerClient } from "@/lib/supabase/storage-server";

const BATCH_SIZE = 100;

function response(body: Record<string, unknown>, status = 200) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function authorized(request: Request): boolean {
  return isValidSchedulerAuthorization(
    request.headers.get("authorization"),
    process.env.SERMON_SCHEDULER_SECRET,
  );
}

type DueSermonRow = {
  id: string;
  publication_status: "draft" | "scheduled" | "published" | "archived";
  published_at: string | null;
  resource_type: unknown;
} & PublicationRow &
  VideoPublicationRow;

async function publishDueAudioSermon(
  supabase: ReturnType<typeof createSupabaseStorageServerClient>,
  resource: DueSermonRow,
  now: string,
): Promise<boolean> {
  const readiness = checkSermonReadyToPublish(resource, resource.id);
  if (!readiness.ok) return false;

  const { data: assets, error: assetError } = await supabase
    .from("assets")
    .select("id, storage_bucket, object_path, media_type, mime_type")
    .in("id", readiness.audioAssetIds);
  if (assetError || !assets?.length) return false;

  let audioExists = false;
  for (const asset of assets) {
    if (!isValidPrivateSermonAudioAsset(asset)) continue;
    const { data: exists, error: existsError } = await supabase.storage
      .from("sermon-audio")
      .exists(asset.object_path);
    if (!existsError && exists) {
      audioExists = true;
      break;
    }
  }
  if (!audioExists) return false;

  // Same status + timestamp transition the audio path has always used.
  const { data: updated, error: updateError } = await supabase
    .from("resources")
    .update({ publication_status: "published", published_at: now })
    .eq("id", resource.id)
    .eq("resource_type", "audio")
    .eq("publication_status", "scheduled")
    .eq("published_at", resource.published_at)
    .lte("published_at", now)
    .select("id")
    .maybeSingle();
  return !updateError && Boolean(updated);
}

async function publishDueVideoSermon(
  supabase: ReturnType<typeof createSupabaseStorageServerClient>,
  resource: DueSermonRow,
  now: string,
): Promise<boolean> {
  // Video readiness re-validates the stored YouTube URL; scheduled videos
  // with missing or invalid URLs stay unpublished.
  const readiness = checkVideoSermonReadyToPublish(resource, resource.id);
  if (!readiness.ok) return false;

  // Identical status + timestamp transition to the audio path. The stored
  // video details are left untouched: description holds sermon text and the
  // canonical YouTube URL was already stored in video_details at save time.
  const { data: updated, error: updateError } = await supabase
    .from("resources")
    .update({ publication_status: "published", published_at: now })
    .eq("id", resource.id)
    .eq("resource_type", "video")
    .eq("publication_status", "scheduled")
    .eq("published_at", resource.published_at)
    .lte("published_at", now)
    .select("id")
    .maybeSingle();
  return !updateError && Boolean(updated);
}

export async function GET(request: Request) {
  if (!authorized(request))
    return response({ error: "Unauthorized." }, 401);

  try {
    const supabase = createSupabaseStorageServerClient();
    const now = new Date().toISOString();
    const { data: due, error } = await supabase
      .from("resources")
      .select(
        `id, title, resource_type, publication_status, published_at,
        sermon_details(resource_id), audio_details(resource_id),
        video_details(resource_id, external_url),
        resource_assets(purpose, asset_id, assets(id, media_type))`,
      )
      .in("resource_type", ["audio", "video"])
      .eq("publication_status", "scheduled")
      .lte("published_at", now)
      .order("published_at", { ascending: true })
      .limit(BATCH_SIZE);
    if (error || !due) return response({ error: "Scheduler unavailable." }, 503);

    let published = 0;
    let publishedAudio = 0;
    let publishedVideo = 0;
    let skipped = 0;
    const nowDate = new Date(now);
    for (const resource of due as unknown as DueSermonRow[]) {
      if (
        !schedulerClaimMatches(
          resource.publication_status,
          resource.published_at,
          resource.published_at,
          nowDate,
        )
      ) {
        skipped += 1;
        continue;
      }

      const mediaType = resource.resource_type === "video" ? "video" : "audio";
      const succeeded = mediaType === "video"
        ? await publishDueVideoSermon(supabase, resource, now)
        : await publishDueAudioSermon(supabase, resource, now);
      if (succeeded) {
        published += 1;
        if (mediaType === "video") publishedVideo += 1;
        else publishedAudio += 1;
      } else {
        skipped += 1;
      }
    }

    if (published > 0) {
      revalidatePath("/sermons");
      revalidatePath("/admin/sermons");
      revalidatePath("/admin");
    }
    return response({
      scanned: due.length,
      published,
      publishedAudio,
      publishedVideo,
      skipped,
      hasMore: due.length === BATCH_SIZE,
    });
  } catch {
    return response({ error: "Scheduler unavailable." }, 503);
  }
}
