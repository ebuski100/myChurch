import {
  youTubeEmbedUrl,
  youTubeThumbnailUrl,
  youTubeWatchUrl,
  type SermonVideoParseResult,
} from "./sermon-video";

export type SermonMedia = "audio" | "video";

export type VideoDisplay = {
  videoId: string;
  embedUrl: string;
  watchUrl: string;
  thumbnailUrl: string;
};

export type SermonVideoValidation = SermonVideoParseResult;

/**
 * Shared public Sermon type extended with optional video info. Audio
 * sermons keep the legacy shape; video sermons add display URLs derived
 * from the validated video ID.
 */
export type SermonWithMedia = {
  id: string;
  title: string;
  preacher: string | null;
  date: string | null;
  durationSeconds: number | null;
  category: string | null;
  downloadAllowed: boolean;
  mediaType: SermonMedia;
  video: VideoDisplay | null;
};

/**
 * Builds video display URLs from an already-validated video ID only. Never
 * pass administrator input through here — validate first.
 */
export function toVideoDisplay(videoId: string): VideoDisplay | null {
  const embedUrl = youTubeEmbedUrl(videoId);
  const watchUrl = youTubeWatchUrl(videoId);
  const thumbnailUrl = youTubeThumbnailUrl(videoId);
  if (!embedUrl || !watchUrl || !thumbnailUrl) return null;
  return { videoId, embedUrl, watchUrl, thumbnailUrl };
}

/** Privacy-enhanced embed host requirement for rendered iframes. */
export function isPrivacyEnhancedEmbedUrl(url: string): boolean {
  try {
    return new URL(url).hostname.toLowerCase() === "www.youtube-nocookie.com";
  } catch {
    return false;
  }
}
