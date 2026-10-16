import type { NextRequest } from "next/server";
import { refreshSupabaseAuthSession } from "@/lib/supabase/auth-proxy";

export async function proxy(request: NextRequest) {
  return refreshSupabaseAuthSession(request);
}

export const config = {
  matcher: ["/admin/:path*"],
};
