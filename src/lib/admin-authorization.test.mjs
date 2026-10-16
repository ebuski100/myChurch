import assert from "node:assert/strict";
import test from "node:test";

const { decideAdminAccess } = await import(new URL("./admin-authorization.ts", import.meta.url).href);

test("requires an authenticated Supabase user", () => {
  assert.deepEqual(decideAdminAccess(null, null), { status: "unauthenticated" });
});

test("denies authenticated users without a matching active admin row", () => {
  assert.deepEqual(decideAdminAccess("user-a", null), { status: "forbidden", userId: "user-a" });
  assert.deepEqual(decideAdminAccess("user-a", "user-b"), { status: "forbidden", userId: "user-a" });
});

test("allows only a matching authenticated admin row", () => {
  assert.deepEqual(decideAdminAccess("user-a", "user-a"), { status: "authorized", userId: "user-a" });
});
