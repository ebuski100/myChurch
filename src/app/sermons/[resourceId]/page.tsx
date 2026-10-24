import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { io } from "next/cache";
import Link from "next/link";
import {
  SiteFooter,
  SiteHeader,
} from "@/app/_components/site-chrome";
import { SermonPlayButton } from "@/app/sermons/sermon-play-button";
import { getPublishedAudioSermonById } from "@/lib/sermon-data";
import { formatDuration } from "@/lib/sermons";

type PageProps = {
  params: Promise<{ resourceId: string }>;
};

function formatSermonDate(date: string | null): string | null {
  if (!date) {
    return null;
  }

  const parsed = new Date(`${date}T00:00:00Z`);

  if (!Number.isFinite(parsed.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(parsed);
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { resourceId } = await params;

  await io();

  const sermon = await getPublishedAudioSermonById(resourceId);

  return {
    title: sermon
      ? `${sermon.title} | Sermons | VictoryCity Revival Ministry`
      : "Sermon not found | VictoryCity Revival Ministry",
    description:
      sermon?.description?.slice(0, 160) ??
      "Listen to sermons from VictoryCity Revival Ministry.",
  };
}

export default async function AudioSermonDetailPage({
  params,
}: PageProps) {
  const { resourceId } = await params;

  await io();

  const sermon = await getPublishedAudioSermonById(resourceId);

  if (!sermon) {
    notFound();
  }

  const duration = formatDuration(sermon.durationSeconds);
  const sermonDate = formatSermonDate(sermon.date);

  return (
    <>
      <SiteHeader />

      <main className="flex-1 bg-[#F3F4F6] pb-16 pt-40 sm:pb-24 sm:pt-44">
        <div className="mx-auto max-w-4xl px-5 sm:px-8 lg:px-10">
          <Link
            href="/sermons"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#785B1F] hover:text-[#101B33] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#9A772E]"
          >
            <span aria-hidden="true">←</span>
            Back to sermon library
          </Link>

          <article className="mt-6 overflow-hidden rounded-3xl border border-[#E4E7EC] bg-white shadow-[0_12px_40px_rgba(16,27,51,0.06)]">
            <div className="bg-[#101B33] px-6 py-8 text-white sm:px-10 sm:py-12">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#E6C77D]">
                {sermon.category || "Sermon"}
              </p>

              <h1 className="mt-4 text-3xl font-semibold leading-tight tracking-[-0.035em] sm:text-5xl">
                {sermon.title}
              </h1>

              <p className="mt-4 text-sm text-white/70 sm:text-base">
                {sermon.preacher || "VictoryCity Revival Ministry"}
                {sermonDate ? ` · ${sermonDate}` : ""}
                {duration ? ` · ${duration}` : ""}
              </p>
            </div>

            <div className="p-6 sm:p-10">
              <div className="flex flex-wrap items-center gap-3">
                <SermonPlayButton sermon={sermon} />

                {sermon.downloadAllowed && (
                  <a
                    href={`/api/sermons/${encodeURIComponent(sermon.id)}/audio?download=1`}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-[#D0D5DD] px-4 text-sm font-semibold text-[#101B33] transition hover:border-[#D9B66D] hover:bg-[#FBF8F0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9A772E]"
                  >
                    <svg
                      viewBox="0 0 20 20"
                      fill="none"
                      className="size-4"
                      aria-hidden="true"
                    >
                      <path
                        d="M10 2.75v9.5m0 0 3.5-3.5M10 12.25l-3.5-3.5M3.5 13.5v2A1.75 1.75 0 0 0 5.25 17.25h9.5A1.75 1.75 0 0 0 16.5 15.5v-2"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Download audio
                  </a>
                )}
              </div>

              {sermon.description ? (
                <section className="mt-8 border-t border-[#EAECF0] pt-7">
                  <h2 className="text-lg font-semibold text-[#101B33]">
                    About this message
                  </h2>

                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#475467] sm:text-base">
                    {sermon.description}
                  </p>
                </section>
              ) : (
                <p className="mt-8 border-t border-[#EAECF0] pt-6 text-sm leading-6 text-[#667085]">
                  Listen to this message from VictoryCity Revival
                  Ministry.
                </p>
              )}
            </div>
          </article>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
