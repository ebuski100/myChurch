// "use client";

// import { useState } from "react";
// import type { Sermon } from "@/lib/sermons";
// import { formatDuration } from "@/lib/sermons";

// function AudioPlayer({ sermon }: { sermon: Sermon }) {
//   const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

//   return (
//     <div className="mt-5">
//       <audio
//         className="w-full accent-[#9A772E]"
//         controls
//         controlsList={sermon.downloadAllowed ? undefined : "nodownload"}
//         preload="none"
//         aria-label={`Play sermon: ${sermon.title}`}
//         onLoadStart={() => setStatus("loading")}
//         onCanPlay={() => setStatus("ready")}
//         onError={() => setStatus("error")}
//       >
//         <source src={`/api/sermons/${encodeURIComponent(sermon.id)}/audio`} />
//         Your browser does not support audio playback.
//       </audio>
//       <p aria-live="polite" className="mt-2 min-h-5 text-xs text-[#667085]">
//         {status === "loading" && "Audio loads when you press play"}
//         {status === "ready" && "Audio ready to play"}
//         {status === "error" && "This audio could not be played. Please try again later."}
//       </p>
//     </div>
//   );
// }

// function SermonCard({ sermon }: { sermon: Sermon }) {
//   const duration = formatDuration(sermon.durationSeconds);
//   const details = [sermon.preacher, sermon.date, duration]
//     .filter((value): value is string => Boolean(value));

//   return (
//     <article className="rounded-2xl border border-[#E4E7EC] bg-white p-5 shadow-[0_8px_30px_rgba(16,27,51,0.04)] sm:p-7">
//       <div className="flex flex-wrap items-center justify-between gap-3">
//         <span className="rounded-full bg-[#F8F4E9] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#785B1F]">
//           {sermon.category ?? "Sermon"}
//         </span>
//       </div>
//       <h2 className="mt-5 text-xl font-semibold tracking-tight text-[#101B33] sm:text-2xl">
//         {sermon.title}
//       </h2>
//       <p className="mt-2 text-sm text-[#667085]">
//         {details.length > 0 ? details.join(" · ") : "Preacher, date, and duration not provided"}
//       </p>
//       <AudioPlayer sermon={sermon} />
//       {sermon.downloadAllowed && (
//         <a
//           href={`/api/sermons/${encodeURIComponent(sermon.id)}/audio?download=1`}
//           className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full border border-[#D0D5DD] px-4 text-sm font-semibold text-[#101B33] transition-colors hover:border-[#D9B66D] hover:bg-[#FBF8F0] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#9A772E]"
//         >
//           <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="size-4">
//             <path d="M10 2.75v9.5m0 0 3.5-3.5M10 12.25l-3.5-3.5M3.5 13.5v2A1.75 1.75 0 0 0 5.25 17.25h9.5A1.75 1.75 0 0 0 16.5 15.5v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
//           </svg>
//           Download audio
//         </a>
//       )}
//     </article>
//   );
// }

// export function SermonLibrary({ sermons }: { sermons: Sermon[] }) {
//   const [query, setQuery] = useState("");
//   const normalizedQuery = query.trim().toLocaleLowerCase();
//   const filteredSermons = sermons.filter((sermon) =>
//     [sermon.title, sermon.preacher ?? ""]
//       .some((value) => value.toLocaleLowerCase().includes(normalizedQuery)),
//   );

//   return (
//     <div>
//       <div className="mx-auto max-w-2xl">
//         <label htmlFor="sermon-search" className="mb-2 block text-sm font-semibold text-[#101B33]">
//           Search sermons
//         </label>
//         <div className="relative">
//           <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[#667085]">
//             <circle cx="8.75" cy="8.75" r="5.75" stroke="currentColor" strokeWidth="1.5" />
//             <path d="m13 13 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
//           </svg>
//           <input
//             id="sermon-search"
//             type="search"
//             value={query}
//             onChange={(event) => setQuery(event.target.value)}
//             placeholder="Search by title or preacher"
//             className="min-h-12 w-full rounded-xl border border-[#D0D5DD] bg-white pl-12 pr-4 text-sm text-[#101B33] outline-none placeholder:text-[#98A2B3] focus:border-[#9A772E] focus:ring-2 focus:ring-[#D9B66D]/35"
//           />
//         </div>
//       </div>

//       <div aria-live="polite" className="mt-8">
//         {sermons.length === 0 ? (
//           <div className="rounded-2xl border border-dashed border-[#C9CDD5] bg-white px-6 py-12 text-center">
//             <h2 className="text-lg font-semibold text-[#101B33]">No published sermons are available yet</h2>
//             <p className="mt-2 text-sm leading-6 text-[#667085]">
//               Please check back when the ministry has published its first sermon.
//             </p>
//           </div>
//         ) : filteredSermons.length > 0 ? (
//           <>
//             <p className="mb-4 text-sm text-[#667085]">
//               {normalizedQuery
//                 ? `${filteredSermons.length} result${filteredSermons.length === 1 ? "" : "s"}`
//                 : `${filteredSermons.length} library listing${filteredSermons.length === 1 ? "" : "s"}`}
//             </p>
//             <div className="grid gap-5 md:grid-cols-2">
//               {filteredSermons.map((sermon) => <SermonCard key={sermon.id} sermon={sermon} />)}
//             </div>
//           </>
//         ) : (
//           <div className="rounded-2xl border border-dashed border-[#C9CDD5] bg-white px-6 py-12 text-center">
//             <h2 className="text-lg font-semibold text-[#101B33]">No sermons match that search</h2>
//             <p className="mt-2 text-sm leading-6 text-[#667085]">Try another title or preacher name.</p>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

"use client";

import { useMemo, useState } from "react";
import type { Sermon } from "@/lib/sermons";
import { formatDuration } from "@/lib/sermons";

function SermonRow({ sermon }: { sermon: Sermon }) {
  const duration = formatDuration(sermon.durationSeconds);

  return (
    <article className="border-b border-[#E4E7EC] last:border-b-0">
      <div className="flex min-w-0 items-center gap-3 py-4 sm:gap-5">
        <div className="min-w-0 flex-1">
          <h3 className="break-words text-sm font-semibold leading-6 text-[#101B33] sm:text-base">
            {sermon.title}
          </h3>

          <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#667085] sm:text-sm">
            <span>{sermon.preacher || "Preacher not provided"}</span>
            <span aria-hidden="true">·</span>
            <span>{sermon.category || "General sermon"}</span>
          </div>
        </div>

        <span className="shrink-0 text-xs tabular-nums text-[#667085] sm:text-sm">
          {duration || "—"}
        </span>

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
              <h2 className="text-sm font-semibold text-[#101B33]">
                {selectedSeries === "all"
                  ? "All sermons"
                  : selectedSeries}
              </h2>
              <span className="text-xs text-[#667085]">
                {filteredSermons.length}{" "}
                {filteredSermons.length === 1 ? "sermon" : "sermons"}
              </span>
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
