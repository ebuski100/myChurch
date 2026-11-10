import assert from "node:assert/strict";
import test from "node:test";

const {
  decidePrimaryTransferAccess,
  validateTransferTarget,
  transferFailureReasonFromError,
  transferFailureMessage,
} = await import(new URL("./primary-transfer.ts", import.meta.url).href);

// Realistic Auth user ids: the validation follows the project's existing
// `isUuid`, which requires an RFC 4122 version/variant nibble.
const primaryId = "11111111-1111-4111-8111-111111111111";
const standardId = "22222222-2222-4222-8222-222222222222";

test("denies the transfer screen to an unauthenticated visitor", () => {
  assert.deepEqual(decidePrimaryTransferAccess({ status: "unauthenticated" }), {
    allowed: false,
    reason: "unauthenticated",
  });
});

test("denies the transfer screen to a user who is not an administrator", () => {
  assert.deepEqual(
    decidePrimaryTransferAccess({ status: "forbidden", userId: standardId }),
    { allowed: false, reason: "forbidden" },
  );
});

test("denies the transfer screen to a standard administrator", () => {
  assert.deepEqual(
    decidePrimaryTransferAccess({
      status: "authorized",
      userId: standardId,
      role: "standard",
    }),
    { allowed: false, reason: "not_primary" },
  );
});

test("allows the transfer screen only to the primary administrator", () => {
  assert.deepEqual(
    decidePrimaryTransferAccess({
      status: "authorized",
      userId: primaryId,
      role: "primary",
    }),
    { allowed: true, userId: primaryId },
  );
});

test("rejects a missing or malformed target", () => {
  for (const target of [null, undefined, "", "   ", "not-a-uuid", 42, {}, `${primaryId}x`]) {
    assert.deepEqual(validateTransferTarget(target, primaryId), {
      ok: false,
      reason: "invalid_target",
    });
  }
});

test("rejects a transfer to the caller", () => {
  assert.deepEqual(validateTransferTarget(primaryId, primaryId), {
    ok: false,
    reason: "self_target",
  });
  assert.deepEqual(validateTransferTarget(primaryId.toUpperCase(), primaryId), {
    ok: false,
    reason: "self_target",
  });
});

test("accepts another administrator and normalises the id", () => {
  assert.deepEqual(validateTransferTarget(` ${standardId.toUpperCase()} `, primaryId), {
    ok: true,
    targetUserId: standardId,
  });
});

test("maps every RPC failure prefix to a reason", () => {
  const cases = {
    "PRIMARY_TRANSFER_UNAUTHENTICATED: no authenticated user": "unauthenticated",
    "PRIMARY_TRANSFER_NOT_PRIMARY: caller is not the active primary": "not_primary",
    "PRIMARY_TRANSFER_NO_ACTIVE_PRIMARY: the primary seat is empty": "no_active_primary",
    "PRIMARY_TRANSFER_INVALID_TARGET: target user id is required": "invalid_target",
    "PRIMARY_TRANSFER_SELF: cannot transfer the primary seat to the current primary": "self_target",
    "PRIMARY_TRANSFER_TARGET_NOT_ADMIN: target is not an administrator": "target_not_admin",
    "PRIMARY_TRANSFER_TARGET_NOT_STANDARD: target is not a standard administrator": "target_not_standard",
    "PRIMARY_TRANSFER_TARGET_INACTIVE: target is deactivated": "target_inactive",
    "PRIMARY_TRANSFER_INVARIANT: transfer did not leave exactly one active primary": "invariant",
  };

  for (const [message, reason] of Object.entries(cases)) {
    assert.equal(transferFailureReasonFromError(message), reason, message);
  }
});

test("falls back to unknown for unrelated or missing errors", () => {
  assert.equal(transferFailureReasonFromError(undefined), "unknown");
  assert.equal(transferFailureReasonFromError(null), "unknown");
  assert.equal(transferFailureReasonFromError(""), "unknown");
  assert.equal(transferFailureReasonFromError("permission denied for function"), "unknown");
  assert.equal(transferFailureReasonFromError("PRIMARY_TRANSFER_SOMETHING_NEW: x"), "unknown");
});

test("every failure reason has a non-empty operator-safe message", () => {
  const reasons = [
    "unauthenticated",
    "not_primary",
    "no_active_primary",
    "invalid_target",
    "self_target",
    "target_not_admin",
    "target_not_standard",
    "target_inactive",
    "invariant",
    "unknown",
  ];

  for (const reason of reasons) {
    const message = transferFailureMessage(reason);
    assert.equal(typeof message, "string");
    assert.ok(message.length > 10, reason);
    assert.ok(!/PRIMARY_TRANSFER_/.test(message), `${reason} must not leak the raw code`);
  }
});
