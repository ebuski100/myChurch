"use client";

import { useState } from "react";
import type { Sermon } from "@/lib/sermons";
import { formatDuration } from "@/lib/sermons";

function AudioPlayer({ sermon }: { sermon: Sermon }) {
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  if (!sermon.audioUrl) {
    return (
      <div className="mt-5 rounded-xl border border-[#E4E7EC] bg-[#F8F9FB] px-4 py-3">
        <p className="text-sm font-medium text-[#344054]">Audio not available yet</p>
        <p className="mt-1 text-xs leading-5 text-[#667085]">
          This sample listing has no recording attached.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-5">
      <audio
        className="w-full accent-[#9A772E]"
        controls
        preload="metadata"
        aria-label={`Play sermon: ${sermon.title}`}
        onLoadStart={() => setStatus("loading")}
        onCanPlay={() => setStatus("ready")}
        onError={() => setStatus("error")}
      >
        <source src={sermon.audioUrl} />
        Your browser does not support audio playback.
      </audio>
      <p aria-live="polite" className="mt-2 min-h-5 text-xs text-[#667085]">
        {status === "loading" && "Loading audio…"}
        {status === "ready" && "Audio ready to play"}
        {status === "error" && "This audio could not be played. Please try again later."}
      </p>
    </div>
  );
}

function SermonCard({ sermon }: { sermon: Sermon }) {
  const duration = formatDuration(sermon.durationSeconds);
  const details = [sermon.preacher, sermon.date, duration]
    .filter((value): value is string => Boolean(value));

  return (
    <article className="rounded-2xl border border-[#E4E7EC] bg-white p-5 shadow-[0_8px_30px_rgba(16,27,51,0.04)] sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="rounded-full bg-[#F8F4E9] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#785B1F]">
          {sermon.isSample ? "Sample listing" : sermon.category ?? "Sermon"}
        </span>
        {sermon.isSample && <span className="text-xs text-[#667085]">Placeholder content</span>}
      </div>
      <h2 className="mt-5 text-xl font-semibold tracking-tight text-[#101B33] sm:text-2xl">
        {sermon.title}
      </h2>
      <p className="mt-2 text-sm text-[#667085]">
        {details.length > 0 ? details.join(" · ") : "Preacher, date, and duration not provided"}
      </p>
      <AudioPlayer sermon={sermon} />
      {sermon.audioUrl && sermon.downloadFilename && (
        <a
          href={sermon.audioUrl}
          download={sermon.downloadFilename}
          className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full border border-[#D0D5DD] px-4 text-sm font-semibold text-[#101B33] transition-colors hover:border-[#D9B66D] hover:bg-[#FBF8F0] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#9A772E]"
        >
          <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="size-4">
            <path d="M10 2.75v9.5m0 0 3.5-3.5M10 12.25l-3.5-3.5M3.5 13.5v2A1.75 1.75 0 0 0 5.25 17.25h9.5A1.75 1.75 0 0 0 16.5 15.5v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Download audio
        </a>
      )}
    </article>
  );
}

export function SermonLibrary({ sermons }: { sermons: Sermon[] }) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filteredSermons = sermons.filter((sermon) =>
    [sermon.title, sermon.preacher ?? ""]
      .some((value) => value.toLocaleLowerCase().includes(normalizedQuery)),
  );

  return (
    <div>
      <div className="mx-auto max-w-2xl">
        <label htmlFor="sermon-search" className="mb-2 block text-sm font-semibold text-[#101B33]">
          Search sermons
        </label>
        <div className="relative">
          <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[#667085]">
            <circle cx="8.75" cy="8.75" r="5.75" stroke="currentColor" strokeWidth="1.5" />
            <path d="m13 13 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            id="sermon-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by title or preacher"
            className="min-h-12 w-full rounded-xl border border-[#D0D5DD] bg-white pl-12 pr-4 text-sm text-[#101B33] outline-none placeholder:text-[#98A2B3] focus:border-[#9A772E] focus:ring-2 focus:ring-[#D9B66D]/35"
          />
        </div>
      </div>

      <div aria-live="polite" className="mt-8">
        {filteredSermons.length > 0 ? (
          <>
            <p className="mb-4 text-sm text-[#667085]">
              {normalizedQuery
                ? `${filteredSermons.length} result${filteredSermons.length === 1 ? "" : "s"}`
                : `${filteredSermons.length} library listing${filteredSermons.length === 1 ? "" : "s"}`}
            </p>
            <div className="grid gap-5 md:grid-cols-2">
              {filteredSermons.map((sermon) => <SermonCard key={sermon.id} sermon={sermon} />)}
            </div>
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-[#C9CDD5] bg-white px-6 py-12 text-center">
            <h2 className="text-lg font-semibold text-[#101B33]">No sermons match that search</h2>
            <p className="mt-2 text-sm leading-6 text-[#667085]">Try another title or preacher name.</p>
          </div>
        )}
      </div>
    </div>
  );
}
