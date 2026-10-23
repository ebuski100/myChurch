import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { SiteFooter, SiteHeader } from "../_components/site-chrome";
import type { ChurchEvent } from "@/lib/events";
import { getPublishedEvents } from "@/lib/event-data";

export const metadata: Metadata = {
  title: "Events | VictoryCity Revival Ministry",
  description:
    "Find confirmed upcoming events at VictoryCity Revival Ministry. Check back for ministry announcements and gatherings.",
};

export const instant = false;

function EventCard({ event }: { event: ChurchEvent }) {
  const time = [event.startTime, event.endTime]
    .filter(Boolean)
    .join(" – ");

  return (
    <Link
      href={`/events/${encodeURIComponent(event.id)}`}
      aria-label={`View event details: ${event.title}`}
      className="group block rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#9A772E]"
    >
      <article className="overflow-hidden rounded-2xl border border-[#E4E7EC] bg-white shadow-[0_8px_30px_rgba(16,27,51,0.04)] transition-[transform,box-shadow] duration-200 group-hover:-translate-y-0.5 group-hover:shadow-[0_14px_36px_rgba(16,27,51,0.12)]">
        {event.imageUrl ? (
          <div
            role="img"
            aria-label={`Image for ${event.title}`}
            className="aspect-[16/8] bg-cover bg-center"
            style={{
              backgroundImage: `url(${JSON.stringify(event.imageUrl)})`,
            }}
          />
        ) : (
          <div
            aria-hidden="true"
            className="relative grid aspect-[16/6] place-items-center overflow-hidden bg-[#101B33]"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(217,182,109,0.2),transparent_56%)]" />
            <span className="relative grid size-12 place-items-center rounded-full border border-[#D9B66D]/40 text-[#E6C77D]">
              <svg viewBox="0 0 24 24" fill="none" className="size-6">
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
            </span>
          </div>
        )}
        <div className="p-5 sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9A772E]">
            {event.status === "past"
              ? "Past event"
              : event.status === "ongoing"
                ? "Ongoing event"
                : "Upcoming event"}
          </p>
          <h3 className="mt-2 text-xl font-semibold tracking-tight text-[#101B33] sm:text-2xl">
            {event.title}
          </h3>
          <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-[#667085]">
                Date
              </dt>
              <dd className="mt-1 text-[#344054]">{event.date}</dd>
            </div>
            {time && (
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-[#667085]">
                  Time
                </dt>
                <dd className="mt-1 text-[#344054]">{time}</dd>
              </div>
            )}
            {event.location && (
              <div className="sm:col-span-2">
                <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-[#667085]">
                  Location
                </dt>
                <dd className="mt-1 text-[#344054]">
                  {event.location}
                </dd>
              </div>
            )}
          </dl>
          {event.description && (
            <p className="mt-5 border-t border-[#EAECF0] pt-4 text-sm leading-6 text-[#667085]">
              {event.description}
            </p>
          )}
        </div>
      </article>
    </Link>
  );
}

function EmptyEvents() {
  return (
    <div className="rounded-3xl border border-dashed border-[#C9CDD5] bg-white px-6 py-10 text-center sm:px-12 sm:py-14">
      <span className="mx-auto grid size-14 place-items-center rounded-full bg-[#F8F4E9] text-[#9A772E]">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          className="size-7"
        >
          <path
            d="M12 8v4l2.5 1.5M20.5 12a8.5 8.5 0 1 1-2.49-6.01M20.5 4.5v5h-5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <h2 className="mt-5 text-xl font-semibold text-[#101B33] sm:text-2xl">
        No upcoming events have been announced.
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#667085]">
        We&apos;ll share confirmed ministry events here when details
        are available. In the meantime, explore VictoryCity and learn
        more about the ministry.
      </p>
      <nav
        aria-label="Explore more from VictoryCity"
        className="mt-7 flex flex-wrap justify-center gap-3"
      >
        <Link
          href="/"
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#101B33] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#1D3158] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#9A772E]"
        >
          Home
        </Link>
        <Link
          href="/about"
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#D0D5DD] px-5 text-sm font-semibold text-[#101B33] transition-colors hover:border-[#D9B66D] hover:bg-[#FBF8F0] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#9A772E]"
        >
          About the ministry
        </Link>
        <Link
          href="/sermons"
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#D0D5DD] px-5 text-sm font-semibold text-[#101B33] transition-colors hover:border-[#D9B66D] hover:bg-[#FBF8F0] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#9A772E]"
        >
          Sermon library
        </Link>
      </nav>
    </div>
  );
}

export default async function EventsPage() {
  await connection();
  const result = await getPublishedEvents();
  const events = result.kind === "success" ? result.events : [];
  const activeEvents = events.filter(
    (event) => event.status !== "past",
  );
  const pastEvents = events.filter(
    (event) => event.status === "past",
  );

  return (
    <>
      <SiteHeader />
      <main>
        <section className="relative isolate overflow-hidden bg-[#101B33] pb-14 pt-44 sm:pb-16 sm:pt-48">
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_78%_35%,rgba(217,182,109,0.17),transparent_36%),radial-gradient(ellipse_at_4%_100%,rgba(62,91,145,0.2),transparent_40%)]"
          />
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="max-w-3xl">
              <p className="mb-6 inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-[#E6C77D]">
                <span className="h-px w-8 bg-[#D9B66D]" />
                Life together
              </p>
              <h1 className="text-4xl font-semibold leading-[1.12] tracking-[-0.04em] text-white sm:text-6xl">
                Events at VictoryCity.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-white/70 sm:text-lg sm:leading-8">
                Find confirmed gatherings and ministry events here.
                We&apos;ll share the details when they are ready.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-[#F3F4F6] py-14 sm:py-20">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="mb-8 sm:mb-10">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9A772E]">
                What&apos;s happening
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[#101B33] sm:text-3xl">
                Upcoming and ongoing events
              </h2>
            </div>
            {result.kind === "error" ? (
              <div
                role="alert"
                className="rounded-2xl border border-[#F0D4D4] bg-white px-6 py-8 text-center"
              >
                <h2 className="text-lg font-semibold text-[#101B33]">
                  Events are temporarily unavailable
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#667085]">
                  Please refresh the page in a moment.
                </p>
              </div>
            ) : activeEvents.length > 0 ? (
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {activeEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            ) : (
              <EmptyEvents />
            )}

            {pastEvents.length > 0 && (
              <section
                aria-labelledby="past-events-heading"
                className="mt-16"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9A772E]">
                  From our community
                </p>
                <h2
                  id="past-events-heading"
                  className="mt-3 text-2xl font-semibold tracking-tight text-[#101B33] sm:text-3xl"
                >
                  Past events
                </h2>
                <div className="mt-7 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {pastEvents.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              </section>
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
