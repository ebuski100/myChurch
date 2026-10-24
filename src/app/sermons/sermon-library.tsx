"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Sermon } from "@/lib/sermons";
import { formatDuration } from "@/lib/sermons";
import { SermonPlayButton } from "./sermon-play-button";

import { ListenLaterButton } from "./listen-later-button";
import { ListenLaterLink } from "./listen-later-link";

function SermonRow({ sermon }: { sermon: Sermon }) {
  const duration = formatDuration(sermon.durationSeconds);

  return (
    <article className="border-b border-[#E4E7EC] last:border-b-0">
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
            <span>{sermon.preacher || "Preacher not provided"}</span>
            <span aria-hidden="true">·</span>
            <span>{sermon.category || "General sermon"}</span>
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
        {sermon.downloadAllowed && (
          <a
            href={`/api/sermons/${encodeURIComponent(sermon.id)}/audio?download=1`}
            aria-label={`Download ${sermon.title}`}
            title="Download audio"
            className="grid size-9 shrink-0 place-items-center rounded-full text-[#667085] transition hover:bg-[#F8F4E9] hover:text-[#785B1F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9A772E]"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              fill="none"
              className="size-5"
            >
              <path
                d="M10 2.75v9.5m0 0 3.5-3.5M10 12.25l-3.5-3.5M3.5 13.5v2A1.75 1.75 0 0 0 5.25 17.25h9.5A1.75 1.75 0 0 0 16.5 15.5v-2"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
        )}
      </div>
    </article>
  );
}

export function SermonLibrary({ sermons }: { sermons: Sermon[] }) {
  const [query, setQuery] = useState("");
  const [selectedSeries, setSelectedSeries] = useState("all");

  const seriesOptions = useMemo(
    () =>
      [
        ...new Set(
          sermons
            .map((sermon) => sermon.category?.trim())
            .filter((category): category is string =>
              Boolean(category),
            ),
        ),
      ].sort((a, b) => a.localeCompare(b)),
    [sermons],
  );

  const normalizedQuery = query.trim().toLocaleLowerCase();

  const filteredSermons = sermons.filter((sermon) => {
    const matchesSearch = [
      sermon.title,
      sermon.preacher ?? "",
      sermon.category ?? "",
    ].some((value) =>
      value.toLocaleLowerCase().includes(normalizedQuery),
    );

    const matchesSeries =
      selectedSeries === "all" ||
      sermon.category?.trim() === selectedSeries;

    return matchesSearch && matchesSeries;
  });

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_220px]">
        <div>
          <label
            htmlFor="sermon-search"
            className="mb-2 block text-sm font-semibold text-[#101B33]"
          >
            Search sermons
          </label>

          <div className="relative">
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              fill="none"
              className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[#667085]"
            >
              <circle
                cx="8.75"
                cy="8.75"
                r="5.75"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="m13 13 4 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>

            <input
              id="sermon-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Title, preacher, or series"
              className="min-h-12 w-full rounded-xl border border-[#D0D5DD] bg-white pl-12 pr-4 text-sm text-[#101B33] outline-none placeholder:text-[#98A2B3] focus:border-[#9A772E] focus:ring-2 focus:ring-[#D9B66D]/35"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="sermon-series"
            className="mb-2 block text-sm font-semibold text-[#101B33]"
          >
            Filter by series
          </label>

          <select
            id="sermon-series"
            value={selectedSeries}
            onChange={(event) =>
              setSelectedSeries(event.target.value)
            }
            className="min-h-12 w-full rounded-xl border border-[#D0D5DD] bg-white px-3 text-sm text-[#101B33] outline-none focus:border-[#9A772E] focus:ring-2 focus:ring-[#D9B66D]/35"
          >
            <option value="all">All series</option>
            {seriesOptions.map((series) => (
              <option key={series} value={series}>
                {series}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div aria-live="polite" className="mt-8">
        {sermons.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#C9CDD5] bg-white px-6 py-12 text-center">
            <h2 className="text-lg font-semibold text-[#101B33]">
              No published sermons are available yet
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#667085]">
              Please check back when the ministry has published its
              first sermon.
            </p>
          </div>
        ) : filteredSermons.length > 0 ? (
          <div className="overflow-hidden rounded-2xl border border-[#E4E7EC] bg-white px-4 shadow-[0_8px_30px_rgba(16,27,51,0.03)] sm:px-6">
            <div className="flex items-center justify-between gap-3 border-b border-[#E4E7EC] py-4">
              <div className="flex items-center">
                <h2 className="text-sm font-semibold text-[#101B33] mr-2">
                  {selectedSeries === "all"
                    ? "All sermons"
                    : selectedSeries}
                </h2>

                <span className="text-xs text-[#667085]">
                  ({filteredSermons.length})
                </span>
              </div>

              <div className=" flex justify-end">
                <ListenLaterLink />
              </div>
            </div>

            {filteredSermons.map((sermon) => (
              <SermonRow key={sermon.id} sermon={sermon} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[#C9CDD5] bg-white px-6 py-12 text-center">
            <h2 className="text-lg font-semibold text-[#101B33]">
              No sermons match your search
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#667085]">
              Try another title, preacher, or series, or choose All
              series.
            </p>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setSelectedSeries("all");
              }}
              className="mt-4 text-sm font-semibold text-[#785B1F] underline underline-offset-4"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
