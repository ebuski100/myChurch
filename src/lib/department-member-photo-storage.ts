import "server-only";

import { randomUUID } from "node:crypto";
import { createSupabaseStorageServerClient } from "@/lib/supabase/storage-server";

export const DEPARTMENT_MEMBER_PHOTO_BUCKET =
  "department-member-photos";
export const MAX_DEPARTMENT_MEMBER_PHOTO_BYTES = 5 * 1024 * 1024;
const SIGNED_URL_TTL_SECONDS = 60 * 60;
const ALLOWED_TYPES = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
} as const;

type AllowedImageType = keyof typeof ALLOWED_TYPES;

type AssetRow = {
  id: string;
  media_type: string;
  storage_bucket: string | null;
  object_path: string | null;
};

export type UploadedDepartmentMemberPhoto = {
  assetId: string;
  objectPath: string;
};

export type DepartmentMemberPhotoUploadFailureReason =
  | "invalid_type"
  | "too_large"
  | "not_configured"
  | "bucket_missing"
  | "storage_error"
  | "asset_write_failed";

export type DepartmentMemberPhotoUploadResult =
  | { ok: true; photo: UploadedDepartmentMemberPhoto | null }
  | { ok: false; reason: DepartmentMemberPhotoUploadFailureReason };

/**
 * Extracts only a short, safe status token from a Supabase error so the
 * server log stays diagnosable without recording object paths, filenames,
 * or credentials.
 */
function safeErrorToken(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null) return undefined;
  const value =
    (error as { code?: unknown }).code ??
    (error as { statusCode?: unknown }).statusCode;
  return typeof value === "string" && /^[A-Za-z0-9_.-]{1,64}$/.test(value)
    ? value
    : undefined;
}

function logPhotoFailure(category: string, error?: unknown): void {
  const token = safeErrorToken(error);
  console.error(
    "[department-member-photo]",
    category,
    ...(token ? [token] : []),
  );
}

/**
 * A missing bucket is reported by Storage as a 404 with a `NoSuchBucket`
 * code. It is distinguished from other storage failures so the cause can be
 * acted on instead of guessed at.
 */
function isMissingBucketError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const candidate = error as {
    code?: unknown;
    error?: unknown;
    message?: unknown;
  };
  return (
    candidate.code === "NoSuchBucket" ||
    candidate.error === "Bucket not found" ||
    candidate.message === "Bucket not found"
  );
}

/**
 * Server Actions can deliver file entries created in a different realm, so
 * the check is structural rather than a strict `instanceof File`.
 */
function isFileLikeEntry(
  value: FormDataEntryValue | null,
): value is File {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as File).arrayBuffer === "function" &&
    typeof (value as File).size === "number" &&
    typeof (value as File).type === "string"
  );
}

function isAllowedImageType(
  value: string,
): value is AllowedImageType {
  return Object.prototype.hasOwnProperty.call(ALLOWED_TYPES, value);
}

function matchesImageSignature(
  bytes: Uint8Array,
  type: AllowedImageType,
): boolean {
  if (type === "image/jpeg") {
    return (
      bytes.length >= 3 &&
      bytes[0] === 0xff &&
      bytes[1] === 0xd8 &&
      bytes[2] === 0xff
    );
  }
  if (type === "image/png") {
    return (
      bytes.length >= 8 &&
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a
    );
  }
  return (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  );
}

export function isSafeDepartmentMemberPhotoPath(
  path: string | null | undefined,
): path is string {
  return (
    typeof path === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(jpg|png|webp)$/i.test(
      path,
    )
  );
}

/** Accepts only small JPEG, PNG, or WebP files and stores them in private storage. */
export async function uploadDepartmentMemberPhoto(
  entry: FormDataEntryValue | null,
  memberId: string,
  altText: string,
): Promise<DepartmentMemberPhotoUploadResult> {
  if (!isFileLikeEntry(entry) || entry.size === 0)
    return { ok: true, photo: null };
  if (!isAllowedImageType(entry.type))
    return { ok: false, reason: "invalid_type" };
  if (entry.size > MAX_DEPARTMENT_MEMBER_PHOTO_BYTES)
    return { ok: false, reason: "too_large" };

  const bytes = new Uint8Array(await entry.arrayBuffer());
  if (!matchesImageSignature(bytes, entry.type))
    return { ok: false, reason: "invalid_type" };

  let storage: ReturnType<typeof createSupabaseStorageServerClient>;
  try {
    storage = createSupabaseStorageServerClient();
  } catch (error) {
    logPhotoFailure("storage_not_configured", error);
    return { ok: false, reason: "not_configured" };
  }

  const assetId = randomUUID();
  const objectPath = `${memberId}/${assetId}${ALLOWED_TYPES[entry.type]}`;
  const { error: uploadError } = await storage.storage
    .from(DEPARTMENT_MEMBER_PHOTO_BUCKET)
    .upload(objectPath, bytes, {
      contentType: entry.type,
      upsert: false,
    });
  if (uploadError) {
    if (isMissingBucketError(uploadError)) {
      logPhotoFailure("bucket_missing", uploadError);
      return { ok: false, reason: "bucket_missing" };
    }
    logPhotoFailure("storage_upload_failed", uploadError);
    return { ok: false, reason: "storage_error" };
  }

  const { error: assetError } = await storage.from("assets").insert({
    id: assetId,
    media_type: "image",
    alt_text: altText.slice(0, 200),
    storage_bucket: DEPARTMENT_MEMBER_PHOTO_BUCKET,
    object_path: objectPath,
    original_filename: entry.name.slice(0, 255),
    mime_type: entry.type,
    file_size_bytes: entry.size,
  });
  if (assetError) {
    logPhotoFailure("asset_write_failed", assetError);
    await storage.storage
      .from(DEPARTMENT_MEMBER_PHOTO_BUCKET)
      .remove([objectPath]);
    return { ok: false, reason: "asset_write_failed" };
  }
  return { ok: true, photo: { assetId, objectPath } };
}

export async function removeNewDepartmentMemberPhotoUpload(
  assetId: string,
  objectPath: string,
): Promise<void> {
  if (!isSafeDepartmentMemberPhotoPath(objectPath)) return;
  const storage = createSupabaseStorageServerClient();
  const { error: removeError } = await storage.storage
    .from(DEPARTMENT_MEMBER_PHOTO_BUCKET)
    .remove([objectPath]);
  if (removeError) return;
  await storage
    .from("assets")
    .delete()
    .eq("id", assetId)
    .eq("storage_bucket", DEPARTMENT_MEMBER_PHOTO_BUCKET);
}

export async function cleanupUnreferencedDepartmentMemberPhoto(
  assetId: string | null,
): Promise<void> {
  if (!assetId) return;
  const storage = createSupabaseStorageServerClient();
  const { count, error: referenceError } = await storage
    .from("department_members")
    .select("id", { count: "exact", head: true })
    .eq("photo_asset_id", assetId);
  if (referenceError || (count ?? 0) > 0) return;

  const { data: asset, error } = await storage
    .from("assets")
    .select("id, media_type, storage_bucket, object_path")
    .eq("id", assetId)
    .maybeSingle();
  if (
    error ||
    !asset ||
    asset.storage_bucket !== DEPARTMENT_MEMBER_PHOTO_BUCKET ||
    !isSafeDepartmentMemberPhotoPath(asset.object_path)
  )
    return;

  const { error: removeError } = await storage.storage
    .from(DEPARTMENT_MEMBER_PHOTO_BUCKET)
    .remove([asset.object_path]);
  if (removeError) return;
  await storage
    .from("assets")
    .delete()
    .eq("id", assetId)
    .eq("storage_bucket", DEPARTMENT_MEMBER_PHOTO_BUCKET);
}

export async function getDepartmentMemberPhotoUrls(
  assetIds: readonly string[],
): Promise<Map<string, string>> {
  const urls = new Map<string, string>();
  const ids = [...new Set(assetIds.filter(Boolean))];
  if (!ids.length) return urls;

  try {
    const storage = createSupabaseStorageServerClient();
    const { data, error } = await storage
      .from("assets")
      .select("id, media_type, storage_bucket, object_path")
      .in("id", ids)
      .eq("media_type", "image")
      .eq("storage_bucket", DEPARTMENT_MEMBER_PHOTO_BUCKET);
    if (error || !data) return urls;

    await Promise.all(
      (data as AssetRow[]).map(async (asset) => {
        if (!isSafeDepartmentMemberPhotoPath(asset.object_path))
          return;
        const { data: signed, error: signError } =
          await storage.storage
            .from(DEPARTMENT_MEMBER_PHOTO_BUCKET)
            .createSignedUrl(
              asset.object_path,
              SIGNED_URL_TTL_SECONDS,
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
