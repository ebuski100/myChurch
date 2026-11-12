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

  const supabase = await createSupabaseAuthServerClient({
    writable: true,
  });

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
