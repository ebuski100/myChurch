// Video-specific sermon publication readiness. This module is intentionally
// separate from sermon-publication.ts so the audio validator stays
// audio-only. Video must never pass through the audio validator.
//
// NOTE: this module is intentionally self-contained (no runtime imports).
// The YouTube parsing logic below is a copy of the parsing rules in
// sermon-video.ts, kept import-free so the project's plain `node --test`
// harness (no bundler, no tsconfig paths) can load this file. The two
// copies are covered by the same behavioral tests; see
// sermon-video.test.mjs for the parser rules.

const YOUTUBE_VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtu.be",
  "www.youtu.be",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
]);

export type VideoPublicationCheckResult =
  | { ok: true; videoId: string; externalUrl: string }
  | {
      ok: false;
      reason:
        | "missing_resource"
        | "not_video"
        | "missing_title"
        | "missing_sermon_details"
        | "missing_video_details"
        | "missing_video_url"
        | "invalid_video_url";
    };

type Relation<T> = T | T[] | null | undefined;

export type VideoPublicationRow = {
  id?: unknown;
  title?: unknown;
  resource_type?: unknown;
  sermon_details?: Relation<{ resource_id?: unknown }>;
  video_details?: Relation<{
    resource_id?: unknown;
    external_url?: unknown;
  }>;
};

function rows<T>(relation: Relation<T>): T[] {
  if (Array.isArray(relation)) return relation;
  return relation == null ? [] : [relation];
}

function isValidVideoId(value: string | null): value is string {
  return typeof value === "string" && YOUTUBE_VIDEO_ID_PATTERN.test(value);
}

function parseVideoId(value: string): string | null {
  const trimmed = value.trim();
  if (
    !trimmed ||
    trimmed.length > 2048 ||
    /[\u0000-\u001f\u007f]/.test(trimmed) ||
    /<\s*\/?\s*(iframe|embed|object|script|video)\b/i.test(trimmed)
  ) {
    return null;
  }
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  if (url.username || url.password) return null;
  if (!YOUTUBE_HOSTS.has(url.hostname.toLowerCase())) return null;

  const host = url.hostname.toLowerCase();
  const path = url.pathname.replace(/\/+$/, "");
  const segments = path.split("/").filter(Boolean);

  if (host === "youtu.be" || host === "www.youtu.be") {
    return segments.length === 1 && isValidVideoId(segments[0])
      ? segments[0]
      : null;
  }
  if (
    segments.length === 1 &&
    segments[0].toLowerCase() === "watch" &&
    isValidVideoId(url.searchParams.get("v"))
  ) {
    return url.searchParams.get("v") as string;
  }
  if (
    segments.length === 2 &&
    ["embed", "shorts", "v"].includes(segments[0].toLowerCase()) &&
    isValidVideoId(segments[1])
  ) {
    return segments[1];
  }
  return null;
}

function canonicalVideoUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

export function checkVideoSermonReadyToPublish(
  row: VideoPublicationRow | null,
  resourceId: string,
): VideoPublicationCheckResult {
  if (!row || row.id !== resourceId) return { ok: false, reason: "missing_resource" };
  if (row.resource_type !== "video") return { ok: false, reason: "not_video" };
  if (typeof row.title !== "string" || !row.title.trim()) {
    return { ok: false, reason: "missing_title" };
  }

  if (!rows(row.sermon_details).some((detail) => detail.resource_id === resourceId)) {
    return { ok: false, reason: "missing_sermon_details" };
  }

  const videoDetails = rows(row.video_details).filter(
    (detail) => detail.resource_id === resourceId,
  );
  if (videoDetails.length === 0) {
    return { ok: false, reason: "missing_video_details" };
  }

  const externalUrl = videoDetails.find(
    (detail) => typeof detail.external_url === "string" && detail.external_url.trim(),
  )?.external_url;
  if (typeof externalUrl !== "string" || !externalUrl.trim()) {
    return { ok: false, reason: "missing_video_url" };
  }

  const videoId = parseVideoId(externalUrl.trim());
  if (!videoId) return { ok: false, reason: "invalid_video_url" };

  return { ok: true, videoId, externalUrl: canonicalVideoUrl(videoId) };
}
