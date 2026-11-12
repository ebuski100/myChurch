import "server-only";

import { createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";
import { createSupabaseStorageServerClient } from "@/lib/supabase/storage-server";
import {
  hashInvitationToken,
  invitationDisplayStatus,
  invitationFailureReasonFromError,
  validateInvitationEmail,
  type InvitationFailureReason,
} from "./admin-invitations";
import { buildInviteCallbackUrl } from "./admin-invite-setup";

export type {
  InvitationAccess,
  InvitationStatus,
} from "./admin-invitations";

export type ManagedInvitation = {
  id: string;
  email: string;
  expiresAt: string;
  acceptedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  status: "pending" | "accepted" | "revoked" | "expired";
};

export type StandardAdminEntry = {
  userId: string;
  email: string | null;
  isActive: boolean;
  adminSince: string | null;
};

export type InvitationListResult =
  | {
      kind: "success";
      invitations: ManagedInvitation[];
      admins: StandardAdminEntry[];
    }
  | { kind: "error" };

type InvitationRow = {
  invitation_id?: unknown;
  invitation_email?: unknown;
  invitation_expires_at?: unknown;
  invitation_accepted_at?: unknown;
  invitation_revoked_at?: unknown;
  invitation_created_at?: unknown;
};

type StandardAdminRow = {
  admin_user_id?: unknown;
  admin_email?: unknown;
  admin_is_active?: unknown;
  admin_since?: unknown;
};

function asRows(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asText(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function shapeInvitation(
  row: InvitationRow,
): ManagedInvitation | null {
  const id = asText(row.invitation_id);
  const email = asText(row.invitation_email);
  const expiresAt = asText(row.invitation_expires_at);
  const createdAt = asText(row.invitation_created_at);

  if (!id || !email || !expiresAt || !createdAt) return null;

  const acceptedAt = asText(row.invitation_accepted_at);
  const revokedAt = asText(row.invitation_revoked_at);

  return {
    id,
    email,
    expiresAt,
    acceptedAt,
    revokedAt,
    createdAt,
    status: invitationDisplayStatus({
      acceptedAt,
      revokedAt,
      expiresAt,
    }),
  };
}

export async function getManagedInvitations(): Promise<InvitationListResult> {
  try {
    const supabase = await createSupabaseAuthServerClient();

    const [invitationsResult, adminsResult] = await Promise.all([
      supabase.rpc("list_admin_invitations"),
      supabase.rpc("list_standard_admins"),
    ]);

    if (invitationsResult.error || adminsResult.error) {
      return { kind: "error" };
    }

    const invitations: ManagedInvitation[] = [];

    for (const value of asRows(invitationsResult.data)) {
      const shaped = shapeInvitation(value as InvitationRow);
      if (shaped) invitations.push(shaped);
    }

    const admins: StandardAdminEntry[] = [];

    for (const value of asRows(adminsResult.data)) {
      const row = value as StandardAdminRow;

      if (typeof row.admin_user_id !== "string") continue;

      admins.push({
        userId: row.admin_user_id,
        email: asText(row.admin_email),
        isActive: row.admin_is_active === true,
        adminSince: asText(row.admin_since),
      });
    }

    return { kind: "success", invitations, admins };
  } catch {
    return { kind: "error" };
  }
}

export type CreateInvitationResult =
  | {
      kind: "success";
      invitationId: string;
      email: string;
      expiresAt: string;
    }
  | { kind: "error"; reason: InvitationFailureReason };

export async function createManagedInvitation(
  rawEmail: string,
  token: string,
): Promise<CreateInvitationResult> {
  const email = validateInvitationEmail(rawEmail);

  if (!email.ok) {
    return { kind: "error", reason: "invalid_email" };
  }

  try {
    const supabase = await createSupabaseAuthServerClient();

    const { data, error } = await supabase.rpc(
      "create_admin_invitation",
      {
        p_email: email.email,
        p_token_hash: hashInvitationToken(token),
      },
    );

    if (error) {
      return {
        kind: "error",
        reason: invitationFailureReasonFromError(error.message),
      };
    }

    const row = asRows(data)[0] as InvitationRow | undefined;
    const invitationId = row ? asText(row.invitation_id) : null;
    const expiresAt = row ? asText(row.invitation_expires_at) : null;

    if (!invitationId || !expiresAt) {
      return { kind: "error", reason: "unknown" };
    }

    return {
      kind: "success",
      invitationId,
      email: email.email,
      expiresAt,
    };
  } catch {
    return { kind: "error", reason: "unknown" };
  }
}

export type RevokeInvitationResult =
  | { kind: "success" }
  | { kind: "error"; reason: InvitationFailureReason };

export async function revokeManagedInvitation(
  invitationId: string,
): Promise<RevokeInvitationResult> {
  try {
    const supabase = await createSupabaseAuthServerClient();

    const { error } = await supabase.rpc("revoke_admin_invitation", {
      p_invitation_id: invitationId,
    });

    if (error) {
      return {
        kind: "error",
        reason: invitationFailureReasonFromError(error.message),
      };
    }

    return { kind: "success" };
  } catch {
    return { kind: "error", reason: "unknown" };
  }
}

export type DeletePastInvitationResult =
  | { kind: "success" }
  | { kind: "error"; reason: InvitationFailureReason };

/**
 * Permanently deletes an accepted, revoked, or expired invitation record.
 *
 * The database RPC independently verifies the active-primary caller and
 * refuses to delete a live invitation. This operation only targets
 * admin_invitations; it does not delete Auth users or admin_users records.
 */
export async function deletePastManagedInvitation(
  invitationId: string,
): Promise<DeletePastInvitationResult> {
  try {
    const supabase = await createSupabaseAuthServerClient();

    const { error } = await supabase.rpc(
      "delete_past_admin_invitation",
      {
        p_invitation_id: invitationId,
      },
    );

    if (error) {
      console.error("[deletePastManagedInvitation] RPC failed:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      return {
        kind: "error",
        reason: invitationFailureReasonFromError(error.message),
      };
    }

    return { kind: "success" };
  } catch {
    return { kind: "error", reason: "unknown" };
  }
}

export type AcceptInvitationResult =
  | { kind: "success" }
  | { kind: "error"; reason: InvitationFailureReason };

export async function acceptManagedInvitation(
  tokenHash: string,
): Promise<AcceptInvitationResult> {
  try {
    const supabase = await createSupabaseAuthServerClient();

    const { error } = await supabase.rpc("accept_admin_invitation", {
      p_token_hash: tokenHash,
    });

    if (error) {
      return {
        kind: "error",
        reason: invitationFailureReasonFromError(error.message),
      };
    }

    return { kind: "success" };
  } catch {
    return { kind: "error", reason: "unknown" };
  }
}

export type DeactivateAdminResult =
  | { kind: "success" }
  | { kind: "error"; reason: InvitationFailureReason };

export async function deactivateManagedAdmin(
  targetUserId: string,
): Promise<DeactivateAdminResult> {
  try {
    const supabase = await createSupabaseAuthServerClient();

    const { error } = await supabase.rpc(
      "deactivate_standard_admin",
      {
        p_target_user_id: targetUserId,
      },
    );

    if (error) {
      return {
        kind: "error",
        reason: invitationFailureReasonFromError(error.message),
      };
    }

    return { kind: "success" };
  } catch {
    return { kind: "error", reason: "unknown" };
  }
}

export type ReactivateAdminResult =
  | { kind: "success" }
  | { kind: "error"; reason: InvitationFailureReason };

export async function reactivateManagedAdmin(
  targetUserId: string,
): Promise<ReactivateAdminResult> {
  try {
    const supabase = await createSupabaseAuthServerClient();

    const { error } = await supabase.rpc(
      "reactivate_standard_admin",
      {
        p_target_user_id: targetUserId,
      },
    );

    if (error) {
      return {
        kind: "error",
        reason: invitationFailureReasonFromError(error.message),
      };
    }

    return { kind: "success" };
  } catch {
    return { kind: "error", reason: "unknown" };
  }
}

export type InviteEmailResult =
  | { kind: "success" }
  | { kind: "error" };

export async function sendAdminInviteEmail(
  email: string,
  token: string,
  siteUrl: string,
): Promise<InviteEmailResult> {
  const supabase = createSupabaseStorageServerClient();
  const redirectTo = buildInviteCallbackUrl(siteUrl, token);

  try {
    // First try the normal invitation flow. This creates a new Auth user.
    const { error: inviteError } =
      await supabase.auth.admin.inviteUserByEmail(email, {
        redirectTo,
      });

    if (!inviteError) {
      return { kind: "success" };
    }

    // Only an existing Auth account should use the alternative flow.
    if (
      inviteError.code !== "email_exists" &&
      inviteError.code !== "user_already_exists"
    ) {
      console.error("[admin-invitation] Invite delivery failed:", {
        code: inviteError.code,
        message: inviteError.message,
      });

      return { kind: "error" };
    }

    // Existing Auth account: send a magic link without creating
    // another Auth user.
    const { error: magicLinkError } =
      await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
          emailRedirectTo: redirectTo,
        },
      });

    if (!magicLinkError) {
      return { kind: "success" };
    }

    // If the existing account has not verified its email yet,
    // resend its signup confirmation instead.
    if (magicLinkError.code === "email_not_confirmed") {
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: redirectTo,
        },
      });

      if (!resendError) {
        return { kind: "success" };
      }

      console.error(
        "[admin-invitation] Signup confirmation resend failed:",
        {
          code: resendError.code,
          message: resendError.message,
        },
      );
    }

    console.error(
      "[admin-invitation] Existing-account email failed:",
      {
        code: magicLinkError.code,
        message: magicLinkError.message,
      },
    );

    return { kind: "error" };
  } catch (error) {
    console.error("[admin-invitation] Email delivery exception:", {
      message:
        error instanceof Error
          ? error.message
          : "Unknown server error",
    });

    return { kind: "error" };
  }
}

// export async function sendAdminInviteEmail(
//   email: string,
//   token: string,
//   siteUrl: string,
// ): Promise<InviteEmailResult> {
//   try {
//     const supabase = createSupabaseStorageServerClient();
//     const redirectTo = buildInviteCallbackUrl(siteUrl, token);

//     const { error } = await supabase.auth.admin.inviteUserByEmail(
//       email,
//       { redirectTo },
//     );

//     if (error) {
//       console.error(
//         "[admin-invitation] Supabase email delivery failed:",
//         {
//           name: error.name,
//           code: error.code,
//           status: error.status,
//           message: error.message,
//         },
//       );

//       return { kind: "error" };
//     }

//     return { kind: "success" };
//   } catch (error) {
//     console.error("[admin-invitation] Email delivery exception:", {
//       message:
//         error instanceof Error
//           ? error.message
//           : "Unknown server error",
//     });

//     return { kind: "error" };
//   }
// }
