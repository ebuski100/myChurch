"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";

function getRecoveryOrigin(requestHeaders: Headers): string {
  const configured =
    process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL;

  if (configured) {
    try {
      const parsed = new URL(configured);
      if (
        parsed.protocol === "https:" ||
        parsed.hostname === "localhost" ||
        parsed.hostname === "127.0.0.1"
      ) {
        return parsed.origin;
      }
    } catch {
      // Fall through to the validated local request host.
    }
  }

  const host =
    requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("host");

  if (!host || !/^(localhost|127\.0\.0\.1)(:\d{1,5})?$/.test(host)) {
    throw new Error(
      "Set NEXT_PUBLIC_SITE_URL to the public website origin.",
    );
  }

  const protocol =
    requestHeaders.get("x-forwarded-proto") === "https"
      ? "https"
      : "http";

  return `${protocol}://${host}`;
}

function safeAuthError(error: { code?: unknown; status?: unknown }) {
  const code =
    typeof error.code === "string" &&
    /^[a-zA-Z0-9_.-]{1,64}$/.test(error.code)
      ? error.code
      : undefined;

  const status =
    typeof error.status === "number" && Number.isInteger(error.status)
      ? error.status
      : undefined;

  console.warn("[admin-auth] password_recovery_request_failed", {
    ...(code ? { code } : {}),
    ...(status ? { status } : {}),
  });
}

export async function requestPasswordResetAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();

  if (
    !email ||
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    redirect("/admin/forgot-password?error=invalid_email");
  }

  let requestFailed = false;

  try {
    const origin = getRecoveryOrigin(await headers());
    const callback = new URL("/auth/callback", origin);

    callback.searchParams.set("next", "/admin/reset-password");

    const supabase = await createSupabaseAuthServerClient({ writable: true });

    const { error } = await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: callback.toString(),
      },
    );

    if (error) {
      safeAuthError(error);
      requestFailed = true;
    }
  } catch (error) {
    requestFailed = true;

    if (
      error instanceof Error &&
      error.message.includes("NEXT_PUBLIC_SITE_URL")
    ) {
      console.error(
        "[admin-auth] password_recovery_origin_not_configured",
      );
    } else {
      console.error(
        "[admin-auth] password_recovery_request_unavailable",
      );
    }
  }

  redirect(
    requestFailed
      ? "/admin/forgot-password?error=unavailable"
      : "/admin/forgot-password?sent=1",
  );
}
