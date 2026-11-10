import type { CookieOptions } from "@supabase/ssr";

type CookieStore = {
  getAll(): { name: string; value: string }[];
  set(name: string, value: string, options: CookieOptions): unknown;
};

export function createServerCookieAdapter(
  cookieStore: CookieStore,
  writable: boolean,
) {
  return {
    getAll() {
      return cookieStore.getAll();
    },
    setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
      if (!writable) return;

      for (const { name, value, options } of cookiesToSet) {
        cookieStore.set(name, value, options);
      }
    },
  };
}
