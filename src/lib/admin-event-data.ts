import "server-only";

import { createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";
import { getEventPosterUrls } from "@/lib/event-posters";
import {
  formatLagosDateTimeInput,
  type EventStatus,
} from "@/lib/event-validation";

export type AdminEvent = {
  id: string;
  title: string;
  description: string | null;
  startsAt: string;
  endsAt: string | null;
  location: string | null;
  status: EventStatus;
  publishedAt: string | null;
  posterAssetId: string | null;
  posterUrl: string | null;
};

export type AdminEventsResult =
  | { kind: "success"; events: AdminEvent[] }
  | { kind: "error" };

export type AdminEventResult =
  | { kind: "success"; event: AdminEvent }
  | { kind: "not_found" }
  | { kind: "error" };

type EventRow = {
  id: string;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string | null;
  location: string | null;
  publication_status: EventStatus;
  published_at: string | null;
  poster_asset_id: string | null;
};

function mapAdminEvent(
  row: EventRow,
  posterUrl: string | null,
): AdminEvent {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    location: row.location,
    status: row.publication_status,
    publishedAt: row.published_at,
    posterAssetId: row.poster_asset_id,
    posterUrl,
  };
}

export function toEventDateTimeInput(value: string | null): string {
  return formatLagosDateTimeInput(value);
}

export async function getAdminEvents(): Promise<AdminEventsResult> {
  try {
    const supabase = await createSupabaseAuthServerClient();
    const { data, error } = await supabase
      .from("events")
      .select(
        "id, title, description, starts_at, ends_at, location, publication_status, published_at, poster_asset_id",
      )
      .order("starts_at", { ascending: true });
    if (error || !data) return { kind: "error" };

    const rows = data as EventRow[];
    const posterUrls = await getEventPosterUrls(
      rows.flatMap((row) =>
        row.poster_asset_id ? [row.poster_asset_id] : [],
      ),
    );
    return {
      kind: "success",
      events: rows.map((row) =>
        mapAdminEvent(
          row,
          posterUrls.get(row.poster_asset_id ?? "") ?? null,
        ),
      ),
    };
  } catch {
    return { kind: "error" };
  }
}

export async function getAdminEvent(
  eventId: string,
): Promise<AdminEventResult> {
  try {
    const supabase = await createSupabaseAuthServerClient();
    const { data, error } = await supabase
      .from("events")
      .select(
        "id, title, description, starts_at, ends_at, location, publication_status, published_at, poster_asset_id",
      )
      .eq("id", eventId)
      .maybeSingle();
    if (error) return { kind: "error" };
    if (!data) return { kind: "not_found" };

    const row = data as EventRow;
    const posterUrls = row.poster_asset_id
      ? await getEventPosterUrls([row.poster_asset_id])
      : new Map<string, string>();
    return {
      kind: "success",
      event: mapAdminEvent(
        row,
        posterUrls.get(row.poster_asset_id ?? "") ?? null,
      ),
    };
  } catch {
    return { kind: "error" };
  }
}
