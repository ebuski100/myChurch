import type { AdminAccessDecision } from "./admin-authorization";

/**
 * Pure authorization and error-mapping helpers for the primary-administrator
 * transfer. No server-only imports and no Supabase client, so the same rules
 * are unit-testable and reusable by the server action and the client form.
 *
 * These checks are a fast, friendly first line only. The database RPC
 * `public.transfer_primary_admin` re-validates the caller, the target and the
 * seat inside one transaction and is the authority on every decision here.
 */

/** An active standard administrator who could receive the primary role. */
export type PrimaryTransferCandidate = {
  userId: string;
  email: string | null;
  adminSince: string | null;
};

/** One successful transfer, as recorded in `admin_primary_transfers`. */
export type PrimaryTransferHistoryEntry = {
  id: string;
  previousPrimaryId: string;
  newPrimaryId: string;
  initiatedById: string;
  transferredAt: string;
};

export type TransferFailureReason =
  | "unauthenticated"
  | "not_primary"
  | "no_active_primary"
  | "invalid_target"
  | "self_target"
  | "target_not_admin"
  | "target_not_standard"
  | "target_inactive"
  | "invariant"
  | "unknown";

export type PrimaryTransferAccess =
  | { allowed: true; userId: string }
  | { allowed: false; reason: "unauthenticated" | "forbidden" | "not_primary" };

export type TransferTargetValidation =
  | { ok: true; targetUserId: string }
  | { ok: false; reason: "invalid_target" | "self_target" };

// Local copy rather than a shared import: this module must stay dependency-free
// so the node:test runner can load it without a bundler.
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const failureCodes: Record<string, TransferFailureReason> = {
  UNAUTHENTICATED: "unauthenticated",
  NOT_PRIMARY: "not_primary",
  NO_ACTIVE_PRIMARY: "no_active_primary",
  INVALID_TARGET: "invalid_target",
  SELF: "self_target",
  TARGET_NOT_ADMIN: "target_not_admin",
  TARGET_NOT_STANDARD: "target_not_standard",
  TARGET_INACTIVE: "target_inactive",
  INVARIANT: "invariant",
};

/**
 * Only the active primary administrator may open the transfer screen or call
 * the action. A standard administrator — including a former primary — is
 * denied even though they are a fully authorized admin elsewhere.
 */
export function decidePrimaryTransferAccess(
  access: AdminAccessDecision,
): PrimaryTransferAccess {
  if (access.status === "unauthenticated") {
    return { allowed: false, reason: "unauthenticated" };
  }
  if (access.status === "forbidden") {
    return { allowed: false, reason: "forbidden" };
  }
  if (access.role !== "primary") {
    return { allowed: false, reason: "not_primary" };
  }
  return { allowed: true, userId: access.userId };
}

/**
 * Validates the submitted target before the RPC is called. The target must be
 * a well-formed id and must not be the caller; everything else (enrolment,
 * role, active state) is checked by the database.
 */
export function validateTransferTarget(
  rawTarget: unknown,
  callerUserId: string,
): TransferTargetValidation {
  if (typeof rawTarget !== "string") {
    return { ok: false, reason: "invalid_target" };
  }

  const targetUserId = rawTarget.trim().toLowerCase();
  if (!uuidPattern.test(targetUserId)) {
    return { ok: false, reason: "invalid_target" };
  }

  if (targetUserId === callerUserId.trim().toLowerCase()) {
    return { ok: false, reason: "self_target" };
  }

  return { ok: true, targetUserId };
}

/**
 * Maps a PostgREST error message back to the RPC's stable `PRIMARY_TRANSFER_*`
 * prefix. Anything unrecognised becomes "unknown" rather than being surfaced
 * verbatim, so raw database detail never reaches the browser.
 */
export function transferFailureReasonFromError(
  message: string | null | undefined,
): TransferFailureReason {
  if (typeof message !== "string") return "unknown";

  const match = /PRIMARY_TRANSFER_([A-Z_]+)/.exec(message);
  if (!match) return "unknown";

  return failureCodes[match[1]] ?? "unknown";
}

export function transferFailureMessage(reason: TransferFailureReason): string {
  switch (reason) {
    case "unauthenticated":
      return "Your session has ended. Sign in again and retry the transfer.";
    case "not_primary":
      return "Only the current primary administrator can transfer the primary role.";
    case "no_active_primary":
      return "There is no active primary administrator to transfer from. Use the recovery procedure instead.";
    case "invalid_target":
      return "Choose a valid administrator account.";
    case "self_target":
      return "You cannot transfer the primary role to yourself.";
    case "target_not_admin":
      return "That account is not an administrator.";
    case "target_not_standard":
      return "The primary role can only be transferred to a standard administrator.";
    case "target_inactive":
      return "That administrator account is deactivated.";
    case "invariant":
      return "A safety check blocked the transfer and nothing was changed. Report this to the technical team.";
    case "unknown":
      return "The transfer could not be completed and nothing was changed. Try again.";
  }
}
