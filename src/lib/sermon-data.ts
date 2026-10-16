import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Sermon } from "@/lib/sermons";

type Embedded<T> = T | T[] | null;

type SermonResourceRow = {
  id: string;
  title: string;
  sermon_details: Embedded<{
    preacher: string | null;
    sermon_date: string | null;
    series: string | null;
  }>;
  audio_details: Embedded<{
    duration_seconds: number | null;
  }>;
  resource_assets: Embedded<{
    purpose: string;
    download_allowed: boolean;
  }>;
};

export type PublishedSermonsResult =
  | { kind: "success"; sermons: Sermon[] }
  | { kind: "error" };

function first<T>(relation: Embedded<T>): T | null {
  return Array.isArray(relation) ? relation[0] ?? null : relation;
}

export async function getPublishedAudioSermons(): Promise<PublishedSermonsResult> {
  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("resources")
      .select(`
        id,
        title,
        sermon_details!inner(preacher, sermon_date, series),
        audio_details!inner(duration_seconds),
        resource_assets(purpose, download_allowed)
      `)
      .eq("resource_type", "audio")
      .eq("publication_status", "published")
      .lte("published_at", new Date().toISOString())
      .order("published_at", { ascending: false });

    if (error || !data) return { kind: "error" };

    const sermons = (data as unknown as SermonResourceRow[]).flatMap((row) => {
      const sermonDetails = first(row.sermon_details);
      const audioDetails = first(row.audio_details);
      const assetLinks = Array.isArray(row.resource_assets)
        ? row.resource_assets
        : row.resource_assets
          ? [row.resource_assets]
          : [];

      if (!sermonDetails || !audioDetails) return [];

      return [{
        id: row.id,
        title: row.title,
        preacher: sermonDetails.preacher,
        date: sermonDetails.sermon_date,
        durationSeconds: audioDetails.duration_seconds,
        category: sermonDetails.series,
        downloadAllowed: assetLinks.some((link) =>
          link.purpose === "audio" && link.download_allowed,
        ),
      } satisfies Sermon];
    });

    return { kind: "success", sermons };
  } catch {
    return { kind: "error" };
  }
}
