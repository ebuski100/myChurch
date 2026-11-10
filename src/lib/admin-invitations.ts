// import { createHash, randomBytes } from "node:crypto";

// import type { AdminAccessDecision } from "./admin-authorization";

// /**
//  * Pure invitation rules for M12 standard-administrator invitations.
//  *
//  * No server-only imports and no Supabase client, so the same rules are
//  * unit-testable and reusable by server actions and client forms. These checks
//  * are a fast, friendly first line only: the database RPCs
//  * (`public.create_admin_invitation`, `public.accept_admin_invitation`,
//  * `public.deactivate_standard_admin`, `public.reactivate_standard_admin`)
//  * re-validate the caller, the address, the token and the invitation state
//  * inside one transaction and are the authority on every decision.
//  *
//  * Invitation lifetime mirrors the database: 72 hours from creation.
//  */

// /** How long an invitation stays usable, in milliseconds. */
// export const ADMIN_INVITATION_TTL_MS = 72 * 60 * 60 * 1000;

// export type InvitationAccess =
//   | { allowed: true; userId: string }
//   | { allowed: false; reason: "unauthenticated" | "forbidden" | "not_primary" };

// export type InvitationEmailValidation =
//   | { ok: true; email: string }
//   | { ok: false; reason: "invalid_email" };

// export type InvitationTokenValidation =
//   | { ok: true; token: string }
//   | { ok: false; reason: "invalid_token" };

// export type InvitationExpiryState =
//   | "pending"
//   | "expired";

// export type InvitationStatus =
//   | "pending"
//   | "accepted"
//   | "revoked"
//   | "expired";

// export type InvitationFailureReason =
//   | "unauthenticated"
//   | "not_primary"
//   | "invalid_email"
//   | "already_admin"
//   | "already_pending"
//   | "invalid_token"
//   | "invalid_invitation"
//   | "expired"
//   | "revoked"
//   | "already_accepted"
//   | "email_mismatch"
//   | "not_found"
//   | "invalid_target"
//   | "self_target"
//   | "target_not_admin"
//   | "target_not_standard"
//   | "target_inactive"
//   | "target_active"
//   | "unknown";

// const failureCodes: Record<string, InvitationFailureReason> = {
//   UNAUTHENTICATED: "unauthenticated",
//   NOT_PRIMARY: "not_primary",
//   INVALID_EMAIL: "invalid_email",
//   ALREADY_ADMIN: "already_admin",
//   ALREADY_PENDING: "already_pending",
//   INVALID_TOKEN: "invalid_token",
//   INVALID: "invalid_invitation",
//   EXPIRED: "expired",
//   REVOKED: "revoked",
//   ALREADY_ACCEPTED: "already_accepted",
//   EMAIL_MISMATCH: "email_mismatch",
//   NOT_FOUND: "not_found",
//   INVALID_TARGET: "invalid_target",
//   SELF: "self_target",
//   TARGET_NOT_ADMIN: "target_not_admin",
//   TARGET_NOT_STANDARD: "target_not_standard",
//   TARGET_INACTIVE: "target_inactive",
//   TARGET_ACTIVE: "target_active",
// };

// // Local copy rather than a shared import: this module must stay dependency-free
// // so the node:test runner can load it without a bundler.
// const uuidPattern =
//   /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// const tokenPattern = /^[0-9a-f]{64}$/;

// /**
//  * Only the active primary administrator may open the invitation screen or call
//  * the invitation actions. A standard administrator is denied even though they
//  * are a fully authorized admin elsewhere — same rule as the transfer screen.
//  */
// export function decideInvitationAccess(
//   access: AdminAccessDecision,
// ): InvitationAccess {
//   if (access.status === "unauthenticated") {
//     return { allowed: false, reason: "unauthenticated" };
//   }
//   if (access.status === "forbidden") {
//     return { allowed: false, reason: "forbidden" };
//   }
//   if (access.role !== "primary") {
//     return { allowed: false, reason: "not_primary" };
//   }
//   return { allowed: true, userId: access.userId };
// }

// /**
//  * Normalizes an invitation email the same way the database does
//  * (`lower(trim(email))`) and rejects malformed addresses, overlong input,
//  * and non-string values. The length cap (254) matches RFC 5321.
//  */
// export function validateInvitationEmail(
//   rawEmail: unknown,
// ): InvitationEmailValidation {
//   if (typeof rawEmail !== "string") {
//     return { ok: false, reason: "invalid_email" };
//   }

//   const email = rawEmail.trim().toLowerCase();
//   if (
//     email.length === 0 ||
//     email.length > 254 ||
//     !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email)
//   ) {
//     return { ok: false, reason: "invalid_email" };
//   }

//   return { ok: true, email };
// }

// /**
//  * Generates one invitation token: 32 random bytes as 64 lowercase hex
//  * characters. The plaintext goes into the emailed link; only its SHA-256
//  * digest is stored (see `hashInvitationToken`).
//  */
// export function generateInvitationToken(): string {
//   return randomBytes(32).toString("hex");
// }

// /**
//  * Hashes a plaintext invitation token for storage. The database compares
//  * digests only, so a database read never yields a usable invitation.
//  */
// export function hashInvitationToken(token: string): string {
//   return createHash("sha256").update(token, "utf8").digest("hex");
// }

// /**
//  * Validates the plaintext invitation token from the emailed link. Tokens are
//  * 32 random bytes rendered as 64 lowercase hex characters; anything else is
//  * rejected before it ever reaches the database (which only stores the
//  * SHA-256 digest and applies the same shape check).
//  */
// export function validateInvitationToken(
//   rawToken: unknown,
// ): InvitationTokenValidation {
//   if (typeof rawToken !== "string") {
//     return { ok: false, reason: "invalid_token" };
//   }

//   const token = rawToken.trim().toLowerCase();
//   if (!tokenPattern.test(token)) {
//     return { ok: false, reason: "invalid_token" };
//   }

//   return { ok: true, token };
// }

// /**
//  * Validates an invitation UUID for revoke/deactivate targets.
//  */
// export function validateInvitationId(
//   rawId: unknown,
// ): { ok: true; invitationId: string } | { ok: false; reason: "invalid_invitation" } {
//   if (typeof rawId !== "string") {
//     return { ok: false, reason: "invalid_invitation" };
//   }

//   const invitationId = rawId.trim().toLowerCase();
//   if (!uuidPattern.test(invitationId)) {
//     return { ok: false, reason: "invalid_invitation" };
//   }

//   return { ok: true, invitationId };
// }

// /**
//  * Validates a deactivate target the way the transfer screen validates its
//  * target: well-formed UUID, and never the caller's own account.
//  */
// export function validateDeactivateTarget(
//   rawTarget: unknown,
//   callerUserId: string,
// ): { ok: true; targetUserId: string } | { ok: false; reason: "invalid_target" | "self_target" } {
//   if (typeof rawTarget !== "string") {
//     return { ok: false, reason: "invalid_target" };
//   }

//   const targetUserId = rawTarget.trim().toLowerCase();
//   if (!uuidPattern.test(targetUserId)) {
//     return { ok: false, reason: "invalid_target" };
//   }

//   if (targetUserId === callerUserId.trim().toLowerCase()) {
//     return { ok: false, reason: "self_target" };
//   }

//   return { ok: true, targetUserId };
// }

// /**
//  * Classifies a pending invitation as live or expired against `now`. Accepted
//  * and revoked states are tracked by the database timestamps, not here; this
//  * helper answers only "has the 72-hour window passed?" for UI display.
//  */
// export function invitationExpiryState(
//   expiresAt: string | Date,
//   now: Date = new Date(),
// ): InvitationExpiryState {
//   const expiry = expiresAt instanceof Date ? expiresAt : new Date(expiresAt);
//   if (!Number.isFinite(expiry.getTime())) return "expired";
//   return expiry.getTime() <= now.getTime() ? "expired" : "pending";
// }

// /**
//  * Derives the display status of an invitation row from its timestamps.
//  * Precedence: accepted > revoked > expired > pending. A row carrying both an
//  * acceptance and a revocation stamp (which the schema forbids) reports
//  * accepted, matching the database's terminal-state rule that acceptance wins.
//  */
// export function invitationDisplayStatus(row: {
//   acceptedAt: string | null;
//   revokedAt: string | null;
//   expiresAt: string;
//   now?: Date;
// }): InvitationStatus {
//   if (row.acceptedAt !== null) return "accepted";
//   if (row.revokedAt !== null) return "revoked";
//   return invitationExpiryState(row.expiresAt, row.now);
// }

// /**
//  * Maps a PostgREST/RPC error message back to a stable reason via the
//  * `ADMIN_INVITE_*` / `ADMIN_DEACTIVATE_*` / `ADMIN_REACTIVATE_*` prefix. Anything unrecognised
//  * becomes "unknown" so raw database detail never reaches the browser.
//  */
// export function invitationFailureReasonFromError(
//   message: string | null | undefined,
// ): InvitationFailureReason {
//   if (typeof message !== "string") return "unknown";

//   const match = /ADMIN_(?:INVITE|DEACTIVATE|REACTIVATE)_([A-Z_]+)/.exec(message);
//   if (!match) return "unknown";

//   return failureCodes[match[1]] ?? "unknown";
// }

// export function invitationFailureMessage(
//   reason: InvitationFailureReason,
// ): string {
//   switch (reason) {
//     case "unauthenticated":
//       return "Your session has ended. Sign in again and retry.";
//     case "not_primary":
//       return "Only the primary administrator can manage administrator invitations.";
//     case "invalid_email":
//       return "Enter a valid email address.";
//     case "already_admin":
//       return "That address is already an administrator.";
//     case "already_pending":
//       return "A live invitation already exists for that address.";
//     case "invalid_token":
//       return "That invitation link is not valid.";
//     case "invalid_invitation":
//       return "That invitation could not be found.";
//     case "expired":
//       return "That invitation has expired. Ask the primary administrator for a new one.";
//     case "revoked":
//       return "That invitation was revoked. Ask the primary administrator for a new one.";
//     case "already_accepted":
//       return "That invitation was already used.";
//     case "email_mismatch":
//       return "That invitation was sent to a different address. Sign in with the invited address and try again.";
//     case "not_found":
//       return "That invitation could not be found.";
//     case "invalid_target":
//       return "Choose a valid administrator account.";
//     case "self_target":
//       return "You cannot deactivate your own account.";
//     case "target_not_admin":
//       return "That account is not an administrator.";
//     case "target_not_standard":
//       return "Only standard administrators can be deactivated here.";
//     case "target_inactive":
//       return "That administrator is already deactivated.";
//     case "target_active":
//       return "That administrator is already active.";
//     case "unknown":
//       return "Something went wrong and nothing was changed. Try again.";
//   }
// }

import { createHash, randomBytes } from "node:crypto";

import type { AdminAccessDecision } from "./admin-authorization";

/**
 * Pure invitation rules for M12 standard-administrator invitations.
 *
 * No server-only imports and no Supabase client, so the same rules are
 * unit-testable and reusable by server actions and client forms. These checks
 * are a fast, friendly first line only: the database RPCs remain authoritative.
 *
 * Invitation lifetime mirrors the database: 72 hours from creation.
 */

export const ADMIN_INVITATION_TTL_MS = 72 * 60 * 60 * 1000;

export type InvitationAccess =
  | { allowed: true; userId: string }
  | {
      allowed: false;
      reason: "unauthenticated" | "forbidden" | "not_primary";
    };

export type InvitationEmailValidation =
  | { ok: true; email: string }
  | { ok: false; reason: "invalid_email" };

export type InvitationTokenValidation =
  | { ok: true; token: string }
  | { ok: false; reason: "invalid_token" };

export type InvitationExpiryState = "pending" | "expired";

export type InvitationStatus =
  | "pending"
  | "accepted"
  | "revoked"
  | "expired";

export type InvitationFailureReason =
  | "unauthenticated"
  | "not_primary"
  | "invalid_email"
  | "already_admin"
  | "already_pending"
  | "invalid_token"
  | "invalid_invitation"
  | "expired"
  | "revoked"
  | "already_accepted"
  | "email_mismatch"
  | "not_found"
  | "still_pending"
  | "invalid_target"
  | "self_target"
  | "target_not_admin"
  | "target_not_standard"
  | "target_inactive"
  | "target_active"
  | "unknown";

const failureCodes: Record<string, InvitationFailureReason> = {
  UNAUTHENTICATED: "unauthenticated",
  NOT_PRIMARY: "not_primary",
  INVALID_EMAIL: "invalid_email",
  ALREADY_ADMIN: "already_admin",
  ALREADY_PENDING: "already_pending",
  INVALID_TOKEN: "invalid_token",
  INVALID: "invalid_invitation",
  EXPIRED: "expired",
  REVOKED: "revoked",
  ALREADY_ACCEPTED: "already_accepted",
  EMAIL_MISMATCH: "email_mismatch",
  NOT_FOUND: "not_found",
  STILL_PENDING: "still_pending",
  INVALID_TARGET: "invalid_target",
  SELF: "self_target",
  TARGET_NOT_ADMIN: "target_not_admin",
  TARGET_NOT_STANDARD: "target_not_standard",
  TARGET_INACTIVE: "target_inactive",
  TARGET_ACTIVE: "target_active",
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const tokenPattern = /^[0-9a-f]{64}$/;

export function decideInvitationAccess(
  access: AdminAccessDecision,
): InvitationAccess {
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

export function validateInvitationEmail(
  rawEmail: unknown,
): InvitationEmailValidation {
  if (typeof rawEmail !== "string") {
    return { ok: false, reason: "invalid_email" };
  }

  const email = rawEmail.trim().toLowerCase();

  if (
    email.length === 0 ||
    email.length > 254 ||
    !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email)
  ) {
    return { ok: false, reason: "invalid_email" };
  }

  return { ok: true, email };
}

export function generateInvitationToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashInvitationToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function validateInvitationToken(
  rawToken: unknown,
): InvitationTokenValidation {
  if (typeof rawToken !== "string") {
    return { ok: false, reason: "invalid_token" };
  }

  const token = rawToken.trim().toLowerCase();

  if (!tokenPattern.test(token)) {
    return { ok: false, reason: "invalid_token" };
  }

  return { ok: true, token };
}

export function validateInvitationId(
  rawId: unknown,
):
  | { ok: true; invitationId: string }
  | { ok: false; reason: "invalid_invitation" } {
  if (typeof rawId !== "string") {
    return { ok: false, reason: "invalid_invitation" };
  }

  const invitationId = rawId.trim().toLowerCase();

  if (!uuidPattern.test(invitationId)) {
    return { ok: false, reason: "invalid_invitation" };
  }

  return { ok: true, invitationId };
}

export function validateDeactivateTarget(
  rawTarget: unknown,
  callerUserId: string,
):
  | { ok: true; targetUserId: string }
  | { ok: false; reason: "invalid_target" | "self_target" } {
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

export function invitationExpiryState(
  expiresAt: string | Date,
  now: Date = new Date(),
): InvitationExpiryState {
  const expiry =
    expiresAt instanceof Date ? expiresAt : new Date(expiresAt);

  if (!Number.isFinite(expiry.getTime())) return "expired";

  return expiry.getTime() <= now.getTime() ? "expired" : "pending";
}

export function invitationDisplayStatus(row: {
  acceptedAt: string | null;
  revokedAt: string | null;
  expiresAt: string;
  now?: Date;
}): InvitationStatus {
  if (row.acceptedAt !== null) return "accepted";
  if (row.revokedAt !== null) return "revoked";

  return invitationExpiryState(row.expiresAt, row.now);
}

export function invitationFailureReasonFromError(
  message: string | null | undefined,
): InvitationFailureReason {
  if (typeof message !== "string") return "unknown";

  const match =
    /ADMIN_(?:INVITE|DEACTIVATE|REACTIVATE)_([A-Z_]+)/.exec(message);

  if (!match) return "unknown";

  return failureCodes[match[1]] ?? "unknown";
}

export function invitationFailureMessage(
  reason: InvitationFailureReason,
): string {
  switch (reason) {
    case "unauthenticated":
      return "Your session has ended. Sign in again and retry.";
    case "not_primary":
      return "Only the primary administrator can manage administrator invitations.";
    case "invalid_email":
      return "Enter a valid email address.";
    case "already_admin":
      return "That address is already an administrator.";
    case "already_pending":
      return "A live invitation already exists for that address.";
    case "invalid_token":
      return "That invitation link is not valid.";
    case "invalid_invitation":
      return "That invitation could not be found.";
    case "expired":
      return "That invitation has expired. Ask the primary administrator for a new one.";
    case "revoked":
      return "That invitation was revoked. Ask the primary administrator for a new one.";
    case "already_accepted":
      return "That invitation was already used.";
    case "email_mismatch":
      return "That invitation was sent to a different address. Sign in with the invited address and try again.";
    case "not_found":
      return "That invitation could not be found.";
    case "still_pending":
      return "This invitation is still active. Revoke it before deleting it.";
    case "invalid_target":
      return "Choose a valid administrator account.";
    case "self_target":
      return "You cannot deactivate your own account.";
    case "target_not_admin":
      return "That account is not an administrator.";
    case "target_not_standard":
      return "Only standard administrators can be deactivated here.";
    case "target_inactive":
      return "That administrator is already deactivated.";
    case "target_active":
      return "That administrator is already active.";
    case "unknown":
      return "Something went wrong and nothing was changed. Try again.";
  }
}
