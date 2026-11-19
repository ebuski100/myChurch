"use client";

import { useEffect, useRef, useState } from "react";
import { useListenLater } from "./listen-later-provider";
import { Spinner } from "@/components/ui/button";

export function ListenLaterButton({
  sermonId,
  sermonTitle,
}: {
  sermonId: string;
  sermonTitle: string;
}) {
  const { isReady, isSaved, toggleSaved } = useListenLater();
  const saved = isSaved(sermonId);
  const [toast, setToast] = useState<{ message: string; type: "add" | "remove" } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  function truncateTitle(title: string) {
    if (title.length <= 40) return title;
    return `${title.slice(0, 39)}…`;
  }

  function handleClick() {
    const wasSaved = saved;
    toggleSaved(sermonId);
    const displayTitle = truncateTitle(sermonTitle);
    setToast({
      message: wasSaved
        ? `Removed from Listen Later: ${displayTitle}`
        : `Added to Listen Later: ${displayTitle}`,
      type: wasSaved ? "remove" : "add",
    });
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setToast(null), 3000);
  }

  return (
    <>
      <button
        type="button"
        disabled={!isReady}
        onClick={handleClick}
        aria-busy={!isReady}
        aria-label={
          !isReady
            ? "Preparing Listen Later"
            : saved
              ? `Remove ${sermonTitle} from Listen Later`
              : `Save ${sermonTitle} to Listen Later`
        }
        aria-pressed={saved}
        title={saved ? "Remove from Listen Later" : "Listen Later"}
        className="grid size-11 shrink-0 place-items-center rounded-full text-[#785B1F] transition hover:bg-[#F8F4E9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9A772E] disabled:cursor-wait disabled:opacity-50"
      >
        {!isReady ? (
          <Spinner />
        ) : (
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            fill={saved ? "currentColor" : "none"}
            className="size-5"
          >
            <path
              d="M5.25 3.25h9.5a.75.75 0 0 1 .75.75v13l-5.5-3.5-5.5 3.5V4a.75.75 0 0 1 .75-.75Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium shadow-lg ${
            toast.type === "add"
              ? "bg-[#ECFDF3] text-[#027A48]"
              : "bg-[#FEF3F2] text-[#B42318]"
          }`}
        >
          {toast.type === "add" ? (
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="size-4"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="size-4"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.536-4.464a.75.75 0 000-1.061L11.06 10l2.475-2.475a.75.75 0 10-1.06-1.06L10 8.94 7.525 6.465a.75.75 0 00-1.06 1.06L8.94 10l-2.475 2.475a.75.75 0 001.06 1.06L10 11.06l2.475 2.475a.75.75 0 001.06 0z"
                clipRule="evenodd"
              />
            </svg>
          )}
          {toast.message}
        </div>
      )}
    </>
  );
}