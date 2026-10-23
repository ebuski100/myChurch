import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getEventPosterUrls } from "@/lib/event-posters";
import { getEventTimingStatus, type ChurchEvent } from "@/lib/events";

const LAGOS_TIME_ZONE = "Africa/Lagos";

export type PublishedEventsResult =
  | { kind: "success"; events: ChurchEvent[] }
  | { kind: "error" };

export type PublishedEventResult =
  | { kind: "success"; event: ChurchEvent }
  | { kind: "not_found" }
  | { kind: "error" };

type PublicEventRow = {
  id: string;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string | null;
  location: string | null;
  poster_asset_id: string | null;
};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "long",
    timeZone: LAGOS_TIME_ZONE,
  }).format(new Date(value));
}

function formatTime(value: string): string {
  return new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: LAGOS_TIME_ZONE,
  }).format(new Date(value));
}

export async function getPublishedEvents(): Promise<PublishedEventsResult> {
  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("events")
      .select(
        "id, title, description, starts_at, ends_at, location, poster_asset_id",
      )
      .eq("publication_status", "published")
      .lte("published_at", new Date().toISOString())
      .order("starts_at", { ascending: true });
    if (error || !data) return { kind: "error" };

    const rows = data as PublicEventRow[];
    const posterUrls = await getEventPosterUrls(
      rows.flatMap((row) =>
        row.poster_asset_id ? [row.poster_asset_id] : [],
      ),
    );
    const now = new Date();
    const events = rows.map(
      (row): ChurchEvent => ({
        id: row.id,
        title: row.title,
        startsAt: row.starts_at,
        endsAt: row.ends_at,
        date: formatDate(row.starts_at),
        startTime: formatTime(row.starts_at),
        endTime: row.ends_at ? formatTime(row.ends_at) : null,
        location: row.location,
        description: row.description,
        imageUrl: posterUrls.get(row.poster_asset_id ?? "") ?? null,
        status: getEventTimingStatus(row.starts_at, row.ends_at, now),
      }),
    );

    return { kind: "success", events };
  } catch {
    return { kind: "error" };
  }
}

export async function getPublishedEventById(
  eventId: string,
): Promise<PublishedEventResult> {
  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("events")
      .select(
        "id, title, description, starts_at, ends_at, location, poster_asset_id",
      )
      .eq("id", eventId)
      .eq("publication_status", "published")
      .lte("published_at", new Date().toISOString())
      .maybeSingle();

    if (error) return { kind: "error" };
    if (!data) return { kind: "not_found" };

    const row = data as PublicEventRow;
    const posterUrls = row.poster_asset_id
      ? await getEventPosterUrls([row.poster_asset_id])
      : new Map<string, string>();
    const now = new Date();
    return {
      kind: "success",
      event: {
        id: row.id,
        title: row.title,
        startsAt: row.starts_at,
        endsAt: row.ends_at,
        date: formatDate(row.starts_at),
        startTime: formatTime(row.starts_at),
        endTime: row.ends_at ? formatTime(row.ends_at) : null,
        location: row.location,
        description: row.description,
        imageUrl: posterUrls.get(row.poster_asset_id ?? "") ?? null,
        status: getEventTimingStatus(row.starts_at, row.ends_at, now),
      },
    };
  } catch {
    return { kind: "error" };
  }
}
