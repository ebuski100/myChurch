"use client";

import Link from "next/link";
import type { Sermon } from "@/lib/sermons";
import { formatDuration } from "@/lib/sermons";
import { SermonPlayButton } from "@/app/sermons/sermon-play-button";
import { useListenLater } from "@/app/sermons/listen-later-provider";
import { ListenLaterButton } from "@/app/sermons/listen-later-button";

export function ListenLaterLibrary({
  sermons,
}: {
  sermons: Sermon[];
}) {
  const { savedIds, isReady } = useListenLater();

  const sermonsById = new Map(
    sermons.map((sermon) => [sermon.id, sermon]),
  );

  // Preserve the order in which sermons were saved.
  const savedSermons = savedIds
    .map((id) => sermonsById.get(id))
    .filter((sermon): sermon is Sermon => Boolean(sermon));

  if (!isReady) {
    return (
      <div
        aria-live="polite"
        aria-busy="true"
        className="rounded-2xl border border-[#E4E7EC] bg-white px-6 py-10 text-sm text-[#667085]"
      >
        Loading your saved sermons…
      </div>
    );
  }

  if (savedSermons.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#C9CDD5] bg-white px-6 py-12 text-center">
        <div className="mx-auto grid size-12 place-items-center rounded-full bg-[#F8F4E9] text-[#785B1F]">
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            fill="none"
            className="size-6"
          >
            <path
              d="M5.25 3.25h9.5a.75.75 0 0 1 .75.75v13l-5.5-3.5-5.5 3.5V4a.75.75 0 0 1 .75-.75Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h2 className="mt-4 text-lg font-semibold text-[#101B33]">
          No saved sermons yet
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#667085]">
          When you find a message you want to hear later, select its
          bookmark icon in the sermon library. It will appear here.
        </p>
        <Link
          href="/sermons"
          className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-[#101B33] px-5 text-sm font-semibold text-white transition hover:bg-[#263653] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9A772E]"
        >
          Browse sermons
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[#E4E7EC] bg-white px-4 shadow-[0_8px_30px_rgba(16,27,51,0.03)] sm:px-6">
      <div className="flex items-center justify-between gap-3 border-b border-[#E4E7EC] py-4">
        <h2 className="text-sm font-semibold text-[#101B33]">
          Your saved messages
        </h2>
        <span className="text-xs text-[#667085]">
          {savedSermons.length}{" "}
          {savedSermons.length === 1 ? "sermon" : "sermons"}
        </span>
      </div>

      {savedSermons.map((sermon) => {
        const duration = formatDuration(sermon.durationSeconds);

        return (
          <article
            key={sermon.id}
            className="border-b border-[#E4E7EC] last:border-b-0"
          >
            <div className="flex min-w-0 items-center gap-3 py-4 sm:gap-5">
              <div className="min-w-0 flex-1">
                <h3 className="break-words text-sm font-semibold leading-6 text-[#101B33] sm:text-base">
                  <Link
                    href={`/sermons/${encodeURIComponent(sermon.id)}`}
                    className="rounded-sm underline-offset-4 hover:text-[#785B1F] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9A772E]"
                  >
                    {sermon.title}
                  </Link>
                </h3>

                <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#667085] sm:text-sm">
                  <span>
                    {sermon.preacher || "Preacher not provided"}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{sermon.category || "General sermon"}</span>
                  <span className="sm:hidden" aria-hidden="true">
                    ·
                  </span>
                  <span className="sm:hidden">{duration || "—"}</span>
                </div>
              </div>

              <span className="hidden shrink-0 text-xs tabular-nums text-[#667085] sm:inline sm:text-sm">
                {duration || "—"}
              </span>

              <SermonPlayButton sermon={sermon} />

              <ListenLaterButton
                sermonId={sermon.id}
                sermonTitle={sermon.title}
              />
            </div>
          </article>
        );
      })}
    </div>
  );
}
