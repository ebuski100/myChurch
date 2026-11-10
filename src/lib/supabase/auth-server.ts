import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createServerCookieAdapter } from "@/lib/supabase/server-cookie-adapter";
import { supabaseCookieOptions } from "@/lib/supabase/cookie-options";

function getSupabaseAuthConfig() {
  const url = process.env.SUPABASE_URL;
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error("Supabase Auth server configuration is missing.");
  }

  return { url, publishableKey };
}

export async function createSupabaseAuthServerClient(
  { writable = false }: { writable?: boolean } = {},
) {
  const { url, publishableKey } = getSupabaseAuthConfig();
  const cookieStore = await cookies();

  return createServerClient(url, publishableKey, {
    cookieOptions: supabaseCookieOptions,
    cookies: createServerCookieAdapter(cookieStore, writable),
  });
}
