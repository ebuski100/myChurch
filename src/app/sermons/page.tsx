import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "../_components/site-chrome";
import { sermons } from "@/lib/sermons";
import { SermonLibrary } from "./sermon-library";

export const metadata: Metadata = {
  title: "Sermons | VictoryCity Revival Ministry",
  description:
    "Explore the sermon library from VictoryCity Revival Ministry. Audio recordings will be shared here when they are available.",
};

export default function SermonsPage() {
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
                Audio library
              </p>
              <h1 className="text-4xl font-semibold leading-[1.12] tracking-[-0.04em] text-white sm:text-6xl">
                Messages for your week.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-white/70 sm:text-lg sm:leading-8">
                Find a message by title or preacher, then listen here when a
                recording is available. We look forward to sharing the
                ministry&apos;s sermons with you.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-[#F3F4F6] py-14 sm:py-20">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="mb-8 flex flex-col gap-3 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9A772E]">
                  VictoryCity Revival Ministry
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[#101B33] sm:text-3xl">
                  Sermon library
                </h2>
              </div>
              <p className="max-w-xl text-sm leading-6 text-[#667085]">
                Listings marked as samples are layout placeholders, not actual
                sermons or recordings.
              </p>
            </div>
            <SermonLibrary sermons={sermons} />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
