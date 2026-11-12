import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseCookieOptions } from "@/lib/supabase/cookie-options";

function getSupabaseAuthConfig() {
  const url = process.env.SUPABASE_URL;
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error("Supabase Auth server configuration is missing.");
  }

  return { url, publishableKey };
}

export async function refreshSupabaseAuthSession(
  request: NextRequest,
) {
  const { url, publishableKey } = getSupabaseAuthConfig();
  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, publishableKey, {
    cookieOptions: supabaseCookieOptions,
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }

        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
        for (const [name, value] of Object.entries(headers)) {
          response.headers.set(name, value);
        }
      },
    },
  });

  const { error } = await supabase.auth.getClaims();
  // if (error) {
  //   console.warn("[supabase-auth] Proxy session validation failed.", {
  //     code:
  //       typeof error.code === "string" &&
  //       /^[A-Za-z0-9_.-]{1,64}$/.test(error.code)
  //         ? error.code
  //         : null,
  //     status:
  //       typeof error.status === "number" &&
  //       Number.isInteger(error.status) &&
  //       error.status >= 400 &&
  //       error.status <= 599
  //         ? error.status
  //         : null,
  //   });
  // }

  if (error) {
    console.warn("[supabase-auth] Proxy session validation failed.", {
      name: error.name,
      message: error.message,
      code:
        typeof error.code === "string" &&
        /^[A-Za-z0-9_.-]{1,64}$/.test(error.code)
          ? error.code
          : null,
      status:
        typeof error.status === "number" &&
        Number.isInteger(error.status) &&
        error.status >= 400 &&
        error.status <= 599
          ? error.status
          : null,
    });
  }

  return response;
}
