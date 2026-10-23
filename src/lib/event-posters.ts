import "server-only";

import { createSupabaseStorageServerClient } from "@/lib/supabase/storage-server";

const EVENT_POSTER_BUCKET = "event-posters";
const POSTER_URL_TTL_SECONDS = 60 * 60;

type PosterAsset = {
  id: string;
  media_type: string;
  storage_bucket: string | null;
  object_path: string | null;
};

function isSafePosterPath(path: string | null): path is string {
  if (
    !path ||
    path.length > 1024 ||
    path !== path.trim() ||
    path.includes("\\")
  ) {
    return false;
  }
  if (/[\u0000-\u001f\u007f]/.test(path)) return false;
  const segments = path.split("/");
  if (segments.length === 2) {
    return (
      /^[0-9a-f-]{36}$/i.test(segments[0]) &&
      /^[0-9a-f-]{36}\.(jpg|png|webp)$/i.test(segments[1])
    );
  }
  return (
    segments.length === 3 &&
    segments[0] === "pending" &&
    /^[0-9a-f-]{36}$/i.test(segments[1]) &&
    /^[0-9a-f-]{36}\.(jpg|png|webp)$/i.test(segments[2])
  );
}

export async function isOwnedStagedEventPoster(
  assetId: string,
  userId: string,
): Promise<boolean> {
  try {
    const storage = createSupabaseStorageServerClient();
    const { data, error } = await storage
      .from("assets")
      .select("id, media_type, storage_bucket, object_path")
      .eq("id", assetId)
      .eq("media_type", "image")
      .maybeSingle();
    if (error || !data || data.storage_bucket !== EVENT_POSTER_BUCKET)
      return false;
    if (
      data.object_path !== `pending/${userId}/${assetId}.jpg` &&
      data.object_path !== `pending/${userId}/${assetId}.png` &&
      data.object_path !== `pending/${userId}/${assetId}.webp`
    )
      return false;

    const [eventRefs, ministryRefs, resourceRefs] = await Promise.all(
      [
        storage
          .from("events")
          .select("id")
          .eq("poster_asset_id", assetId),
        storage
          .from("ministries")
          .select("id")
          .eq("image_asset_id", assetId),
        storage
          .from("resource_assets")
          .select("resource_id")
          .eq("asset_id", assetId),
      ],
    );
    if (
      eventRefs.error ||
      ministryRefs.error ||
      resourceRefs.error ||
      (eventRefs.data?.length ?? 0) > 0 ||
      (ministryRefs.data?.length ?? 0) > 0 ||
      (resourceRefs.data?.length ?? 0) > 0
    )
      return false;

    const { data: exists, error: existsError } = await storage.storage
      .from(EVENT_POSTER_BUCKET)
      .exists(data.object_path);
    return !existsError && exists;
  } catch {
    return false;
  }
}

export async function cleanupUnusedEventPoster(
  assetId: string,
): Promise<boolean> {
  try {
    const storage = createSupabaseStorageServerClient();
    const [eventRefs, ministryRefs, resourceRefs, assetResult] =
      await Promise.all([
        storage
          .from("events")
          .select("id")
          .eq("poster_asset_id", assetId),
        storage
          .from("ministries")
          .select("id")
          .eq("image_asset_id", assetId),
        storage
          .from("resource_assets")
          .select("resource_id")
          .eq("asset_id", assetId),
        storage
          .from("assets")
          .select("id, storage_bucket, object_path")
          .eq("id", assetId)
          .maybeSingle(),
      ]);
    if (
      eventRefs.error ||
      ministryRefs.error ||
      resourceRefs.error ||
      assetResult.error
    ) {
      return false;
    }
    if (
      (eventRefs.data?.length ?? 0) > 0 ||
      (ministryRefs.data?.length ?? 0) > 0 ||
      (resourceRefs.data?.length ?? 0) > 0
    )
      return true;

    const asset = assetResult.data;
    if (
      !asset ||
      asset.storage_bucket !== EVENT_POSTER_BUCKET ||
      !isSafePosterPath(asset.object_path)
    )
      return true;

    const { error: removeError } = await storage.storage
      .from(EVENT_POSTER_BUCKET)
      .remove([asset.object_path]);
    if (removeError) return false;

    const { error: deleteError } = await storage
      .from("assets")
      .delete()
      .eq("id", assetId);
    return !deleteError;
  } catch {
    return false;
  }
}

export async function getEventPosterUrls(
  assetIds: readonly string[],
): Promise<Map<string, string>> {
  const uniqueIds = [...new Set(assetIds.filter(Boolean))];
  const urls = new Map<string, string>();
  if (uniqueIds.length === 0) return urls;

  try {
    const storage = createSupabaseStorageServerClient();
    const { data, error } = await storage
      .from("assets")
      .select("id, media_type, storage_bucket, object_path")
      .in("id", uniqueIds)
      .eq("media_type", "image");
    if (error || !data) return urls;

    await Promise.all(
      (data as PosterAsset[]).map(async (asset) => {
        if (
          asset.storage_bucket !== EVENT_POSTER_BUCKET ||
          !isSafePosterPath(asset.object_path)
        ) {
          return;
        }
        const { data: signed, error: signError } =
          await storage.storage
            .from(EVENT_POSTER_BUCKET)
            .createSignedUrl(
              asset.object_path,
              POSTER_URL_TTL_SECONDS,
            );
        if (!signError && signed?.signedUrl)
          urls.set(asset.id, signed.signedUrl);
      }),
    );
  } catch {
    return urls;
  }

  return urls;
}
