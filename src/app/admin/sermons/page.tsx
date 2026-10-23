import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminAccess } from "@/lib/admin-auth";
import { getAdminSermons } from "@/lib/admin-sermon-data";
import { AdminNotice } from "../admin-notice";
import { AdminWorkspace } from "../admin-shell";
import { SermonList } from "./sermon-list";

export const metadata: Metadata = {
  title: "Sermons | Admin | VictoryCity Revival Ministry",
  robots: { index: false, follow: false },
};

export const instant = false;

async function SermonRecords() {
  const result = await getAdminSermons();

  if (result.kind === "error") {
    return (
      <div
        role="alert"
        className="rounded-2xl border border-[#F0D4D4] bg-white px-6 py-10 text-center"
      >
        <h2 className="text-lg font-semibold text-[#101B33]">
          Sermons could not be loaded
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#667085]">
          The sermon list is temporarily unavailable. Please try again
          in a moment.
        </p>
        <Link
          href="/admin/sermons"
          className="mt-5 inline-flex min-h-10 items-center justify-center rounded-full bg-[#101B33] px-4 text-sm font-semibold text-white hover:bg-[#263653] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9A772E]"
        >
          Try again
        </Link>
      </div>
    );
  }

  return <SermonList sermons={result.sermons} />;
}

function SermonListLoading() {
  return (
    <div aria-live="polite" aria-busy="true">
      <p className="mb-4 text-sm text-[#667085]">
        Loading sermon records…
      </p>
      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            aria-hidden="true"
            className="h-64 animate-pulse rounded-2xl border border-[#E4E7EC] bg-white"
          />
        ))}
      </div>
    </div>
  );
}

export default async function AdminSermonsPage({
  searchParams,
}: {
  searchParams: Promise<{
    created?: string;
    published?: string;
    scheduled?: string;
    updated?: string;
    durationWarning?: string;
  }>;
}) {
  await connection();
  const access = await getAdminAccess();

  if (access.status === "unauthenticated") redirect("/admin/login");
  if (access.status === "forbidden")
    redirect("/admin/login?error=not_admin");
  const params = await searchParams;
  const notice =
    params.durationWarning === "1"
      ? params.published === "1"
        ? "Sermon published, but its audio duration could not be updated; the existing saved duration was kept."
        : params.scheduled === "1"
          ? "Sermon scheduled, but its audio duration could not be updated; the existing saved duration was kept."
          : "Sermon draft saved, but its audio duration could not be updated; the existing saved duration was kept."
      : params.published === "1"
        ? "Sermon published successfully."
        : params.scheduled === "1"
          ? "Sermon scheduled. Automatic publication requires the scheduler to be configured."
          : params.created === "1"
            ? "Sermon draft saved successfully."
            : params.updated === "1"
              ? "Sermon details updated."
              : undefined;
  const noticeWarning = params.durationWarning === "1";
  const clearQueryParams = Object.fromEntries(
    [
      "created",
      "published",
      "scheduled",
      "updated",
      "durationWarning",
    ]
      .filter((key) => params[key as keyof typeof params] === "1")
      .map((key) => [key, "1"]),
  );

  return (
    <AdminWorkspace activeSection="sermons">
      <main className="mx-auto w-full max-w-[1500px] px-5 py-7 sm:px-8 sm:py-9 xl:px-10">
        <div className="mb-7 flex items-center gap-2 text-xs text-[#98A2B3]">
          <Link href="/admin" className="hover:text-[#101B33]">
            Admin
          </Link>
          <span aria-hidden="true">/</span>
          <span className="font-medium text-[#475467]">Sermons</span>
        </div>

        <section className="relative isolate overflow-hidden rounded-2xl bg-[#101B33] px-6 py-7 shadow-[0_12px_32px_rgba(16,27,51,0.1)] sm:px-8 sm:py-9">
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_84%_18%,rgba(217,182,109,0.19),transparent_35%),radial-gradient(ellipse_at_2%_100%,rgba(62,91,145,0.2),transparent_44%)]"
          />
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-3xl">
              <p className="mb-4 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#E6C77D] sm:text-xs">
                <span className="h-px w-6 bg-[#D9B66D]" />
                Content library
              </p>
              <h1 className="text-3xl font-semibold leading-tight tracking-[-0.035em] text-white sm:text-4xl">
                Sermons
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65 sm:text-base sm:leading-7">
                Review sermon details and publication status across
                the ministry library.
              </p>
            </div>
            <Link
              href="/sermons"
              className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 self-start rounded-full bg-[#D9B66D] px-4 text-sm font-semibold text-[#101B33] transition-colors hover:bg-[#E8CC8B] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:self-auto"
            >
              Preview public library <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </section>

        <div className="mb-5 mt-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9A772E]">
              Metadata management
            </p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-[#101B33] sm:text-2xl">
              Sermon records
            </h2>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-[#E4E7EC] bg-white px-3 py-1.5 text-xs font-medium text-[#667085]">
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              fill="none"
              className="size-4"
            >
              <path
                d="M10 6.5v4m0 3h.01M10 2.5l8 14H2z"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Publication status changes require confirmation
          </span>
        </div>

        {notice && (
          <AdminNotice
            message={notice}
            kind={noticeWarning ? "warning" : "success"}
            resetKey={notice}
            clearQueryParams={clearQueryParams}
            className="mb-5"
          />
        )}
        <Suspense fallback={<SermonListLoading />}>
          <SermonRecords />
        </Suspense>
      </main>
    </AdminWorkspace>
  );
}
