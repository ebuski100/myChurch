import "server-only";

import { createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";
import type { SermonMediaType } from "@/lib/admin-sermon-validation";

export type AdminSermonStatus = "draft" | "scheduled" | "published" | "archived";

export type AdminSermon = {
  id: string;
  title: string;
  preacher: string | null;
  sermonDate: string | null;
  series: string | null;
  durationSeconds: number | null;
  status: AdminSermonStatus;
  publishedAt: string | null;
  mediaType: SermonMediaType;
  hasMedia: boolean;
  /** Kept for existing callers; true when any linked sermon media exists. */
  hasAudioAsset: boolean;
};

export type AdminSermonsResult =
  | { kind: "success"; sermons: AdminSermon[] }
  | { kind: "error" };

export type AdminSermonEdit = {
  id: string;
  title: string;
  description: string | null;
  preacher: string | null;
  sermonDate: string | null;
  series: string | null;
  durationSeconds: number | null;
  status: AdminSermonStatus;
  publishedAt: string | null;
  mediaType: SermonMediaType;
  hasMedia: boolean;
  /** Kept for existing callers operating on audio sermons. */
  hasAudioAsset: boolean;
  downloadAllowed: boolean;
  youtubeUrl: string | null;
  youtubeVideoId: string | null;
};

export type AdminSermonEditResult =
  | { kind: "success"; sermon: AdminSermonEdit }
  | { kind: "not_found" }
  | { kind: "error" };

type Embedded<T> = T | T[] | null;

type SermonResourceRow = {
  id: string;
  title: string;
  resource_type: "audio" | "video";
  publication_status: AdminSermonStatus;
  published_at: string | null;
  sermon_details: Embedded<{
    preacher: string | null;
    sermon_date: string | null;
    series: string | null;
  }>;
  audio_details: Embedded<{ duration_seconds: number | null }>;
  video_details: Embedded<{ external_url: string | null }>;
  resource_assets: Embedded<{
    purpose: string;
    assets: Embedded<{ id: string }>;
  }>;
};

function rows<T>(relation: Embedded<T>): T[] {
  if (Array.isArray(relation)) return relation;
  return relation === null ? [] : [relation];
}

export async function getAdminSermons(): Promise<AdminSermonsResult> {
  try {
    const supabase = await createSupabaseAuthServerClient();
    const { data, error } = await supabase
      .from("resources")
      .select(`
        id,
        title,
        resource_type,
        publication_status,
        published_at,
        sermon_details!inner(preacher, sermon_date, series),
        audio_details(duration_seconds),
        video_details(external_url),
        resource_assets(purpose, assets(id))
      `)
      .in("resource_type", ["audio", "video"])
      .order("created_at", { ascending: false });

    if (error || !data) return { kind: "error" };

    const sermons = (data as unknown as SermonResourceRow[]).flatMap((row) => {
      const sermonDetails = rows(row.sermon_details)[0];
      if (!sermonDetails) return [];

      const audioDetails = rows(row.audio_details)[0] ?? null;
      const videoDetails = rows(row.video_details)[0] ?? null;
      const mediaType: SermonMediaType =
        row.resource_type === "video" ? "video" : "audio";
      const hasMedia = mediaType === "audio"
        ? rows(row.resource_assets).some((link) =>
            link.purpose === "audio" && rows(link.assets).some((asset) => Boolean(asset.id)),
          )
        : Boolean(videoDetails?.external_url?.trim());

      return [{
        id: row.id,
        title: row.title,
        preacher: sermonDetails.preacher,
        sermonDate: sermonDetails.sermon_date,
        series: sermonDetails.series,
        durationSeconds: audioDetails?.duration_seconds ?? null,
        status: row.publication_status,
        publishedAt: row.published_at,
        mediaType,
        hasMedia,
        hasAudioAsset: hasMedia && mediaType === "audio",
      } satisfies AdminSermon];
    });

    return { kind: "success", sermons };
  } catch {
    return { kind: "error" };
  }
}

export async function getAdminSermonForEdit(resourceId: string): Promise<AdminSermonEditResult> {
  try {
    const supabase = await createSupabaseAuthServerClient();
    const { data, error } = await supabase
      .from("resources")
      .select("id, title, description, resource_type, publication_status, published_at, sermon_details!inner(preacher, sermon_date, series), audio_details(duration_seconds), video_details(external_url), resource_assets(purpose, download_allowed, assets(id))")
      .eq("id", resourceId)
      .in("resource_type", ["audio", "video"])
      .maybeSingle();

    if (error) return { kind: "error" };
    if (!data) return { kind: "not_found" };

    const row = data as unknown as {
      id: string;
      title: string;
      description: string | null;
      resource_type: "audio" | "video";
      publication_status: AdminSermonStatus;
      published_at: string | null;
      sermon_details: Embedded<{ preacher: string | null; sermon_date: string | null; series: string | null }>;
      audio_details: Embedded<{ duration_seconds: number | null }>;
      video_details: Embedded<{ external_url: string | null }>;
      resource_assets: Embedded<{ purpose: string; download_allowed: boolean; assets: Embedded<{ id: string }> }>;
    };
    const details = rows(row.sermon_details)[0];
    if (!details) return { kind: "not_found" };
    const mediaType: SermonMediaType =
      row.resource_type === "video" ? "video" : "audio";
    const audio = rows(row.audio_details)[0] ?? null;
    const video = rows(row.video_details)[0] ?? null;
    const audioLink = rows(row.resource_assets).find((link) =>
      link.purpose === "audio" && rows(link.assets).some((asset) => Boolean(asset.id)),
    );
    const hasMedia = mediaType === "audio"
      ? Boolean(audioLink)
      : Boolean(video?.external_url?.trim());
    return {
      kind: "success",
      sermon: {
        id: row.id,
        title: row.title,
        description: row.description,
        preacher: details.preacher,
        sermonDate: details.sermon_date,
        series: details.series,
        durationSeconds: audio?.duration_seconds ?? null,
        status: row.publication_status,
        publishedAt: row.published_at,
        mediaType,
        hasMedia,
        hasAudioAsset: mediaType === "audio" ? Boolean(audioLink) : false,
        downloadAllowed: audioLink?.download_allowed === true,
        youtubeUrl: mediaType === "video" ? (video?.external_url ?? null) : null,
        youtubeVideoId: null,
      },
    };
  } catch {
    return { kind: "error" };
  }
}
