"use client";

import Link from "next/link";
import { useListenLater } from "./listen-later-provider";

export function ListenLaterLink() {
  const { savedIds, isReady } = useListenLater();

  return (
    <Link
      href="/sermons/listen-later"
      className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#D9B66D] bg-white px-4 text-sm font-semibold text-[#785B1F] transition hover:bg-[#F8F4E9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9A772E]"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        fill="none"
        className="size-4"
      >
        <path
          d="M5.25 3.25h9.5a.75.75 0 0 1 .75.75v13l-5.5-3.5-5.5 3.5V4a.75.75 0 0 1 .75-.75Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
      Listen Later
      <span className="rounded-full bg-[#F8F4E9] px-2 py-0.5 text-xs">
        {isReady ? savedIds.length : "…"}
      </span>
    </Link>
  );
}
