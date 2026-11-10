"use client";

import { useEffect, useState, useActionState } from "react";
import Link from "next/link";
import { resetAdminPasswordAction } from "./actions";
import type { ResetPasswordActionState } from "@/lib/admin-password-recovery";

const initialState: ResetPasswordActionState = {};

type RecoveryStatus = "checking" | "ready" | "invalid";

export default function ResetPasswordClient({
  initialError,
}: {
  initialError: boolean;
}) {
  const [status, setStatus] = useState<RecoveryStatus>(
    initialError ? "invalid" : "checking",
  );
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [state, formAction, pending] = useActionState(
    resetAdminPasswordAction,
    initialState,
  );

  useEffect(() => {
    if (initialError) return;

    let cancelled = false;

    async function verifyRecoverySession() {
      try {
        const hash = window.location.hash.startsWith("#")
          ? window.location.hash.slice(1)
          : "";

        const params = new URLSearchParams(hash);
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");
        const type = params.get("type");

        if (accessToken || refreshToken) {
          if (type !== "recovery" || !accessToken || !refreshToken) {
            if (!cancelled) setStatus("invalid");
            return;
          }

          const persisted = await fetch("/auth/session", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              access_token: accessToken,
              refresh_token: refreshToken,
            }),
            cache: "no-store",
          });

          if (!persisted.ok) {
            if (!cancelled) setStatus("invalid");
            return;
          }

          window.history.replaceState(
            null,
            "",
            window.location.pathname + window.location.search,
          );
        }

        const response = await fetch("/auth/recovery/session", {
          cache: "no-store",
        });

        if (!response.ok) {
          if (!cancelled) setStatus("invalid");
          return;
        }

        const result = (await response.json()) as { email?: string };

        if (!cancelled) {
          setEmail(
            typeof result.email === "string" ? result.email : "",
          );
          setStatus("ready");
        }
      } catch {
        if (!cancelled) setStatus("invalid");
      }
    }

    void verifyRecoverySession();

    return () => {
      cancelled = true;
    };
  }, [initialError]);

  return (
    <main className="flex min-h-[calc(100vh-80px)] flex-1 items-center justify-center bg-[#F7F7F5] px-5 py-12 sm:px-8">
      <section className="w-full max-w-md rounded-[28px] border border-[#E7E5DF] bg-white p-7 shadow-[0_24px_80px_rgba(16,27,51,0.08)] sm:p-10">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#9A772E]">
          Administrator access
        </p>

        <h1 className="mt-3 font-serif text-3xl font-medium tracking-tight text-[#101B33]">
          Choose a new password
        </h1>

        {status === "checking" && (
          <p
            role="status"
            className="mt-4 text-sm leading-6 text-[#737985]"
          >
            Verifying your password-reset link…
          </p>
        )}

        {status === "invalid" && (
          <div className="mt-5">
            <p
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-800"
            >
              This password-reset link is invalid, expired, or has
              already been used. Request a new link to continue.
            </p>

            <Link
              href="/admin/forgot-password"
              className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-[#101B33] px-5 text-sm font-semibold text-white"
            >
              Request another reset link
            </Link>
          </div>
        )}

        {status === "ready" && (
          <>
            <p className="mt-3 text-sm leading-6 text-[#737985]">
              {email ? (
                <>
                  Set a new password for{" "}
                  <strong className="text-[#101B33]">{email}</strong>.
                </>
              ) : (
                "Set a new password for your administrator account."
              )}{" "}
              Use at least 8 characters.
            </p>

            {state.message && (
              <p
                role="alert"
                className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-800"
              >
                {state.message}
              </p>
            )}

            <form action={formAction} className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="new-password"
                  className="mb-2 block text-xs font-semibold text-[#30394A]"
                >
                  New password
                </label>

                <div className="relative">
                  <input
                    id="new-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    minLength={8}
                    className="h-12 w-full rounded-xl border border-[#DFE1E5] bg-[#FCFCFB] px-4 pr-16 text-sm text-[#101B33] outline-none focus:border-[#A7894B] focus:ring-4 focus:ring-[#D9B66D]/15"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute inset-y-0 right-3 px-2 text-xs font-semibold text-[#8A7447]"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="confirm-password"
                  className="mb-2 block text-xs font-semibold text-[#30394A]"
                >
                  Confirm new password
                </label>

                <input
                  id="confirm-password"
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  className="h-12 w-full rounded-xl border border-[#DFE1E5] bg-[#FCFCFB] px-4 text-sm text-[#101B33] outline-none focus:border-[#A7894B] focus:ring-4 focus:ring-[#D9B66D]/15"
                />
              </div>

              <button
                type="submit"
                disabled={pending}
                className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[#101B33] px-5 text-sm font-semibold text-white transition hover:bg-[#1B2B49] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {pending ? "Updating password…" : "Update password"}
              </button>
            </form>
          </>
        )}

        <Link
          href="/admin/login"
          className="mt-7 inline-flex text-sm font-semibold text-[#8A7447] hover:text-[#101B33]"
        >
          ← Back to sign in
        </Link>
      </section>
    </main>
  );
}
