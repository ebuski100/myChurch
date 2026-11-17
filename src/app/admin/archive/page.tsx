import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { getAdminAccess } from "@/lib/admin-auth";
import {
  contentArchiveTypes,
  getAdminContentArchive,
  type ContentArchiveType,
} from "@/lib/content-archive-data";
import { AdminWorkspace } from "../admin-shell";
import { ContentArchiveActions, RetryContentCleanupButton } from "./archive-controls";
import { ContentArchiveNotice } from "./archive-notice";

export const metadata: Metadata = {
  title: "Content Archive | Admin | VictoryCity Revival Ministry",
  robots: { index: false, follow: false },
};

export const instant = false;

const typeLabels: Record<ContentArchiveType, string> = {
  resource: "Sermons, books, documents & resources",
  event: "Events",
  gallery_album: "Gallery albums",
  gallery_photo: "Gallery photos",
  ministry: "Ministries",
  department: "Departments",
  department_member: "Department members",
};

const actionLabels = {
  archived: "Archived",
  restored: "Restored",
  permanently_deleted: "Permanently deleted",
} as const;

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Lagos",
  }).format(new Date(value));
}

export default async function AdminContentArchivePage({
  searchParams,
}: {
  searchParams: Promise<{
    contentArchive?: string;
    historyPage?: string;
  }>;
}) {
  await connection();
  const access = await getAdminAccess();
  if (access.status === "unauthenticated") redirect("/admin/login");
  if (access.status === "forbidden") {
    redirect("/admin/login?error=not_admin");
  }

  const params = await searchParams;
  const requestedHistoryPage =
    params.historyPage && /^\d{1,6}$/.test(params.historyPage)
      ? Number(params.historyPage)
      : 0;
  const [result] = await Promise.all([
    getAdminContentArchive(access.role, requestedHistoryPage),
  ]);

  return (
    <AdminWorkspace activeSection="archive">
      <main className="mx-auto w-full max-w-[1500px] px-5 py-7 sm:px-8 sm:py-9 xl:px-10">
        <nav className="mb-7 flex items-center gap-2 text-xs text-[#98A2B3]" aria-label="Breadcrumb">
          <Link href="/admin" className="hover:text-[#101B33]">
            Admin
          </Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page" className="font-medium text-[#475467]">
            Content archive
          </span>
        </nav>

        <header className="mb-7">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9A772E]">
            Content stewardship
          </p>
          <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight text-[#101B33]">
            Content archive
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#667085]">
            Archived content is hidden from public pages while its original
            publication status and associated records are preserved. Restore
            any item at any time; only a primary administrator can permanently
            delete archived content.
          </p>
        </header>

        <ContentArchiveNotice result={params.contentArchive} />

        {result.kind === "error" ? (
          <section
            role="alert"
            className="rounded-2xl border border-[#F0D4D4] bg-white px-6 py-10 text-center"
          >
            <h2 className="text-lg font-semibold text-[#101B33]">
              Archive data could not be loaded
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#667085]">
              The archive is temporarily unavailable. Please try again after
              confirming the content archive migration has been applied.
            </p>
            <Link
              href="/admin/archive"
              className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-[#101B33] px-4 text-sm font-semibold text-white hover:bg-[#263653] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9A772E]"
            >
              Try again
            </Link>
          </section>
        ) : (
          <div className="space-y-10">
            <section aria-labelledby="archived-content-heading">
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2
                    id="archived-content-heading"
                    className="text-xl font-semibold tracking-tight text-[#101B33]"
                  >
                    Archived content
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-[#667085]">
                    {result.archivedItems.length
                      ? `${result.archivedItems.length} item${result.archivedItems.length === 1 ? "" : "s"} hidden from public pages.`
                      : "Nothing has been archived yet."}
                  </p>
                </div>
              </div>

              {result.archivedItems.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#C9CDD5] bg-white px-6 py-10 text-center">
                  <h3 className="font-semibold text-[#101B33]">
                    Your archive is clear
                  </h3>
                  <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#667085]">
                    Content archived from the sections below will appear here
                    with its previous publication state preserved.
                  </p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {result.archivedItems.map((item) => (
                    <article
                      key={`${item.contentType}:${item.contentId}`}
                      className="flex flex-col gap-4 rounded-2xl border border-[#E4E7EC] bg-white p-4 shadow-[0_4px_18px_rgba(16,27,51,0.03)] sm:flex-row sm:items-center sm:justify-between sm:p-5"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="break-words font-semibold text-[#101B33]">
                            {item.title}
                          </h3>
                          <span className="rounded-full border border-[#E8D8D8] bg-[#FBF5F5] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#8A5656]">
                            Archived
                          </span>
                        </div>
                        <p className="mt-1 text-xs leading-5 text-[#667085]">
                          {typeLabels[item.contentType]} · Archived{" "}
                          {formatDate(item.archivedAt)}
                          {item.previousPublicationStatus
                            ? ` · Previously ${item.previousPublicationStatus}`
                            : ""}
                        </p>
                      </div>
                      <ContentArchiveActions
                        content={item}
                        archived
                        canPermanentlyDelete={access.role === "primary"}
                      />
                    </article>
                  ))}
                </div>
              )}
            </section>

            {access.role === "primary" && result.cleanupJobs.length > 0 && (
              <section aria-labelledby="cleanup-heading">
                <div className="mb-4">
                  <h2
                    id="cleanup-heading"
                    className="text-xl font-semibold tracking-tight text-[#101B33]"
                  >
                    Pending media cleanup
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-[#667085]">
                    These storage objects were unreferenced when their
                    archived content was deleted. Failed cleanup remains
                    queued for retry.
                  </p>
                </div>
                <div className="space-y-3">
                  {result.cleanupJobs.map((job) => (
                    <article
                      key={job.id}
                      className="flex flex-col gap-3 rounded-2xl border border-[#F3E1B7] bg-[#FFFBF2] p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <h3 className="font-semibold text-[#101B33]">
                          {job.title}
                        </h3>
                        <p className="mt-1 text-xs leading-5 text-[#765A22]">
                          {typeLabels[
                            contentArchiveTypes.find(
                              (type) => type === job.contentType,
                            ) ?? "resource"
                          ]}{" "}
                          · {job.attemptCount} attempt
                          {job.attemptCount === 1 ? "" : "s"} · Queued{" "}
                          {formatDate(job.createdAt)}
                        </p>
                      </div>
                      <RetryContentCleanupButton jobId={job.id} />
                    </article>
                  ))}
                </div>
              </section>
            )}

            <section aria-labelledby="available-content-heading">
              <div className="mb-4">
                <h2
                  id="available-content-heading"
                  className="text-xl font-semibold tracking-tight text-[#101B33]"
                >
                  Manage content
                </h2>
                <p className="mt-1 text-sm leading-6 text-[#667085]">
                  Archive content to remove it from public pages without
                  permanently deleting its record or media.
                </p>
              </div>

              {result.candidates.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#C9CDD5] bg-white px-6 py-10 text-center">
                  <h3 className="font-semibold text-[#101B33]">
                    All available content is listed in the archive
                  </h3>
                  <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#667085]">
                    There are no active items available to archive.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {contentArchiveTypes.map((type) => {
                    const items = result.candidates.filter(
                      (item) => item.contentType === type,
                    );
                    if (items.length === 0) return null;

                    return (
                      <details
                        key={type}
                        className="group overflow-hidden rounded-2xl border border-[#E4E7EC] bg-white"
                      >
                        <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#9A772E] [&::-webkit-details-marker]:hidden">
                          <span className="font-semibold text-[#101B33]">
                            {typeLabels[type]}
                          </span>
                          <span className="flex items-center gap-3 text-xs text-[#667085]">
                            {items.length} available
                            <svg
                              aria-hidden="true"
                              viewBox="0 0 20 20"
                              fill="none"
                              className="size-4 transition-transform group-open:rotate-180"
                            >
                              <path
                                d="m5 7.5 5 5 5-5"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </span>
                        </summary>
                        <div className="divide-y divide-[#EAECF0] border-t border-[#EAECF0]">
                          {items.map((item) => (
                            <article
                              key={item.contentId}
                              className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                            >
                              <div className="min-w-0">
                                <h3 className="break-words text-sm font-semibold text-[#101B33]">
                                  {item.title}
                                </h3>
                                {item.detail && (
                                  <p className="mt-1 text-xs text-[#667085]">
                                    {item.detail}
                                  </p>
                                )}
                              </div>
                              <ContentArchiveActions
                                content={item}
                                archived={false}
                              />
                            </article>
                          ))}
                        </div>
                      </details>
                    );
                  })}
                </div>
              )}
            </section>

            <section aria-labelledby="history-heading">
              <div className="mb-4">
                <h2
                  id="history-heading"
                  className="text-xl font-semibold tracking-tight text-[#101B33]"
                >
                  Content history
                </h2>
                <p className="mt-1 text-sm leading-6 text-[#667085]">
                  The latest 250 archive, restore, and deletion events are
                  shown here. Permanent-deletion history remains after the
                  original content record is removed.
                </p>
              </div>

              {result.history.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#C9CDD5] bg-white px-6 py-8 text-sm text-[#667085]">
                  No content actions have been recorded yet.
                </div>
              ) : (
                <>
                  <ol className="space-y-2">
                    {result.history.map((entry) => (
                      <li
                        key={entry.id}
                        className="grid gap-1 rounded-xl border border-[#E4E7EC] bg-white px-4 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-4"
                      >
                        <div className="min-w-0">
                          <p className="break-words text-sm font-medium text-[#101B33]">
                            {entry.title}
                            <span className="ml-2 text-xs font-normal text-[#667085]">
                              {typeLabels[entry.contentType]}
                            </span>
                          </p>
                          <p className="mt-1 break-words text-xs text-[#667085]">
                            {actionLabels[entry.action]} by{" "}
                            {entry.administratorIdentity}
                          </p>
                        </div>
                        <time
                          dateTime={entry.occurredAt}
                          className="text-xs text-[#667085]"
                        >
                          {formatDate(entry.occurredAt)}
                        </time>
                      </li>
                    ))}
                  </ol>
                  {result.historyTotal > 250 && (
                    <nav
                      aria-label="Content history pages"
                      className="mt-4 flex flex-wrap items-center justify-between gap-3"
                    >
                      <p className="text-xs text-[#667085]">
                        Showing {result.historyPage * 250 + 1}–
                        {Math.min(
                          (result.historyPage + 1) * 250,
                          result.historyTotal,
                        )}{" "}
                        of {result.historyTotal} history entries
                      </p>
                      <div className="flex gap-2">
                        {result.historyPage > 0 && (
                          <Link
                            href={`/admin/archive?historyPage=${result.historyPage - 1}`}
                            className="inline-flex min-h-10 items-center rounded-full border border-[#D0D5DD] bg-white px-4 text-xs font-semibold text-[#344054] hover:border-[#D9B66D] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9A772E]"
                          >
                            Newer entries
                          </Link>
                        )}
                        {(result.historyPage + 1) * 250 <
                          result.historyTotal && (
                          <Link
                            href={`/admin/archive?historyPage=${result.historyPage + 1}`}
                            className="inline-flex min-h-10 items-center rounded-full border border-[#D0D5DD] bg-white px-4 text-xs font-semibold text-[#344054] hover:border-[#D9B66D] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9A772E]"
                          >
                            Older entries
                          </Link>
                        )}
                      </div>
                    </nav>
                  )}
                </>
              )}
            </section>
          </div>
        )}
      </main>
    </AdminWorkspace>
  );
}
