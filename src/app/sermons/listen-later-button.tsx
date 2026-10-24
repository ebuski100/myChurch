"use client";

import { useListenLater } from "./listen-later-provider";

export function ListenLaterButton({
  sermonId,
  sermonTitle,
}: {
  sermonId: string;
  sermonTitle: string;
}) {
  const { isReady, isSaved, toggleSaved } = useListenLater();
  const saved = isSaved(sermonId);

  return (
    <button
      type="button"
      disabled={!isReady}
      onClick={() => toggleSaved(sermonId)}
      aria-label={
        saved
          ? `Remove ${sermonTitle} from Listen Later`
          : `Save ${sermonTitle} to Listen Later`
      }
      aria-pressed={saved}
      title={saved ? "Remove from Listen Later" : "Listen Later"}
      className="grid size-9 shrink-0 place-items-center rounded-full text-[#785B1F] transition hover:bg-[#F8F4E9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9A772E] disabled:opacity-50"
    >
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
    </button>
  );
}
