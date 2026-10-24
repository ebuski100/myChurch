"use client";

import { useAudioPlayer } from "./audio-player-provider";
import type { Sermon } from "@/lib/sermons";

export function SermonPlayButton({ sermon }: { sermon: Sermon }) {
  const { currentSermon, status, playSermon, togglePlayback } =
    useAudioPlayer();

  const isCurrent = currentSermon?.id === sermon.id;
  const isPlaying = isCurrent && status === "playing";
  const label = isPlaying ? "Pause" : isCurrent ? "Resume" : "Play";

  return (
    <button
      type="button"
      onClick={() => {
        if (isCurrent) {
          void togglePlayback();
        } else {
          void playSermon(sermon);
        }
      }}
      aria-label={`${label} sermon: ${sermon.title}`}
      className="inline-flex min-h-9 shrink-0 items-center justify-center gap-1.5 rounded-full bg-[#101B33] px-3 text-xs font-semibold text-white transition hover:bg-[#263653] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9A772E] sm:px-4 sm:text-sm"
    >
      {isPlaying ? (
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          className="size-4"
          aria-hidden="true"
        >
          <rect x="5" y="4" width="3.5" height="12" rx="1" />
          <rect x="11.5" y="4" width="3.5" height="12" rx="1" />
        </svg>
      ) : (
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          className="size-4"
          aria-hidden="true"
        >
          <path d="M6.2 3.9a1 1 0 0 0-1.5.87v10.46a1 1 0 0 0 1.5.87l8.45-5.23a1 1 0 0 0 0-1.7L6.2 3.9Z" />
        </svg>
      )}

      {label}
    </button>
  );
}
