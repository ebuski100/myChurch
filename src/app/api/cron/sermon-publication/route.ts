import "server-only";

import { revalidatePath } from "next/cache";
import {
  checkSermonReadyToPublish,
  isValidPrivateSermonAudioAsset,
} from "@/lib/sermon-publication";
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
        resource_assets(purpose, asset_id, assets(id, media_type))`,
      )
      .eq("resource_type", "audio")
      .eq("publication_status", "scheduled")
      .lte("published_at", now)
      .order("published_at", { ascending: true })
      .limit(BATCH_SIZE);
    if (error || !due)
      return response({ error: "Scheduler unavailable." }, 503);

    let published = 0;
    let skipped = 0;
    const nowDate = new Date(now);
    for (const resource of due) {
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
      const readiness = checkSermonReadyToPublish(
        resource,
        resource.id,
      );
      if (!readiness.ok) {
        skipped += 1;
        continue;
      }
      const { data: assets, error: assetError } = await supabase
        .from("assets")
        .select(
          "id, storage_bucket, object_path, media_type, mime_type",
        )
        .in("id", readiness.audioAssetIds);
      if (assetError || !assets?.length) {
        skipped += 1;
        continue;
      }

      let audioExists = false;
      for (const asset of assets) {
        if (!isValidPrivateSermonAudioAsset(asset)) continue;
        const { data: exists, error: existsError } =
          await supabase.storage
            .from("sermon-audio")
            .exists(asset.object_path);
        if (!existsError && exists) {
          audioExists = true;
          break;
        }
      }
      if (!audioExists) {
        skipped += 1;
        continue;
      }

      const { data: updated, error: updateError } = await supabase
        .from("resources")
        .update({
          publication_status: "published",
          published_at: now,
        })
        .eq("id", resource.id)
        .eq("resource_type", "audio")
        .eq("publication_status", "scheduled")
        .eq("published_at", resource.published_at)
        .lte("published_at", now)
        .select("id")
        .maybeSingle();
      if (!updateError && updated) published += 1;
      else skipped += 1;
    }

    if (published > 0) {
      revalidatePath("/sermons");
      revalidatePath("/admin/sermons");
      revalidatePath("/admin");
    }
    return response({
      scanned: due.length,
      published,
      skipped,
      hasMore: due.length === BATCH_SIZE,
    });
  } catch {
    return response({ error: "Scheduler unavailable." }, 503);
  }
}
