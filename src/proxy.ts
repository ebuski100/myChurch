import { NextResponse, type NextRequest } from "next/server";
import { refreshSupabaseAuthSession } from "@/lib/supabase/auth-proxy";

export async function proxy(request: NextRequest) {
  if (
    request.method === "POST" &&
    request.nextUrl.pathname === "/admin/login"
  ) {
    return NextResponse.next();
  }

  return refreshSupabaseAuthSession(request);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
