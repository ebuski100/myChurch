// Pure, unit-testable helpers for YouTube video sermons.
// Never render administrator-supplied iframe HTML or accept arbitrary
// embed hosts — only the validated video ID leaves these helpers.

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

export type SermonVideoParseResult =
  | { ok: true; videoId: string }
  | {
      ok: false;
      reason:
        | "invalid_url"
        | "unsupported_host"
        | "missing_video_id"
        | "invalid_video_id";
    };

function isYouTubeHost(hostname: string): boolean {
  return YOUTUBE_HOSTS.has(hostname.toLowerCase());
}

function isValidVideoId(value: string | null): value is string {
  return typeof value === "string" && YOUTUBE_VIDEO_ID_PATTERN.test(value);
}

/**
 * Parses normal YouTube URL formats and extracts the video ID:
 *  - https://www.youtube.com/watch?v=VIDEO_ID
 *  - https://youtu.be/VIDEO_ID
 *  - https://www.youtube.com/embed/VIDEO_ID
 *  - https://www.youtube.com/shorts/VIDEO_ID
 *  - https://www.youtube.com/v/VIDEO_ID
 *  - https://m.youtube.com/watch?v=VIDEO_ID
 *  - https://www.youtube-nocookie.com/embed/VIDEO_ID
 *
 * Rejects malformed URLs, unsupported hosts (including deceptive lookalikes
 * like youtube.com.evil.example), invalid IDs, and arbitrary iframe/embed
 * HTML. Only http(s) schemes are accepted.
 */
export function parseYouTubeVideoUrl(
  value: FormDataEntryValue | string | null | undefined,
): SermonVideoParseResult {
  if (typeof value !== "string") return { ok: false, reason: "invalid_url" };
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 2048 || /[\u0000-\u001f\u007f]/.test(trimmed)) {
    return { ok: false, reason: "invalid_url" };
  }
  if (/<\s*\/?\s*(iframe|embed|object|script|video)\b/i.test(trimmed)) {
    return { ok: false, reason: "invalid_url" };
  }

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return { ok: false, reason: "invalid_url" };
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return { ok: false, reason: "invalid_url" };
  }
  if (url.username || url.password) {
    return { ok: false, reason: "invalid_url" };
  }
  if (!isYouTubeHost(url.hostname)) {
    return { ok: false, reason: "unsupported_host" };
  }

  const host = url.hostname.toLowerCase();
  const path = url.pathname.replace(/\/+$/, "");

  // Short links: https://youtu.be/VIDEO_ID
  if (host === "youtu.be" || host === "www.youtu.be") {
    const segments = path.split("/").filter(Boolean);
    if (segments.length !== 1) return { ok: false, reason: "missing_video_id" };
    return isValidVideoId(segments[0])
      ? { ok: true, videoId: segments[0] }
      : { ok: false, reason: "invalid_video_id" };
  }

  const segments = path.split("/").filter(Boolean);

  // Watch pages: /watch?v=VIDEO_ID (extra params like &t= are ignored).
  if (segments.length === 1 && segments[0].toLowerCase() === "watch") {
    const videoId = url.searchParams.get("v");
    if (!videoId) return { ok: false, reason: "missing_video_id" };
    return isValidVideoId(videoId)
      ? { ok: true, videoId }
      : { ok: false, reason: "invalid_video_id" };
  }

  // Embed / shorts / legacy paths: /embed/ID, /shorts/ID, /v/ID.
  if (segments.length === 2) {
    const [kind, videoId] = segments;
    const lowered = kind.toLowerCase();
    if (lowered === "embed" || lowered === "shorts" || lowered === "v") {
      if (!videoId) return { ok: false, reason: "missing_video_id" };
      return isValidVideoId(videoId)
        ? { ok: true, videoId }
        : { ok: false, reason: "invalid_video_id" };
    }
  }

  // nocookie embed host only supports /embed/ID.
  if (
    (host === "youtube-nocookie.com" || host === "www.youtube-nocookie.com") &&
    segments.length === 2 &&
    segments[0].toLowerCase() === "embed" &&
    isValidVideoId(segments[1])
  ) {
    return { ok: true, videoId: segments[1] };
  }

  return { ok: false, reason: "missing_video_id" };
}

/** Privacy-enhanced embed URL generated from a validated video ID only. */
export function youTubeEmbedUrl(videoId: string): string | null {
  if (!isValidVideoId(videoId)) return null;
  return `https://www.youtube-nocookie.com/embed/${videoId}`;
}

/** Standard watch URL generated from a validated video ID only. */
export function youTubeWatchUrl(videoId: string): string | null {
  if (!isValidVideoId(videoId)) return null;
  return `https://www.youtube.com/watch?v=${videoId}`;
}

/** High-quality thumbnail URL generated from a validated video ID only. */
export function youTubeThumbnailUrl(videoId: string): string | null {
  if (!isValidVideoId(videoId)) return null;
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

/**
 * Canonical HTTPS watch URL stored in video_details. The stored URL is
 * regenerated from the video ID rather than echoing administrator input.
 */
export function canonicalYouTubeUrl(videoId: string): string | null {
  return youTubeWatchUrl(videoId);
}
