import type { Metadata } from "next";
import { Suspense } from "react";
import { io } from "next/cache";
import { SiteFooter, SiteHeader } from "../_components/site-chrome";
import { getPublishedAudioSermons } from "@/lib/sermon-data";
import { SermonLibrary } from "./sermon-library";

export const metadata: Metadata = {
  title: "Sermons | VictoryCity Revival Ministry",
  description:
    "Explore the sermon library from VictoryCity Revival Ministry. Audio recordings will be shared here when they are available.",
};

async function SermonResults() {
  await io();
  const result = await getPublishedAudioSermons();

  if (result.kind === "error") {
    return (
      <div className="rounded-2xl border border-[#E4E7EC] bg-white px-6 py-10 text-center">
        <h3 className="text-lg font-semibold text-[#101B33]">
          Sermon library temporarily unavailable
        </h3>
        <p className="mt-2 text-sm leading-6 text-[#667085]">
          We couldn&apos;t load the published sermons. Please try again later.
        </p>
      </div>
    );
  }

  return <SermonLibrary sermons={result.sermons} />;
}

function SermonResultsFallback() {
  return (
    <div aria-live="polite" aria-busy="true" className="space-y-4">
      <p className="text-sm text-[#667085]">Loading published sermons…</p>
      <div className="grid gap-5 md:grid-cols-2">
        {[0, 1].map((item) => (
          <div
            key={item}
            aria-hidden="true"
            className="h-48 animate-pulse rounded-2xl border border-[#E4E7EC] bg-white"
          />
        ))}
      </div>
    </div>
  );
}

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
                Browse published sermon details. Recordings will play here when
                authorized audio access is available.
              </p>
            </div>
            <Suspense fallback={<SermonResultsFallback />}>
              <SermonResults />
            </Suspense>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
