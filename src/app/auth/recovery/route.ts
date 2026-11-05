import { NextResponse } from "next/server";
import { createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";

export async function GET() {
  const supabase = await createSupabaseAuthServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ ok: false }, { status: 401 });
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
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  return NextResponse.json(
    { ok: true, email: user.email ?? null },
    {
      headers: { "Cache-Control": "no-store, max-age=0" },
    },
  );
}
