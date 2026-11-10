// "use server";

// import { revalidatePath } from "next/cache";
// import { redirect } from "next/navigation";
// import { getAdminAccess } from "@/lib/admin-auth";
// import {
//   decideInvitationAccess,
//   generateInvitationToken,
//   invitationFailureMessage,
//   validateDeactivateTarget,
//   validateInvitationEmail,
//   validateInvitationId,
//   validateInvitationToken,
//   hashInvitationToken,
// } from "@/lib/admin-invitations";
// import {
//   acceptManagedInvitation,
//   createManagedInvitation,
//   deactivateManagedAdmin,
//   reactivateManagedAdmin,
//   revokeManagedInvitation,
//   sendAdminInviteEmail,
// } from "@/lib/admin-invitation-data";

// export type InvitationActionState = {
//   message?: string;
// };

// /**
//  * Invites a standard administrator. Primary-only. Records the invitation row,
//  * sends the Supabase Auth invite email carrying the M12 token, and revokes
//  * the newly created row if delivery fails so no undeliverable token stays
//  * live.
//  *
//  * A live invitation for the same address is never touched: the create RPC
//  * rejects the duplicate with ALREADY_PENDING inside its own transaction, and
//  * the original token and expiry stay valid until expiry or an explicit
//  * primary-administrator revocation.
//  */
// export async function inviteStandardAdminAction(
//   _previous: InvitationActionState,
//   form: FormData,
// ): Promise<InvitationActionState> {
//   const decision = decideInvitationAccess(await getAdminAccess());

//   if (!decision.allowed) {
//     if (decision.reason === "unauthenticated") redirect("/admin/login");
//     if (decision.reason === "forbidden")
//       redirect("/admin/login?error=not_admin");
//     return { message: invitationFailureMessage("not_primary") };
//   }

//   const email = validateInvitationEmail(form.get("email"));
//   if (!email.ok) {
//     return { message: invitationFailureMessage("invalid_email") };
//   }

//   const token = generateInvitationToken();
//   const created = await createManagedInvitation(email.email, token);

//   if (created.kind === "error") {
//     return { message: invitationFailureMessage(created.reason) };
//   }

//   const siteUrl =
//     process.env.NEXT_PUBLIC_SITE_URL ?? "http://127.0.0.1:3000";
//   const delivered = await sendAdminInviteEmail(
//     created.email,
//     token,
//     siteUrl,
//   );

//   if (delivered.kind === "error") {
//     // Best effort: the row exists but the email never left. Revoke it
//     // through the same primary path so the token cannot linger.
//     await revokeManagedInvitation(created.invitationId);
//     return {
//       message:
//         "The invitation could not be emailed and nothing usable was created. Try again.",
//     };
//   }

//   revalidatePath("/admin/invitations");
//   redirect("/admin/invitations?invited=1");
// }

// /**
//  * Cancels a pending invitation. Primary-only; idempotent.
//  */
// export async function revokeInvitationAction(
//   _previous: InvitationActionState,
//   form: FormData,
// ): Promise<InvitationActionState> {
//   const decision = decideInvitationAccess(await getAdminAccess());

//   if (!decision.allowed) {
//     if (decision.reason === "unauthenticated") redirect("/admin/login");
//     if (decision.reason === "forbidden")
//       redirect("/admin/login?error=not_admin");
//     return { message: invitationFailureMessage("not_primary") };
//   }

//   const invitation = validateInvitationId(form.get("invitationId"));
//   if (!invitation.ok) {
//     return { message: invitationFailureMessage("invalid_invitation") };
//   }

//   const revoked = await revokeManagedInvitation(invitation.invitationId);
//   if (revoked.kind === "error") {
//     return { message: invitationFailureMessage(revoked.reason) };
//   }

//   revalidatePath("/admin/invitations");
//   redirect("/admin/invitations?revoked=1");
// }

// /**
//  * Deactivates one active standard administrator. Primary-only; the RPC
//  * refuses self-deactivation and primary targets, and the checks below give
//  * the same answers early for friendly errors.
//  */
// export async function deactivateStandardAdminAction(
//   _previous: InvitationActionState,
//   form: FormData,
// ): Promise<InvitationActionState> {
//   const decision = decideInvitationAccess(await getAdminAccess());

//   if (!decision.allowed) {
//     if (decision.reason === "unauthenticated") redirect("/admin/login");
//     if (decision.reason === "forbidden")
//       redirect("/admin/login?error=not_admin");
//     return { message: invitationFailureMessage("not_primary") };
//   }

//   const target = validateDeactivateTarget(
//     form.get("targetUserId"),
//     decision.userId,
//   );
//   if (!target.ok) {
//     return {
//       message: invitationFailureMessage(
//         target.reason === "self_target" ? "self_target" : "invalid_target",
//       ),
//     };
//   }

//   const deactivated = await deactivateManagedAdmin(target.targetUserId);
//   if (deactivated.kind === "error") {
//     return { message: invitationFailureMessage(deactivated.reason) };
//   }

//   revalidatePath("/admin/invitations");
//   redirect("/admin/invitations?deactivated=1");
// }

// /**
//  * Reactivates one deactivated standard administrator. Primary-only; the RPC
//  * updates the existing row in place (same user_id, role back to 'standard')
//  * and refuses self-targets, primary targets, already-active targets, and
//  * non-primary callers. The checks below give the same answers early for
//  * friendly errors.
//  */
// export async function reactivateStandardAdminAction(
//   _previous: InvitationActionState,
//   form: FormData,
// ): Promise<InvitationActionState> {
//   const decision = decideInvitationAccess(await getAdminAccess());

//   if (!decision.allowed) {
//     if (decision.reason === "unauthenticated") redirect("/admin/login");
//     if (decision.reason === "forbidden")
//       redirect("/admin/login?error=not_admin");
//     return { message: invitationFailureMessage("not_primary") };
//   }

//   const target = validateDeactivateTarget(
//     form.get("targetUserId"),
//     decision.userId,
//   );
//   if (!target.ok) {
//     return {
//       message: invitationFailureMessage(
//         target.reason === "self_target" ? "self_target" : "invalid_target",
//       ),
//     };
//   }

//   const reactivated = await reactivateManagedAdmin(target.targetUserId);
//   if (reactivated.kind === "error") {
//     return { message: invitationFailureMessage(reactivated.reason) };
//   }

//   revalidatePath("/admin/invitations");
//   redirect("/admin/invitations?reactivated=1");
// }

// /**
//  * Accepts an invitation for the CALLER. Any authenticated user may submit —
//  * the token decides, not the role. On success the caller is a standard
//  * administrator, so the redirect goes to the overview, which every active
//  * admin can open.
//  */
// export async function acceptInvitationAction(
//   _previous: InvitationActionState,
//   form: FormData,
// ): Promise<InvitationActionState> {
//   const token = validateInvitationToken(form.get("token"));
//   if (!token.ok) {
//     return { message: invitationFailureMessage("invalid_token") };
//   }

//   const accepted = await acceptManagedInvitation(
//     hashInvitationToken(token.token),
//   );
//   if (accepted.kind === "error") {
//     return { message: invitationFailureMessage(accepted.reason) };
//   }

//   revalidatePath("/admin");
//   redirect("/admin?invitationAccepted=1");
// }

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminAccess, getAuthenticatedUser } from "@/lib/admin-auth";
import {
  decideInvitationAccess,
  generateInvitationToken,
  invitationFailureMessage,
  validateDeactivateTarget,
  validateInvitationEmail,
  validateInvitationId,
  validateInvitationToken,
  hashInvitationToken,
} from "@/lib/admin-invitations";
import {
  acceptManagedInvitation,
  createManagedInvitation,
  deactivateManagedAdmin,
  deletePastManagedInvitation,
  reactivateManagedAdmin,
  revokeManagedInvitation,
  sendAdminInviteEmail,
} from "@/lib/admin-invitation-data";

export type InvitationActionState = {
  message?: string;
};

export async function inviteStandardAdminAction(
  _previous: InvitationActionState,
  form: FormData,
): Promise<InvitationActionState> {
  const decision = decideInvitationAccess(await getAdminAccess());

  if (!decision.allowed) {
    if (decision.reason === "unauthenticated")
      redirect("/admin/login");
    if (decision.reason === "forbidden") {
      redirect("/admin/login?error=not_admin");
    }

    return { message: invitationFailureMessage("not_primary") };
  }

  const email = validateInvitationEmail(form.get("email"));

  if (!email.ok) {
    return { message: invitationFailureMessage("invalid_email") };
  }

  const token = generateInvitationToken();
  const created = await createManagedInvitation(email.email, token);

  if (created.kind === "error") {
    return { message: invitationFailureMessage(created.reason) };
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://127.0.0.1:3000";

  const delivered = await sendAdminInviteEmail(
    created.email,
    token,
    siteUrl,
  );

  if (delivered.kind === "error") {
    await revokeManagedInvitation(created.invitationId);

    return {
      message:
        "The invitation could not be emailed and nothing usable was created. Try again.",
    };
  }

  revalidatePath("/admin/invitations");
  redirect("/admin/invitations?invited=1");
}

export async function revokeInvitationAction(
  _previous: InvitationActionState,
  form: FormData,
): Promise<InvitationActionState> {
  const decision = decideInvitationAccess(await getAdminAccess());

  if (!decision.allowed) {
    if (decision.reason === "unauthenticated")
      redirect("/admin/login");
    if (decision.reason === "forbidden") {
      redirect("/admin/login?error=not_admin");
    }

    return { message: invitationFailureMessage("not_primary") };
  }

  const invitation = validateInvitationId(form.get("invitationId"));

  if (!invitation.ok) {
    return {
      message: invitationFailureMessage("invalid_invitation"),
    };
  }

  const revoked = await revokeManagedInvitation(
    invitation.invitationId,
  );

  if (revoked.kind === "error") {
    return { message: invitationFailureMessage(revoked.reason) };
  }

  revalidatePath("/admin/invitations");
  redirect("/admin/invitations?revoked=1");
}

/**
 * Permanently removes a historical invitation record.
 *
 * The UI asks for confirmation, but the database RPC is the security
 * boundary: it rechecks the active-primary caller and refuses live invitations.
 * Deleting an accepted invitation does not delete its administrator account
 * or its Supabase Auth user.
 */
export async function deletePastInvitationAction(
  _previous: InvitationActionState,
  form: FormData,
): Promise<InvitationActionState> {
  const decision = decideInvitationAccess(await getAdminAccess());

  if (!decision.allowed) {
    if (decision.reason === "unauthenticated")
      redirect("/admin/login");
    if (decision.reason === "forbidden") {
      redirect("/admin/login?error=not_admin");
    }

    return { message: invitationFailureMessage("not_primary") };
  }

  const invitation = validateInvitationId(form.get("invitationId"));

  if (!invitation.ok) {
    return {
      message: invitationFailureMessage("invalid_invitation"),
    };
  }

  const deleted = await deletePastManagedInvitation(
    invitation.invitationId,
  );

  if (deleted.kind === "error") {
    return { message: invitationFailureMessage(deleted.reason) };
  }

  revalidatePath("/admin/invitations");
  redirect("/admin/invitations?deleted=1");
}

export async function deactivateStandardAdminAction(
  _previous: InvitationActionState,
  form: FormData,
): Promise<InvitationActionState> {
  const decision = decideInvitationAccess(await getAdminAccess());

  if (!decision.allowed) {
    if (decision.reason === "unauthenticated")
      redirect("/admin/login");
    if (decision.reason === "forbidden") {
      redirect("/admin/login?error=not_admin");
    }

    return { message: invitationFailureMessage("not_primary") };
  }

  const target = validateDeactivateTarget(
    form.get("targetUserId"),
    decision.userId,
  );

  if (!target.ok) {
    return {
      message: invitationFailureMessage(
        target.reason === "self_target"
          ? "self_target"
          : "invalid_target",
      ),
    };
  }

  const deactivated = await deactivateManagedAdmin(
    target.targetUserId,
  );

  if (deactivated.kind === "error") {
    return { message: invitationFailureMessage(deactivated.reason) };
  }

  revalidatePath("/admin/invitations");
  redirect("/admin/invitations?deactivated=1");
}

export async function reactivateStandardAdminAction(
  _previous: InvitationActionState,
  form: FormData,
): Promise<InvitationActionState> {
  const decision = decideInvitationAccess(await getAdminAccess());

  if (!decision.allowed) {
    if (decision.reason === "unauthenticated")
      redirect("/admin/login");
    if (decision.reason === "forbidden") {
      redirect("/admin/login?error=not_admin");
    }

    return { message: invitationFailureMessage("not_primary") };
  }

  const target = validateDeactivateTarget(
    form.get("targetUserId"),
    decision.userId,
  );

  if (!target.ok) {
    return {
      message: invitationFailureMessage(
        target.reason === "self_target"
          ? "self_target"
          : "invalid_target",
      ),
    };
  }

  const reactivated = await reactivateManagedAdmin(
    target.targetUserId,
  );

  if (reactivated.kind === "error") {
    return { message: invitationFailureMessage(reactivated.reason) };
  }

  revalidatePath("/admin/invitations");
  redirect("/admin/invitations?reactivated=1");
}

export async function acceptInvitationAction(
  _previous: InvitationActionState,
  form: FormData,
): Promise<InvitationActionState> {
  const token = validateInvitationToken(form.get("token"));

  if (!token.ok) {
    return { message: invitationFailureMessage("invalid_token") };
  }

  const user = await getAuthenticatedUser();
  if (!user) {
    redirect(
      `/admin/login?invitationToken=${encodeURIComponent(token.token)}`,
    );
  }

  const accepted = await acceptManagedInvitation(
    hashInvitationToken(token.token),
  );

  if (accepted.kind === "error") {
    return { message: invitationFailureMessage(accepted.reason) };
  }

  revalidatePath("/admin");
  redirect("/admin?invitationAccepted=1");
}
