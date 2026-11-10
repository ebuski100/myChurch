"use server";

import { redirect } from "next/navigation";
import { createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";

export async function signOutAction() {
  const supabase = await createSupabaseAuthServerClient({ writable: true });
  await supabase.auth.signOut();
  redirect("/admin/login");
}
