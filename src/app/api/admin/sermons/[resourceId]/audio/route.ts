import "server-only";

import { randomUUID } from "node:crypto";
import { getAdminAccess } from "@/lib/admin-auth";
import { isUuid, isValidAudioObjectPath } from "@/lib/sermon-audio-authorization";
import { parseUploadedAudioDuration } from "@/lib/sermon-audio-duration";
import {
  SERMON_AUDIO_BUCKET_LIMIT_BYTES,
  validateSermonAudioUpload,
} from "@/lib/sermon-audio-upload-validation";
import { createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";
import { createSupabaseStorageServerClient } from "@/lib/supabase/storage-server";

const BUCKET = "sermon-audio";

type RouteContext = { params: Promise<{ resourceId: string }> };
type AudioLinkRow = {
  asset_id: string;
  download_allowed: boolean;
  is_public_metadata: boolean;
  sort_order: number;
  assets: {
    id: string;
    storage_bucket: string | null;
    object_path: string | null;
  } | Array<{
    id: string;
    storage_bucket: string | null;
    object_path: string | null;
  }> | null;
};

function json(message: string, status: number, extra: Record<string, unknown> = {}): Response {
  return Response.json({ message, ...extra }, {
    status,
    headers: { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" },
  });
}

function rows<T>(value: T | T[] | null | undefined): T[] {
  if (Array.isArray(value)) return value;
  return value == null ? [] : [value];
}

function safeCode(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null) return undefined;
  const value = (error as { code?: unknown; statusCode?: unknown }).code ??
    (error as { statusCode?: unknown }).statusCode;
  return typeof value === "string" && /^[A-Za-z0-9_.-]{1,64}$/.test(value) ? value : undefined;
}

function logFailure(category: string, error?: unknown) {
  const code = safeCode(error);
  console.error("[sermon-audio-upload]", category, ...(code ? [code] : []));
}

async function readUploadPrefix(stream: ReadableStream<Uint8Array>, expectedSize: number) {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (total < 12) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    total += value.byteLength;
    if (total > expectedSize || total > SERMON_AUDIO_BUCKET_LIMIT_BYTES) {
      await reader.cancel();
      return { ok: false as const };
    }
    chunks.push(value);
  }
  if (total === 0) {
    await reader.cancel();
    return { ok: false as const };
  }
  const prefix = new Uint8Array(Math.min(total, 12));
  let offset = 0;
  for (const chunk of chunks) {
    const take = Math.min(chunk.length, prefix.length - offset);
    if (take <= 0) break;
    prefix.set(chunk.subarray(0, take), offset);
    offset += take;
  }
  return { ok: true as const, reader, chunks, total, prefix };
}

function validatedStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  initialChunks: Uint8Array[],
  initialTotal: number,
  expectedSize: number,
): ReadableStream<Uint8Array> {
  let total = initialTotal;
  let initialIndex = 0;
  let finished = false;

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      if (initialIndex < initialChunks.length) {
        controller.enqueue(initialChunks[initialIndex++]);
        return;
      }
      if (finished) return;
      const { done, value } = await reader.read();
      if (done) {
        finished = true;
        if (total !== expectedSize) {
          controller.error(new Error("Upload size did not match the declared size."));
        } else {
          controller.close();
        }
        return;
      }
      if (!value) return;
      total += value.byteLength;
      if (total > expectedSize || total > SERMON_AUDIO_BUCKET_LIMIT_BYTES) {
        finished = true;
        await reader.cancel();
        controller.error(new Error("Upload exceeded its declared size."));
        return;
      }
      controller.enqueue(value);
    },
    async cancel(reason) {
      finished = true;
      await reader.cancel(reason);
    },
  });
}

async function removeUploadedObject(
  storage: ReturnType<typeof createSupabaseStorageServerClient>,
  objectPath: string,
): Promise<boolean> {
  const { error } = await storage.storage.from(BUCKET).remove([objectPath]);
  if (error) logFailure("new_object_cleanup_failed", error);
  return !error;
}

async function cleanupUnlinkedNewAsset(
  database: Awaited<ReturnType<typeof createSupabaseAuthServerClient>>,
  storage: ReturnType<typeof createSupabaseStorageServerClient>,
  assetId: string | null,
  objectPath: string,
): Promise<boolean> {
  const objectRemoved = await removeUploadedObject(storage, objectPath);
  if (!objectRemoved) return false;

  if (assetId) {
    const { data, error } = await database.from("assets").delete().eq("id", assetId).select("id").maybeSingle();
    if (error || !data) {
      logFailure("new_asset_cleanup_failed", error);
      return false;
    }
  }
  return true;
}

async function cleanupReplacedAsset(
  database: Awaited<ReturnType<typeof createSupabaseAuthServerClient>>,
  storage: ReturnType<typeof createSupabaseStorageServerClient>,
  previous: AudioLinkRow,
): Promise<boolean> {
  const privileged = storage;
  const asset = rows(previous.assets)[0];
  if (!asset) return false;

  const [resourceRefs, eventRefs, ministryRefs] = await Promise.all([
    privileged.from("resource_assets").select("asset_id").eq("asset_id", previous.asset_id),
    privileged.from("events").select("id").eq("poster_asset_id", previous.asset_id),
    privileged.from("ministries").select("id").eq("image_asset_id", previous.asset_id),
  ]);
  if (resourceRefs.error || eventRefs.error || ministryRefs.error) {
    logFailure("previous_asset_reference_check_failed", resourceRefs.error ?? eventRefs.error ?? ministryRefs.error);
    return false;
  }
  if ((resourceRefs.data?.length ?? 0) > 0 || (eventRefs.data?.length ?? 0) > 0 || (ministryRefs.data?.length ?? 0) > 0) {
    return true;
  }

  if (asset.storage_bucket !== BUCKET || !isValidAudioObjectPath(asset.object_path)) {
    logFailure("previous_object_locator_not_cleaned");
    return false;
  }

  const { error: storageError } = await storage.storage.from(BUCKET).remove([asset.object_path]);
  if (storageError) {
    logFailure("previous_object_cleanup_failed", storageError);
    return false;
  }

  const { data: deletedAsset, error: deleteError } = await database
    .from("assets").delete().eq("id", previous.asset_id).select("id").maybeSingle();
  if (deleteError || !deletedAsset) {
    logFailure("previous_asset_record_cleanup_failed", deleteError);
    return false;
  }
  return true;
}

async function rollbackNewUpload(
  database: Awaited<ReturnType<typeof createSupabaseAuthServerClient>>,
  storage: ReturnType<typeof createSupabaseStorageServerClient>,
  assetId: string | null,
  objectPath: string,
): Promise<boolean> {
  try {
    return await cleanupUnlinkedNewAsset(database, storage, assetId, objectPath);
  } catch (error) {
    logFailure("new_upload_cleanup_failed", error);
    return false;
  }
}

export async function POST(request: Request, context: RouteContext): Promise<Response> {
  const { resourceId } = await context.params;
  if (!isUuid(resourceId)) return json("Sermon not found.", 404);

  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) return json("This request is not allowed.", 403);

  let access;
  let pendingObjectPath: string | null = null;
  let pendingAssetId: string | null = null;
  let associationCommitted = false;
  try {
    access = await getAdminAccess();
  } catch {
    return json("Administrator access could not be verified.", 503);
  }
  if (access.status === "unauthenticated") return json("Sign in to continue.", 401);
  if (access.status === "forbidden") return json("Administrator access is required.", 403);

  let filename: string;
  try {
    const encodedFilename = request.headers.get("x-audio-file-name");
    if (!encodedFilename) return json("Choose an audio file to upload.", 400);
    filename = decodeURIComponent(encodedFilename);
  } catch {
    return json("Choose a valid audio filename.", 400);
  }
  const declaredSize = Number(request.headers.get("x-audio-file-size"));
  if (!Number.isSafeInteger(declaredSize) || declaredSize <= 0 || declaredSize > SERMON_AUDIO_BUCKET_LIMIT_BYTES) {
    return json("The selected file must be between 1 byte and 500 MiB.", 413);
  }
  // The browser detects container duration; this validates its representation, not its factual accuracy.
  const durationSeconds = parseUploadedAudioDuration(request.headers.get("x-audio-duration-seconds"));
  let database: Awaited<ReturnType<typeof createSupabaseAuthServerClient>>;
  let storage: ReturnType<typeof createSupabaseStorageServerClient>;
  try {
    [database, storage] = await Promise.all([
      createSupabaseAuthServerClient(),
      Promise.resolve(createSupabaseStorageServerClient()),
    ]);
  } catch {
    logFailure("server_configuration_missing");
    return json("Audio management is temporarily unavailable.", 503);
  }

  try {
    const { data: resource, error: resourceError } = await database
      .from("resources")
      .select("id, resource_type, sermon_details!inner(resource_id), audio_details!inner(resource_id)")
      .eq("id", resourceId)
      .eq("resource_type", "audio")
      .maybeSingle();
    if (resourceError) {
      logFailure("sermon_validation_failed", resourceError);
      return json("The sermon could not be verified.", 503);
    }
    if (!resource) return json("Sermon not found.", 404);

    const { data: linkedRows, error: linksError } = await storage
      .from("resource_assets")
      .select("asset_id, download_allowed, is_public_metadata, sort_order, assets(id, storage_bucket, object_path)")
      .eq("resource_id", resourceId)
      .eq("purpose", "audio");
    if (linksError) {
      logFailure("existing_audio_lookup_failed", linksError);
      return json("Existing audio could not be verified.", 503);
    }
    const oldLinks = (linkedRows ?? []) as unknown as AudioLinkRow[];
    if (oldLinks.length > 1) return json("This sermon has multiple audio links and needs administrator review.", 409);
    const previous = oldLinks[0] ?? null;

    if (!request.body) return json("The upload did not include a file.", 400);
    let prefix: Awaited<ReturnType<typeof readUploadPrefix>>;
    try {
      prefix = await readUploadPrefix(request.body, declaredSize);
    } catch {
      return json("The audio file could not be read.", 400);
    }
    if (!prefix.ok) return json("The audio file is empty or has an invalid size.", 400);

    const validation = validateSermonAudioUpload(filename, declaredSize, prefix.prefix);
    if (!validation.ok) {
      await prefix.reader.cancel();
      return json("Choose a supported audio file with valid audio data.", 400);
    }

    const objectPath = `${resourceId}/${randomUUID()}.${validation.extension.slice(1)}`;
    pendingObjectPath = objectPath;
    const stream = validatedStream(prefix.reader, prefix.chunks, prefix.total, declaredSize);
    const { error: uploadError } = await storage.storage.from(BUCKET).upload(objectPath, stream, {
      cacheControl: "0",
      contentType: validation.mimeType,
      upsert: false,
    });
    if (uploadError) {
      logFailure("storage_upload_failed", uploadError);
      const cleanupSucceeded = await removeUploadedObject(storage, objectPath);
      pendingObjectPath = null;
      return json(cleanupSucceeded ? "The audio upload failed. Please try again." : "The upload failed and requires administrator cleanup.", 503);
    }

    const { data: insertedAsset, error: assetError } = await database
      .from("assets")
      .insert({
        media_type: "audio",
        storage_bucket: BUCKET,
        object_path: objectPath,
        original_filename: filename,
        mime_type: validation.mimeType,
        file_size_bytes: declaredSize,
      })
      .select("id")
      .single();
    if (assetError || !insertedAsset) {
      logFailure("asset_record_insert_failed", assetError);
      const cleanupSucceeded = await rollbackNewUpload(database, storage, null, objectPath);
      pendingObjectPath = null;
      return json(cleanupSucceeded ? "The audio could not be attached. Please try again." : "The upload failed and requires administrator cleanup.", 503);
    }
    pendingAssetId = insertedAsset.id;

    let associationError: unknown = null;
    if (previous) {
      const { data, error } = await database
        .from("resource_assets")
        .update({ asset_id: insertedAsset.id })
        .eq("resource_id", resourceId)
        .eq("asset_id", previous.asset_id)
        .eq("purpose", "audio")
        .select("asset_id")
        .maybeSingle();
      associationError = error ?? (!data ? new Error("Audio relationship was not updated.") : null);
    } else {
      const { error } = await database.from("resource_assets").insert({
        resource_id: resourceId,
        asset_id: insertedAsset.id,
        purpose: "audio",
        is_public_metadata: true,
        download_allowed: false,
        sort_order: 0,
      });
      associationError = error;
    }

    if (associationError) {
      logFailure("audio_relationship_update_failed", associationError);
      const cleanupSucceeded = await rollbackNewUpload(database, storage, insertedAsset.id, objectPath);
      pendingObjectPath = null;
      pendingAssetId = null;
      return json(cleanupSucceeded ? "The audio could not be attached. Please try again." : "The upload failed and requires administrator cleanup.", 503);
    }
    associationCommitted = true;
    pendingObjectPath = null;
    pendingAssetId = null;

    let durationWarning = durationSeconds === null;
    if (durationSeconds !== null) {
      try {
        const { data: durationUpdate, error: durationError } = await database
          .from("audio_details")
          .update({ duration_seconds: durationSeconds })
          .eq("resource_id", resourceId)
          .select("resource_id")
          .maybeSingle();
        if (durationError || !durationUpdate) {
          logFailure("duration_update_failed", durationError);
          durationWarning = true;
        }
      } catch (error) {
        logFailure("duration_update_failed", error);
        durationWarning = true;
      }
    }

    let replacementCleanupSucceeded = true;
    if (previous) {
      try {
        replacementCleanupSucceeded = await cleanupReplacedAsset(database, storage, previous);
      } catch (error) {
        logFailure("previous_audio_cleanup_failed", error);
        replacementCleanupSucceeded = false;
      }
    }

    const warnings = [
      !replacementCleanupSucceeded ? "The previous file could not be fully cleaned up and needs administrator review." : "",
      durationWarning ? "The audio duration could not be determined or saved; the stored duration was left unchanged." : "",
    ].filter(Boolean);
    return json(
      warnings.length > 0 ? `Audio attached. ${warnings.join(" ")}` : "Audio uploaded and attached to this sermon.",
      200,
      { ok: true, cleanupWarning: !replacementCleanupSucceeded, durationWarning },
    );
  } catch (error) {
    logFailure("unexpected_upload_failure", error);
    if (pendingObjectPath && !associationCommitted) {
      const cleanupSucceeded = await rollbackNewUpload(database, storage, pendingAssetId, pendingObjectPath);
      if (!cleanupSucceeded) return json("The upload failed and requires administrator cleanup.", 503);
    }
    return json("The audio upload could not be completed. Please try again.", 503);
  }
}
