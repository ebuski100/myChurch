import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowIcon, SiteFooter, SiteHeader } from "../_components/site-chrome";

export const metadata: Metadata = {
  title: "About Us | VictoryCity Revival Ministry",
  description:
    "Learn about VictoryCity Revival Ministry, our Massive Grace Explosion theme, and how to join us in Coal Camp, Zone 6, Agric Quarters.",
};

const ministryDetails = [
  {
    id: "vision",
    label: "Our vision",
    mark: "01",
    title: "A vision to share",
    description:
      "The ministry's vision statement has not yet been provided. We look forward to sharing the church's own words here.",
  },
  {
    id: "mission",
    label: "Our mission",
    mark: "02",
    title: "A mission to share",
    description:
      "The ministry's mission statement has not yet been provided. This section is ready for the ministry's confirmed wording.",
  },
  {
    id: "beliefs",
    label: "What we believe",
    mark: "03",
    title: "Beliefs to share",
    description:
      "The church's statement of beliefs has not yet been provided. We will add it when the ministry supplies its approved text.",
  },
];

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#9A772E]">
      {children}
    </p>
  );
}

export default function AboutPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="relative isolate overflow-hidden bg-[#101B33] pb-16 pt-44 sm:pb-20 sm:pt-48">
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
                About VictoryCity
              </p>
              <h1 className="text-4xl font-semibold leading-[1.12] tracking-[-0.04em] text-white sm:text-6xl">
                A ministry centered on Massive Grace Explosion.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-white/70 sm:text-lg sm:leading-8">
                Get to know our ministry, the information we can share today,
                and the details we are still gathering from the church.
              </p>
              <a
                href="#story"
                className="mt-8 inline-flex min-h-12 items-center gap-3 rounded-full bg-[#D9B66D] px-6 text-sm font-semibold text-[#101B33] transition-colors hover:bg-[#E8CC8B] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              >
                Discover our ministry <ArrowIcon />
              </a>
            </div>
          </div>
        </section>

        <section id="story" className="scroll-mt-8 bg-white py-20 sm:py-28">
          <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 md:grid-cols-[0.8fr_1.2fr] md:items-center md:gap-20 lg:px-10">
            <div className="relative flex min-h-72 items-center justify-center overflow-hidden rounded-3xl bg-[#101B33] p-8 sm:min-h-96">
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(217,182,109,0.2),transparent_58%)]"
              />
              <div className="relative max-w-xs text-center">
                <span className="mx-auto mb-5 grid size-14 place-items-center rounded-full border border-[#D9B66D]/40 text-[#E6C77D]">
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="size-7"
                  >
                    <path
                      d="M12 3v18M5 9h14M7 17l5-5 5 5"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <p className="text-xs uppercase tracking-[0.22em] text-[#E6C77D]">
                  Our theme
                </p>
                <p className="mt-3 text-2xl font-medium leading-snug text-white">
                  Massive Grace Explosion
                </p>
              </div>
            </div>
            <div>
              <Eyebrow>Our story</Eyebrow>
              <h2 className="text-3xl font-semibold leading-tight tracking-tight text-[#101B33] sm:text-4xl">
                A place to gather and grow in community.
              </h2>
              <p className="mt-5 leading-7 text-[#667085]">
                VictoryCity Revival Ministry welcomes people to gather for
                worship, fellowship, and time together. The ministry&apos;s
                stated theme is <strong className="font-semibold text-[#101B33]">Massive Grace Explosion</strong>.
              </p>
              <p className="mt-4 leading-7 text-[#667085]">
                The church meets in Coal Camp, Zone 6, Agric Quarters. Specific
                details about the ministry&apos;s history and founding have not
                yet been provided, so we have left them out.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/#services"
                  className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#101B33] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#1D3158] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#9A772E]"
                >
                  See service times <ArrowIcon />
                </Link>
                <Link
                  href="/#visit"
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#D0D5DD] px-5 text-sm font-semibold text-[#101B33] transition-colors hover:border-[#D9B66D] hover:bg-[#FBF8F0] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#9A772E]"
                >
                  Plan a visit <ArrowIcon />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#F3F4F6] py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="mx-auto max-w-2xl text-center">
              <Eyebrow>Our foundation</Eyebrow>
              <h2 className="text-3xl font-semibold tracking-tight text-[#101B33] sm:text-4xl">
                What guides the ministry
              </h2>
              <p className="mt-4 leading-7 text-[#667085]">
                We want these statements to reflect the ministry accurately.
                Confirmed details are still needed for the sections below.
              </p>
            </div>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {ministryDetails.map((detail) => (
                <article
                  id={detail.id}
                  key={detail.id}
                  className="scroll-mt-8 rounded-2xl border border-[#E4E7EC] bg-white p-6 shadow-[0_8px_30px_rgba(16,27,51,0.04)] sm:p-8"
                >
                  <div className="flex items-center justify-between">
                    <span className="grid size-11 place-items-center rounded-xl bg-[#F8F4E9] text-sm font-semibold text-[#9A772E]">
                      {detail.mark}
                    </span>
                    <span className="h-px w-12 bg-[#D9B66D]" />
                  </div>
                  <p className="mt-7 text-xs font-semibold uppercase tracking-[0.16em] text-[#667085]">
                    {detail.label}
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-[#101B33]">
                    {detail.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-[#667085]">
                    {detail.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="grid gap-10 rounded-3xl border border-[#E4E7EC] bg-[#FBFBFC] p-7 sm:p-10 md:grid-cols-[0.8fr_1.2fr] md:items-center lg:p-14">
              <div>
                <Eyebrow>Leadership</Eyebrow>
                <h2 className="text-3xl font-semibold tracking-tight text-[#101B33] sm:text-4xl">
                  Meet our pastor
                </h2>
                <p className="mt-4 leading-7 text-[#667085]">
                  We are grateful for the leadership serving the VictoryCity
                  community.
                </p>
              </div>
              <article className="flex items-center gap-5 rounded-2xl border border-[#E4E7EC] bg-white p-5 sm:p-7">
                <div
                  aria-hidden="true"
                  className="grid size-16 shrink-0 place-items-center rounded-full bg-[#101B33] text-[#E6C77D] sm:size-20"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="size-8 sm:size-9"
                  >
                    <circle
                      cx="12"
                      cy="8"
                      r="3.5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M5 20c.5-3.4 3.2-5.5 7-5.5s6.5 2.1 7 5.5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9A772E]">
                    Pastor
                  </p>
                  <h3 className="mt-1 text-xl font-semibold text-[#101B33] sm:text-2xl">
                    Pst. Nelson
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-[#667085]">
                    Additional biography details have not been provided.
                  </p>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="bg-[#101B33] py-16 sm:py-20">
          <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-10">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#E6C77D]">
                You are welcome
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                Come and gather with us.
              </h2>
            </div>
            <Link
              href="/#visit"
              className="inline-flex min-h-12 items-center justify-center gap-3 self-start rounded-full bg-[#D9B66D] px-6 text-sm font-semibold text-[#101B33] transition-colors hover:bg-[#E8CC8B] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white md:self-auto"
            >
              Plan your visit <ArrowIcon />
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
