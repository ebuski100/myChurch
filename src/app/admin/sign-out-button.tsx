"use client";

import { useState, useTransition } from "react";
import { signOutAction } from "./actions";
import { LoadingButton } from "@/components/ui/button";

export function SignOutButton({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const colors = compact
    ? "border-[#D0D5DD] text-[#475467] hover:border-[#D9B66D] hover:bg-[#FBF8F0] hover:text-[#101B33] focus-visible:outline-[#9A772E]"
    : "border-white/15 text-white/80 hover:border-[#D9B66D]/70 hover:bg-white/5 hover:text-white focus-visible:outline-[#E6C77D]";

  function handleConfirm() {
    startTransition(async () => {
      await signOutAction();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 ${colors} ${compact ? "px-3" : "w-full"}`}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          fill="none"
          className="size-4"
        >
          <path
            d="M8 4H4.5v12H8M11 6l4 4-4 4m4-4H7"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Sign out
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="sign-out-title"
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-[#101B33] shadow-xl">
            <h2 id="sign-out-title" className="text-lg font-semibold">
              Sign out?
            </h2>
            <p className="mt-3 text-sm leading-6">
              Are you sure you want to sign out of your admin account?
            </p>
            <div className="mt-5 flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={isPending}
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#D0D5DD] px-5 py-2.5 text-sm font-semibold text-[#475467] disabled:opacity-60"
              >
                Cancel
              </button>
              <LoadingButton
                type="button"
                pending={isPending}
                pendingLabel="Signing out…"
                onClick={handleConfirm}
                disabled={isPending}
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#D9B66D] px-5 py-2.5 text-sm font-semibold text-[#101B33] hover:bg-[#E8CC8B]"
              >
                Sign Out
              </LoadingButton>
            </div>
          </div>
        </div>
      )}
    </>
  );
}