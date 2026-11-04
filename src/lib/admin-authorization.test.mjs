import assert from "node:assert/strict";
import test from "node:test";

const { decideAdminAccess } = await import(new URL("./admin-authorization.ts", import.meta.url).href);

const activeStandard = { userId: "user-a", role: "standard", isActive: true };
const activePrimary = { userId: "user-a", role: "primary", isActive: true };

test("requires an authenticated Supabase user", () => {
  assert.deepEqual(decideAdminAccess(null, null), { status: "unauthenticated" });
  assert.deepEqual(decideAdminAccess(null, activeStandard), { status: "unauthenticated" });
});

test("denies authenticated users without a matching active admin row", () => {
  assert.deepEqual(decideAdminAccess("user-a", null), { status: "forbidden", userId: "user-a" });
  assert.deepEqual(
    decideAdminAccess("user-a", { userId: "user-b", role: "standard", isActive: true }),
    { status: "forbidden", userId: "user-a" },
  );
});

test("denies a deactivated administrator", () => {
  assert.deepEqual(
    decideAdminAccess("user-a", { userId: "user-a", role: "standard", isActive: false }),
    { status: "forbidden", userId: "user-a" },
  );
  assert.deepEqual(
    decideAdminAccess("user-a", { userId: "user-a", role: "primary", isActive: false }),
    { status: "forbidden", userId: "user-a" },
  );
});

test("fails closed when the active flag is not a real boolean", () => {
  assert.deepEqual(
    decideAdminAccess("user-a", { userId: "user-a", role: "standard", isActive: undefined }),
    { status: "forbidden", userId: "user-a" },
  );
  assert.deepEqual(
    decideAdminAccess("user-a", { userId: "user-a", role: "standard", isActive: null }),
    { status: "forbidden", userId: "user-a" },
  );
});

test("fails closed on a role the schema does not allow", () => {
  assert.deepEqual(
    decideAdminAccess("user-a", { userId: "user-a", role: "owner", isActive: true }),
    { status: "forbidden", userId: "user-a" },
  );
});

test("allows only a matching, active admin row", () => {
  assert.deepEqual(decideAdminAccess("user-a", activeStandard), {
    status: "authorized",
    userId: "user-a",
    role: "standard",
  });
});

test("carries the administrator role into an authorized decision", () => {
  assert.deepEqual(decideAdminAccess("user-a", activePrimary), {
    status: "authorized",
    userId: "user-a",
    role: "primary",
  });
});
