"use server";

import { redirect } from "next/navigation";
import { getAdminAccessContext } from "@/lib/admin-auth";
import { sanitizeAuthErrorMessage } from "@/lib/admin-password-recovery";
import type { ResetPasswordActionState } from "@/lib/admin-password-recovery";

const MIN_PASSWORD_LENGTH = 8;

export async function resetAdminPasswordAction(
  _previous: ResetPasswordActionState,
  formData: FormData,
): Promise<ResetPasswordActionState> {
  const password = formData.get("password");
  const confirmation = formData.get("confirmPassword");

  if (
    typeof password !== "string" ||
    password.length < MIN_PASSWORD_LENGTH
  ) {
    return {
      message: `Choose a password with at least ${MIN_PASSWORD_LENGTH} characters.`,
    };
  }

  if (typeof confirmation !== "string" || password !== confirmation) {
    return {
      message:
        "The passwords do not match. Enter the same password twice.",
    };
  }

  const { supabase, access } = await getAdminAccessContext({
    writable: true,
  });
  if (access.status === "unauthenticated") {
    return {
      message:
        "Your password-reset session has expired. Request a new recovery code.",
    };
  }

  if (access.status !== "authorized") {
    return {
      message:
        "This account is not authorized to reset an administrator password.",
    };
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password,
  });

  if (updateError) {
    const code =
      typeof updateError.code === "string" &&
      /^[a-zA-Z0-9_.-]{1,64}$/.test(updateError.code)
        ? updateError.code
        : undefined;
    const status =
      typeof updateError.status === "number" &&
      Number.isInteger(updateError.status) &&
      updateError.status >= 400 &&
      updateError.status <= 599
        ? updateError.status
        : undefined;
    const message = sanitizeAuthErrorMessage(
      updateError.message,
      password,
    );

    console.error("[admin-auth] password_update_failed", {
      ...(code ? { code } : {}),
      ...(status ? { status } : {}),
      ...(message ? { message } : {}),
    });

    return {
      message:
        "Your password could not be updated. Check the password requirements and try again.",
    };
  }

  await supabase.auth.signOut();

  redirect("/admin/login?passwordReset=1");
}
