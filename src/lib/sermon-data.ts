// import "server-only";

// import { createSupabaseServerClient } from "@/lib/supabase/server";
// import type { Sermon } from "@/lib/sermons";

// type Embedded<T> = T | T[] | null;

// type SermonResourceRow = {
//   id: string;
//   title: string;
//   sermon_details: Embedded<{
//     preacher: string | null;
//     sermon_date: string | null;
//     series: string | null;
//   }>;
//   audio_details: Embedded<{
//     duration_seconds: number | null;
//   }>;
//   resource_assets: Embedded<{
//     purpose: string;
//     download_allowed: boolean;
//   }>;
// };

// export type PublishedSermonsResult =
//   | { kind: "success"; sermons: Sermon[] }
//   | { kind: "error" };

// function first<T>(relation: Embedded<T>): T | null {
//   return Array.isArray(relation) ? relation[0] ?? null : relation;
// }

// export async function getPublishedAudioSermons(): Promise<PublishedSermonsResult> {
//   try {
//     const supabase = createSupabaseServerClient();
//     const { data, error } = await supabase
//       .from("resources")
//       .select(`
//         id,
//         title,
//         sermon_details!inner(preacher, sermon_date, series),
//         audio_details!inner(duration_seconds),
//         resource_assets(purpose, download_allowed)
//       `)
//       .eq("resource_type", "audio")
//       .eq("publication_status", "published")
//       .lte("published_at", new Date().toISOString())
//       .order("published_at", { ascending: false });

//     if (error || !data) return { kind: "error" };

//     const sermons = (data as unknown as SermonResourceRow[]).flatMap((row) => {
//       const sermonDetails = first(row.sermon_details);
//       const audioDetails = first(row.audio_details);
//       const assetLinks = Array.isArray(row.resource_assets)
//         ? row.resource_assets
//         : row.resource_assets
//           ? [row.resource_assets]
//           : [];

//       if (!sermonDetails || !audioDetails) return [];

//       return [{
//         id: row.id,
//         title: row.title,
//         preacher: sermonDetails.preacher,
//         date: sermonDetails.sermon_date,
//         durationSeconds: audioDetails.duration_seconds,
//         category: sermonDetails.series,
//         downloadAllowed: assetLinks.some((link) =>
//           link.purpose === "audio" && link.download_allowed,
//         ),
//       } satisfies Sermon];
//     });

//     return { kind: "success", sermons };
//   } catch {
//     return { kind: "error" };
//   }
// }

import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Sermon } from "@/lib/sermons";
import { isUuid } from "@/lib/sermon-audio-authorization";

type Embedded<T> = T | T[] | null;

type SermonResourceRow = {
  id: string;
  title: string;
  description?: string | null;
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
  return Array.isArray(relation) ? (relation[0] ?? null) : relation;
}

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
        const sermonDetails = first(row.sermon_details);
        const audioDetails = first(row.audio_details);

        const assetLinks = Array.isArray(row.resource_assets)
          ? row.resource_assets
          : row.resource_assets
            ? [row.resource_assets]
            : [];

        if (!sermonDetails || !audioDetails) {
          return [];
        }

        return [
          {
            id: row.id,
            title: row.title,
            preacher: sermonDetails.preacher,
            date: sermonDetails.sermon_date,
            durationSeconds: audioDetails.duration_seconds,
            category: sermonDetails.series,
            downloadAllowed: assetLinks.some(
              (link) =>
                link.purpose === "audio" && link.download_allowed,
            ),
          } satisfies Sermon,
        ];
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
    const sermonDetails = first(row.sermon_details);
    const audioDetails = first(row.audio_details);

    const assetLinks = Array.isArray(row.resource_assets)
      ? row.resource_assets
      : row.resource_assets
        ? [row.resource_assets]
        : [];

    if (!sermonDetails || !audioDetails) {
      return null;
    }

    return {
      id: row.id,
      title: row.title,
      description: row.description ?? null,
      preacher: sermonDetails.preacher,
      date: sermonDetails.sermon_date,
      durationSeconds: audioDetails.duration_seconds,
      category: sermonDetails.series,
      downloadAllowed: assetLinks.some(
        (link) => link.purpose === "audio" && link.download_allowed,
      ),
    };
  } catch {
    return null;
  }
}
