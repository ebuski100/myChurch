import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminAccess } from "@/lib/admin-auth";
import { formatLagosDateTimeInput } from "@/lib/event-validation";
import { AdminWorkspace } from "../../admin-shell";
import { createEventAction } from "../actions";
import { EventForm } from "../event-form";
import { EventPosterUpload } from "../event-poster-upload";

export const metadata: Metadata = {
  title: "New Event | Admin | VictoryCity Revival Ministry",
  robots: { index: false, follow: false },
};

export const instant = false;

export default async function NewAdminEventPage() {
  const access = await getAdminAccess();
  if (access.status === "unauthenticated") redirect("/admin/login");
  if (access.status === "forbidden")
    redirect("/admin/login?error=not_admin");

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
          <span className="font-medium text-[#475467]">New</span>
        </div>
        <header className="mb-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9A772E]">
            Event management
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#101B33]">
            Create an event
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#667085]">
            Set the event details and choose whether it stays private
            or is published.
          </p>
        </header>
        <EventForm
          action={createEventAction}
          minStartDateTime={formatLagosDateTimeInput(
            new Date().toISOString(),
          )}
        >
          <EventPosterUpload
            title="New event"
            posterAssetId={null}
            posterUrl={null}
          />
        </EventForm>
      </main>
    </AdminWorkspace>
  );
}
