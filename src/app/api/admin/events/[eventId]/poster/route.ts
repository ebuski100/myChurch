import "server-only";

import { randomUUID } from "node:crypto";
import { getAdminAccess } from "@/lib/admin-auth";
import { isUuid } from "@/lib/sermon-audio-authorization";
import {
  MAX_EVENT_IMAGE_BYTES,
  validateEventImageUpload,
} from "@/lib/event-image-validation";
import { createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";
import { createSupabaseStorageServerClient } from "@/lib/supabase/storage-server";

const BUCKET = "event-posters";
const MAX_FILENAME_LENGTH = 255;
type RouteContext = { params: Promise<{ eventId: string }> };

function json(
  message: string,
  status: number,
  extra: Record<string, unknown> = {},
) {
  return Response.json(
    { message, ...extra },
    {
      status,
      headers: {
        "Cache-Control": "private, no-store",
        "Referrer-Policy": "no-referrer",
      },
    },
  );
}

async function readLimitedBody(
  request: Request,
): Promise<
  { ok: true; bytes: Uint8Array } | { ok: false; tooLarge: boolean }
> {
  if (!request.body) return { ok: false, tooLarge: false };

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    total += value.byteLength;
    if (total > MAX_EVENT_IMAGE_BYTES) {
      await reader.cancel();
      return { ok: false, tooLarge: true };
    }
    chunks.push(value);
  }

  if (total === 0) return { ok: false, tooLarge: false };
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return { ok: true, bytes };
}

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
  const [eventId, filename, ...extra] = path.split("/");
  return (
    extra.length === 0 &&
    /^[0-9a-f-]{36}$/i.test(eventId) &&
    /^[0-9a-f-]{36}\.(jpg|png|webp)$/i.test(filename)
  );
}

async function removeNewUpload(
  database: Awaited<
    ReturnType<typeof createSupabaseAuthServerClient>
  >,
  storage: ReturnType<typeof createSupabaseStorageServerClient>,
  assetId: string | null,
  objectPath: string,
): Promise<boolean> {
  const { error: storageError } = await storage.storage
    .from(BUCKET)
    .remove([objectPath]);
  if (storageError) return false;
  if (!assetId) return true;
  const { error } = await database
    .from("assets")
    .delete()
    .eq("id", assetId);
  return !error;
}

async function cleanupReplacedPoster(
  database: Awaited<
    ReturnType<typeof createSupabaseAuthServerClient>
  >,
  storage: ReturnType<typeof createSupabaseStorageServerClient>,
  assetId: string,
): Promise<boolean> {
  const [
    eventReferences,
    ministryReferences,
    resourceReferences,
    assetResult,
  ] = await Promise.all([
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
    eventReferences.error ||
    ministryReferences.error ||
    resourceReferences.error ||
    assetResult.error
  )
    return false;
  if (
    (eventReferences.data?.length ?? 0) > 0 ||
    (ministryReferences.data?.length ?? 0) > 0 ||
    (resourceReferences.data?.length ?? 0) > 0
  )
    return true;

  const previous = assetResult.data;
  if (
    !previous ||
    previous.storage_bucket !== BUCKET ||
    !isSafePosterPath(previous.object_path)
  )
    return true;

  const { error: storageError } = await storage.storage
    .from(BUCKET)
    .remove([previous.object_path]);
  if (storageError) return false;
  const { error: deleteError } = await database
    .from("assets")
    .delete()
    .eq("id", assetId);
  return !deleteError;
}

export async function POST(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const { eventId } = await context.params;
  if (!isUuid(eventId)) return json("Event not found.", 404);

  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) {
    return json("This request is not allowed.", 403);
  }

  let access;
  try {
    access = await getAdminAccess();
  } catch {
    return json("Administrator access could not be verified.", 503);
  }
  if (access.status === "unauthenticated")
    return json("Sign in to continue.", 401);
  if (access.status === "forbidden")
    return json("Administrator access is required.", 403);

  const rawFilename = request.headers.get("x-event-image-file-name");
  let filename: string;
  try {
    if (!rawFilename) return json("Choose an event image.", 400);
    filename = decodeURIComponent(rawFilename);
  } catch {
    return json("Choose a valid image filename.", 400);
  }
  if (filename.length > MAX_FILENAME_LENGTH)
    return json("The image filename is too long.", 400);

  const declaredSize = Number(
    request.headers.get("x-event-image-file-size"),
  );
  if (
    !Number.isSafeInteger(declaredSize) ||
    declaredSize <= 0 ||
    declaredSize > MAX_EVENT_IMAGE_BYTES
  ) {
    return json("Choose an image no larger than 5 MiB.", 413);
  }
  const contentLength = Number(request.headers.get("content-length"));
  if (
    Number.isFinite(contentLength) &&
    contentLength > MAX_EVENT_IMAGE_BYTES
  ) {
    return json("Choose an image no larger than 5 MiB.", 413);
  }

  let database: Awaited<
    ReturnType<typeof createSupabaseAuthServerClient>
  >;
  let storage: ReturnType<typeof createSupabaseStorageServerClient>;
  try {
    [database, storage] = await Promise.all([
      createSupabaseAuthServerClient(),
      Promise.resolve(createSupabaseStorageServerClient()),
    ]);
  } catch {
    return json("Event image storage is not configured.", 503);
  }

  const { data: event, error: eventError } = await database
    .from("events")
    .select("id, title, poster_asset_id")
    .eq("id", eventId)
    .maybeSingle();
  if (eventError)
    return json("The event could not be verified.", 503);
  if (!event) return json("Event not found.", 404);

  const body = await readLimitedBody(request);
  if (!body.ok) {
    return body.tooLarge
      ? json("Choose an image no larger than 5 MiB.", 413)
      : json("The image upload did not include file data.", 400);
  }
  if (body.bytes.byteLength !== declaredSize) {
    return json(
      "The uploaded image size did not match its declared size.",
      400,
    );
  }

  const validation = validateEventImageUpload(
    filename,
    declaredSize,
    body.bytes.subarray(0, 12),
  );
  if (!validation.ok) {
    const message =
      validation.reason === "invalid_filename"
        ? "Choose a valid image filename."
        : validation.reason === "invalid_size"
          ? "Choose an image no larger than 5 MiB."
          : "Choose a valid JPG, PNG, or WebP image.";
    return json(
      message,
      validation.reason === "invalid_size" ? 413 : 400,
    );
  }

  const objectPath = `${eventId}/${randomUUID()}.${validation.value.extension}`;
  const { error: uploadError } = await storage.storage
    .from(BUCKET)
    .upload(objectPath, body.bytes, {
      cacheControl: "0",
      contentType: validation.value.mimeType,
      upsert: false,
    });
  if (uploadError)
    return json(
      "The event image could not be uploaded. Please try again.",
      503,
    );

  const { data: asset, error: assetError } = await database
    .from("assets")
    .insert({
      media_type: "image",
      alt_text: event.title,
      storage_bucket: BUCKET,
      object_path: objectPath,
      original_filename: filename,
      mime_type: validation.value.mimeType,
      file_size_bytes: declaredSize,
    })
    .select("id")
    .single();
  if (assetError || !asset) {
    await storage.storage.from(BUCKET).remove([objectPath]);
    return json(
      "The event image could not be attached. Please try again.",
      503,
    );
  }

  const { data: updated, error: updateError } = await database
    .from("events")
    .update({ poster_asset_id: asset.id })
    .eq("id", eventId)
    .select("id")
    .maybeSingle();
  if (updateError || !updated) {
    await removeNewUpload(database, storage, asset.id, objectPath);
    return json(
      "The event image could not be attached. Please try again.",
      503,
    );
  }

  const cleanupWarning = event.poster_asset_id
    ? !(await cleanupReplacedPoster(
        database,
        storage,
        event.poster_asset_id,
      ))
    : false;
  const { data: signed } = await storage.storage
    .from(BUCKET)
    .createSignedUrl(objectPath, 60 * 60);
  return json("Event image uploaded.", 200, {
    ok: true,
    imageUrl: signed?.signedUrl ?? null,
    cleanupWarning,
  });
}
