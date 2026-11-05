"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";
import {
  hashInvitationToken,
  validateInvitationToken,
} from "@/lib/admin-invitations";
import { acceptManagedInvitation } from "@/lib/admin-invitation-data";
import {
  buildConfirmErrorUrl,
  setupFailureMessage,
  validateSetupPassword,
} from "@/lib/admin-invite-setup";
import type { SetupInvitationActionState } from "./setup-form";

/**
 * Completes invitation setup for the CALLER. The caller arrives here with a
 * Supabase Auth session minted by the invite verification (`/auth/callback`
 * or `/auth/confirm` + `/auth/session`) but no password yet. This action
 * sets the password with `updateUser`, then consumes the M12 invitation
 * through the existing RPC — whose email-ownership, single-use, expiry and
 * revocation checks decide, atomically, exactly as the old accept button did.
 */
export async function setupInvitationAction(
  _previous: SetupInvitationActionState,
  form: FormData,
): Promise<SetupInvitationActionState> {
  const token = validateInvitationToken(form.get("token"));
  if (!token.ok) {
    return { message: setupFailureMessage("invalid_token") };
  }

  const supabase = await createSupabaseAuthServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(buildConfirmErrorUrl("session_expired", token.token));
  }

  const password = validateSetupPassword(
    form.get("password"),
    form.get("confirmPassword"),
  );
  if (!password.ok) {
    return {
      message: setupFailureMessage(
        password.reason === "too_short"
          ? "weak_password"
          : password.reason === "mismatch"
            ? "password_mismatch"
            : "update_failed",
      ),
    };
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: password.password,
  });
  if (updateError) {
    return { message: setupFailureMessage("update_failed") };
  }

  const accepted = await acceptManagedInvitation(
    hashInvitationToken(token.token),
  );
  if (accepted.kind === "error") {
    return { message: setupFailureMessage(accepted.reason) };
  }

  revalidatePath("/admin");
  redirect("/admin?invitationAccepted=1");
}

export async function setupSignOutAction() {
  const supabase = await createSupabaseAuthServerClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
