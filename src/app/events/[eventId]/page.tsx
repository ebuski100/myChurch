import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import {
  SiteFooter,
  SiteHeader,
} from "../../_components/site-chrome";
import { isUuid } from "@/lib/sermon-audio-authorization";
import { getPublishedEventById } from "@/lib/event-data";
import { buildEventDirectionsUrl } from "@/lib/event-public-details";
import { EventActions } from "../event-actions";

export const metadata: Metadata = {
  title: "Event Details | VictoryCity Revival Ministry",
  robots: { index: false, follow: false },
};

export const instant = false;

function formatEventDateTime(value: string): string {
  return (
    new Intl.DateTimeFormat("en", {
      dateStyle: "full",
      timeStyle: "short",
      timeZone: "Africa/Lagos",
    }).format(new Date(value)) + " WAT"
  );
}

function statusLabel(
  status: "upcoming" | "ongoing" | "past",
): string {
  return status === "ongoing"
    ? "Ongoing"
    : status === "past"
      ? "Completed"
      : "Upcoming";
}

function EventLoadError() {
  return (
    <div
      role="alert"
      className="rounded-2xl border border-[#F0D4D4] bg-white px-6 py-10 text-center"
    >
      <h1 className="text-xl font-semibold text-[#101B33]">
        Event details are temporarily unavailable
      </h1>
      <p className="mt-2 text-sm leading-6 text-[#667085]">
        Please try again in a moment.
      </p>
      <Link
        href="/events"
        className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-[#101B33] px-5 text-sm font-semibold text-white hover:bg-[#263653] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9A772E]"
      >
        Back to events
      </Link>
    </div>
  );
}

export default async function PublicEventPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  await connection();
  const { eventId } = await params;
  if (!isUuid(eventId)) notFound();

  const result = await getPublishedEventById(eventId);
  if (result.kind === "not_found") notFound();

  const event = result.kind === "success" ? result.event : null;
  const directionsUrl = event
    ? buildEventDirectionsUrl(event.location)
    : null;

  return (
    <>
      <SiteHeader />
      <main>
        <section className="relative isolate overflow-hidden bg-[#101B33] pb-12 pt-44 sm:pb-14 sm:pt-48">
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_78%_35%,rgba(217,182,109,0.17),transparent_36%),radial-gradient(ellipse_at_4%_100%,rgba(62,91,145,0.2),transparent_40%)]"
          />
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <Link
              href="/events"
              className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-white/70 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E6C77D]"
            >
              <span aria-hidden="true">←</span> All events
            </Link>
            {event && (
              <div className="mt-9 max-w-4xl">
                <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#E6C77D]">
                  {statusLabel(event.status)} event
                </p>
                <h1 className="text-3xl font-semibold leading-tight text-white sm:text-5xl">
                  {event.title}
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-7 text-white/70">
                  {formatEventDateTime(event.startsAt)}
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="bg-[#F3F4F6] py-10 sm:py-14">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            {!event ? (
              <EventLoadError />
            ) : (
              <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] lg:gap-12">
                <div>
                  {event.imageUrl ? (
                    <div
                      role="img"
                      aria-label={`Poster for ${event.title}`}
                      className="aspect-[4/3] overflow-hidden rounded-2xl border border-[#E4E7EC] bg-cover bg-center shadow-[0_12px_32px_rgba(16,27,51,0.1)] sm:aspect-[16/10]"
                      style={{
                        backgroundImage: `url(${JSON.stringify(event.imageUrl)})`,
                      }}
                    />
                  ) : (
                    <div
                      aria-hidden="true"
                      className="relative grid aspect-[4/3] place-items-center overflow-hidden rounded-2xl bg-[#101B33] sm:aspect-[16/10]"
                    >
                      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,rgba(217,182,109,0.2),transparent_55%)]" />
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        fill="none"
                        className="relative size-14 text-[#E6C77D]"
                      >
                        <rect
                          x="3.5"
                          y="5"
                          width="17"
                          height="15.5"
                          rx="2"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        />
                        <path
                          d="M7.5 3.5v3M16.5 3.5v3M3.5 9.5h17"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>
                  )}
                  {event.description && (
                    <section
                      aria-labelledby="event-description-heading"
                      className="mt-9"
                    >
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9A772E]">
                        About this gathering
                      </p>
                      <h2
                        id="event-description-heading"
                        className="mt-2 text-xl font-semibold text-[#101B33]"
                      >
                        Event details
                      </h2>
                      <p className="mt-4 whitespace-pre-line text-sm leading-7 text-[#475467] sm:text-base">
                        {event.description}
                      </p>
                    </section>
                  )}
                </div>

                <aside className="h-fit border-t border-[#D9DDE4] pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9A772E]">
                    Event information
                  </p>
                  <dl className="mt-5 divide-y divide-[#E1E4E9] border-y border-[#E1E4E9]">
                    <div className="py-4">
                      <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-[#667085]">
                        Starts
                      </dt>
                      <dd className="mt-1.5 text-sm font-medium leading-6 text-[#101B33]">
                        {formatEventDateTime(event.startsAt)}
                      </dd>
                    </div>
                    {event.endsAt && (
                      <div className="py-4">
                        <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-[#667085]">
                          Ends
                        </dt>
                        <dd className="mt-1.5 text-sm font-medium leading-6 text-[#101B33]">
                          {formatEventDateTime(event.endsAt)}
                        </dd>
                      </div>
                    )}
                    <div className="py-4">
                      <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-[#667085]">
                        Status
                      </dt>
                      <dd className="mt-1.5 text-sm font-medium text-[#101B33]">
                        {statusLabel(event.status)}
                      </dd>
                    </div>
                    {event.location && (
                      <div className="py-4">
                        <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-[#667085]">
                          Venue
                        </dt>
                        <dd className="mt-1.5 text-sm font-medium leading-6 text-[#101B33]">
                          {event.location}
                        </dd>
                      </div>
                    )}
                  </dl>

                  {directionsUrl && (
                    <Link
                      href={directionsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full border border-[#D0D5DD] bg-white px-5 text-sm font-semibold text-[#101B33] transition-colors hover:border-[#D9B66D] hover:bg-[#FBF8F0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9A772E]"
                    >
                      Get directions{" "}
                      <span aria-hidden="true" className="ml-2">
                        ↗
                      </span>
                    </Link>
                  )}
                  <EventActions
                    event={{
                      id: event.id,
                      title: event.title,
                      description: event.description,
                      startsAt: event.startsAt,
                      endsAt: event.endsAt,
                      location: event.location,
                    }}
                  />
                </aside>
              </div>
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
