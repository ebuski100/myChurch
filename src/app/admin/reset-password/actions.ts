"use server";

import { redirect } from "next/navigation";
import { createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";
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

  const supabase = await createSupabaseAuthServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      message:
        "Your password-reset session has expired. Request a new reset link.",
    };
  }

  const { data: admin, error: adminError } = await supabase
    .from("admin_users")
    .select("user_id, role, is_active")
    .eq("user_id", user.id)
    .maybeSingle();

  if (
    adminError ||
    !admin ||
    admin.user_id !== user.id ||
    admin.is_active !== true ||
    !["primary", "standard"].includes(admin.role)
  ) {
    return {
      message:
        "This account is not authorized to reset an administrator password.",
    };
  }

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
