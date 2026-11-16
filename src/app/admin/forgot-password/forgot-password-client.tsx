"use client";

import { useActionState } from "react";
import Link from "next/link";
import { LoadingButton } from "@/components/ui/button";
import { passwordRecoveryAction } from "./actions";
import type { ForgotPasswordActionState } from "@/lib/admin-password-recovery";

const initialState: ForgotPasswordActionState = { step: "email" };

export default function ForgotPasswordClient() {
  const [state, formAction, pending] = useActionState(
    passwordRecoveryAction,
    initialState,
  );

  return (
    <main className="flex min-h-[calc(100vh-80px)] flex-1 items-center justify-center bg-[#F7F7F5] px-5 py-12 sm:px-8">
      <section className="w-full max-w-md rounded-[28px] border border-[#E7E5DF] bg-white p-7 shadow-[0_24px_80px_rgba(16,27,51,0.08)] sm:p-10">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#9A772E]">
          Administrator access
        </p>
        <h1 className="mt-3 font-serif text-3xl font-medium tracking-tight text-[#101B33]">
          Reset your password
        </h1>

        {state.step === "email" ? (
          <>
            <p className="mt-3 text-sm leading-6 text-[#737985]">
              Enter the email address associated with your administrator
              account. If an account matches, we’ll send a recovery code.
            </p>

            {state.message && (
              <p
                role="alert"
                className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
              >
                {state.message}
              </p>
            )}

            <form action={formAction} className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="recovery-email"
                  className="mb-2 block text-xs font-semibold text-[#30394A]"
                >
                  Email address
                </label>
                <input
                  id="recovery-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={254}
                  defaultValue={state.email ?? ""}
                  placeholder="admin@example.com"
                  className="h-12 w-full rounded-xl border border-[#DFE1E5] bg-[#FCFCFB] px-4 text-sm text-[#101B33] outline-none transition placeholder:text-[#B0B4BC] focus:border-[#A7894B] focus:bg-white focus:ring-4 focus:ring-[#D9B66D]/15"
                />
              </div>
              <LoadingButton
                type="submit"
                pendingLabel="Requesting recovery code…"
                disabled={pending}
                className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[#101B33] px-5 text-sm font-semibold text-white transition hover:bg-[#1B2B49] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#A7894B] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Send recovery code
              </LoadingButton>
            </form>
          </>
        ) : (
          <>
            <p className="mt-3 text-sm leading-6 text-[#737985]">
              If an administrator account matches{" "}
              <strong className="text-[#101B33]">{state.email}</strong>, a
              recovery code was sent to this email address. Check your inbox
              and spam folder, then enter the code below.
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
              <input type="hidden" name="intent" value="verify" />
              <input type="hidden" name="email" value={state.email ?? ""} />
              <div>
                <label
                  htmlFor="recovery-code"
                  className="mb-2 block text-xs font-semibold text-[#30394A]"
                >
                  Recovery code
                </label>
                <input
                  id="recovery-code"
                  name="token"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="([0-9]{6}|[0-9]{8})"
                  required
                  aria-describedby="recovery-code-help"
                  className="h-12 w-full rounded-xl border border-[#DFE1E5] bg-[#FCFCFB] px-4 text-center text-lg tracking-[0.35em] text-[#101B33] outline-none focus:border-[#A7894B] focus:bg-white focus:ring-4 focus:ring-[#D9B66D]/15"
                />
                <p id="recovery-code-help" className="mt-2 text-xs text-[#737985]">
                  Enter the code exactly as it appears in the email.
                </p>
              </div>
              <LoadingButton
                type="submit"
                pendingLabel="Verifying recovery code…"
                disabled={pending}
                className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[#101B33] px-5 text-sm font-semibold text-white transition hover:bg-[#1B2B49] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Verify code
              </LoadingButton>
            </form>

            <div className="mt-4 flex items-center justify-between gap-4">
              <form action={formAction}>
                <input type="hidden" name="intent" value="request" />
                <input type="hidden" name="email" value={state.email ?? ""} />
                <LoadingButton
                  type="submit"
                  pendingLabel="Requesting another code…"
                  disabled={pending}
                  className="text-sm font-semibold text-[#8A7447] hover:text-[#101B33] disabled:opacity-50"
                >
                  Send another code
                </LoadingButton>
              </form>
              <form action={formAction}>
                <input type="hidden" name="intent" value="change-email" />
                <input type="hidden" name="email" value={state.email ?? ""} />
                <LoadingButton
                  type="submit"
                  pendingLabel="Changing email…"
                  disabled={pending}
                  className="text-sm font-semibold text-[#8A7447] hover:text-[#101B33] disabled:opacity-50"
                >
                  Change email
                </LoadingButton>
              </form>
            </div>
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
