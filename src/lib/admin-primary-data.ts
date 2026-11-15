import "server-only";

import { createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";
import type {
  PrimaryTransferCandidate,
  PrimaryTransferHistoryEntry,
} from "./primary-transfer";
import { shapePrimaryTransferHistory } from "./primary-transfer";

// The shapes live in `primary-transfer.ts`, which stays dependency-free so the
// node:test runner can load it. Re-exported here so the screen has one import.
export type { PrimaryTransferCandidate, PrimaryTransferHistoryEntry };

export type PrimaryTransferCandidatesResult =
  | { kind: "success"; candidates: PrimaryTransferCandidate[] }
  | { kind: "error" };

export type PrimaryTransferHistoryResult =
  | { kind: "success"; entries: PrimaryTransferHistoryEntry[] }
  | { kind: "error" };

export type PrimaryTransferPageData = {
  candidates: PrimaryTransferCandidatesResult;
  history: PrimaryTransferHistoryResult;
};

type CandidateRow = {
  user_id?: unknown;
  email?: unknown;
  admin_since?: unknown;
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
function shapeCandidates(data: unknown): PrimaryTransferCandidatesResult {
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
}

function safeHistoryLimit(limit: number): number {
  return Number.isInteger(limit) ? Math.min(Math.max(limit, 1), 50) : 10;
}

type AuthServerClient = Awaited<
  ReturnType<typeof createSupabaseAuthServerClient>
>;

async function loadCandidates(
  supabase: AuthServerClient,
): Promise<PrimaryTransferCandidatesResult> {
  const { data, error } = await supabase.rpc(
    "list_primary_transfer_candidates",
  );
  return error ? { kind: "error" } : shapeCandidates(data);
}

async function loadHistory(
  supabase: AuthServerClient,
  limit: number,
): Promise<PrimaryTransferHistoryResult> {
  const { data, error } = await supabase.rpc(
    "list_primary_transfer_history",
    { p_limit: safeHistoryLimit(limit) },
  );
  return error
    ? { kind: "error" }
    : { kind: "success", entries: shapePrimaryTransferHistory(data) };
}

export async function getPrimaryTransferPageData(
  limit = 10,
): Promise<PrimaryTransferPageData> {
  try {
    const supabase = await createSupabaseAuthServerClient();
    const [candidates, history] = await Promise.all([
      loadCandidates(supabase),
      loadHistory(supabase, limit),
    ]);
    return { candidates, history };
  } catch {
    return {
      candidates: { kind: "error" },
      history: { kind: "error" },
    };
  }
}

export async function getPrimaryTransferCandidates(): Promise<PrimaryTransferCandidatesResult> {
  try {
    return await loadCandidates(await createSupabaseAuthServerClient());
  } catch {
    return { kind: "error" };
  }
}

export async function getPrimaryTransferHistory(
  limit = 10,
): Promise<PrimaryTransferHistoryResult> {
  try {
    return await loadHistory(
      await createSupabaseAuthServerClient(),
      limit,
    );
  } catch {
    return { kind: "error" };
  }
}
