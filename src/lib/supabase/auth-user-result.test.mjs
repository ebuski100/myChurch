import assert from "node:assert/strict";
import test from "node:test";
import {
  AuthSessionMissingError,
  createClient,
} from "@supabase/supabase-js";

const { getVerifiedUserOrThrow } = await import(
  new URL("./auth-user-result.ts", import.meta.url).href
);
const { decideAdminAccess } = await import(
  new URL("../admin-authorization.ts", import.meta.url).href
);
const { decidePrimaryTransferAccess } = await import(
  new URL("../primary-transfer.ts", import.meta.url).href
);

const user = { id: "user-a" };
const activeStandard = {
  userId: user.id,
  role: "standard",
  isActive: true,
};
const activePrimary = { ...activeStandard, role: "primary" };

test("the installed SDK returns AuthSessionMissingError when no session exists", async () => {
  const supabase = createClient("https://example.supabase.co", "test-publishable-key");
  const { data, error } = await supabase.auth.getUser();

  assert.equal(data.user, null);
  assert.ok(error instanceof AuthSessionMissingError);
});

test("treats the SDK missing-session error as unauthenticated", () => {
  const verifiedUser = getVerifiedUserOrThrow(null, new AuthSessionMissingError());

  assert.equal(verifiedUser, null);
  assert.deepEqual(decideAdminAccess(verifiedUser?.id ?? null, null), {
    status: "unauthenticated",
  });
});

test("preserves a user only when getUser has no error", () => {
  assert.equal(getVerifiedUserOrThrow(user, null), user);
});

test("does not grant access when getUser returns an unexpected error", () => {
  const networkError = new Error("network unavailable");

  assert.throws(
    () => getVerifiedUserOrThrow(user, networkError),
    (error) => error.cause === networkError,
  );
});

test("allows an active standard admin but not primary-only operations", () => {
  const access = decideAdminAccess(user.id, activeStandard);

  assert.deepEqual(access, {
    status: "authorized",
    userId: user.id,
    role: "standard",
  });
  assert.deepEqual(decidePrimaryTransferAccess(access), {
    allowed: false,
    reason: "not_primary",
  });
});

test("allows an active primary admin to perform primary-only operations", () => {
  const access = decideAdminAccess(user.id, activePrimary);

  assert.deepEqual(decidePrimaryTransferAccess(access), {
    allowed: true,
    userId: user.id,
  });
});

test("denies authenticated users without an active admin record", () => {
  assert.deepEqual(decideAdminAccess(user.id, null), {
    status: "forbidden",
    userId: user.id,
  });
});
