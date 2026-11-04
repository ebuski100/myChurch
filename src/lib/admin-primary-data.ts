import "server-only";

import { createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";
import type {
  PrimaryTransferCandidate,
  PrimaryTransferHistoryEntry,
} from "./primary-transfer";

// The shapes live in `primary-transfer.ts`, which stays dependency-free so the
// node:test runner can load it. Re-exported here so the screen has one import.
export type { PrimaryTransferCandidate, PrimaryTransferHistoryEntry };

export type PrimaryTransferCandidatesResult =
  | { kind: "success"; candidates: PrimaryTransferCandidate[] }
  | { kind: "error" };

export type PrimaryTransferHistoryResult =
  | { kind: "success"; entries: PrimaryTransferHistoryEntry[] }
  | { kind: "error" };

type CandidateRow = {
  user_id?: unknown;
  email?: unknown;
  admin_since?: unknown;
};

type HistoryRow = {
  id?: unknown;
  previous_primary_id?: unknown;
  new_primary_id?: unknown;
  initiated_by_id?: unknown;
  transferred_at?: unknown;
};

function asRows(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

/**
 * Eligible recipients for a transfer: active standard administrators.
 *
 * The database decides eligibility (see
 * `public.list_primary_transfer_candidates`), so this helper only shapes the
 * result. A caller who is not the active primary receives an empty list rather
 * than an error — the RPC still refuses the transfer itself.
 */
export async function getPrimaryTransferCandidates(): Promise<PrimaryTransferCandidatesResult> {
  try {
    const supabase = await createSupabaseAuthServerClient();
    const { data, error } = await supabase.rpc(
      "list_primary_transfer_candidates",
    );

    if (error) return { kind: "error" };

    const candidates: PrimaryTransferCandidate[] = [];
    for (const value of asRows(data)) {
      const row = value as CandidateRow;
      if (typeof row.user_id !== "string") continue;
      candidates.push({
        userId: row.user_id,
        email: typeof row.email === "string" ? row.email : null,
        adminSince:
          typeof row.admin_since === "string" ? row.admin_since : null,
      });
    }

    return { kind: "success", candidates };
  } catch {
    return { kind: "error" };
  }
}

/**
 * Most recent successful transfers. Readable by any ACTIVE administrator
 * through the `admin_primary_transfers_read_active_admin` policy.
 */
export async function getPrimaryTransferHistory(
  limit = 10,
): Promise<PrimaryTransferHistoryResult> {
  const safeLimit = Number.isInteger(limit)
    ? Math.min(Math.max(limit, 1), 50)
    : 10;

  try {
    const supabase = await createSupabaseAuthServerClient();
    const { data, error } = await supabase
      .from("admin_primary_transfers")
      .select(
        "id, previous_primary_id, new_primary_id, initiated_by_id, transferred_at",
      )
      .order("transferred_at", { ascending: false })
      .limit(safeLimit);

    if (error) return { kind: "error" };

    const entries: PrimaryTransferHistoryEntry[] = [];
    for (const value of asRows(data)) {
      const row = value as HistoryRow;
      if (
        typeof row.id !== "string" ||
        typeof row.previous_primary_id !== "string" ||
        typeof row.new_primary_id !== "string" ||
        typeof row.initiated_by_id !== "string" ||
        typeof row.transferred_at !== "string"
      ) {
        continue;
      }
      entries.push({
        id: row.id,
        previousPrimaryId: row.previous_primary_id,
        newPrimaryId: row.new_primary_id,
        initiatedById: row.initiated_by_id,
        transferredAt: row.transferred_at,
      });
    }

    return { kind: "success", entries };
  } catch {
    return { kind: "error" };
  }
}
