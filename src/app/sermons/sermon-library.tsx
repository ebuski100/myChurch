"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { SermonWithMedia } from "@/lib/sermon-media-display";
import { formatDuration } from "@/lib/sermons";
import { SermonPlayButton } from "./sermon-play-button";
import { ListenLaterButton } from "./listen-later-button";
import { ListenLaterLink } from "./listen-later-link";

function getCategories(sermons: SermonWithMedia[]) {
  return [
    ...new Set(
      sermons
        .map((sermon) => sermon.category?.trim())
        .filter((category): category is string => Boolean(category)),
    ),
  ].sort((a, b) => a.localeCompare(b));
}

function matchesFilters(
  sermon: SermonWithMedia,
  query: string,
  category: string,
) {
  const normalizedQuery = query.trim().toLocaleLowerCase();

  const matchesQuery =
    !normalizedQuery ||
    [sermon.title, sermon.preacher ?? "", sermon.category ?? ""].some(
      (value) => value.toLocaleLowerCase().includes(normalizedQuery),
    );

  const matchesCategory =
    category === "all" || sermon.category === category;

  return matchesQuery && matchesCategory;
}

function SectionFilters({
  label,
  query,
  onQueryChange,
  category,
  onCategoryChange,
  categories,
}: {
  label: string;
  query: string;
  onQueryChange: (value: string) => void;
  category: string;
  onCategoryChange: (value: string) => void;
  categories: string[];
}) {
  return (
    <div className="mt-6 grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
      <label className="block">
        <span className="sr-only">Search {label}</span>
        <input
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={`Search ${label.toLowerCase()}...`}
          className="min-h-11 w-full rounded-xl border border-[#E4E7EC] bg-white px-4 text-sm text-[#101B33] outline-none transition placeholder:text-[#98A2B3] focus:border-[#9A772E] focus:ring-2 focus:ring-[#9A772E]/15"
        />
      </label>

      <label className="block">
        <span className="sr-only">Filter {label} by category</span>
        <select
          value={category}
          onChange={(event) => onCategoryChange(event.target.value)}
          className="min-h-11 w-full rounded-xl border border-[#E4E7EC] bg-white px-4 text-sm text-[#101B33] outline-none focus:border-[#9A772E] focus:ring-2 focus:ring-[#9A772E]/15"
        >
          <option value="all">All categories</option>
          {categories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

function VideoSermonCard({ sermon }: { sermon: SermonWithMedia }) {
  if (!sermon.video) return null;

  const duration = formatDuration(sermon.durationSeconds);

  return (
    <Link
      href={`/sermons/${encodeURIComponent(sermon.id)}`}
      aria-label={`Watch video sermon: ${sermon.title}`}
      className="group block overflow-hidden rounded-2xl border border-[#E4E7EC] bg-white transition duration-200 hover:-translate-y-1 hover:border-[#D5C18D] hover:shadow-lg hover:shadow-[#101B33]/[0.06] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#9A772E]"
    >
      <div className="relative aspect-video overflow-hidden bg-[#101B33]">
        <div
          role="img"
          aria-label={`Thumbnail for ${sermon.title}`}
          className="absolute inset-0 bg-cover bg-center transition duration-300 group-hover:scale-105"
          style={{
            backgroundImage: `url("${sermon.video.thumbnailUrl}")`,
          }}
        />

        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-[#101B33]/65 via-transparent to-[#101B33]/10"
        />

        <span className="absolute left-3 top-3 rounded-full border border-white/20 bg-[#101B33]/80 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white backdrop-blur-sm">
          Video sermon
        </span>

        <span className="absolute inset-0 grid place-items-center">
          <span className="grid size-14 place-items-center rounded-full border border-white/50 bg-white/95 text-[#101B33] shadow-lg transition duration-200 group-hover:scale-110 group-hover:bg-[#D9BD78]">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="ml-1 size-6"
            >
              <path d="M8 5.8c0-.78.85-1.26 1.52-.86l9.52 5.7a1.6 1.6 0 0 1 0 2.74l-9.52 5.7A1 1 0 0 1 8 18.22V5.8Z" />
            </svg>
          </span>
        </span>

        {duration && (
          <span className="absolute bottom-3 right-3 rounded-md bg-[#101B33]/90 px-2 py-1 text-xs font-medium tabular-nums text-white">
            {duration || "Duration unavailable"}
          </span>
        )}
      </div>

      <div className="p-4 sm:p-5">
        {sermon.category && (
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#9A772E]">
            {sermon.category}
          </p>
        )}

        <h3 className="mt-2 line-clamp-2 text-base font-semibold leading-6 text-[#101B33] transition group-hover:text-[#785B1F] sm:text-lg">
          {sermon.title}
        </h3>

        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#667085] sm:text-sm">
          <span>{sermon.preacher || "Preacher not provided"}</span>
          {sermon.date && (
            <>
              <span aria-hidden="true">·</span>
              <span>{sermon.date}</span>
            </>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-[#F0F1F3] pt-3 text-sm font-semibold text-[#785B1F]">
          <span>Watch message</span>
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            fill="none"
            className="size-4 transition group-hover:translate-x-1"
          >
            <path
              d="M4.5 10h11m0 0-4-4m4 4-4 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </Link>
  );
}

function AudioSermonRow({ sermon }: { sermon: SermonWithMedia }) {
  const duration = formatDuration(sermon.durationSeconds);

  return (
    <article className="border-b border-[#E4E7EC] last:border-b-0">
      <div className="flex min-w-0 items-center gap-3 py-4 sm:gap-5">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#F8F4E9] text-[#785B1F] sm:size-12">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            className="size-5 sm:size-6"
          >
            <path
              d="M9 18V5l12-2v13M9 18c0 1.1-1.34 2-3 2s-3-.9-3-2 1.34-2 3-2 3 .9 3 2Zm12-2c0 1.1-1.34 2-3 2s-3-.9-3-2 1.34-2 3-2 3 .9 3 2ZM9 9l12-2"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="break-words text-sm font-semibold leading-6 text-[#101B33] sm:text-base">
            {sermon.title}
          </h3>

          <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#667085] sm:text-sm">
            <span>{sermon.preacher || "Preacher not provided"}</span>
            {sermon.category && (
              <>
                <span aria-hidden="true">·</span>
                <span>{sermon.category}</span>
              </>
            )}
            {sermon.date && (
              <>
                <span aria-hidden="true">·</span>
                <span>{sermon.date}</span>
              </>
            )}
          </div>

          {duration && (
            <p className="mt-1 text-xs tabular-nums text-[#667085] sm:hidden">
              {duration}
            </p>
          )}
        </div>

        <span className="hidden shrink-0 text-sm tabular-nums text-[#667085] sm:inline">
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

export function SermonLibrary({
  sermons,
}: {
  sermons: SermonWithMedia[];
}) {
  const [videoQuery, setVideoQuery] = useState("");
  const [videoCategory, setVideoCategory] = useState("all");
  const [audioQuery, setAudioQuery] = useState("");
  const [audioCategory, setAudioCategory] = useState("all");

  const videoSermons = useMemo(
    () =>
      sermons.filter(
        (sermon) =>
          sermon.mediaType === "video" && sermon.video !== null,
      ),
    [sermons],
  );

  const audioSermons = useMemo(
    () => sermons.filter((sermon) => sermon.mediaType === "audio"),
    [sermons],
  );

  const videoCategories = useMemo(
    () => getCategories(videoSermons),
    [videoSermons],
  );

  const audioCategories = useMemo(
    () => getCategories(audioSermons),
    [audioSermons],
  );

  const filteredVideos = useMemo(
    () =>
      videoSermons.filter((sermon) =>
        matchesFilters(sermon, videoQuery, videoCategory),
      ),
    [videoSermons, videoQuery, videoCategory],
  );

  const filteredAudio = useMemo(
    () =>
      audioSermons.filter((sermon) =>
        matchesFilters(sermon, audioQuery, audioCategory),
      ),
    [audioSermons, audioQuery, audioCategory],
  );

  return (
    <div className="space-y-16">
      <section aria-labelledby="video-sermons-heading">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#9A772E]">
              Watch and grow
            </p>
            <h2
              id="video-sermons-heading"
              className="mt-2 text-2xl font-semibold tracking-tight text-[#101B33] sm:text-3xl"
            >
              Video sermons
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#667085] sm:text-base">
              Watch the message and follow along with the teaching.
            </p>
          </div>

          <span className="rounded-full bg-[#F8F4E9] px-3 py-1.5 text-xs font-semibold text-[#785B1F]">
            {filteredVideos.length}{" "}
            {filteredVideos.length === 1 ? "message" : "messages"}
          </span>
        </div>

        <SectionFilters
          label="video sermons"
          query={videoQuery}
          onQueryChange={setVideoQuery}
          category={videoCategory}
          onCategoryChange={setVideoCategory}
          categories={videoCategories}
        />

        {filteredVideos.length > 0 ? (
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredVideos.map((sermon) => (
              <VideoSermonCard key={sermon.id} sermon={sermon} />
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-dashed border-[#D0D5DD] bg-[#FCFCFD] px-5 py-10 text-center">
            <p className="font-semibold text-[#101B33]">
              {videoSermons.length === 0
                ? "Video sermons are coming soon"
                : "No matching video sermons"}
            </p>
            <p className="mt-2 text-sm leading-6 text-[#667085]">
              {videoSermons.length === 0
                ? "Published video messages will appear here."
                : "Try another search term or choose a different category."}
            </p>
          </div>
        )}
      </section>

      <section aria-labelledby="audio-sermons-heading">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#9A772E]">
              Listen anywhere
            </p>
            <h2
              id="audio-sermons-heading"
              className="mt-2 text-2xl font-semibold tracking-tight text-[#101B33] sm:text-3xl"
            >
              Audio sermons
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#667085] sm:text-base">
              Listen directly from the library and save messages for
              later.
            </p>
          </div>

          <ListenLaterLink />
        </div>

        <SectionFilters
          label="audio sermons"
          query={audioQuery}
          onQueryChange={setAudioQuery}
          category={audioCategory}
          onCategoryChange={setAudioCategory}
          categories={audioCategories}
        />

        <div className="mt-5 overflow-hidden rounded-2xl border border-[#E4E7EC] bg-white px-4 sm:px-6">
          {filteredAudio.length > 0 ? (
            filteredAudio.map((sermon) => (
              <AudioSermonRow key={sermon.id} sermon={sermon} />
            ))
          ) : (
            <div className="py-10 text-center">
              <p className="font-semibold text-[#101B33]">
                {audioSermons.length === 0
                  ? "Audio sermons are coming soon"
                  : "No matching audio sermons"}
              </p>
              <p className="mt-2 text-sm leading-6 text-[#667085]">
                {audioSermons.length === 0
                  ? "Published audio recordings will appear here."
                  : "Try another search term or choose a different category."}
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
