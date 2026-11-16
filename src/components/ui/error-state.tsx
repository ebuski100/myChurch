"use client";

import { useTransition } from "react";
import { LoadingButton } from "./button";

export function ErrorState({
  onRetry,
  admin = false,
}: {
  onRetry: () => void;
  admin?: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <main
      className={`flex min-h-[50vh] flex-1 items-center justify-center px-5 py-16 ${
        admin ? "bg-[#F5F6F8]" : "bg-[#F8F9FB]"
      }`}
    >
      <section
        role="alert"
        className="w-full max-w-lg rounded-2xl border border-[#E4E7EC] bg-white p-7 text-center shadow-[0_8px_30px_rgba(16,27,51,0.06)] sm:p-9"
      >
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9A772E]">
          {admin ? "Administrator workspace" : "VictoryCity"}
        </p>
        <h1 className="mt-3 text-xl font-semibold text-[#101B33]">
          This page couldn’t be loaded
        </h1>
        <p className="mt-2 text-sm leading-6 text-[#667085]">
          Something went wrong while preparing this page. Please try
          again.
        </p>
        <LoadingButton
          type="button"
          onClick={() => startTransition(onRetry)}
          pending={pending}
          pendingLabel="Retrying…"
          disabled={pending}
          className="mt-6 min-h-11 rounded-full bg-[#101B33] px-5 text-sm font-semibold text-white hover:bg-[#263653]"
        >
          Try again
        </LoadingButton>
      </section>
    </main>
  );
}
