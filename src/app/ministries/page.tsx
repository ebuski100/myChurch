import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "../_components/site-chrome";
import type { Ministry } from "@/lib/ministries";
import { ministries } from "@/lib/ministries";

export const metadata: Metadata = {
  title: "Ministries & Departments | VictoryCity Revival Ministry",
  description:
    "Explore ministries and departments at VictoryCity Revival Ministry and learn how to get involved as confirmed information becomes available.",
};

function MinistryCard({ ministry }: { ministry: Ministry }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-[#E4E7EC] bg-white shadow-[0_8px_30px_rgba(16,27,51,0.04)]">
      {ministry.imageUrl && (
        <div
          role="img"
          aria-label={`Image for ${ministry.name}`}
          className="aspect-[16/8] bg-cover bg-center"
          style={{ backgroundImage: `url(${JSON.stringify(ministry.imageUrl)})` }}
        />
      )}
      <div className="p-6 sm:p-8">
        <h2 className="text-xl font-semibold tracking-tight text-[#101B33] sm:text-2xl">
          {ministry.name}
        </h2>
        <p className="mt-3 text-sm leading-6 text-[#667085]">
          {ministry.description}
        </p>
        {ministry.involvementUrl && ministry.involvementLabel && (
          <a
            href={ministry.involvementUrl}
            className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#101B33] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#1D3158] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#9A772E]"
          >
            {ministry.involvementLabel}
            <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="size-4">
              <path d="M4 10h12m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        )}
      </div>
    </article>
  );
}

function MinistryEmptyState() {
  return (
    <div className="rounded-3xl border border-dashed border-[#C9CDD5] bg-white px-6 py-10 text-center sm:px-12 sm:py-14">
      <span className="mx-auto grid size-14 place-items-center rounded-full bg-[#F8F4E9] text-[#9A772E]">
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="size-7">
          <path d="M12 3.5v17M5 9h14M7 17l5-5 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <h2 className="mt-5 text-xl font-semibold text-[#101B33] sm:text-2xl">
        Ministry information is coming soon.
      </h2>
      <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-[#667085]">
        The church has not yet provided confirmed department descriptions or
        ways to get involved. We&apos;ll add ministry information here once it
        has been confirmed.
      </p>
      <nav
        aria-label="Explore VictoryCity pages"
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
        <Link
          href="/events"
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#D0D5DD] px-5 text-sm font-semibold text-[#101B33] transition-colors hover:border-[#D9B66D] hover:bg-[#FBF8F0] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#9A772E]"
        >
          Events
        </Link>
      </nav>
    </div>
  );
}

export default function MinistriesPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="relative isolate overflow-hidden bg-[#101B33] pb-14 pt-44 sm:pb-16 sm:pt-48">
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_78%_35%,rgba(217,182,109,0.17),transparent_36%),radial-gradient(ellipse_at_4%_100%,rgba(62,91,145,0.2),transparent_40%)]"
          />
          <div
            aria-hidden="true"
            className="absolute -right-20 top-24 -z-10 size-[360px] rounded-full border border-white/[0.06] sm:right-[10%] sm:size-[460px]"
          >
            <div className="absolute inset-8 rounded-full border border-[#D9B66D]/15" />
            <div className="absolute inset-20 rounded-full border border-white/[0.06]" />
          </div>
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="max-w-3xl">
              <p className="mb-6 inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-[#E6C77D]">
                <span className="h-px w-8 bg-[#D9B66D]" />
                Serve together
              </p>
              <h1 className="text-4xl font-semibold leading-[1.12] tracking-[-0.04em] text-white sm:text-6xl">
                Ministries &amp; Departments
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-white/70 sm:text-lg sm:leading-8">
                Discover the different ways people serve and connect within
                VictoryCity Revival Ministry. We&apos;ll share confirmed
                ministry details as they become available.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-[#F3F4F6] py-14 sm:py-20">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="mx-auto mb-9 max-w-3xl text-center sm:mb-12">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9A772E]">
                Find your place
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[#101B33] sm:text-3xl">
                Learn about our church departments.
              </h2>
              <p className="mt-4 text-sm leading-7 text-[#667085] sm:text-base">
                This page will introduce each ministry, explain how it serves,
                and share confirmed ways to get involved. We want every detail
                to come from the church, so we&apos;re waiting for approved
                ministry information before publishing department listings.
              </p>
            </div>

            {ministries.length > 0 ? (
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {ministries.map((ministry) => (
                  <MinistryCard key={ministry.id} ministry={ministry} />
                ))}
              </div>
            ) : (
              <MinistryEmptyState />
            )}
          </div>
        </section>

        <section className="bg-white py-14 sm:py-20">
          <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-10">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9A772E]">
                Get to know VictoryCity
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[#101B33]">
                Explore the ministry and stay connected.
              </h2>
            </div>
            <Link
              href="/about"
              className="inline-flex min-h-11 items-center justify-center self-start rounded-full border border-[#D0D5DD] px-5 text-sm font-semibold text-[#101B33] transition-colors hover:border-[#D9B66D] hover:bg-[#FBF8F0] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#9A772E] md:self-auto"
            >
              Learn about the church
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
