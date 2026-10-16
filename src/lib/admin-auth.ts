import "server-only";

import { createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";
import { decideAdminAccess } from "@/lib/admin-authorization";

export async function getAdminAccess() {
  const supabase = await createSupabaseAuthServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (!user) return decideAdminAccess(null, null);
  if (authError) {
    throw new Error("Administrator identity could not be verified.");
  }

  const { data: adminRecord, error } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error("Administrator access could not be verified.");
  }

  return decideAdminAccess(user.id, adminRecord?.user_id ?? null);
}
