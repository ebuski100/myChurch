// import { redirect } from "next/navigation";
// import { createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";
// import { validateInvitationToken } from "@/lib/admin-invitations";
// import {
//   buildConfirmErrorUrl,
//   buildSetupForwardUrl,
//   DEFAULT_CONFIRM_NEXT,
//   INVITATION_TOKEN_PARAM,
//   parseAuthErrorCode,
//   resolveConfirmNext,
//   validateConfirmOtpType,
// } from "@/lib/admin-invite-setup";

// /**
//  * Supabase Auth confirmation callback. The invite email links to Auth's
//  * verify endpoint with this route as `redirect_to`, carrying the M12
//  * invitation token as `?token=` alongside `?next=`; after verification Auth
//  * returns here with either `?code=` (PKCE) or `?token_hash=&type=` (with the
//  * preserved `token`/`next` params) and this route exchanges the Auth code
//  * for a session (persisted via cookies) before sending the invitee to
//  * password setup at `next?token=…`.
//  *
//  * Verification failures arrive as `?error=…&error_code=…` (the one-time
//  * Supabase token was already consumed, expired, or never valid) — or with
//  * no Auth params at all when a client strips them. A consumed-but-verified
//  * link means the invitee already has an account: they go to the confirm
//  * page with `invalid_link`, which explains the state and points at sign-in,
//  * with the M12 token preserved for fragment recovery. Only a request with
//  * no Auth params at all (a stripped or hand-typed URL, not an Auth
//  * redirect) falls through to `invalid_request`. Fragment
//  * (`#access_token=…`) deliveries are handled by the confirm page, which
//  * POSTs them to `/auth/session`.
//  */
// export async function GET(request: Request) {
//   const url = new URL(request.url);
//   const params = url.searchParams;

//   const next = resolveConfirmNext(params.get("next"));
//   const token = validateInvitationToken(params.get(INVITATION_TOKEN_PARAM));
//   const validatedToken = token.ok ? token.token : null;
//   const forward = buildSetupForwardUrl(next, validatedToken);

//   const supabase = await createSupabaseAuthServerClient();

//   // Auth-side verification failure: the email link was already consumed,
//   // expired, or never valid. The Supabase one-time token is gone either
//   // way; the M12 invitation itself is untouched (single-use is enforced by
//   // the acceptance RPC, not the email click). Route to the confirm page
//   // with the M12 token preserved so fragment recovery can still run.
//   // Any Auth-reported failure is a link problem, never `invalid_request`.
//   if (params.get("error") || parseAuthErrorCode(params.get("error_code"))) {
//     return redirectConfirm("invalid_link", validatedToken);
//   }

//   const code = params.get("code");
//   if (typeof code === "string" && code.length > 0) {
//     const { error } = await supabase.auth.exchangeCodeForSession(code);
//     if (!error) redirect(forward);
//     return redirectConfirm("invalid_link", validatedToken);
//   }

//   const otpType = validateConfirmOtpType(params.get("type"));
//   const tokenHash = params.get("token_hash");
//   if (
//     otpType.ok &&
//     typeof tokenHash === "string" &&
//     tokenHash.length > 0
//   ) {
//     const { error } = await supabase.auth.verifyOtp({
//       token_hash: tokenHash,
//       type: otpType.otpType,
//     });
//     if (!error) redirect(forward);
//     return redirectConfirm("invalid_link", validatedToken);
//   }

//   return redirectConfirm("invalid_request", validatedToken);
// }

// function redirectConfirm(
//   reason: "invalid_link" | "invalid_request",
//   token: string | null,
// ) {
//   redirect(buildConfirmErrorUrl(reason, token));
// }

import { redirect } from "next/navigation";
import { createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";
import { validateInvitationToken } from "@/lib/admin-invitations";
import {
  buildConfirmErrorUrl,
  buildSetupForwardUrl,
  INVITATION_TOKEN_PARAM,
  parseAuthErrorCode,
  resolveConfirmNext,
  validateConfirmOtpType,
} from "@/lib/admin-invite-setup";

/**
 * Supabase Auth confirmation callback.
 *
 * Handles both administrator invitations and password recovery.
 * Invitation acceptance remains separate from password recovery.
 *
 * PKCE codes are exchanged here. Implicit-flow recovery fragments
 * are forwarded to the recovery page for session persistence.
 *
 * Auth error descriptions and token values are never echoed.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const params = url.searchParams;

  const next = resolveConfirmNext(params.get("next"));
  const token = validateInvitationToken(
    params.get(INVITATION_TOKEN_PARAM),
  );

  const validatedToken = token.ok ? token.token : null;
  const forward = buildSetupForwardUrl(next, validatedToken);
  const isPasswordRecovery = next === "/admin/reset-password";

  const supabase = await createSupabaseAuthServerClient({ writable: true });

  if (
    params.get("error") ||
    parseAuthErrorCode(params.get("error_code"))
  ) {
    if (isPasswordRecovery) {
      redirect("/admin/reset-password?error=invalid_link");
    }

    return redirectConfirm("invalid_link", validatedToken);
  }

  const code = params.get("code");

  if (typeof code === "string" && code.length > 0) {
    const { error } =
      await supabase.auth.exchangeCodeForSession(code);

    if (!error) redirect(forward);

    if (isPasswordRecovery) {
      redirect("/admin/reset-password?error=invalid_link");
    }

    return redirectConfirm("invalid_link", validatedToken);
  }

  const otpType = validateConfirmOtpType(params.get("type"));
  const tokenHash = params.get("token_hash");

  if (
    otpType.ok &&
    typeof tokenHash === "string" &&
    tokenHash.length > 0
  ) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: otpType.otpType,
    });

    if (!error) redirect(forward);

    if (isPasswordRecovery) {
      redirect("/admin/reset-password?error=invalid_link");
    }

    return redirectConfirm("invalid_link", validatedToken);
  }

  // Recovery tokens delivered in the URL fragment are not sent to
  // the server. Forward the fragment to the browser recovery page.
  if (isPasswordRecovery) redirect(forward);

  return redirectConfirm("invalid_request", validatedToken);
}

function redirectConfirm(
  reason: "invalid_link" | "invalid_request",
  token: string | null,
) {
  redirect(buildConfirmErrorUrl(reason, token));
}
