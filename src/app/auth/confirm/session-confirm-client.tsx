"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  buildSetupForwardUrl,
  DEFAULT_CONFIRM_NEXT,
  parseFragmentSessionTokens,
  resolveConfirmNext,
} from "@/lib/admin-invite-setup";

type SessionConfirmClientProps = {
  token: string | null;
  error: string | null;
  next: string;
};

function messageFor(error: string | null): string {
  switch (error) {
    case "invalid_link":
      return "That invitation link is not valid or has expired. Ask the primary administrator for a fresh invitation.";
    case "session_expired":
      return "Your invitation link has expired. Ask the primary administrator for a fresh invitation.";
    default:
      return "That request was not valid. Open your invitation link again.";
  }
}

/**
 * Completes fragment-delivered Supabase sessions (`#access_token=…`) that the
 * callback route cannot see. Fragments never reach the server, so a request
 * may arrive here carrying `?error=invalid_request` *and* valid fragment
 * tokens — the server rejected what it could see, not what the invitee
 * holds. Fragment recovery therefore runs whenever fragment tokens exist,
 * regardless of the query-string error; the error panel shows only when no
 * fragment exists or Auth itself rejects the tokens. Sessions persist via
 * `POST /auth/session` (server-side `setSession` with the publishable key),
 * then navigation continues to the verified `next` target. Shown error
 * states never echo raw parameters, and one-time tokens are stripped from
 * the address bar after the attempt.
 */
export function SessionConfirmClient({
  token,
  error,
  next,
}: SessionConfirmClientProps) {
  const [status, setStatus] = useState<"working" | "failed">("working");
  // Shares one in-flight persist attempt across effect re-runs (StrictMode
  // double-effects, remounts): fragment tokens are one-shot and POSTing
  // them twice risks a rejected replay.
  const persistAttempt = useRef<Promise<boolean> | null>(null);
  const safeNext = resolveConfirmNext(next || DEFAULT_CONFIRM_NEXT);
  const forward = buildSetupForwardUrl(safeNext, token);

  useEffect(() => {
    let cancelled = false;

    async function persistFragmentSession(): Promise<boolean> {
      try {
        const fragment = parseFragmentSessionTokens(window.location.hash);
        if (!fragment) return false;

        const response = await fetch("/auth/session", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            access_token: fragment.accessToken,
            refresh_token: fragment.refreshToken,
          }),
        });

        return response.ok;
      } catch {
        return false;
      }
    }

    async function run() {
      if (!persistAttempt.current) {
        persistAttempt.current = persistFragmentSession();
      }
      const ok = await persistAttempt.current;
      if (cancelled) return;
      if (ok) {
        window.history.replaceState(
          null,
          "",
          window.location.pathname + window.location.search,
        );
        window.location.assign(forward);
      } else {
        window.history.replaceState(
          null,
          "",
          window.location.pathname + window.location.search,
        );
        setStatus("failed");
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [forward]);

  if (status === "failed") {
    return (
      <main className="mx-auto w-full max-w-[720px] px-5 py-16 sm:px-8">
        <div className="rounded-2xl border border-[#E4E7EC] bg-white px-6 py-10 text-center shadow-[0_4px_18px_rgba(16,27,51,0.035)]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9A772E]">
            Administrator invitation
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-[#101B33]">
            This invitation link did not verify
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#667085]">
            {error === "invalid_request"
              ? "That invitation link did not verify. Ask the primary administrator for a fresh invitation."
              : messageFor(error)}
          </p>
          <Link
            href="/admin/login"
            className="mt-6 inline-flex min-h-10 items-center justify-center rounded-full bg-[#101B33] px-5 text-sm font-semibold text-white hover:bg-[#263653] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9A772E]"
          >
            Go to admin sign in
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-[720px] px-5 py-16 sm:px-8">
      <div className="rounded-2xl border border-[#E4E7EC] bg-white px-6 py-10 text-center shadow-[0_4px_18px_rgba(16,27,51,0.035)]">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9A772E]">
          Administrator invitation
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-[#101B33]">
          Verifying your invitation…
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#667085]">
          Hold on while we verify your invitation with the sign-in
          service. You will continue to password setup automatically.
        </p>
      </div>
    </main>
  );
}
