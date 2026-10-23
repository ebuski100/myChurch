import "server-only";

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

type EventPosterAsset = {
  id: string;
  media_type: string;
  storage_bucket: string | null;
  object_path: string | null;
  mime_type: string | null;
};

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

function stagedPath(
  userId: string,
  assetId: string,
  extension: string,
): string {
  return `pending/${userId}/${assetId}.${extension}`;
}

function isOwnedStagedAsset(
  asset: EventPosterAsset | null,
  userId: string,
  assetId: string,
): asset is EventPosterAsset {
  return Boolean(
    asset &&
    asset.id === assetId &&
    asset.media_type === "image" &&
    asset.storage_bucket === BUCKET &&
    typeof asset.object_path === "string" &&
    asset.object_path.startsWith(`pending/${userId}/${assetId}.`) &&
    /\.(jpg|png|webp)$/.test(asset.object_path),
  );
}

async function getAuthorizedClients(): Promise<
  | {
      ok: true;
      userId: string;
      database: Awaited<
        ReturnType<typeof createSupabaseAuthServerClient>
      >;
      storage: ReturnType<typeof createSupabaseStorageServerClient>;
    }
  | { ok: false; response: Response }
> {
  let access;
  try {
    access = await getAdminAccess();
  } catch {
    return {
      ok: false,
      response: json(
        "Administrator access could not be verified.",
        503,
      ),
    };
  }
  if (access.status === "unauthenticated") {
    return { ok: false, response: json("Sign in to continue.", 401) };
  }
  if (access.status === "forbidden") {
    return {
      ok: false,
      response: json("Administrator access is required.", 403),
    };
  }

  try {
    const database = await createSupabaseAuthServerClient();
    const {
      data: { user },
      error,
    } = await database.auth.getUser();
    if (error || !user) {
      return {
        ok: false,
        response: json(
          "Administrator access could not be verified.",
          503,
        ),
      };
    }
    const storage = createSupabaseStorageServerClient();
    return { ok: true, userId: user.id, database, storage };
  } catch {
    return {
      ok: false,
      response: json("Event image storage is not configured.", 503),
    };
  }
}

function checkOrigin(request: Request): Response | null {
  const origin = request.headers.get("origin");
  return origin && origin === new URL(request.url).origin
    ? null
    : json("This request is not allowed.", 403);
}

export async function POST(request: Request): Promise<Response> {
  const originError = checkOrigin(request);
  if (originError) return originError;
  const authorized = await getAuthorizedClients();
  if (!authorized.ok) return authorized.response;
  const { userId, database, storage } = authorized;

  const rawFilename = request.headers.get("x-event-image-file-name");
  const assetId =
    request.headers.get("x-event-image-upload-token") ?? "";
  let filename: string;
  try {
    if (!rawFilename) return json("Choose an event image.", 400);
    filename = decodeURIComponent(rawFilename);
  } catch {
    return json("Choose a valid image filename.", 400);
  }
  if (!isUuid(assetId))
    return json("Choose a valid upload token.", 400);
  if (
    !filename ||
    filename.length > MAX_FILENAME_LENGTH ||
    filename !== filename.trim() ||
    /[\\/\u0000-\u001f\u007f]/.test(filename)
  ) {
    return json("Choose a valid image filename.", 400);
  }

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

  const objectPath = stagedPath(
    userId,
    assetId,
    validation.value.extension,
  );
  const { data: existing, error: existingError } = await storage
    .from("assets")
    .select("id, media_type, storage_bucket, object_path, mime_type")
    .eq("id", assetId)
    .maybeSingle();
  if (existingError)
    return json("The image upload could not be verified.", 503);
  if (
    existing &&
    (!isOwnedStagedAsset(
      existing as EventPosterAsset,
      userId,
      assetId,
    ) ||
      existing.object_path !== objectPath)
  ) {
    return json(
      "This upload token is already in use. Select the file again.",
      409,
    );
  }
  if (existing) {
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
    if (eventRefs.error || ministryRefs.error || resourceRefs.error) {
      return json("The staged poster could not be verified.", 503);
    }
    if (
      (eventRefs.data?.length ?? 0) ||
      (ministryRefs.data?.length ?? 0) ||
      (resourceRefs.data?.length ?? 0)
    ) {
      return json(
        "This poster is already attached to saved content. Select the file again to replace it.",
        409,
      );
    }
  }

  const { error: uploadError } = await storage.storage
    .from(BUCKET)
    .upload(objectPath, body.bytes, {
      cacheControl: "0",
      contentType: validation.value.mimeType,
      upsert: true,
    });
  if (uploadError)
    return json(
      "The event image could not be uploaded. Please retry.",
      503,
    );

  const assetValues = {
    media_type: "image",
    alt_text: "Event poster",
    storage_bucket: BUCKET,
    object_path: objectPath,
    original_filename: filename,
    mime_type: validation.value.mimeType,
    file_size_bytes: declaredSize,
  };
  const assetWrite = existing
    ? await database
        .from("assets")
        .update(assetValues)
        .eq("id", assetId)
        .select("id")
        .maybeSingle()
    : await database
        .from("assets")
        .insert({ id: assetId, ...assetValues })
        .select("id")
        .maybeSingle();
  if (assetWrite.error || !assetWrite.data) {
    if (!existing)
      await storage.storage.from(BUCKET).remove([objectPath]);
    return json(
      "The event image could not be staged. Please retry.",
      503,
    );
  }

  const { data: signed, error: signError } = await storage.storage
    .from(BUCKET)
    .createSignedUrl(objectPath, 60 * 60);
  if (signError || !signed?.signedUrl) {
    return json(
      "The image uploaded but its preview could not be created. Retry the upload.",
      503,
    );
  }
  return json(
    "Poster uploaded and ready to save with the event.",
    200,
    {
      ok: true,
      assetId,
      imageUrl: signed.signedUrl,
    },
  );
}

export async function DELETE(request: Request): Promise<Response> {
  const originError = checkOrigin(request);
  if (originError) return originError;
  const authorized = await getAuthorizedClients();
  if (!authorized.ok) return authorized.response;
  const { userId, database, storage } = authorized;

  let payload: { assetId?: unknown };
  try {
    payload = await request.json();
  } catch {
    return json("Choose a valid staged poster.", 400);
  }
  if (
    typeof payload.assetId !== "string" ||
    !isUuid(payload.assetId)
  ) {
    return json("Choose a valid staged poster.", 400);
  }

  const { data, error } = await storage
    .from("assets")
    .select("id, media_type, storage_bucket, object_path, mime_type")
    .eq("id", payload.assetId)
    .maybeSingle();
  if (error)
    return json("The staged poster could not be verified.", 503);
  const asset = data as EventPosterAsset | null;
  if (!isOwnedStagedAsset(asset, userId, payload.assetId)) {
    return json("The staged poster could not be found.", 404);
  }

  const [eventReferences, ministryReferences, resourceReferences] =
    await Promise.all([
      storage
        .from("events")
        .select("id")
        .eq("poster_asset_id", payload.assetId),
      storage
        .from("ministries")
        .select("id")
        .eq("image_asset_id", payload.assetId),
      storage
        .from("resource_assets")
        .select("resource_id")
        .eq("asset_id", payload.assetId),
    ]);
  if (
    eventReferences.error ||
    ministryReferences.error ||
    resourceReferences.error
  ) {
    return json("The staged poster could not be verified.", 503);
  }
  if (
    (eventReferences.data?.length ?? 0) ||
    (ministryReferences.data?.length ?? 0) ||
    (resourceReferences.data?.length ?? 0)
  ) {
    return json(
      "This poster is already in use and cannot be removed here.",
      409,
    );
  }

  const { error: removeError } = await storage.storage
    .from(BUCKET)
    .remove([asset.object_path!]);
  if (removeError)
    return json(
      "The staged poster could not be removed. Please retry.",
      503,
    );
  const { error: deleteError } = await database
    .from("assets")
    .delete()
    .eq("id", payload.assetId);
  if (deleteError)
    return json(
      "The staged poster file was removed, but its record needs cleanup.",
      503,
    );
  return json("Staged poster removed.", 200, { ok: true });
}
