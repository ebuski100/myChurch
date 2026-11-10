"use server";

import { redirect } from "next/navigation";
import { createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";
import { getAdminAccess } from "@/lib/admin-auth";
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

  const access = await getAdminAccess();
  if (access.status === "unauthenticated") {
    return {
      message:
        "Your password-reset session has expired. Request a new reset link.",
    };
  }

  if (access.status !== "authorized") {
    return {
      message:
        "This account is not authorized to reset an administrator password.",
    };
  }

  const supabase = await createSupabaseAuthServerClient({ writable: true });
  const { error: updateError } = await supabase.auth.updateUser({
    password,
  });

  if (updateError) {
    return {
      message:
        "Your password could not be updated. Check the password requirements and try again.",
    };
  }

  await supabase.auth.signOut();

  redirect("/admin/login?passwordReset=1");
}
