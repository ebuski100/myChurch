export const SETUP_PASSWORD_MIN_LENGTH = 8;

/** Where the auth callback may send an invitee after verification. */
export const DEFAULT_CONFIRM_NEXT = "/admin/invitations/setup";

/**
 * Canonical query parameter carrying the M12 invitation token through the
 * whole invite flow (email → callback → confirm → setup). Every handoff
 * reads and writes this one name so the token can never be renamed or
 * dropped between redirects.
 */
export const INVITATION_TOKEN_PARAM = "token";

/**
 * Builds the `redirect_to` URL embedded in the Supabase invite email: the
 * auth callback plus the setup target and the plaintext invitation token.
 * The token must be freshly generated hex; it is encoded, never logged.
 */
export function buildInviteCallbackUrl(
  siteUrl: string,
  token: string,
): string {
  const base = siteUrl.replace(/\/$/, "");
  const next = encodeURIComponent(DEFAULT_CONFIRM_NEXT);

  return `${base}/auth/callback?next=${next}&${INVITATION_TOKEN_PARAM}=${encodeURIComponent(token)}`;
}

/**
 * Appends the invitation token to a same-app URL (`?token=…` or `&token=…`).
 * Pass only tokens already validated by `validateInvitationToken`; this
 * encodes but does not shape-check.
 */
export function withInvitationToken(
  baseUrl: string,
  token: string,
): string {
  const separator = baseUrl.includes("?") ? "&" : "?";

  return `${baseUrl}${separator}${INVITATION_TOKEN_PARAM}=${encodeURIComponent(token)}`;
}

/**
 * Builds the setup-screen URL carrying a validated invitation token:
 * `next?token=…`, or bare `next` when there is no token to preserve.
 */
export function buildSetupForwardUrl(
  next: string,
  token: string | null,
): string {
  if (!token) return next;

  return withInvitationToken(next, token);
}

/**
 * Builds the confirm-page error URL, preserving a validated invitation
 * token alongside the mapped error so fragment recovery can still run.
 */
export function buildConfirmErrorUrl(
  reason: ConfirmFailureReason,
  token: string | null,
): string {
  const base = `/auth/confirm?error=${reason}&next=${encodeURIComponent(DEFAULT_CONFIRM_NEXT)}`;

  return token ? withInvitationToken(base, token) : base;
}

/**
 * Error codes GoTrue appends to `redirect_to` when email-link verification
 * fails (e.g. the one-time token was already consumed or expired). Present
 * as `?error=…&error_code=…&error_description=…` on the callback request.
 */
export function parseAuthErrorCode(
  rawErrorCode: unknown,
): string | null {
  if (typeof rawErrorCode !== "string") return null;

  const code = rawErrorCode.trim().toLowerCase();

  if (code.length === 0 || code.length > 64) return null;
  if (!/^[a-z0-9_]+$/.test(code)) return null;

  return code;
}

export type FragmentSessionTokens = {
  accessToken: string;
  refreshToken: string;
};

/**
 * Extracts implicit-flow Auth session tokens from a URL fragment
 * (`#access_token=…&refresh_token=…`). Returns null unless both tokens are
 * present and non-empty. Pure and dependency-free so the confirm page
 * client and the node:test suite share the exact parsing; the server can
 * never see fragments, so this runs only in the browser.
 */
export function parseFragmentSessionTokens(
  rawHash: unknown,
): FragmentSessionTokens | null {
  if (typeof rawHash !== "string" || rawHash.length === 0)
    return null;

  const hash = rawHash.startsWith("#") ? rawHash.slice(1) : rawHash;

  if (hash.length === 0) return null;

  const params = new URLSearchParams(hash);
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");

  if (!accessToken || !refreshToken) return null;

  return { accessToken, refreshToken };
}

/** OTP types the confirm callback accepts from Supabase Auth. */
const confirmOtpTypes = [
  "invite",
  "signup",
  "magiclink",
  "recovery",
  "email",
] as const;

export type ConfirmOtpType = (typeof confirmOtpTypes)[number];

/**
 * Accepts only relative paths inside the admin workspace. Anything else —
 * absolute URLs, protocol-relative URLs, backslashes, other sections —
 * falls back to the setup screen so the callback can never become an open
 * redirect.
 */
export function resolveConfirmNext(rawNext: unknown): string {
  if (typeof rawNext !== "string") return DEFAULT_CONFIRM_NEXT;

  const next = rawNext.trim();

  if (!/^\/admin\/[A-Za-z0-9/_-]*$/.test(next)) {
    return DEFAULT_CONFIRM_NEXT;
  }

  return next;
}

/** Type-narrows a Supabase OTP `type` parameter to the accepted set. */
export function validateConfirmOtpType(
  rawType: unknown,
): { ok: true; otpType: ConfirmOtpType } | { ok: false } {
  if (
    typeof rawType === "string" &&
    (confirmOtpTypes as readonly string[]).includes(rawType)
  ) {
    return { ok: true, otpType: rawType as ConfirmOtpType };
  }

  return { ok: false };
}

export type SetupPasswordValidation =
  | { ok: true; password: string }
  | {
      ok: false;
      reason: "missing_password" | "too_short" | "mismatch";
    };

/**
 * Validates a new administrator password before it reaches Supabase Auth.
 * Supabase enforces its own minimum as well; this check gives the friendly
 * error first and guarantees both fields agree.
 */
export function validateSetupPassword(
  rawPassword: unknown,
  rawConfirm: unknown,
): SetupPasswordValidation {
  if (typeof rawPassword !== "string" || rawPassword.length === 0) {
    return { ok: false, reason: "missing_password" };
  }

  if (typeof rawConfirm !== "string" || rawPassword !== rawConfirm) {
    return { ok: false, reason: "mismatch" };
  }

  if (rawPassword.length < SETUP_PASSWORD_MIN_LENGTH) {
    return { ok: false, reason: "too_short" };
  }

  return { ok: true, password: rawPassword };
}

export type ConfirmFailureReason =
  | "invalid_request"
  | "invalid_link"
  | "session_expired";

export function confirmFailureMessage(
  reason: ConfirmFailureReason,
): string {
  switch (reason) {
    case "invalid_request":
      return "That request was not valid. Open your invitation link again.";

    case "session_expired":
      return "Your invitation link has expired. Ask the primary administrator for a fresh invitation.";

    case "invalid_link":
      return "That invitation link is not valid or has expired. Ask the primary administrator for a fresh invitation.";
  }
}

export type SetupFailureReason =
  | "session_expired"
  | "weak_password"
  | "password_mismatch"
  | "update_failed"
  | SetupInvitationFailureReason;

// Local copy rather than a shared import: this module must stay
// dependency-free so the node:test runner can load it without a bundler,
// matching the convention in `admin-invitations.ts`. Keep in sync with
// `invitationFailureMessage` there.
export type SetupInvitationFailureReason =
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

const invitationFailureMessages: Record<
  SetupInvitationFailureReason,
  string
> = {
  unauthenticated: "Your session has ended. Sign in again and retry.",
  not_primary:
    "Only the primary administrator can manage administrator invitations.",
  invalid_email: "Enter a valid email address.",
  already_admin: "That address is already an administrator.",
  already_pending:
    "A live invitation already exists for that address.",
  invalid_token: "That invitation link is not valid.",
  invalid_invitation: "That invitation could not be found.",
  expired:
    "That invitation has expired. Ask the primary administrator for a new one.",
  revoked:
    "That invitation was revoked. Ask the primary administrator for a new one.",
  already_accepted: "That invitation was already used.",
  email_mismatch:
    "That invitation was sent to a different address. Sign in with the invited address and try again.",
  not_found: "That invitation could not be found.",
  still_pending:
    "This invitation is still active. Revoke it before deleting it.",
  invalid_target: "Choose a valid administrator account.",
  self_target: "You cannot deactivate your own account.",
  target_not_admin: "That account is not an administrator.",
  target_not_standard:
    "Only standard administrators can be deactivated here.",
  target_inactive: "That administrator is already deactivated.",
  target_active: "That administrator is already active.",
  unknown: "Something went wrong and nothing was changed. Try again.",
};

export function setupFailureMessage(
  reason: SetupFailureReason,
): string {
  switch (reason) {
    case "session_expired":
      return "Your invitation session has ended. Open the invitation link again and retry.";

    case "weak_password":
      return `Choose a password with at least ${SETUP_PASSWORD_MIN_LENGTH} characters.`;

    case "password_mismatch":
      return "The passwords do not match. Enter the same password twice.";

    case "update_failed":
      return "Your password could not be saved. Try again.";

    default:
      return setupFailureMessageForInvitation(reason);
  }
}

/** Shared by `setupFailureMessage` for invitation-acceptance reasons. */
export function setupFailureMessageForInvitation(
  reason: SetupInvitationFailureReason,
): string {
  return invitationFailureMessages[reason];
}
