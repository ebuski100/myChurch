import assert from "node:assert/strict";
import test from "node:test";

const {
  resolveConfirmNext,
  validateConfirmOtpType,
  validateSetupPassword,
  confirmFailureMessage,
  setupFailureMessage,
  setupFailureMessageForInvitation,
  buildInviteCallbackUrl,
  buildSetupForwardUrl,
  buildConfirmErrorUrl,
  withInvitationToken,
  parseAuthErrorCode,
  parseFragmentSessionTokens,
  DEFAULT_CONFIRM_NEXT,
  INVITATION_TOKEN_PARAM,
  SETUP_PASSWORD_MIN_LENGTH,
} = await import(
  new URL("./admin-invite-setup.ts", import.meta.url).href
);
const { validateInvitationToken } = await import(
  new URL("./admin-invitations.ts", import.meta.url).href
);

test("setup password minimum is 8", () => {
  assert.equal(SETUP_PASSWORD_MIN_LENGTH, 8);
});

// test("accepts a relative admin path as the confirm target", () => {
//   assert.equal(resolveConfirmNext("/admin/invitations/setup"), "/admin/invitations/setup");
//   assert.equal(resolveConfirmNext("/admin"), DEFAULT_CONFIRM_NEXT);
// });

test("accepts valid relative admin paths as confirm targets", () => {
  assert.equal(
    resolveConfirmNext("/admin/invitations/setup"),
    "/admin/invitations/setup",
  );

  assert.equal(
    resolveConfirmNext("/admin/reset-password"),
    "/admin/reset-password",
  );

  assert.equal(resolveConfirmNext("/admin"), DEFAULT_CONFIRM_NEXT);
});

test("rejects open-redirect and non-admin confirm targets", () => {
  for (const next of [
    null,
    undefined,
    42,
    "",
    "   ",
    "https://evil.example/admin",
    "//evil.example/admin",
    "/admin/../etc",
    "/other",
    "/",
    "\\admin",
    "javascript:alert(1)",
  ]) {
    assert.equal(resolveConfirmNext(next), DEFAULT_CONFIRM_NEXT);
  }
});

test("narrows confirm OTP types to the accepted set", () => {
  assert.deepEqual(validateConfirmOtpType("invite"), {
    ok: true,
    otpType: "invite",
  });
  assert.deepEqual(validateConfirmOtpType("signup"), {
    ok: true,
    otpType: "signup",
  });
  assert.deepEqual(validateConfirmOtpType("recovery"), {
    ok: true,
    otpType: "recovery",
  });
  for (const otpType of [null, undefined, "", "sms", "INVITE", 42]) {
    assert.deepEqual(validateConfirmOtpType(otpType), { ok: false });
  }
});

test("validates a matching setup password", () => {
  assert.deepEqual(
    validateSetupPassword("correct horse 9", "correct horse 9"),
    {
      ok: true,
      password: "correct horse 9",
    },
  );
  assert.deepEqual(validateSetupPassword("", ""), {
    ok: false,
    reason: "missing_password",
  });
  assert.deepEqual(validateSetupPassword(null, null), {
    ok: false,
    reason: "missing_password",
  });
});

test("rejects mismatched and short setup passwords", () => {
  assert.deepEqual(
    validateSetupPassword("correct horse 9", "different"),
    {
      ok: false,
      reason: "mismatch",
    },
  );
  assert.deepEqual(validateSetupPassword("short7!", "short7!"), {
    ok: false,
    reason: "too_short",
  });
});

test("maps confirm and setup failures to friendly messages", () => {
  assert.ok(
    confirmFailureMessage("invalid_link").includes("not valid"),
  );
  assert.ok(
    confirmFailureMessage("session_expired").includes("expired"),
  );
  assert.ok(
    confirmFailureMessage("invalid_request").includes("not valid"),
  );
  assert.ok(
    setupFailureMessage("session_expired").includes("session"),
  );
  assert.ok(
    setupFailureMessage("weak_password").includes("8 characters"),
  );
  assert.ok(
    setupFailureMessage("password_mismatch").includes("do not match"),
  );
  assert.ok(
    setupFailureMessage("update_failed").includes(
      "could not be saved",
    ),
  );
  assert.ok(setupFailureMessage("expired").includes("expired"));
  assert.equal(typeof validateInvitationToken, "function");
});

const SAMPLE_TOKEN =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

test("uses a single canonical token parameter name", () => {
  assert.equal(INVITATION_TOKEN_PARAM, "token");
});

test("invite email callback URL carries token and next", () => {
  const url = buildInviteCallbackUrl(
    "https://example.com/",
    SAMPLE_TOKEN,
  );
  const parsed = new URL(url);
  assert.equal(
    parsed.origin + parsed.pathname,
    "https://example.com/auth/callback",
  );
  assert.equal(parsed.searchParams.get("next"), DEFAULT_CONFIRM_NEXT);
  assert.equal(
    parsed.searchParams.get(INVITATION_TOKEN_PARAM),
    SAMPLE_TOKEN,
  );
});

test("invite email callback URL trims a trailing slash from the site URL", () => {
  const url = buildInviteCallbackUrl(
    "https://example.com/",
    SAMPLE_TOKEN,
  );
  assert.ok(url.startsWith("https://example.com/auth/callback?"));
});

test("setup forward URL preserves a validated token", () => {
  assert.equal(
    buildSetupForwardUrl(DEFAULT_CONFIRM_NEXT, SAMPLE_TOKEN),
    `${DEFAULT_CONFIRM_NEXT}?${INVITATION_TOKEN_PARAM}=${SAMPLE_TOKEN}`,
  );
});

test("setup forward URL without a token is the bare target", () => {
  assert.equal(
    buildSetupForwardUrl(DEFAULT_CONFIRM_NEXT, null),
    DEFAULT_CONFIRM_NEXT,
  );
});

test("withInvitationToken appends with ? or & correctly", () => {
  assert.equal(
    withInvitationToken("/admin/invitations/setup", SAMPLE_TOKEN),
    `/admin/invitations/setup?${INVITATION_TOKEN_PARAM}=${SAMPLE_TOKEN}`,
  );
  assert.equal(
    withInvitationToken("/admin/x?next=%2Fy", SAMPLE_TOKEN),
    `/admin/x?next=%2Fy&${INVITATION_TOKEN_PARAM}=${SAMPLE_TOKEN}`,
  );
});

test("confirm error URL preserves the token for fragment recovery", () => {
  const url = buildConfirmErrorUrl("invalid_request", SAMPLE_TOKEN);
  const parsed = new URL(url, "https://example.com");
  assert.equal(parsed.pathname, "/auth/confirm");
  assert.equal(parsed.searchParams.get("error"), "invalid_request");
  assert.equal(
    parsed.searchParams.get(INVITATION_TOKEN_PARAM),
    SAMPLE_TOKEN,
  );
});

test("confirm error URL without a token carries only the error", () => {
  const url = buildConfirmErrorUrl("invalid_link", null);
  const parsed = new URL(url, "https://example.com");
  assert.equal(parsed.searchParams.get("error"), "invalid_link");
  assert.equal(parsed.searchParams.get(INVITATION_TOKEN_PARAM), null);
});

test("full redirect chain keeps the exact token at every handoff", () => {
  // Email → callback → setup: simulate the query strings each step reads.
  const emailUrl = new URL(
    buildInviteCallbackUrl("https://example.com", SAMPLE_TOKEN),
  );
  const tokenAtCallback = emailUrl.searchParams.get(
    INVITATION_TOKEN_PARAM,
  );
  assert.equal(tokenAtCallback, SAMPLE_TOKEN);

  const setupUrl = new URL(
    buildSetupForwardUrl(DEFAULT_CONFIRM_NEXT, tokenAtCallback),
    "https://example.com",
  );
  assert.equal(
    setupUrl.searchParams.get(INVITATION_TOKEN_PARAM),
    SAMPLE_TOKEN,
  );
  assert.deepEqual(
    validateInvitationToken(
      setupUrl.searchParams.get(INVITATION_TOKEN_PARAM),
    ),
    { ok: true, token: SAMPLE_TOKEN },
  );

  // Callback failure → confirm (fragment recovery): token must survive.
  const errorUrl = new URL(
    buildConfirmErrorUrl("invalid_request", tokenAtCallback),
    "https://example.com",
  );
  assert.equal(
    errorUrl.searchParams.get(INVITATION_TOKEN_PARAM),
    SAMPLE_TOKEN,
  );
});

test("parses Auth error codes defensively", () => {
  assert.equal(parseAuthErrorCode("otp_expired"), "otp_expired");
  assert.equal(parseAuthErrorCode("  OTP_EXPIRED  "), "otp_expired");
  for (const bad of [
    null,
    undefined,
    42,
    "",
    "   ",
    "a".repeat(65),
    "bad code!",
    "x".repeat(200),
  ]) {
    assert.equal(parseAuthErrorCode(bad), null);
  }
});

test("consumed-link callback keeps M12 token on the confirm error URL", () => {
  // Simulates the double-click case: Auth redirects with ?error=&error_code=
  // and no code/token_hash. The callback must preserve the M12 token so
  // fragment recovery can still run, and must report invalid_link (the
  // email link is spent), never invalid_request.
  const confirmed = buildConfirmErrorUrl(
    "invalid_link",
    SAMPLE_TOKEN,
  );
  const parsed = new URL(confirmed, "https://example.com");
  assert.equal(parsed.searchParams.get("error"), "invalid_link");
  assert.equal(
    parsed.searchParams.get(INVITATION_TOKEN_PARAM),
    SAMPLE_TOKEN,
  );
});

test("parses implicit-flow fragment session tokens", () => {
  const fragment =
    "#access_token=AAA&expires_at=1&expires_in=3600&refresh_token=BBB&token_type=bearer&type=invite";
  assert.deepEqual(parseFragmentSessionTokens(fragment), {
    accessToken: "AAA",
    refreshToken: "BBB",
  });
  // Leading # is optional; extra fragment fields are ignored.
  assert.deepEqual(
    parseFragmentSessionTokens("access_token=AAA&refresh_token=BBB"),
    { accessToken: "AAA", refreshToken: "BBB" },
  );
});

test("rejects fragments without a complete token pair", () => {
  for (const bad of [
    null,
    undefined,
    42,
    "",
    "#",
    "#access_token=AAA",
    "#refresh_token=BBB",
    "#access_token=&refresh_token=BBB",
    "#access_token=AAA&refresh_token=",
    "#type=invite",
  ]) {
    assert.equal(parseFragmentSessionTokens(bad), null);
  }
});
