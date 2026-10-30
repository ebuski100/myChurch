import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Sermon } from "@/lib/sermons";
import { isUuid } from "@/lib/sermon-audio-authorization";
import {
  toVideoDisplay,
  type SermonWithMedia,
} from "@/lib/sermon-media-display";
import { parseYouTubeVideoUrl } from "@/lib/sermon-video";

type Embedded<T> = T | T[] | null;

type SermonDetails = {
  preacher: string | null;
  sermon_date: string | null;
  series: string | null;
};

type ResourceAsset = {
  purpose: string;
  download_allowed: boolean;
};

type SermonResourceRow = {
  id: string;
  title: string;
  description?: string | null;
  sermon_details: Embedded<SermonDetails>;
  audio_details: Embedded<{
    duration_seconds: number | null;
  }>;
  resource_assets: Embedded<ResourceAsset>;
};

type VideoSermonResourceRow = {
  id: string;
  title: string;
  description?: string | null;
  sermon_details: Embedded<SermonDetails>;
  video_details: Embedded<{
    external_url: string | null;
    duration_seconds: number | null;
  }>;
};

export type PublishedSermonsResult =
  | { kind: "success"; sermons: Sermon[] }
  | { kind: "error" };

export type PublishedSermonLibraryResult =
  | { kind: "success"; sermons: SermonWithMedia[] }
  | { kind: "error" };

function first<T>(relation: Embedded<T>): T | null {
  return Array.isArray(relation) ? (relation[0] ?? null) : relation;
}

function getAssetLinks(
  relation: Embedded<ResourceAsset>,
): ResourceAsset[] {
  if (!relation) return [];
  return Array.isArray(relation) ? relation : [relation];
}

function toAudioSermon(row: SermonResourceRow): Sermon | null {
  const sermonDetails = first(row.sermon_details);
  const audioDetails = first(row.audio_details);

  if (!sermonDetails || !audioDetails) {
    return null;
  }

  const assetLinks = getAssetLinks(row.resource_assets);

  return {
    id: row.id,
    title: row.title,
    preacher: sermonDetails.preacher,
    date: sermonDetails.sermon_date,
    durationSeconds: audioDetails.duration_seconds,
    category: sermonDetails.series,
    downloadAllowed: assetLinks.some(
      (link) => link.purpose === "audio" && link.download_allowed,
    ),
  };
}

function toVideoSermon(
  row: VideoSermonResourceRow,
): SermonWithMedia | null {
  const sermonDetails = first(row.sermon_details);
  const videoDetails = first(row.video_details);

  if (!sermonDetails || !videoDetails?.external_url) {
    return null;
  }

  const parsedVideo = parseYouTubeVideoUrl(videoDetails.external_url);

  if (!parsedVideo.ok) {
    return null;
  }

  const video = toVideoDisplay(parsedVideo.videoId);

  if (!video) {
    return null;
  }

  return {
    id: row.id,
    title: row.title,
    preacher: sermonDetails.preacher,
    date: sermonDetails.sermon_date,
    durationSeconds: videoDetails.duration_seconds,
    category: sermonDetails.series,
    downloadAllowed: false,
    mediaType: "video",
    video,
  };
}

/**
 * Returns published audio sermons for the existing audio player
 * and Listen Later features.
 */
export async function getPublishedAudioSermons(): Promise<PublishedSermonsResult> {
  try {
    const supabase = createSupabaseServerClient();

    const { data, error } = await supabase
      .from("resources")
      .select(
        `
        id,
        title,
        sermon_details!inner(preacher, sermon_date, series),
        audio_details!inner(duration_seconds),
        resource_assets(purpose, download_allowed)
      `,
      )
      .eq("resource_type", "audio")
      .eq("publication_status", "published")
      .lte("published_at", new Date().toISOString())
      .order("published_at", { ascending: false });

    if (error || !data) {
      return { kind: "error" };
    }

    const sermons = (data as unknown as SermonResourceRow[]).flatMap(
      (row) => {
        const sermon = toAudioSermon(row);
        return sermon ? [sermon] : [];
      },
    );

    return { kind: "success", sermons };
  } catch {
    return { kind: "error" };
  }
}

export type PublishedAudioSermonDetail = Sermon & {
  description: string | null;
};

/**
 * Kept for compatibility with any existing audio-specific callers.
 * The public [resourceId] page will use the video-only function instead.
 */
export async function getPublishedAudioSermonById(
  resourceId: string,
): Promise<PublishedAudioSermonDetail | null> {
  if (!isUuid(resourceId)) {
    return null;
  }

  try {
    const supabase = createSupabaseServerClient();

    const { data, error } = await supabase
      .from("resources")
      .select(
        `
        id,
        title,
        description,
        sermon_details!inner(preacher, sermon_date, series),
        audio_details!inner(duration_seconds),
        resource_assets(purpose, download_allowed)
      `,
      )
      .eq("id", resourceId)
      .eq("resource_type", "audio")
      .eq("publication_status", "published")
      .lte("published_at", new Date().toISOString())
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    const row = data as unknown as SermonResourceRow;
    const sermon = toAudioSermon(row);

    if (!sermon) {
      return null;
    }

    return {
      ...sermon,
      description: row.description ?? null,
    };
  } catch {
    return null;
  }
}

/**
 * Returns published video sermons with validated YouTube display URLs.
 * Invalid or unsupported video URLs are excluded from the public library.
 */
export async function getPublishedVideoSermons(): Promise<PublishedSermonLibraryResult> {
  try {
    const supabase = createSupabaseServerClient();

    const { data, error } = await supabase
      .from("resources")
      .select(
        `
        id,
        title,
        sermon_details!inner(preacher, sermon_date, series),
        video_details!inner(external_url, duration_seconds)
      `,
      )
      .eq("resource_type", "video")
      .eq("publication_status", "published")
      .lte("published_at", new Date().toISOString())
      .order("published_at", { ascending: false });

    if (error || !data) {
      return { kind: "error" };
    }

    const sermons = (
      data as unknown as VideoSermonResourceRow[]
    ).flatMap((row) => {
      const sermon = toVideoSermon(row);
      return sermon ? [sermon] : [];
    });

    return { kind: "success", sermons };
  } catch {
    return { kind: "error" };
  }
}

/**
 * Combined public library: audio sermons retain their existing
 * audio-player data, while videos include validated YouTube details.
 */
export async function getPublishedSermonLibrary(): Promise<PublishedSermonLibraryResult> {
  const [audioResult, videoResult] = await Promise.all([
    getPublishedAudioSermons(),
    getPublishedVideoSermons(),
  ]);

  if (audioResult.kind === "error" || videoResult.kind === "error") {
    return { kind: "error" };
  }

  const audioSermons: SermonWithMedia[] = audioResult.sermons.map(
    (sermon) => ({
      ...sermon,
      mediaType: "audio",
      video: null,
    }),
  );

  const sermons = [...audioSermons, ...videoResult.sermons];

  // Keep both media types in reverse chronological order where dates exist.
  sermons.sort((a, b) => {
    const dateA = a.date ? Date.parse(a.date) : 0;
    const dateB = b.date ? Date.parse(b.date) : 0;
    return dateB - dateA;
  });

  return { kind: "success", sermons };
}

export type PublishedVideoSermonDetail = SermonWithMedia & {
  description: string | null;
};

/**
 * Looks up a published video sermon only.
 * Audio resources, invalid IDs, drafts and future publications return null.
 */
export async function getPublishedVideoSermonById(
  resourceId: string,
): Promise<PublishedVideoSermonDetail | null> {
  if (!isUuid(resourceId)) {
    return null;
  }

  try {
    const supabase = createSupabaseServerClient();

    const { data, error } = await supabase
      .from("resources")
      .select(
        `
        id,
        title,
        description,
        sermon_details!inner(preacher, sermon_date, series),
        video_details!inner(external_url, duration_seconds)
      `,
      )
      .eq("id", resourceId)
      .eq("resource_type", "video")
      .eq("publication_status", "published")
      .lte("published_at", new Date().toISOString())
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    const row = data as unknown as VideoSermonResourceRow;
    const sermon = toVideoSermon(row);

    if (!sermon) {
      return null;
    }

    return {
      ...sermon,
      description: row.description ?? null,
    };
  } catch {
    return null;
  }
}
