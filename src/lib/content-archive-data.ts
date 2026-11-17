import "server-only";

import { createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";

export const contentArchiveTypes = [
  "resource",
  "event",
  "gallery_album",
  "gallery_photo",
  "ministry",
  "department",
  "department_member",
] as const;

export type ContentArchiveType = (typeof contentArchiveTypes)[number];

export type ContentArchiveCandidate = {
  contentType: ContentArchiveType;
  contentId: string;
  title: string;
  detail: string;
};

export type ContentArchiveItem = {
  contentType: ContentArchiveType;
  contentId: string;
  title: string;
  previousPublicationStatus: string | null;
  archivedAt: string;
};

export type ContentArchiveHistoryEntry = {
  id: number;
  contentType: ContentArchiveType;
  contentId: string;
  title: string;
  action: "archived" | "restored" | "permanently_deleted";
  administratorIdentity: string;
  occurredAt: string;
};

export type ContentCleanupJob = {
  id: string;
  contentType: string;
  contentId: string;
  title: string;
  attemptCount: number;
  lastError: string | null;
  createdAt: string;
};

export type AdminContentArchiveResult =
  | {
      kind: "success";
      archivedItems: ContentArchiveItem[];
      candidates: ContentArchiveCandidate[];
      history: ContentArchiveHistoryEntry[];
      historyTotal: number;
      historyPage: number;
      cleanupJobs: ContentCleanupJob[];
    }
  | { kind: "error" };

type RawArchiveItem = {
  content_type: string;
  content_id: string;
  title_snapshot: string;
  previous_publication_status: string | null;
  archived_at: string;
};

type RawCandidateRow = {
  id: string;
  title?: string | null;
  name?: string | null;
  full_name?: string | null;
  caption?: string | null;
  alt_text?: string | null;
  resource_type?: string | null;
  publication_status?: string | null;
  album_id?: string | null;
  department_id?: string | null;
  gallery_albums?: { title?: string | null } | null;
  departments?: { name?: string | null } | null;
};

function isContentArchiveType(
  value: string,
): value is ContentArchiveType {
  return contentArchiveTypes.some((type) => type === value);
}

function relation<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : (value ?? null);
}

function candidate(
  contentType: ContentArchiveType,
  row: RawCandidateRow,
  title: string,
  detail: string,
): ContentArchiveCandidate {
  return {
    contentType,
    contentId: row.id,
    title: title.trim() || "Untitled content",
    detail,
  };
}

export async function getAdminContentArchive(
  role: "primary" | "standard",
  historyPage = 0,
): Promise<AdminContentArchiveResult> {
  try {
    const supabase = await createSupabaseAuthServerClient();
    const [
      archiveResult,
      historyResult,
      cleanupResult,
      resourcesResult,
      eventsResult,
      albumsResult,
      photosResult,
      ministriesResult,
      departmentsResult,
      membersResult,
    ] = await Promise.all([
      supabase
        .from("content_archive_items")
        .select(
          "content_type, content_id, title_snapshot, previous_publication_status, archived_at",
        )
        .order("archived_at", { ascending: false }),
      supabase
        .from("content_archive_history")
        .select(
          "id, content_type, content_id, title_snapshot, action, administrator_identity, occurred_at",
          { count: "exact" },
        )
        .order("occurred_at", { ascending: false })
        .range(historyPage * 250, historyPage * 250 + 249),
      role === "primary"
        ? supabase
            .from("content_storage_cleanup_jobs")
            .select(
              "id, content_type, content_id, content_title, attempt_count, last_error, created_at",
            )
            .is("completed_at", null)
            .order("created_at", { ascending: true })
        : Promise.resolve({ data: [], error: null }),
      supabase
        .from("resources")
        .select("id, title, resource_type, publication_status"),
      supabase
        .from("events")
        .select("id, title, publication_status"),
      supabase
        .from("gallery_albums")
        .select("id, title, publication_status"),
      supabase
        .from(
          "gallery_photos",
        )
        .select(
          "id, album_id, caption, alt_text, gallery_albums(title)",
        ),
      supabase
        .from("ministries")
        .select("id, name, publication_status"),
      supabase
        .from("departments")
        .select("id, name, publication_status"),
      supabase
        .from("department_members")
        .select(
          "id, department_id, full_name, publication_status, departments(name)",
        ),
    ]);

    if (
      archiveResult.error ||
      historyResult.error ||
      cleanupResult.error ||
      resourcesResult.error ||
      eventsResult.error ||
      albumsResult.error ||
      photosResult.error ||
      ministriesResult.error ||
      departmentsResult.error ||
      membersResult.error
    ) {
      return { kind: "error" };
    }

    const archivedItems = (archiveResult.data ?? [])
      .filter((row): row is typeof row & { content_type: ContentArchiveType } =>
        isContentArchiveType(row.content_type),
      )
      .map((row: RawArchiveItem) => ({
        contentType: row.content_type as ContentArchiveType,
        contentId: row.content_id,
        title: row.title_snapshot,
        previousPublicationStatus: row.previous_publication_status,
        archivedAt: row.archived_at,
      }));

    const archivedKeys = new Set(
      archivedItems.map(
        (item) => `${item.contentType}:${item.contentId}`,
      ),
    );
    const candidates: ContentArchiveCandidate[] = [];

    for (const raw of resourcesResult.data ?? []) {
      const row = raw as RawCandidateRow;
      if (row.publication_status === "archived") continue;
      candidates.push(
        candidate(
          "resource",
          row,
          row.title ?? "",
          [row.resource_type, row.publication_status]
            .filter(Boolean)
            .join(" · "),
        ),
      );
    }

    for (const raw of eventsResult.data ?? []) {
      const row = raw as RawCandidateRow;
      if (row.publication_status === "archived") continue;
      candidates.push(
        candidate("event", row, row.title ?? "", row.publication_status ?? ""),
      );
    }

    for (const raw of albumsResult.data ?? []) {
      const row = raw as RawCandidateRow;
      if (row.publication_status === "archived") continue;
      candidates.push(
        candidate(
          "gallery_album",
          row,
          row.title ?? "",
          `Gallery album · ${row.publication_status ?? "unknown status"}`,
        ),
      );
    }

    for (const raw of photosResult.data ?? []) {
      const row = raw as RawCandidateRow;
      const album = relation(row.gallery_albums);
      candidates.push(
        candidate(
          "gallery_photo",
          row,
          row.caption ||
            row.alt_text ||
            `Gallery photo ${row.id.slice(0, 8)}`,
          `Photo in ${album?.title ?? "Unknown album"}`,
        ),
      );
    }

    for (const raw of ministriesResult.data ?? []) {
      const row = raw as RawCandidateRow;
      if (row.publication_status === "archived") continue;
      candidates.push(
        candidate(
          "ministry",
          row,
          row.name ?? "",
          row.publication_status ?? "",
        ),
      );
    }

    for (const raw of departmentsResult.data ?? []) {
      const row = raw as RawCandidateRow;
      if (row.publication_status === "archived") continue;
      candidates.push(
        candidate(
          "department",
          row,
          row.name ?? "",
          row.publication_status ?? "",
        ),
      );
    }

    for (const raw of membersResult.data ?? []) {
      const row = raw as RawCandidateRow;
      if (row.publication_status === "archived") continue;
      const department = relation(row.departments);
      candidates.push(
        candidate(
          "department_member",
          row,
          row.full_name ?? "",
          `${department?.name ?? "Department"} · ${row.publication_status ?? "unknown status"}`,
        ),
      );
    }

    const visibleCandidates = candidates
      .filter(
        (item) =>
          !archivedKeys.has(`${item.contentType}:${item.contentId}`),
      )
      .sort((left, right) => left.title.localeCompare(right.title));

    const history = (historyResult.data ?? [])
      .filter(
        (row) =>
          isContentArchiveType(row.content_type) &&
          (row.action === "archived" ||
            row.action === "restored" ||
            row.action === "permanently_deleted"),
      )
      .map((row) => ({
        id: row.id,
        contentType: row.content_type as ContentArchiveType,
        contentId: row.content_id,
        title: row.title_snapshot,
        action: row.action as ContentArchiveHistoryEntry["action"],
        administratorIdentity: row.administrator_identity,
        occurredAt: row.occurred_at,
      }));

    const cleanupJobs = (cleanupResult.data ?? []).map((row) => ({
      id: row.id,
      contentType: row.content_type,
      contentId: row.content_id,
      title: row.content_title,
      attemptCount: row.attempt_count,
      lastError: row.last_error,
      createdAt: row.created_at,
    }));

    return {
      kind: "success",
      archivedItems,
      candidates: visibleCandidates,
      history,
      historyTotal: historyResult.count ?? history.length,
      historyPage,
      cleanupJobs,
    };
  } catch {
    return { kind: "error" };
  }
}
