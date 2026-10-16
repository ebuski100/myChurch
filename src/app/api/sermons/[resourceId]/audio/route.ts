import "server-only";

import { authorizeSermonAudio, isUuid } from "@/lib/sermon-audio-authorization";
import { createSupabaseStorageServerClient } from "@/lib/supabase/storage-server";

const BUCKET = "sermon-audio";
const SIGNED_URL_TTL_SECONDS = 10 * 60;
const MISSING_CONFIGURATION_MESSAGE = "Sermon audio authorization is not configured.";

type RouteContext = {
  params: Promise<{ resourceId: string }>;
};

function response(message: string, status: number): Response {
  return Response.json(
    { error: message },
    {
      status,
      headers: {
        "Cache-Control": "private, no-store",
        "Referrer-Policy": "no-referrer",
      },
    },
  );
}

function safeDownloadFilename(filename: string | null, resourceId: string): string {
  const baseName = filename?.split(/[\\/]/).pop()?.trim() ?? "";
  const safeName = baseName
    .replace(/[^\p{L}\p{N}._-]/gu, "_")
    .replace(/^\.+$/, "")
    .slice(0, 120);

  return safeName || `${resourceId}.audio`;
}

function safeErrorCode(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null) return undefined;

  const details = error as { code?: unknown; statusCode?: unknown };
  const value = details.code ?? details.statusCode;
  return typeof value === "string" && /^[A-Za-z0-9_.-]{1,64}$/.test(value)
    ? value
    : undefined;
}

function safeCaughtErrorDetails(error: unknown): {
  name?: string;
  message?: string;
  code?: string;
} {
  if (typeof error !== "object" || error === null) return {};

  const details = error as { name?: unknown; message?: unknown };
  const name =
    typeof details.name === "string" && /^[A-Za-z][A-Za-z0-9_.-]{0,63}$/.test(details.name)
      ? details.name
      : undefined;
  const message =
    typeof details.message === "string" &&
    ["fetch failed", "network request failed", "request timed out", "timeout", "socket hang up"].includes(
      details.message.trim().toLowerCase(),
    )
      ? details.message.trim()
      : undefined;

  return { name, message, code: safeErrorCode(error) };
}

function logAudioFailure(category: string, error?: unknown): void {
  const code = safeErrorCode(error);
  console.error("[sermon-audio]", category, ...(code ? [code] : []));
}

export async function GET(request: Request, context: RouteContext) {
  const { resourceId } = await context.params;
  if (!isUuid(resourceId)) return response("Audio not found.", 404);

  const download = new URL(request.url).searchParams.get("download") === "1";
  let stage = "client_initialization";

  try {
    const supabase = createSupabaseStorageServerClient();

    stage = "authorization_query";
    const { data, error } = await supabase
      .from("resources")
      .select(`
        id,
        resource_type,
        publication_status,
        published_at,
        sermon_details!inner(resource_id),
        audio_details!inner(resource_id),
        resource_assets!inner(
          purpose,
          download_allowed,
          assets!inner(storage_bucket, object_path, media_type, mime_type, original_filename)
        )
      `)
      .eq("id", resourceId)
      .eq("resource_assets.purpose", "audio")
      .maybeSingle();

    if (error) {
      logAudioFailure("authorization_query_failed", error);
      return response("Audio playback is temporarily unavailable.", 503);
    }

    stage = "authorization_validation";
    const authorization = authorizeSermonAudio(
      data,
      resourceId,
      download ? "download" : "playback",
    );

    if (!authorization.ok) {
      if (authorization.reason === "download_not_allowed") {
        return response("Downloads are not enabled for this sermon.", 403);
      }
      return response("Audio not found.", 404);
    }

    const filename = safeDownloadFilename(authorization.audio.originalFilename, resourceId);
    stage = "signed_url_creation";
    const { data: signed, error: signingError } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(
        authorization.audio.objectPath,
        SIGNED_URL_TTL_SECONDS,
        download ? { download: filename } : undefined,
      );

    if (signingError || !signed?.signedUrl) {
      logAudioFailure("signed_url_creation_failed", signingError);
      return response("Audio playback is temporarily unavailable.", 503);
    }

    stage = "redirect_creation";
    const redirectUrl = new URL(signed.signedUrl);
    return new Response(null, {
      status: 302,
      headers: {
        Location: redirectUrl.toString(),
        "Cache-Control": "private, no-store",
        "Referrer-Policy": "no-referrer",
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === MISSING_CONFIGURATION_MESSAGE) {
      logAudioFailure("server_configuration_missing");
    } else {
      console.error(
        "[sermon-audio] unexpected_server_failure",
        { stage, ...safeCaughtErrorDetails(error) },
      );
    }
    return response("Audio playback is temporarily unavailable.", 503);
  }
}
