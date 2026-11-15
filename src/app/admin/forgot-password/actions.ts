"use server";

import { redirect } from "next/navigation";
import { createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";
import {
  isAuthorizedRecoveryAdmin,
  isValidRecoveryOtp,
  isValidRecoveryEmail,
  type ForgotPasswordActionState,
} from "@/lib/admin-password-recovery";

function logRecoveryFailure(
  event: string,
  error?: { code?: unknown; status?: unknown },
) {
  const code =
    typeof error?.code === "string" &&
    /^[a-zA-Z0-9_.-]{1,64}$/.test(error.code)
      ? error.code
      : undefined;
  const status =
    typeof error?.status === "number" &&
    Number.isInteger(error.status) &&
    error.status >= 400 &&
    error.status <= 599
      ? error.status
      : undefined;

  console.warn(`[admin-auth] ${event}`, {
    ...(code ? { code } : {}),
    ...(status ? { status } : {}),
  });
}

function getEmail(formData: FormData): string {
  const value = formData.get("email");
  return typeof value === "string" ? value.trim() : "";
}

function codeStep(email: string, message?: string): ForgotPasswordActionState {
  return { step: "code", email, ...(message ? { message } : {}) };
}

async function requestRecoveryCode(
  email: string,
): Promise<ForgotPasswordActionState> {
  if (!isValidRecoveryEmail(email)) {
    return {
      step: "email",
      email,
      message: "Enter a valid email address.",
    };
  }

  try {
    const supabase = await createSupabaseAuthServerClient({
      writable: true,
    });
    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
      logRecoveryFailure("password_recovery_request_failed", error);
      return {
        step: "email",
        email,
        message: "We couldn't request a code right now. Please try again.",
      };
    }

    return codeStep(email);
  } catch {
    logRecoveryFailure("password_recovery_request_unavailable");
    return {
      step: "email",
      email,
      message: "We couldn't request a code right now. Please try again.",
    };
  }
}

async function signOutRejectedRecovery(
  supabase: Awaited<ReturnType<typeof createSupabaseAuthServerClient>>,
) {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) logRecoveryFailure("password_recovery_rejected_sign_out_failed", error);
  } catch {
    logRecoveryFailure("password_recovery_rejected_sign_out_unavailable");
  }
}

async function verifyRecoveryCode(
  email: string,
  token: string,
): Promise<ForgotPasswordActionState> {
  if (!isValidRecoveryEmail(email) || !isValidRecoveryOtp(token)) {
    return codeStep(
      email,
      "Enter a valid email address and the recovery code from your email.",
    );
  }

  let supabase: Awaited<ReturnType<typeof createSupabaseAuthServerClient>>;
  let user: { id: string } | null;

  try {
    supabase = await createSupabaseAuthServerClient({ writable: true });
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "recovery",
    });

    if (error || !data.user) {
      if (error) logRecoveryFailure("password_recovery_otp_rejected", error);
      return codeStep(
        email,
        "That code is invalid, expired, or already used. Request a new code and try again.",
      );
    }

    user = data.user;
  } catch {
    logRecoveryFailure("password_recovery_otp_unavailable");
    return codeStep(
      email,
      "We couldn't verify that code right now. Please try again.",
    );
  }

  let authorized = false;

  try {
    const { data: admin, error } = await supabase
      .from("admin_users")
      .select("user_id, role, is_active")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      logRecoveryFailure("password_recovery_admin_check_failed", error);
    } else {
      authorized = isAuthorizedRecoveryAdmin(user.id, admin);
    }
  } catch {
    logRecoveryFailure("password_recovery_admin_check_unavailable");
  }

  if (!authorized) {
    await signOutRejectedRecovery(supabase);
    return codeStep(
      email,
      "This account is not authorized to reset an administrator password.",
    );
  }

  redirect("/admin/reset-password");
}

export async function passwordRecoveryAction(
  _previousState: ForgotPasswordActionState,
  formData: FormData,
): Promise<ForgotPasswordActionState> {
  const intent = formData.get("intent");
  const email = getEmail(formData);

  if (intent === "change-email") {
    return { step: "email", email };
  }

  if (intent === "verify") {
    const tokenValue = formData.get("token");
    const token = typeof tokenValue === "string" ? tokenValue.trim() : "";
    return verifyRecoveryCode(email, token);
  }

  return requestRecoveryCode(email);
}
