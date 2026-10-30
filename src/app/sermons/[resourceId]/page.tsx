import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { io } from "next/cache";
import VideoEmbed from "./video-embed";
import VideoPlayerFocus from "./video-player-focus";
import Link from "next/link";
import {
  SiteFooter,
  SiteHeader,
} from "@/app/_components/site-chrome";
import { getPublishedVideoSermonById } from "@/lib/sermon-data";
import { isPrivacyEnhancedEmbedUrl } from "@/lib/sermon-media-display";
import { formatDuration } from "@/lib/sermons";

// Allow this route to wait for its request-time sermon data.
export const instant = false;

type PageProps = {
  params: Promise<{ resourceId: string }>;
};

function formatSermonDate(date: string | null): string | null {
  if (!date) return null;

  const parsed = new Date(`${date}T00:00:00Z`);

  if (!Number.isFinite(parsed.getTime())) return null;

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

  const sermon = await getPublishedVideoSermonById(resourceId);

  return {
    title: sermon
      ? `${sermon.title} | Sermons | VictoryCity Revival Ministry`
      : "Sermon not found | VictoryCity Revival Ministry",
    description:
      sermon?.description?.slice(0, 160) ??
      "Watch video sermons from VictoryCity Revival Ministry.",
  };
}

export default async function VideoSermonDetailPage({
  params,
}: PageProps) {
  const { resourceId } = await params;

  await io();

  const sermon = await getPublishedVideoSermonById(resourceId);

  if (!sermon || !sermon.video) {
    notFound();
  }

  // Only embed validated YouTube URLs using the privacy-enhanced host.
  const embedUrl = sermon.video.embedUrl;

  if (!isPrivacyEnhancedEmbedUrl(embedUrl)) {
    notFound();
  }

  // Do not autoplay when opening or reloading a video sermon.
  const videoUrl = new URL(embedUrl);
  videoUrl.searchParams.delete("autoplay");
  videoUrl.searchParams.set("playsinline", "1");

  const duration = formatDuration(sermon.durationSeconds);
  const sermonDate = formatSermonDate(sermon.date);

  return (
    <>
      <SiteHeader />

      <main className="flex-1 bg-[#F3F4F6] pb-16 pt-40 sm:pb-24 sm:pt-44">
        <div className="mx-auto max-w-5xl px-5 sm:px-8 lg:px-10">
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
                {sermon.category || "Video sermon"}
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

            <div className="p-4 sm:p-8">
              <VideoPlayerFocus key={resourceId}>
                <div className="aspect-video overflow-hidden rounded-2xl bg-black">
                  <VideoEmbed
                    src={videoUrl.toString()}
                    title={sermon.title}
                  />
                </div>
              </VideoPlayerFocus>

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
                <p className="mt-6 text-sm leading-6 text-[#667085]">
                  Watch this message from VictoryCity Revival
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
