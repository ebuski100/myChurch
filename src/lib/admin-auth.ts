// import "server-only";

// import { createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";
// import { decideAdminAccess, type AdminRole } from "@/lib/admin-authorization";

// type AdminUserRow = {
//   user_id: string;
//   role: string;
//   is_active: boolean;
// };

// export async function getAdminAccess() {
//   const supabase = await createSupabaseAuthServerClient();
//   const { data: { user }, error: authError } = await supabase.auth.getUser();

//   if (!user) return decideAdminAccess(null, null);
//   if (authError) {
//     throw new Error("Administrator identity could not be verified.");
//   }

//   const { data: adminRecord, error } = await supabase
//     .from("admin_users")
//     .select("user_id, role, is_active")
//     .eq("user_id", user.id)
//     .maybeSingle();

//   if (error) {
//     throw new Error("Administrator access could not be verified.");
//   }

//   const row = adminRecord as AdminUserRow | null;

//   return decideAdminAccess(
//     user.id,
//     row
//       ? {
//           userId: row.user_id,
//           role: row.role as AdminRole,
//           // Strict comparison: a missing or null value is treated as inactive,
//           // so an unexpected column shape fails closed.
//           isActive: row.is_active === true,
//         }
//       : null,
//   );
// }

import "server-only";

import { createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";
import {
  decideAdminAccess,
  type AdminRole,
} from "@/lib/admin-authorization";

type AdminUserRow = {
  user_id: string;
  role: string;
  is_active: boolean;
};

export async function getAdminAccess() {
  const supabase = await createSupabaseAuthServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    if (
      authError.name === "AuthSessionMissingError" ||
      authError.code === "refresh_token_already_used"
    ) {
      return decideAdminAccess(null, null);
    }

    throw new Error("Administrator identity could not be verified.");
  }

  if (!user) {
    return decideAdminAccess(null, null);
  }

  const { data: adminRecord, error } = await supabase
    .from("admin_users")
    .select("user_id, role, is_active")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error("Administrator access could not be verified.");
  }

  const row = adminRecord as AdminUserRow | null;

  return decideAdminAccess(
    user.id,
    row
      ? {
          userId: row.user_id,
          role: row.role as AdminRole,
          isActive: row.is_active === true,
        }
      : null,
  );
}
