import assert from "node:assert/strict";
import test from "node:test";

const {
  ADMIN_INVITATION_TTL_MS,
  decideInvitationAccess,
  generateInvitationToken,
  hashInvitationToken,
  validateInvitationEmail,
  validateInvitationToken,
  validateInvitationId,
  validateDeactivateTarget,
  invitationExpiryState,
  invitationDisplayStatus,
  invitationFailureReasonFromError,
  invitationFailureMessage,
} = await import(new URL("./admin-invitations.ts", import.meta.url).href);

// Realistic Auth user ids: the validation follows the project's existing
// RFC 4122 version/variant pattern.
const primaryId = "11111111-1111-4111-8111-111111111111";
const standardId = "22222222-2222-4222-8222-222222222222";
const invitationId = "33333333-3333-4333-8333-333333333333";
const hexToken =
  "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

test("invitation lifetime is 72 hours", () => {
  assert.equal(ADMIN_INVITATION_TTL_MS, 72 * 60 * 60 * 1000);
});

test("generates unique 64-character hex tokens", () => {
  const first = generateInvitationToken();
  const second = generateInvitationToken();
  assert.match(first, /^[0-9a-f]{64}$/);
  assert.match(second, /^[0-9a-f]{64}$/);
  assert.notEqual(first, second);
});

test("hashes tokens with SHA-256 hex", async () => {
  const { createHash } = await import("node:crypto");
  const token = generateInvitationToken();
  assert.equal(hashInvitationToken(token), createHash("sha256").update(token, "utf8").digest("hex"));
  assert.match(hashInvitationToken(token), /^[0-9a-f]{64}$/);
  assert.notEqual(hashInvitationToken(token), token);
});

test("denies the invitation screen to an unauthenticated visitor", () => {
  assert.deepEqual(decideInvitationAccess({ status: "unauthenticated" }), {
    allowed: false,
    reason: "unauthenticated",
  });
});

test("denies the invitation screen to a user who is not an administrator", () => {
  assert.deepEqual(
    decideInvitationAccess({ status: "forbidden", userId: standardId }),
    { allowed: false, reason: "forbidden" },
  );
});

test("denies the invitation screen to a standard administrator", () => {
  assert.deepEqual(
    decideInvitationAccess({
      status: "authorized",
      userId: standardId,
      role: "standard",
    }),
    { allowed: false, reason: "not_primary" },
  );
});

test("allows the invitation screen only to the primary administrator", () => {
  assert.deepEqual(
    decideInvitationAccess({
      status: "authorized",
      userId: primaryId,
      role: "primary",
    }),
    { allowed: true, userId: primaryId },
  );
});

test("normalizes a valid invitation email", () => {
  assert.deepEqual(validateInvitationEmail("  New.Admin@Example.COM  "), {
    ok: true,
    email: "new.admin@example.com",
  });
});

test("rejects malformed invitation emails", () => {
  for (const email of [
    null,
    undefined,
    42,
    {},
    "",
    "   ",
    "no-at-sign",
    "missing-tld@example",
    "@example.com",
    "user@.com",
    "a".repeat(250) + "@x.co",
  ]) {
    assert.deepEqual(validateInvitationEmail(email), {
      ok: false,
      reason: "invalid_email",
    });
  }
});

test("accepts a 64-character lowercase hex token", () => {
  assert.deepEqual(validateInvitationToken(hexToken), {
    ok: true,
    token: hexToken,
  });
});

test("normalizes an uppercase token before accepting it", () => {
  assert.deepEqual(validateInvitationToken(hexToken.toUpperCase()), {
    ok: true,
    token: hexToken,
  });
});

test("rejects malformed invitation tokens", () => {
  for (const token of [
    null,
    undefined,
    "",
    "   ",
    "not-a-hash",
    hexToken.slice(0, 63),
    `${hexToken}00`,
    "g".repeat(64),
    42,
  ]) {
    assert.deepEqual(validateInvitationToken(token), {
      ok: false,
      reason: "invalid_token",
    });
  }
});

test("accepts a well-formed invitation id", () => {
  assert.deepEqual(validateInvitationId(invitationId), {
    ok: true,
    invitationId,
  });
});

test("rejects a malformed invitation id", () => {
  for (const id of [null, undefined, "", "not-a-uuid", `${invitationId}x`]) {
    assert.deepEqual(validateInvitationId(id), {
      ok: false,
      reason: "invalid_invitation",
    });
  }
});

test("validates a deactivate target and rejects self-deactivation", () => {
  assert.deepEqual(validateDeactivateTarget(standardId, primaryId), {
    ok: true,
    targetUserId: standardId,
  });
  assert.deepEqual(validateDeactivateTarget(primaryId, primaryId), {
    ok: false,
    reason: "self_target",
  });
  assert.deepEqual(validateDeactivateTarget("not-a-uuid", primaryId), {
    ok: false,
    reason: "invalid_target",
  });
});

test("classifies invitation expiry against now", () => {
  const now = new Date("2026-11-03T12:00:00.000Z");
  assert.equal(
    invitationExpiryState("2026-11-04T12:00:00.000Z", now),
    "pending",
  );
  // Boundary: expiry equal to now is expired.
  assert.equal(
    invitationExpiryState("2026-11-03T12:00:00.000Z", now),
    "expired",
  );
  assert.equal(
    invitationExpiryState("2026-11-03T11:59:59.000Z", now),
    "expired",
  );
  assert.equal(invitationExpiryState("not-a-date", now), "expired");
});

test("derives invitation display status with accepted winning over revoked", () => {
  const expiresAt = "2026-11-06T12:00:00.000Z";
  const now = new Date("2026-11-03T12:00:00.000Z");
  assert.equal(
    invitationDisplayStatus({
      acceptedAt: null,
      revokedAt: null,
      expiresAt,
      now,
    }),
    "pending",
  );
  assert.equal(
    invitationDisplayStatus({
      acceptedAt: null,
      revokedAt: null,
      expiresAt: "2026-11-01T12:00:00.000Z",
      now,
    }),
    "expired",
  );
  assert.equal(
    invitationDisplayStatus({
      acceptedAt: null,
      revokedAt: "2026-11-03T10:00:00.000Z",
      expiresAt,
      now,
    }),
    "revoked",
  );
  assert.equal(
    invitationDisplayStatus({
      acceptedAt: "2026-11-03T10:00:00.000Z",
      revokedAt: null,
      expiresAt,
      now,
    }),
    "accepted",
  );
  assert.equal(
    invitationDisplayStatus({
      acceptedAt: "2026-11-03T10:00:00.000Z",
      revokedAt: "2026-11-03T11:00:00.000Z",
      expiresAt,
      now,
    }),
    "accepted",
  );
});

test("maps reactivation error codes to friendly reasons", () => {
  assert.equal(
    invitationFailureReasonFromError(
      "ADMIN_REACTIVATE_TARGET_ACTIVE: administrator is already active",
    ),
    "target_active",
  );
  assert.equal(
    invitationFailureReasonFromError(
      "ADMIN_REACTIVATE_NOT_PRIMARY: caller is not the active primary",
    ),
    "not_primary",
  );
  assert.equal(
    invitationFailureReasonFromError(
      "ADMIN_REACTIVATE_TARGET_NOT_STANDARD: only standard administrators can be reactivated here",
    ),
    "target_not_standard",
  );
  assert.equal(
    invitationFailureReasonFromError(
      "ADMIN_REACTIVATE_SELF: cannot reactivate your own account",
    ),
    "self_target",
  );
  assert.equal(
    invitationFailureReasonFromError(
      "ADMIN_REACTIVATE_TARGET_NOT_ADMIN: target is not an administrator",
    ),
    "target_not_admin",
  );
  assert.ok(
    invitationFailureMessage("target_active").includes("already active"),
  );
});

test("maps invitation error codes to friendly messages", () => {
  assert.equal(
    invitationFailureReasonFromError(
      "ADMIN_INVITE_ALREADY_PENDING: a live invitation already exists",
    ),
    "already_pending",
  );
  assert.equal(
    invitationFailureReasonFromError(
      "ADMIN_DEACTIVATE_SELF: cannot deactivate your own account",
    ),
    "self_target",
  );
  assert.equal(invitationFailureReasonFromError("boom"), "unknown");
  assert.equal(invitationFailureReasonFromError(null), "unknown");
  assert.ok(invitationFailureMessage("expired").includes("expired"));
  assert.ok(invitationFailureMessage("not_primary").includes("primary"));
});
