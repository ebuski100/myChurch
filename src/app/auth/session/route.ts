import { NextResponse } from "next/server";
import { createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";

/**
 * Persists an Auth session delivered in a URL fragment.
 *
 * Fragments never reach the server, so the browser extracts them
 * and POSTs them here. setSession validates the Supabase-issued
 * tokens and writes the session cookies.
 *
 * Used by invitation confirmation and password recovery.
 *
 * POST-only with no URL parameters or prerendered output.
 */
export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const payload =
    typeof body === "object" && body !== null
      ? (body as Record<string, unknown>)
      : {};

  const accessToken = payload["access_token"];
  const refreshToken = payload["refresh_token"];

  if (typeof accessToken !== "string" || accessToken.length === 0) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (typeof refreshToken !== "string" || refreshToken.length === 0) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const supabase = await createSupabaseAuthServerClient({
    writable: true,
  });

  const { error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (error) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
