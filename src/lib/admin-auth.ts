import "server-only";

import { createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";
import {
  decideAdminAccess,
  type AdminRole,
} from "@/lib/admin-authorization";
import { getVerifiedUserOrThrow } from "@/lib/supabase/auth-user-result";

type AdminUserRow = {
  user_id: string;
  role: string;
  is_active: boolean;
};

async function getAuthenticatedContext() {
  const supabase = await createSupabaseAuthServerClient();
  const { data, error } = await supabase.auth.getUser();
  const user = getVerifiedUserOrThrow(data.user, error);

  return { supabase, user };
}

export async function getAuthenticatedUser() {
  return (await getAuthenticatedContext()).user;
}

export async function getAdminAccess() {
  const { supabase, user } = await getAuthenticatedContext();
  if (!user) {
    const decision = decideAdminAccess(null, null);
    console.info("[admin-auth] Access decision.", {
      operation: "admin_authorization",
      result: decision.status,
      authenticatedUserPresent: false,
    });
    return decision;
  }

  const { data: adminRecord, error } = await supabase
    .from("admin_users")
    .select("user_id, role, is_active")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error("Administrator access could not be verified.", {
      cause: error,
    });
  }

  const row = adminRecord as AdminUserRow | null;

  const decision = decideAdminAccess(
    user.id,
    row
      ? {
          userId: row.user_id,
          role: row.role as AdminRole,
          isActive: row.is_active === true,
        }
      : null,
  );
  console.info("[admin-auth] Access decision.", {
    operation: "admin_authorization",
    result: decision.status,
    authenticatedUserPresent: true,
    activeAdminRecordFound: Boolean(row),
    activeAdminRecord: row?.is_active === true,
  });
  return decision;
}
