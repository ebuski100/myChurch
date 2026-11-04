"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminAccess } from "@/lib/admin-auth";
import {
  decidePrimaryTransferAccess,
  transferFailureMessage,
  transferFailureReasonFromError,
  validateTransferTarget,
} from "@/lib/primary-transfer";
import { createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";

export type PrimaryTransferActionState = {
  message?: string;
};

/**
 * Moves the primary seat to another administrator through
 * `public.transfer_primary_admin`.
 *
 * The checks here are the same friendly first line the screen uses; the RPC
 * re-validates the caller, the target and the seat inside one transaction and
 * is the authority on every decision. Nothing is written unless the RPC
 * succeeds, and a failure never leaves a partial state behind.
 *
 * On success the caller is no longer the primary, so the redirect goes to the
 * overview — not back to this screen, which would now be restricted.
 */
export async function transferPrimaryAdminAction(
  _previous: PrimaryTransferActionState,
  form: FormData,
): Promise<PrimaryTransferActionState> {
  const decision = decidePrimaryTransferAccess(
    await getAdminAccess(),
  );

  if (!decision.allowed) {
    if (decision.reason === "unauthenticated")
      redirect("/admin/login");
    if (decision.reason === "forbidden")
      redirect("/admin/login?error=not_admin");
    return { message: transferFailureMessage("not_primary") };
  }

  if (form.get("confirm") !== "yes") {
    return {
      message:
        "Tick the confirmation box before transferring the primary role.",
    };
  }

  const target = validateTransferTarget(
    form.get("targetUserId"),
    decision.userId,
  );
  if (!target.ok) {
    return { message: transferFailureMessage(target.reason) };
  }

  const supabase = await createSupabaseAuthServerClient();
  const { error } = await supabase.rpc("transfer_primary_admin", {
    p_target_user_id: target.targetUserId,
  });

  // if (error) {
  //   // Raw database detail never reaches the browser: the message is mapped
  //   // back to a stable reason and then to operator-safe copy.
  //   return {
  //     message: transferFailureMessage(
  //       transferFailureReasonFromError(error.message),
  //     ),
  //   };
  // }

  if (error) {
    console.error("[M11 primary transfer RPC diagnostic]", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });

    return {
      message: transferFailureMessage(
        transferFailureReasonFromError(error.message),
      ),
    };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/primary-transfer");
  redirect("/admin?primaryTransferred=1");
}
