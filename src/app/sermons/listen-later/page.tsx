import type { Metadata } from "next";
import { io } from "next/cache";
import Link from "next/link";
import {
  SiteFooter,
  SiteHeader,
} from "@/app/_components/site-chrome";
import { getPublishedAudioSermons } from "@/lib/sermon-data";
import { ListenLaterLibrary } from "./listen-later-library";

export const metadata: Metadata = {
  title: "Listen Later | VictoryCity Revival Ministry",
  description: "Return to the sermons you saved to listen to later.",
};

export default async function ListenLaterPage() {
  await io();
  const result = await getPublishedAudioSermons();

  return (
    <>
      <SiteHeader />
      <main className="min-h-[60vh] flex-1 bg-[#F3F4F6] pb-16 pt-40 sm:pb-24 sm:pt-44">
        <div className="mx-auto max-w-5xl px-5 sm:px-8 lg:px-10">
          <Link
            href="/sermons"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#785B1F] hover:text-[#101B33] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#9A772E]"
          >
            <span aria-hidden="true">←</span> Back to sermon library
          </Link>

          <header className="mt-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9A772E]">
              Your personal collection
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#101B33] sm:text-5xl">
              Listen Later
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#667085] sm:text-base">
              Keep the messages you want to revisit close at hand.
              Your saved list stays in this browser and does not
              require an account.
            </p>
          </header>

          <section className="mt-8">
            {result.kind === "error" ? (
              <div className="rounded-2xl border border-[#E4E7EC] bg-white px-6 py-10 text-center">
                <h2 className="text-lg font-semibold text-[#101B33]">
                  Your saved sermons couldn&apos;t be loaded
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#667085]">
                  Please refresh the page or try again later.
                </p>
              </div>
            ) : (
              <ListenLaterLibrary sermons={result.sermons} />
            )}
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
