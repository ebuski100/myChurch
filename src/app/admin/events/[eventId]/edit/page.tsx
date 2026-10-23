import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AdminNotice } from "../../../admin-notice";
import { AdminWorkspace } from "../../../admin-shell";
import { getAdminAccess } from "@/lib/admin-auth";
import { getAdminEvent } from "@/lib/admin-event-data";
import { formatLagosDateTimeInput } from "@/lib/event-validation";
import { EventForm } from "../../event-form";
import { EventPosterUpload } from "../../event-poster-upload";
import { updateEventAction } from "../../actions";

export const metadata: Metadata = {
  title: "Edit Event | Admin | VictoryCity Revival Ministry",
  robots: { index: false, follow: false },
};

export const instant = false;

export default async function EditAdminEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>;
  searchParams?: Promise<{ created?: string }>;
}) {
  const access = await getAdminAccess();
  if (access.status === "unauthenticated") redirect("/admin/login");
  if (access.status === "forbidden")
    redirect("/admin/login?error=not_admin");

  const { eventId } = await params;
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      eventId,
    )
  ) {
    notFound();
  }
  const result = await getAdminEvent(eventId);
  if (result.kind === "not_found") notFound();
  const query = await searchParams;

  return (
    <AdminWorkspace activeSection="events">
      <main className="mx-auto w-full max-w-4xl px-5 py-7 sm:px-8 sm:py-9">
        <div className="mb-7 flex items-center gap-2 text-xs text-[#98A2B3]">
          <Link href="/admin" className="hover:text-[#101B33]">
            Admin
          </Link>
          <span aria-hidden="true">/</span>
          <Link href="/admin/events" className="hover:text-[#101B33]">
            Events
          </Link>
          <span aria-hidden="true">/</span>
          <span className="font-medium text-[#475467]">Edit</span>
        </div>
        {result.kind === "error" ? (
          <div
            role="alert"
            className="rounded-2xl border border-[#F0D4D4] bg-white px-6 py-10 text-center"
          >
            <h1 className="text-xl font-semibold text-[#101B33]">
              Event could not be loaded
            </h1>
            <p className="mt-2 text-sm text-[#667085]">
              Try again or return to the events list.
            </p>
            <Link
              href="/admin/events"
              className="mt-5 inline-flex min-h-10 items-center rounded-full bg-[#101B33] px-4 text-sm font-semibold text-white"
            >
              Back to events
            </Link>
          </div>
        ) : (
          <>
            <header className="mb-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9A772E]">
                Event management · {result.event.status}
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#101B33]">
                Edit event
              </h1>
            </header>
            {query?.created === "1" && (
              <AdminNotice
                message="Event created. Add an optional poster image or continue editing its details."
                kind="success"
                resetKey="event-created"
                clearQueryParams={{ created: "1" }}
                className="mb-5"
              />
            )}
            <EventForm
              event={result.event}
              action={updateEventAction.bind(null, result.event.id)}
              minStartDateTime={formatLagosDateTimeInput(
                new Date().toISOString(),
              )}
            >
              <EventPosterUpload
                title={result.event.title}
                posterAssetId={result.event.posterAssetId}
                posterUrl={result.event.posterUrl}
              />
            </EventForm>
          </>
        )}
      </main>
    </AdminWorkspace>
  );
}
