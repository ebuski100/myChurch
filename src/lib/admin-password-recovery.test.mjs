import assert from "node:assert/strict";
import test from "node:test";

const {
  isAuthorizedRecoveryAdmin,
  isValidRecoveryOtp,
  isValidRecoveryEmail,
  sanitizeAuthErrorMessage,
} = await import(new URL("./admin-password-recovery.ts", import.meta.url).href);

test("accepts valid recovery email addresses and rejects malformed input", () => {
  assert.equal(isValidRecoveryEmail("admin@example.com"), true);
  assert.equal(isValidRecoveryEmail("not-an-email"), false);
  assert.equal(isValidRecoveryEmail("admin@example"), false);
  assert.equal(isValidRecoveryEmail("a".repeat(250) + "@x.co"), false);
  assert.equal(isValidRecoveryEmail(null), false);
});

test("accepts configured six-digit and observed eight-digit recovery OTPs", () => {
  assert.equal(isValidRecoveryOtp("012345"), true);
  assert.equal(isValidRecoveryOtp("00123456"), true);
  assert.equal(isValidRecoveryOtp("12345"), false);
  assert.equal(isValidRecoveryOtp("1234567"), false);
  assert.equal(isValidRecoveryOtp("123456789"), false);
  assert.equal(isValidRecoveryOtp("12a45678"), false);
  assert.equal(isValidRecoveryOtp("１２３４５６７８"), false);
  assert.equal(isValidRecoveryOtp(null), false);
});

test("recovery requires the matching active primary or standard admin", () => {
  assert.equal(
    isAuthorizedRecoveryAdmin("user-a", {
      user_id: "user-a",
      role: "primary",
      is_active: true,
    }),
    true,
  );
  assert.equal(
    isAuthorizedRecoveryAdmin("user-a", {
      user_id: "user-a",
      role: "standard",
      is_active: true,
    }),
    true,
  );
  assert.equal(
    isAuthorizedRecoveryAdmin("user-a", {
      user_id: "user-b",
      role: "standard",
      is_active: true,
    }),
    false,
  );
  assert.equal(
    isAuthorizedRecoveryAdmin("user-a", {
      user_id: "user-a",
      role: "standard",
      is_active: false,
    }),
    false,
  );
  assert.equal(
    isAuthorizedRecoveryAdmin("user-a", {
      user_id: "user-a",
      role: "admin",
      is_active: true,
    }),
    false,
  );
  assert.equal(isAuthorizedRecoveryAdmin("user-a", null), false);
});

test("auth diagnostic messages redact passwords, OTPs, and session tokens", () => {
  const password = "NewSecretPassword123!";
  const message = sanitizeAuthErrorMessage(
    `Rejected ${password}; otp=12345678; access_token=access-secret; refresh_token=refresh-secret; token=token-secret; Bearer bearer-secret`,
    password,
  );

  assert.ok(message);
  assert.equal(message.includes(password), false);
  assert.equal(message.includes("12345678"), false);
  assert.equal(message.includes("access-secret"), false);
  assert.equal(message.includes("refresh-secret"), false);
  assert.equal(message.includes("token-secret"), false);
  assert.equal(message.includes("bearer-secret"), false);
});
