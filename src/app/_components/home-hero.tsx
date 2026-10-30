import Link from "next/link";
import { ArrowIcon } from "./site-chrome";
import { HOME_ARTWORK, HomeArtwork } from "./home-artwork";

export function HomeHero() {
  const heroEntry = HOME_ARTWORK.hero;

  return (
    <section
      id="home"
      aria-labelledby="hero-heading"
      className="relative isolate flex min-h-[720px] flex-col overflow-hidden bg-[#101B33]"
    >
      {/* Cinematic artwork layer (placeholder until the real photo lands). */}
      <div aria-hidden="true" className="absolute inset-0 -z-20">
        <HomeArtwork
          slot="hero"
          eager
          className="absolute inset-0 h-full w-full"
        />
        {/*
          ASSET: replace via HOME_ARTWORK.hero.src in home-artwork.tsx:
            public/images/hero-worship.jpg
          Spec: wide 16:9 worship congregation, min 2400x1350,
          JPG under ~400KB, no overlaid text. Keep the overlay below.
        */}
        {heroEntry.src ? null : (
          <span className="sr-only">
            Decorative illustrated worship artwork placeholder
          </span>
        )}
      </div>

      {/* Readability overlay: dark navy, lifting slightly right. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-r from-[#0B1428]/95 via-[#101B33]/80 to-[#101B33]/30"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-[#0B1428]/90 to-transparent"
      />

      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-5 pb-10 pt-44 sm:px-8 sm:pt-44 lg:px-10">
        <div className="max-w-2xl">
          <p className="mb-6 text-xs font-semibold uppercase tracking-[0.22em] text-[#E6C77D]">
            God&apos;s Massive Grace Explosion Center
          </p>
          <h1
            id="hero-heading"
            className="font-display text-5xl font-normal leading-[1.05] tracking-[-0.02em] text-white sm:text-6xl lg:text-7xl"
          >
            Experience the power of{" "}
            <span className="text-[#D9B66D]">God&rsquo;s grace.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-white/75 sm:text-lg sm:leading-8">
            A place to worship, grow in faith, and encounter
            God&rsquo;s presence.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/sermons"
              className="inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-[#D9B66D] px-6 text-sm font-semibold text-[#101B33] transition-colors hover:bg-[#E8CC8B] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            >
              Listen to Sermons <ArrowIcon />
            </Link>
            <a
              href="#visit"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/25 bg-white/5 px-6 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:border-white/60 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E6C77D]"
            >
              Plan Your Visit
            </a>
          </div>
        </div>
      </div>

      {/* Info bar: location + both service times, like the reference. */}
      <div className="relative border-t border-white/10 bg-[#0B1428]/60 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-4 text-sm text-white/70 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-8 lg:px-10">
          <p className="inline-flex items-center gap-2">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              className="size-4 shrink-0 text-[#D9B66D]"
            >
              <path
                d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <circle
                cx="12"
                cy="10"
                r="2.5"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
            Coal Camp, Zone 6, Agric Quarters
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-8">
            <p className="inline-flex items-center gap-2">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                className="size-4 shrink-0 text-[#D9B66D]"
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
              Sunday: 8:00 AM – 11:00 AM
            </p>
            <p className="inline-flex items-center gap-2">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                className="size-4 shrink-0 text-[#D9B66D]"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="8.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="M12 7v5l3.5 2"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              Wednesday: 4:00 PM – 6:00 PM
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
