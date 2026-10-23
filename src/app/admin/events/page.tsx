import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { AdminNotice } from "../admin-notice";
import { AdminWorkspace } from "../admin-shell";
import { getAdminAccess } from "@/lib/admin-auth";
import { getAdminEvents } from "@/lib/admin-event-data";

export const metadata: Metadata = {
  title: "Events | Admin | VictoryCity Revival Ministry",
  robots: { index: false, follow: false },
};

export const instant = false;

const statusStyles = {
  draft: "border-[#EAECF0] bg-[#F8F9FB] text-[#667085]",
  published: "border-[#CFE5D5] bg-[#F0F8F2] text-[#3C704B]",
  cancelled: "border-[#F0D4D4] bg-[#FBF5F5] text-[#8A4242]",
  archived: "border-[#E8D8D8] bg-[#FBF5F5] text-[#8A5656]",
} as const;

function formatEventStart(value: string): string {
  return (
    new Intl.DateTimeFormat("en", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Africa/Lagos",
    }).format(new Date(value)) + " WAT"
  );
}

export default async function AdminEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ updated?: string; created?: string }>;
}) {
  await connection();
  const access = await getAdminAccess();
  if (access.status === "unauthenticated") redirect("/admin/login");
  if (access.status === "forbidden")
    redirect("/admin/login?error=not_admin");

  const params = await searchParams;
  const result = await getAdminEvents();

  return (
    <AdminWorkspace activeSection="events">
      <main className="mx-auto w-full max-w-[1500px] px-5 py-7 sm:px-8 sm:py-9 xl:px-10">
        <div className="mb-7 flex items-center gap-2 text-xs text-[#98A2B3]">
          <Link href="/admin" className="hover:text-[#101B33]">
            Admin
          </Link>
          <span aria-hidden="true">/</span>
          <span className="font-medium text-[#475467]">Events</span>
        </div>

        <header className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9A772E]">
              Ministry gatherings
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#101B33]">
              Events
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#667085]">
              Draft, publish, and manage confirmed ministry events.
            </p>
          </div>
          <Link
            href="/admin/events/new"
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full bg-[#101B33] px-5 text-sm font-semibold text-white hover:bg-[#263653] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9A772E]"
          >
            Create event{" "}
            <span aria-hidden="true" className="ml-2">
              +
            </span>
          </Link>
        </header>

        {params.created === "draft" ? (
          <AdminNotice
            message="Event draft saved successfully."
            kind="success"
            resetKey="event-created-draft"
            clearQueryParams={{ created: "draft" }}
            className="mb-5"
          />
        ) : params.created === "published" ? (
          <AdminNotice
            message="Event published successfully."
            kind="success"
            resetKey="event-created-published"
            clearQueryParams={{ created: "published" }}
            className="mb-5"
          />
        ) : params.updated === "1" ? (
          <AdminNotice
            message="Event details updated."
            kind="success"
            resetKey="event-updated"
            clearQueryParams={{ updated: "1" }}
            className="mb-5"
          />
        ) : null}

        {result.kind === "error" ? (
          <div
            role="alert"
            className="rounded-2xl border border-[#F0D4D4] bg-white px-6 py-10 text-center"
          >
            <h2 className="text-lg font-semibold text-[#101B33]">
              Events could not be loaded
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#667085]">
              The event list is temporarily unavailable. Please try
              again in a moment.
            </p>
            <Link
              href="/admin/events"
              className="mt-5 inline-flex min-h-10 items-center justify-center rounded-full bg-[#101B33] px-4 text-sm font-semibold text-white"
            >
              Try again
            </Link>
          </div>
        ) : result.events.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#C9CDD5] bg-white px-6 py-12 text-center">
            <h2 className="text-lg font-semibold text-[#101B33]">
              No events yet
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#667085]">
              Create a draft to add a confirmed gathering to the
              ministry calendar.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {result.events.map((event) => (
              <article
                key={event.id}
                className="overflow-hidden rounded-2xl border border-[#E4E7EC] bg-white shadow-[0_5px_22px_rgba(16,27,51,0.035)]"
              >
                {event.posterUrl && (
                  <div
                    role="img"
                    aria-label={`Poster for ${event.title}`}
                    className="aspect-[16/8] bg-cover bg-center"
                    style={{
                      backgroundImage: `url(${JSON.stringify(event.posterUrl)})`,
                    }}
                  />
                )}
                <div className="p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span
                      className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold capitalize ${statusStyles[event.status]}`}
                    >
                      {event.status}
                    </span>
                    <span className="text-xs text-[#667085]">
                      {formatEventStart(event.startsAt)}
                    </span>
                  </div>
                  <h2 className="mt-4 text-lg font-semibold leading-snug text-[#101B33]">
                    {event.title}
                  </h2>
                  <p className="mt-1 text-sm text-[#667085]">
                    {event.location || "Venue not provided"}
                  </p>
                  {event.description && (
                    <p className="mt-4 line-clamp-3 border-t border-[#EAECF0] pt-4 text-sm leading-6 text-[#667085]">
                      {event.description}
                    </p>
                  )}
                  <div className="mt-5 border-t border-[#EAECF0] pt-4">
                    <Link
                      href={`/admin/events/${encodeURIComponent(event.id)}/edit`}
                      className="inline-flex min-h-10 items-center justify-center rounded-full border border-[#D0D5DD] px-4 text-sm font-semibold text-[#101B33] hover:border-[#D9B66D] hover:bg-[#FBF8F0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9A772E]"
                    >
                      Edit event
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </AdminWorkspace>
  );
}
