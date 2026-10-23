"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { formatDuration } from "@/lib/sermons";
import { formatScheduledDate } from "@/lib/sermon-lifecycle";
import type {
  AdminSermon,
  AdminSermonStatus,
} from "@/lib/admin-sermon-data";
import { AdminNotice } from "../admin-notice";
import {
  bulkSermonLifecycleAction,
  type BulkSermonActionState,
} from "./bulk-actions";

type StatusFilter = "all" | AdminSermonStatus;

const statusOptions: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "published", label: "Published" },
  { value: "scheduled", label: "Scheduled" },
  { value: "draft", label: "Draft" },
  { value: "archived", label: "Archived" },
];

const statusStyles: Record<AdminSermonStatus, string> = {
  published: "border-[#CFE5D5] bg-[#F0F8F2] text-[#3C704B]",
  scheduled: "border-[#D9E2F2] bg-[#F3F6FC] text-[#435A82]",
  draft: "border-[#EAECF0] bg-[#F8F9FB] text-[#667085]",
  archived: "border-[#E8D8D8] bg-[#FBF5F5] text-[#8A5656]",
};

const PAGE_SIZE = 20;
const initialBulkState: BulkSermonActionState = {};

function formatSermonDate(date: string | null): string {
  if (!date) return "Date not set";
  const parsed = new Date(`${date}T00:00:00Z`);
  if (!Number.isFinite(parsed.getTime())) return "Date not set";
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(parsed);
}

function SermonCard({
  sermon,
  selected,
  onSelect,
}: {
  sermon: AdminSermon;
  selected: boolean;
  onSelect: (id: string, selected: boolean) => void;
}) {
  const duration = formatDuration(sermon.durationSeconds);

  return (
    <article className="rounded-2xl border border-[#E4E7EC] bg-white p-5 shadow-[0_5px_22px_rgba(16,27,51,0.035)] sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="inline-flex items-center gap-2 text-xs font-medium text-[#475467]">
          <input
            type="checkbox"
            checked={selected}
            onChange={(event) =>
              onSelect(sermon.id, event.currentTarget.checked)
            }
            aria-label={`Select ${sermon.title}`}
            className="size-4 rounded border-[#D0D5DD] accent-[#9A772E] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9A772E]"
          />
          Select
        </label>
        <span
          className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold capitalize tracking-wide ${statusStyles[sermon.status]}`}
        >
          {sermon.status}
        </span>
        <span
          className={`inline-flex items-center gap-2 text-xs font-medium ${sermon.hasAudioAsset ? "text-[#3C704B]" : "text-[#8A93A3]"}`}
        >
          <span
            aria-hidden="true"
            className={`size-1.5 rounded-full ${sermon.hasAudioAsset ? "bg-[#63A67A]" : "bg-[#C2C8D0]"}`}
          />
          {sermon.hasAudioAsset ? "Audio linked" : "No audio link"}
        </span>
      </div>

      <h2 className="mt-4 text-lg font-semibold leading-snug tracking-tight text-[#101B33] sm:text-xl">
        {sermon.title}
      </h2>
      <p className="mt-1 text-sm text-[#667085]">
        {sermon.preacher || "Speaker not provided"}
      </p>

      <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 border-t border-[#EAECF0] pt-4 text-sm">
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#98A2B3]">
            Sermon date
          </dt>
          <dd className="mt-1 font-medium text-[#475467]">
            {formatSermonDate(sermon.sermonDate)}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#98A2B3]">
            Duration
          </dt>
          <dd className="mt-1 font-medium text-[#475467]">
            {duration ?? "Not provided"}
          </dd>
        </div>
        {sermon.status === "scheduled" && (
          <div className="col-span-2">
            <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#98A2B3]">
              Publishes
            </dt>
            <dd className="mt-1 font-medium text-[#435A82]">
              {formatScheduledDate(sermon.publishedAt) ??
                "Schedule time unavailable"}
            </dd>
          </div>
        )}
        <div className="col-span-2">
          <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#98A2B3]">
            Series
          </dt>
          <dd className="mt-1 font-medium text-[#475467]">
            {sermon.series || "No series assigned"}
          </dd>
        </div>
      </dl>
      <div className="mt-5 border-t border-[#EAECF0] pt-4">
        <Link
          href={`/admin/sermons/${encodeURIComponent(sermon.id)}/edit`}
          className="inline-flex min-h-10 items-center justify-center rounded-full border border-[#D0D5DD] px-4 text-sm font-semibold text-[#101B33] hover:border-[#D9B66D] hover:bg-[#FBF8F0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9A772E]"
        >
          Edit details
        </Link>
      </div>
    </article>
  );
}

export function SermonList({ sermons }: { sermons: AdminSermon[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkState, bulkAction, bulkPending] = useActionState(
    bulkSermonLifecycleAction,
    initialBulkState,
  );
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filteredSermons = sermons.filter((sermon) => {
    const matchesStatus =
      status === "all" || sermon.status === status;
    const matchesQuery = [
      sermon.title,
      sermon.preacher ?? "",
      sermon.series ?? "",
      sermon.sermonDate ?? "",
      formatDuration(sermon.durationSeconds) ?? "",
    ].some((value) =>
      value.toLocaleLowerCase().includes(normalizedQuery),
    );
    return matchesStatus && matchesQuery;
  });
  const pageCount = Math.max(
    1,
    Math.ceil(filteredSermons.length / PAGE_SIZE),
  );
  const currentPage = Math.min(page, pageCount);
  const pageSermons = filteredSermons.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );
  const allPageSelected =
    pageSermons.length > 0 &&
    pageSermons.every((sermon) => selected.has(sermon.id));
  const selectedSermons = sermons.filter((sermon) =>
    selected.has(sermon.id),
  );
  const selectedTitles = new Map(
    sermons.map((sermon) => [sermon.id, sermon.title]),
  );

  function updateSelection(id: string, checked: boolean) {
    setSelected((current) => {
      const next = new Set(current);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function resetFilter(nextQuery: string, nextStatus: StatusFilter) {
    setQuery(nextQuery);
    setStatus(nextStatus);
    setPage(1);
    setSelected(new Set());
  }

  return (
    <>
      <div className="mb-5 flex justify-end">
        <Link
          href="/admin/sermons/new"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#101B33] px-5 text-sm font-semibold text-white hover:bg-[#263653] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9A772E]"
        >
          Create sermon <span aria-hidden="true">+</span>
        </Link>
      </div>
      <div className="rounded-2xl border border-[#E4E7EC] bg-white p-4 shadow-[0_4px_18px_rgba(16,27,51,0.03)] sm:p-5">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
          <div>
            <label
              htmlFor="admin-sermon-search"
              className="mb-2 block text-xs font-semibold text-[#475467]"
            >
              Search sermons
            </label>
            <div className="relative">
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                fill="none"
                className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#8A93A3]"
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
                id="admin-sermon-search"
                type="search"
                value={query}
                onChange={(event) =>
                  resetFilter(event.target.value, status)
                }
                placeholder="Title, speaker, or series"
                className="min-h-11 w-full rounded-xl border border-[#D0D5DD] bg-white pl-10 pr-3 text-sm text-[#101B33] outline-none placeholder:text-[#98A2B3] focus:border-[#9A772E] focus:ring-2 focus:ring-[#D9B66D]/30"
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="admin-sermon-status"
              className="mb-2 block text-xs font-semibold text-[#475467]"
            >
              Publication status
            </label>
            <select
              id="admin-sermon-status"
              value={status}
              onChange={(event) =>
                resetFilter(query, event.target.value as StatusFilter)
              }
              className="min-h-11 w-full rounded-xl border border-[#D0D5DD] bg-white px-3 text-sm text-[#101B33] outline-none focus:border-[#9A772E] focus:ring-2 focus:ring-[#D9B66D]/30"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {selectedSermons.length > 0 && (
        <section
          aria-labelledby="bulk-actions-heading"
          className="mt-5 rounded-2xl border border-[#E4E7EC] bg-white p-4 sm:p-5"
        >
          <h2
            id="bulk-actions-heading"
            className="text-sm font-semibold text-[#101B33]"
          >
            Bulk actions
          </h2>
          <p className="mt-1 text-xs text-[#667085]">
            {selectedSermons.length} sermon
            {selectedSermons.length === 1 ? "" : "s"} selected.
          </p>
          <form
            action={bulkAction}
            className="mt-4 flex flex-col gap-3"
          >
            {selectedSermons.map((sermon) => (
              <input
                key={sermon.id}
                type="hidden"
                name="resourceId"
                value={sermon.id}
              />
            ))}
            <label className="flex items-start gap-2 text-sm leading-5 text-[#475467]">
              <input
                type="checkbox"
                name="confirmation"
                value="yes"
                required
                disabled={bulkPending}
                className="mt-1 size-4 accent-[#9A772E]"
              />
              <span>
                Confirm each selected sermon may change status
                according to the chosen action.
              </span>
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                name="command"
                value="archive"
                disabled={
                  bulkPending ||
                  !selectedSermons.some(
                    (sermon) => sermon.status !== "archived",
                  )
                }
                className="min-h-10 rounded-full bg-[#101B33] px-4 text-sm font-semibold text-white disabled:opacity-50"
              >
                {bulkPending ? "Working…" : "Archive selected"}
              </button>
              <button
                type="submit"
                name="command"
                value="restore"
                disabled={
                  bulkPending ||
                  !selectedSermons.some(
                    (sermon) => sermon.status === "archived",
                  )
                }
                className="min-h-10 rounded-full border border-[#D0D5DD] px-4 text-sm font-semibold text-[#344054] disabled:opacity-50"
              >
                Restore selected as drafts
              </button>
              <button
                type="submit"
                name="command"
                value="cancel_schedule"
                disabled={
                  bulkPending ||
                  !selectedSermons.some(
                    (sermon) => sermon.status === "scheduled",
                  )
                }
                className="min-h-10 rounded-full border border-[#D0D5DD] px-4 text-sm font-semibold text-[#344054] disabled:opacity-50"
              >
                Cancel selected schedules
              </button>
            </div>
            {(bulkState.message || bulkState.items) && (
              <AdminNotice
                message={bulkState.message ?? "Bulk action results"}
                kind={
                  bulkState.items
                    ? bulkState.items.some((item) => !item.success)
                      ? "error"
                      : "success"
                    : "error"
                }
                resetKey={bulkState}
                className="text-sm font-medium"
              >
                {bulkState.items && (
                  <ul
                    className="mt-2 space-y-1"
                    aria-label="Bulk action results"
                  >
                    {bulkState.items.map((item) => (
                      <li
                        key={item.resourceId}
                        className={
                          item.success
                            ? "text-[#3C704B]"
                            : "text-[#8A4242]"
                        }
                      >
                        {selectedTitles.get(item.resourceId) ??
                          "Sermon"}
                        : {item.message}
                      </li>
                    ))}
                  </ul>
                )}
              </AdminNotice>
            )}
          </form>
        </section>
      )}

      <div aria-live="polite" className="mt-5">
        {sermons.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#C9CDD5] bg-white px-6 py-12 text-center">
            <h2 className="text-lg font-semibold text-[#101B33]">
              No sermon records found
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#667085]">
              Sermons appear here when an audio resource has its
              sermon details record.
            </p>
            <Link
              href="/sermons"
              className="mt-5 inline-flex min-h-10 items-center justify-center rounded-full border border-[#D0D5DD] px-4 text-sm font-semibold text-[#101B33] hover:border-[#D9B66D] hover:bg-[#FBF8F0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9A772E]"
            >
              Preview public sermon library
            </Link>
          </div>
        ) : filteredSermons.length > 0 ? (
          <>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3 text-xs text-[#667085]">
              <p>
                Showing {(currentPage - 1) * PAGE_SIZE + 1}–
                {Math.min(
                  currentPage * PAGE_SIZE,
                  filteredSermons.length,
                )}{" "}
                of {filteredSermons.length} matching sermons (
                {sermons.length} total)
              </p>
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={allPageSelected}
                  onChange={(event) => {
                    const checked = event.currentTarget.checked;
                    setSelected((current) => {
                      const next = new Set(current);
                      for (const sermon of pageSermons) {
                        if (checked) next.add(sermon.id);
                        else next.delete(sermon.id);
                      }
                      return next;
                    });
                  }}
                  aria-label="Select all sermons on this page"
                  className="size-4 accent-[#9A772E]"
                />
                Select all on this page
              </label>
            </div>
            <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {pageSermons.map((sermon) => (
                <SermonCard
                  key={sermon.id}
                  sermon={sermon}
                  selected={selected.has(sermon.id)}
                  onSelect={updateSelection}
                />
              ))}
            </div>
            {pageCount > 1 && (
              <nav
                aria-label="Sermon list pages"
                className="mt-5 flex items-center justify-center gap-3"
              >
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setPage(currentPage - 1)}
                  className="min-h-10 rounded-full border border-[#D0D5DD] px-4 text-sm disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-sm text-[#475467]">
                  Page {currentPage} of {pageCount}
                </span>
                <button
                  type="button"
                  disabled={currentPage >= pageCount}
                  onClick={() => setPage(currentPage + 1)}
                  className="min-h-10 rounded-full border border-[#D0D5DD] px-4 text-sm disabled:opacity-50"
                >
                  Next
                </button>
              </nav>
            )}
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-[#C9CDD5] bg-white px-6 py-10 text-center">
            <h2 className="text-base font-semibold text-[#101B33]">
              No sermons match these filters
            </h2>
            <p className="mt-2 text-sm text-[#667085]">
              Adjust the search or choose a different publication
              status.
            </p>
            <button
              type="button"
              onClick={() => resetFilter("", "all")}
              className="mt-4 inline-flex min-h-10 items-center justify-center rounded-full bg-[#101B33] px-4 text-sm font-semibold text-white hover:bg-[#263653] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9A772E]"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </>
  );
}
