import "server-only";

import { getAdminAccess } from "@/lib/admin-auth";
import { isUuid, isValidAudioObjectPath } from "@/lib/sermon-audio-authorization";
import { parseUploadedAudioDuration } from "@/lib/sermon-audio-duration";
import {
 SERMON_AUDIO_EFFECTIVE_UPLOAD_BYTES,
 FORMAT_BY_EXTENSION,
 validateSermonAudioUpload,
} from "@/lib/sermon-audio-upload-validation";
import { verifyAuthorizationToken } from "../authorize/route";
import { createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";
import { createSupabaseStorageServerClient } from "@/lib/supabase/storage-server";

const BUCKET = "sermon-audio";

function json(message: string, status: number, extra: Record<string, unknown> = {}): Response {
 return Response.json({ message, ...extra }, {
 status,
 headers: { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" },
 });
}

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

function rows<T>(value: T | T[] | null | undefined): T[] {
 if (Array.isArray(value)) return value;
 return value == null ? [] : [value];
}

async function removeUploadedObject(
 storage: ReturnType<typeof createSupabaseStorageServerClient>,
 objectPath: string,
): Promise<boolean> {
 const { error } = await storage.storage.from(BUCKET).remove([objectPath]);
 return !error;
}

export async function POST(request: Request, context: RouteContext): Promise<Response> {
 const { resourceId } = await context.params;
 if (!isUuid(resourceId)) return json("Sermon not found.", 404);

 let access;
 try {
 access = await getAdminAccess();
 } catch {
 return json("Administrator access could not be verified.", 503);
 }
 if (access.status === "unauthenticated") return json("Sign in to continue.", 401);
 if (access.status === "forbidden") return json("Administrator access is required.", 403);

 let body: { objectPath?: unknown; token?: unknown; durationSeconds?: unknown; filename?: unknown; size?: unknown };
 try {
 body = await request.json();
 } catch {
 return json("Invalid request body.", 400);
 }

 const objectPath = typeof body.objectPath === "string" ? body.objectPath : null;
 const token = typeof body.token === "string" ? body.token : null;
 const declaredSize = typeof body.size === "number" ? body.size : null;
 const filename = typeof body.filename === "string" ? body.filename : null;

 if (!objectPath || !token) return json("Missing upload authorization.", 400);
 if (!isValidAudioObjectPath(objectPath)) return json("Invalid storage path.", 400);
 if (!objectPath.startsWith(`${resourceId}/`)) return json("Storage path does not belong to this sermon.", 403);

 const extension = filename ? filename.slice(filename.lastIndexOf(".")).toLowerCase() : "";
if (!verifyAuthorizationToken(token, resourceId, objectPath, filename ?? "", extension, declaredSize ?? 0)) {
 return json("Upload authorization expired or invalid. Please retry.", 403);
 }

 if (!filename || declaredSize === null) return json("Missing file metadata.", 400);
 if (!Number.isSafeInteger(declaredSize) || declaredSize <= 0 || declaredSize > SERMON_AUDIO_EFFECTIVE_UPLOAD_BYTES) {
 return json("Invalid file size.", 413);
 }

 const format = FORMAT_BY_EXTENSION[extension];
 if (!format) return json("Unsupported audio format.", 400);

 let database;
 let storage;
 try {
 [database, storage] = await Promise.all([
 createSupabaseAuthServerClient(),
 Promise.resolve(createSupabaseStorageServerClient()),
 ]);
 } catch {
 return json("Audio management is temporarily unavailable.", 503);
 }

 try {
 // Verify resource exists
 const { data: resource, error: resourceError } = await database
 .from("resources")
 .select("id, resource_type, sermon_details!inner(resource_id), audio_details!inner(resource_id)")
 .eq("id", resourceId)
 .eq("resource_type", "audio")
 .maybeSingle();
 if (resourceError) return json("The sermon could not be verified.", 503);
 if (!resource) return json("Sermon not found.", 404);

 // Check existing links
 const { data: linkedRows, error: linksError } = await storage
 .from("resource_assets")
 .select("asset_id, download_allowed, is_public_metadata, sort_order, assets(id, storage_bucket, object_path)")
 .eq("resource_id", resourceId)
 .eq("purpose", "audio");
 if (linksError) return json("Existing audio could not be verified.", 503);
 const oldLinks = (linkedRows ?? []) as unknown as AudioLinkRow[];
 if (oldLinks.length > 1) return json("This sermon has multiple audio links and needs administrator review.", 409);
 const previous = oldLinks[0] ?? null;

 // Check for duplicate asset (idempotency)
 const { data: existingAsset } = await database
 .from("assets")
 .select("id")
 .eq("storage_bucket", BUCKET)
 .eq("object_path", objectPath)
 .maybeSingle();
 if (existingAsset) {
 // Already finalized — return success
 return json("Audio uploaded and attached to this sermon.", 200, { ok: true, cleanupWarning: false, durationWarning: false });
 }

 // Verify object exists and get metadata
 const { data: objectInfo, error: infoError } = await storage.storage.from(BUCKET).info(objectPath);
 if (infoError || !objectInfo) {
 return json("Uploaded file not found in storage. Please retry.", 404);
 }

 const actualSize = (objectInfo as { size?: number }).size ?? (objectInfo as { metadata?: { size?: number } }).metadata?.size;
 if (typeof actualSize !== "number" || actualSize !== declaredSize) {
 await removeUploadedObject(storage, objectPath);
 return json("Uploaded file size does not match. Please retry.", 400);
 }
 if (actualSize > SERMON_AUDIO_EFFECTIVE_UPLOAD_BYTES) {
 await removeUploadedObject(storage, objectPath);
 return json("Uploaded file exceeds size limit.", 413);
 }

 // Read first 12 bytes for signature verification
 const { data: signedUrlData } = await storage.storage.from(BUCKET).createSignedUrl(objectPath, 60);
 if (!signedUrlData?.signedUrl) {
 await removeUploadedObject(storage, objectPath);
 return json("Could not verify uploaded file. Please retry.", 503);
 }

 let prefix: Uint8Array;
 try {
 const res = await fetch(signedUrlData.signedUrl, {
 headers: { Range: "bytes=0-11" },
 });
 if (!res.ok && res.status !== 206) throw new Error("fetch failed");
 const buf = await res.arrayBuffer();
 prefix = new Uint8Array(buf);
 } catch {
 await removeUploadedObject(storage, objectPath);
 return json("Could not read uploaded file for verification.", 503);
 }

 const validation = validateSermonAudioUpload(filename, declaredSize, prefix);
 if (!validation.ok) {
 await removeUploadedObject(storage, objectPath);
 return json("Choose a supported audio file with valid audio data.", 400);
 }

 // Create asset record (handle unique-constraint conflict for duplicate finalize)
 let insertedAsset: { id: string } | null = null;
 let assetError: unknown = null;
 const { data: newAsset, error: insertError } = await database
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
 if (insertError) {
 const pgCode = (insertError as { code?: string }).code;
 if (pgCode === "23505") {
 const { data: existing } = await database
 .from("assets")
 .select("id, storage_bucket, object_path, original_filename, file_size_bytes")
 .eq("storage_bucket", BUCKET)
 .eq("object_path", objectPath)
 .maybeSingle();
 if (
 existing &&
 existing.storage_bucket === BUCKET &&
 existing.object_path === objectPath &&
 existing.original_filename === filename &&
 existing.file_size_bytes === declaredSize
 ) {
 insertedAsset = { id: existing.id };
 } else {
 return json("The audio could not be attached. Please try again.", 503);
 }
 } else {
 assetError = insertError;
 }
 } else {
 insertedAsset = newAsset;
 }

 if (assetError || !insertedAsset) {
 const cleanupSucceeded = await removeUploadedObject(storage, objectPath);
 return json(
 cleanupSucceeded ? "The audio could not be attached. Please try again." : "The upload failed and requires administrator cleanup.",
 503,
 );
 }

 // Associate with resource
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
 // Rollback
 await database.from("assets").delete().eq("id", insertedAsset.id);
 await removeUploadedObject(storage, objectPath);
 return json("The audio could not be attached. Please try again.", 503);
 }

 // Duration update
 const durationSeconds = parseUploadedAudioDuration(
 typeof body.durationSeconds === "string" ? body.durationSeconds : null,
 );
 let durationWarning = durationSeconds === null;
 if (durationSeconds !== null) {
 try {
 const { data: durationUpdate, error: durationError } = await database
 .from("audio_details")
 .update({ duration_seconds: durationSeconds })
 .eq("resource_id", resourceId)
 .select("resource_id")
 .maybeSingle();
 if (durationError || !durationUpdate) durationWarning = true;
 } catch {
 durationWarning = true;
 }
 }

 // Cleanup replaced asset (with reference checks from original cleanupReplacedAsset)
 let replacementCleanupSucceeded = true;
 if (previous) {
 const asset = rows(previous.assets)[0];
 if (asset && asset.storage_bucket === BUCKET && isValidAudioObjectPath(asset.object_path)) {
 // Check if referenced by other resources, events, or ministries
 const [resourceRefs, eventRefs, ministryRefs] = await Promise.all([
 storage.from("resource_assets").select("asset_id").eq("asset_id", previous.asset_id),
 storage.from("events").select("id").eq("poster_asset_id", previous.asset_id),
 storage.from("ministries").select("id").eq("image_asset_id", previous.asset_id),
 ]);
 if (resourceRefs.error || eventRefs.error || ministryRefs.error) {
 replacementCleanupSucceeded = false;
 } else if (
 (resourceRefs.data?.length ?? 0) > 0 ||
 (eventRefs.data?.length ?? 0) > 0 ||
 (ministryRefs.data?.length ?? 0) > 0
 ) {
 // Still referenced — preserve asset and object
 replacementCleanupSucceeded = true;
 } else {
 const { error: storageError } = await storage.storage.from(BUCKET).remove([asset.object_path!]);
 if (storageError) {
 replacementCleanupSucceeded = false;
 } else {
 const { error: deleteError } = await database.from("assets").delete().eq("id", previous.asset_id);
 if (deleteError) replacementCleanupSucceeded = false;
 }
 }
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
 } catch {
 return json("The audio upload could not be completed. Please try again.", 503);
 }
}
