"use client";

import { createBrowserClient } from "@supabase/ssr";
import { supabaseCookieOptions } from "@/lib/supabase/cookie-options";

type BrowserAuthConfig = {
  url: string;
  publishableKey: string;
};

let browserClient: ReturnType<typeof createBrowserClient> | undefined;
let authConfigPromise: Promise<BrowserAuthConfig> | undefined;

async function getSupabaseAuthConfig(): Promise<BrowserAuthConfig> {
  authConfigPromise ??= fetch("/api/supabase/config", { cache: "no-store" })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error("Supabase browser Auth configuration is unavailable.");
      }

      const config: unknown = await response.json();
      if (typeof config !== "object" || config === null) {
        throw new Error("Supabase browser Auth configuration is invalid.");
      }

      const url = Reflect.get(config, "url");
      const publishableKey = Reflect.get(config, "publishableKey");
      if (typeof url !== "string" || typeof publishableKey !== "string") {
        throw new Error("Supabase browser Auth configuration is invalid.");
      }

      return {
        url,
        publishableKey,
      };
    })
    .catch((error: unknown) => {
      authConfigPromise = undefined;
      throw error;
    });

  return authConfigPromise;
}

export async function createSupabaseBrowserClient() {
  if (browserClient) return browserClient;

  const { url, publishableKey } = await getSupabaseAuthConfig();
  browserClient = createBrowserClient(url, publishableKey, {
    cookieOptions: supabaseCookieOptions,
  });
  return browserClient;
}
