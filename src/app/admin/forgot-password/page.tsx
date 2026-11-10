import Link from "next/link";
import { requestPasswordResetAction } from "./actions";

export const metadata = {
  title: "Reset Password | VictoryCity Revival Ministry",
  robots: { index: false, follow: false },
};

export const instant = false;

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  const { sent, error } = await searchParams;

  return (
    <main className="flex min-h-[calc(100vh-80px)] flex-1 items-center justify-center bg-[#F7F7F5] px-5 py-12 sm:px-8">
      <section className="w-full max-w-md rounded-[28px] border border-[#E7E5DF] bg-white p-7 shadow-[0_24px_80px_rgba(16,27,51,0.08)] sm:p-10">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#9A772E]">
          Administrator access
        </p>
        <h1 className="mt-3 font-serif text-3xl font-medium tracking-tight text-[#101B33]">
          Reset your password
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#737985]">
          Enter the email address associated with your active
          administrator account. We’ll send a secure password-reset
          link if an account matches.
        </p>

        {sent === "1" ? (
          <div
            role="status"
            className="mt-6 rounded-xl border border-[#CFE5D5] bg-[#F0F8F2] px-4 py-4 text-sm leading-6 text-[#3C704B]"
          >
            If an administrator account matches that address, a
            password-reset email has been sent. Check your inbox and
            spam folder.
          </div>
        ) : (
          <>
            {error === "invalid_email" && (
              <p
                role="alert"
                className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
              >
                Enter a valid email address.
              </p>
            )}
            {error === "unavailable" && (
              <p
                role="alert"
                className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-800"
              >
                We couldn&apos;t send a reset link right now. Check
                the Auth redirect configuration and try again.
              </p>
            )}
            <form
              action={requestPasswordResetAction}
              className="mt-6 space-y-4"
            >
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
                  placeholder="admin@example.com"
                  className="h-12 w-full rounded-xl border border-[#DFE1E5] bg-[#FCFCFB] px-4 text-sm text-[#101B33] outline-none transition placeholder:text-[#B0B4BC] focus:border-[#A7894B] focus:bg-white focus:ring-4 focus:ring-[#D9B66D]/15"
                />
              </div>
              <button
                type="submit"
                className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[#101B33] px-5 text-sm font-semibold text-white transition hover:bg-[#1B2B49] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#A7894B]"
              >
                Send reset link
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
