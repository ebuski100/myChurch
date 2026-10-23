import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AdminDashboardCounts = {
  sermons: number | null;
  events: number | null;
};

function countOrUnavailable(result: { count: number | null; error: unknown }) {
  return result.error ? null : result.count ?? 0;
}

export async function getAdminDashboardCounts(): Promise<AdminDashboardCounts> {
  try {
    const supabase = createSupabaseServerClient();
    const publishedAt = new Date().toISOString();

    const [sermons, events] = await Promise.all([
      supabase
        .from("resources")
        .select(
          "id, sermon_details!inner(resource_id), audio_details!inner(resource_id)",
          { count: "exact", head: true },
        )
        .eq("resource_type", "audio")
        .eq("publication_status", "published")
        .lte("published_at", publishedAt),
      supabase
        .from("events")
        .select("id", { count: "exact", head: true })
        .eq("publication_status", "published")
        .lte("published_at", publishedAt),
    ]);

    return {
      sermons: countOrUnavailable(sermons),
      events: countOrUnavailable(events),
    };
  } catch {
    return { sermons: null, events: null };
  }
}
