// import { NextResponse } from "next/server";
// import { createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";

// /**
//  * Persists an Auth session delivered in a URL fragment (`#access_token=…`).
//  * Fragments never reach the server, so the confirm page extracts them in the
//  * browser and POSTs them here; `setSession` writes the same cookies the
//  * callback route writes for `?code=` deliveries. A fresh invite link from a
//  * mail client is the only caller — no CSRF-sourced session can be injected
//  * because only tokens Auth itself minted will verify.
//  *
//  * POST-only with no URL parameters or prerendered output, so no segment
//  * config is needed under Cache Components.
//  */
// export async function POST(request: Request) {
//   let body: unknown;
//   try {
//     body = await request.json();
//   } catch {
//     return NextResponse.json({ ok: false }, { status: 400 });
//   }

//   const payload =
//     typeof body === "object" && body !== null
//       ? (body as Record<string, unknown>)
//       : {};
//   const accessToken = payload["access_token"];
//   const refreshToken = payload["refresh_token"];

//   if (typeof accessToken !== "string" || accessToken.length === 0) {
//     return NextResponse.json({ ok: false }, { status: 400 });
//   }
//   if (typeof refreshToken !== "string" || refreshToken.length === 0) {
//     return NextResponse.json({ ok: false }, { status: 400 });
//   }

//   const supabase = await createSupabaseAuthServerClient();
//   const { error } = await supabase.auth.setSession({
//     access_token: accessToken,
//     refresh_token: refreshToken,
//   });

//   if (error) {
//     return NextResponse.json({ ok: false }, { status: 401 });
//   }

//   return NextResponse.json({ ok: true });
// }

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

  const supabase = await createSupabaseAuthServerClient({ writable: true });

  const { error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (error) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
