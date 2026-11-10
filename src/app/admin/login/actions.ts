// "use server";

// import { redirect } from "next/navigation";
// import { createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";

// function supabaseTargetCategory(): "missing" | "invalid" | "loopback" | "non_loopback" {
//   const configuredUrl = process.env.SUPABASE_URL;
//   if (!configuredUrl) return "missing";

//   try {
//     const hostname = new URL(configuredUrl).hostname.toLowerCase();
//     return ["localhost", "127.0.0.1", "[::1]"].includes(hostname)
//       ? "loopback"
//       : "non_loopback";
//   } catch {
//     return "invalid";
//   }
// }

// function logSignInFailure(
//   stage: "form_validation" | "password_auth",
//   category: string,
//   error?: { code?: unknown; status?: unknown },
// ) {
//   const code =
//     typeof error?.code === "string" && /^[A-Za-z0-9_.-]{1,64}$/.test(error.code)
//       ? error.code
//       : undefined;
//   const status =
//     typeof error?.status === "number" && Number.isInteger(error.status) &&
//     error.status >= 400 && error.status <= 599
//       ? error.status
//       : undefined;

//   console.warn("[admin-auth] sign_in_failed", {
//     stage,
//     category,
//     target: supabaseTargetCategory(),
//     ...(code ? { code } : {}),
//     ...(status ? { status } : {}),
//   });
// }

// export async function signInAction(formData: FormData) {
//   const email = String(formData.get("email") ?? "").trim();
//   const password = String(formData.get("password") ?? "");

//   if (!email || !password) {
//     logSignInFailure("form_validation", "missing_credentials");
//     redirect("/admin/login?error=invalid");
//   }

//   const supabase = await createSupabaseAuthServerClient();
//   const { error } = await supabase.auth.signInWithPassword({ email, password });

//   if (error) {
//     logSignInFailure("password_auth", "supabase_auth_rejected", error);
//     redirect("/admin/login?error=invalid");
//   }

//   redirect("/admin");
// }

"use server";

import { redirect } from "next/navigation";
import { createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";

function supabaseTargetCategory():
  | "missing"
  | "invalid"
  | "loopback"
  | "non_loopback" {
  const configuredUrl = process.env.SUPABASE_URL;
  if (!configuredUrl) return "missing";

  try {
    const hostname = new URL(configuredUrl).hostname.toLowerCase();
    return ["localhost", "127.0.0.1", "[::1]"].includes(hostname)
      ? "loopback"
      : "non_loopback";
  } catch {
    return "invalid";
  }
}

function logSignInFailure(
  stage: "form_validation" | "password_auth",
  category: string,
  error?: { code?: unknown; status?: unknown },
) {
  const code =
    typeof error?.code === "string" &&
    /^[A-Za-z0-9_.-]{1,64}$/.test(error.code)
      ? error.code
      : undefined;
  const status =
    typeof error?.status === "number" &&
    Number.isInteger(error.status) &&
    error.status >= 400 &&
    error.status <= 599
      ? error.status
      : undefined;

  console.warn("[admin-auth] sign_in_failed", {
    stage,
    category,
    target: supabaseTargetCategory(),
    ...(code ? { code } : {}),
    ...(status ? { status } : {}),
  });
}

function logSignInOutcome(
  success: boolean,
  userIdReturned: boolean,
  redirect: string,
) {
  console.info("[admin-auth] sign_in_outcome", {
    success,
    userIdReturned,
    redirect,
  });
}

export async function signInAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const rawToken = formData.get("invitationToken");
  const invitationToken =
    typeof rawToken === "string" &&
    /^[0-9a-f]{64}$/i.test(rawToken.trim())
      ? rawToken.trim().toLowerCase()
      : null;

  const afterSignIn = invitationToken
    ? `/admin/invitations/accept?token=${encodeURIComponent(invitationToken)}`
    : "/admin";

  if (!email || !password) {
    logSignInFailure("form_validation", "missing_credentials");
    logSignInOutcome(false, false, "/admin/login?error=invalid");
    redirect("/admin/login?error=invalid");
  }

  const supabase = await createSupabaseAuthServerClient({ writable: true });
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    logSignInOutcome(
      false,
      false,
      "/admin/login?error=invalid",
    );
    logSignInFailure(
      "password_auth",
      "supabase_auth_rejected",
      error,
    );
    redirect("/admin/login?error=invalid");
  }

  logSignInOutcome(
    true,
    Boolean(data.user?.id),
    afterSignIn === "/admin" ? "/admin" : "/admin/invitations/accept",
  );
  redirect(afterSignIn);
}
