import "server-only";

import { randomUUID, createHmac } from "node:crypto";
import { getAdminAccess } from "@/lib/admin-auth";
import { isUuid } from "@/lib/sermon-audio-authorization";
import { parseUploadedAudioDuration } from "@/lib/sermon-audio-duration";
import {
 SERMON_AUDIO_EFFECTIVE_UPLOAD_BYTES,
 FORMAT_BY_EXTENSION,
} from "@/lib/sermon-audio-upload-validation";
import { createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";
import { createSupabaseStorageServerClient } from "@/lib/supabase/storage-server";

const AUTHORIZATION_TTL_MS = 60 * 60 * 1000;

function getHmacSecret(): string {
 const secret = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
 if (!secret) throw new Error("Server configuration missing.");
 return secret;
}

export type AuthorizationClaims = {
 resourceId: string;
 objectPath: string;
 filename: string;
 extension: string;
 size: number;
 expiresAt: number;
};

export function createAuthorizationToken(
 resourceId: string,
 objectPath: string,
 filename: string,
 extension: string,
 size: number,
): { token: string; expiresAt: number } {
 const expiresAt = Date.now() + AUTHORIZATION_TTL_MS;
 const claims: AuthorizationClaims = { resourceId, objectPath, filename, extension, size, expiresAt };
 const payload = JSON.stringify(claims);
 const hmac = createHmac("sha256", getHmacSecret()).update(payload).digest("hex");
 const token = Buffer.from(JSON.stringify({ payload, hmac })).toString("base64url");
 return { token, expiresAt };
}

export function verifyAuthorizationToken(
 token: string,
 resourceId: string,
 objectPath: string,
 filename: string,
 extension: string,
 size: number,
): boolean {
 try {
 const decoded = JSON.parse(Buffer.from(token, "base64url").toString("utf8")) as { payload: string; hmac: string };
 const claims = JSON.parse(decoded.payload) as AuthorizationClaims;
 if (claims.resourceId !== resourceId) return false;
 if (claims.objectPath !== objectPath) return false;
 if (claims.filename !== filename) return false;
 if (claims.extension !== extension) return false;
 if (claims.size !== size) return false;
 if (!Number.isFinite(claims.expiresAt) || claims.expiresAt < Date.now()) return false;
 const expectedHmac = createHmac("sha256", getHmacSecret()).update(decoded.payload).digest("hex");
 return decoded.hmac === expectedHmac;
 } catch {
 return false;
 }
}

function json(message: string, status: number, extra: Record<string, unknown> = {}): Response {
 return Response.json({ message, ...extra }, {
 status,
 headers: { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" },
 });
}

type RouteContext = { params: Promise<{ resourceId: string }> };

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

 let body: { filename?: unknown; size?: unknown; durationSeconds?: unknown };
 try {
 body = await request.json();
 } catch {
 return json("Invalid request body.", 400);
 }

 const filename = typeof body.filename === "string" ? body.filename : null;
 const size = typeof body.size === "number" ? body.size : null;
 if (!filename || size === null) return json("Choose an audio file to upload.", 400);

 if (
 filename.length === 0 ||
 filename.length > 255 ||
 /[\\/\u0000-\u001f\u007f]/.test(filename) ||
 filename.trim() !== filename
 ) {
 return json("Choose a valid audio filename.", 400);
 }

 if (!Number.isSafeInteger(size) || size <= 0 || size > SERMON_AUDIO_EFFECTIVE_UPLOAD_BYTES) {
 return json(
 `The selected file must be between 1 byte and ${Math.round(SERMON_AUDIO_EFFECTIVE_UPLOAD_BYTES / (1024 * 1024))} MiB.`,
 413,
 );
 }

 const extension = filename.slice(filename.lastIndexOf(".")).toLowerCase();
 const format = FORMAT_BY_EXTENSION[extension];
 if (!format) {
 return json("Choose an MP3, MP4/M4A, AAC, OGG, WAV, WebM, or FLAC file.", 400);
 }

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
 const { data: resource, error: resourceError } = await database
 .from("resources")
 .select("id, resource_type, sermon_details!inner(resource_id), audio_details!inner(resource_id)")
 .eq("id", resourceId)
 .eq("resource_type", "audio")
 .maybeSingle();
 if (resourceError) return json("The sermon could not be verified.", 503);
 if (!resource) return json("Sermon not found.", 404);

 const { data: linkedRows, error: linksError } = await storage
 .from("resource_assets")
 .select("asset_id")
 .eq("resource_id", resourceId)
 .eq("purpose", "audio");
 if (linksError) return json("Existing audio could not be verified.", 503);
 if ((linkedRows ?? []).length > 1) {
 return json("This sermon has multiple audio links and needs administrator review.", 409);
 }

 const objectPath = `${resourceId}/${randomUUID()}.${extension.slice(1)}`;
 const { token, expiresAt } = createAuthorizationToken(resourceId, objectPath, filename, extension, size);

 const durationSeconds = parseUploadedAudioDuration(
 typeof body.durationSeconds === "string" ? body.durationSeconds : null,
 );

 return Response.json(
 {
 ok: true,
 objectPath,
 token,
 expiresAt,
 mimeType: format.mimeType,
 durationSeconds,
 },
 { headers: { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" } },
 );
 } catch {
 return json("Audio authorization could not be completed. Please try again.", 503);
 }
}
