// import type { Metadata } from "next";
// import { Suspense } from "react";
// import { io } from "next/cache";
// import { SiteFooter, SiteHeader } from "../_components/site-chrome";
// import { getPublishedSermonLibrary } from "@/lib/sermon-data";
// import { SermonLibrary } from "./sermon-library";

// export const metadata: Metadata = {
//   title: "Sermons | VictoryCity Revival Ministry",
//   description:
//     "Explore published audio and video sermons from VictoryCity Revival Ministry.",
// };

// async function SermonResults() {
//   await io();
//   const result = await getPublishedSermonLibrary();

//   if (result.kind === "error") {
//     return (
//       <div className="rounded-2xl border border-[#E4E7EC] bg-white px-6 py-10 text-center">
//         <h3 className="text-lg font-semibold text-[#101B33]">
//           Sermon library temporarily unavailable
//         </h3>
//         <p className="mt-2 text-sm leading-6 text-[#667085]">
//           We couldn&apos;t load the published sermons. Please try
//           again later.
//         </p>
//       </div>
//     );
//   }

//   return <SermonLibrary sermons={result.sermons} />;
// }

// function SermonResultsFallback() {
//   return (
//     <div aria-live="polite" aria-busy="true" className="space-y-4">
//       <p className="text-sm text-[#667085]">
//         Loading published sermons…
//       </p>
//       <div className="grid gap-5 md:grid-cols-2">
//         {[0, 1].map((item) => (
//           <div
//             key={item}
//             aria-hidden="true"
//             className="h-48 animate-pulse rounded-2xl border border-[#E4E7EC] bg-white"
//           />
//         ))}
//       </div>
//     </div>
//   );
// }

// export default function SermonsPage() {
//   return (
//     <>
//       <SiteHeader />
//       <main>
//         <section className="relative isolate overflow-hidden bg-[#101B33] pb-14 pt-44 sm:pb-16 sm:pt-48">
//           <div
//             aria-hidden="true"
//             className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_78%_35%,rgba(217,182,109,0.17),transparent_36%),radial-gradient(ellipse_at_4%_100%,rgba(62,91,145,0.2),transparent_40%)]"
//           />
//           <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
//             <div className="max-w-3xl">
//               <p className="mb-6 inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-[#E6C77D]">
//                 <span className="h-px w-8 bg-[#D9B66D]" />
//                 Message Library
//               </p>
//               <h1 className="text-4xl font-semibold leading-[1.12] tracking-[-0.04em] text-white sm:text-6xl">
//                 Messages for your week.
//               </h1>
//               <p className="mt-6 max-w-2xl text-base leading-7 text-white/70 sm:text-lg sm:leading-8">
//                 Explore messages through video sermons and audio
//                 recordings. Search by title, preacher, or series and
//                 choose how you want to experience each message.
//               </p>
//             </div>
//           </div>
//         </section>

//         <section className="bg-[#F3F4F6] py-14 sm:py-20">
//           <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
//             <div className="mb-8 flex flex-col gap-3 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
//               <div>
//                 <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9A772E]">
//                   VictoryCity Revival Ministry
//                 </p>
//                 <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[#101B33] sm:text-3xl">
//                   Sermon library
//                 </h2>
//               </div>
//               <p className="max-w-xl text-sm leading-6 text-[#667085]">
//                 Watch published video messages or play available audio
//                 recordings directly from the library.
//               </p>
//             </div>
//             <Suspense fallback={<SermonResultsFallback />}>
//               <SermonResults />
//             </Suspense>
//           </div>
//         </section>
//       </main>
//       <SiteFooter />
//     </>
//   );
// }

import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import { io } from "next/cache";
import { SiteFooter, SiteHeader } from "../_components/site-chrome";
import { getPublishedSermonLibrary } from "@/lib/sermon-data";
import { SermonLibrary } from "./sermon-library";

export const metadata: Metadata = {
  title: "Sermons | VictoryCity Revival Ministry",
  description:
    "Explore published audio and video sermons from VictoryCity Revival Ministry.",
};

async function SermonResults() {
  await io();
  const result = await getPublishedSermonLibrary();

  if (result.kind === "error") {
    return (
      <div className="rounded-2xl border border-[#E4E7EC] bg-white px-6 py-10 text-center">
        <h3 className="text-lg font-semibold text-[#101B33]">
          Sermon library temporarily unavailable
        </h3>
        <p className="mt-2 text-sm leading-6 text-[#667085]">
          We couldn&apos;t load the published sermons. Please try
          again later.
        </p>
      </div>
    );
  }

  return <SermonLibrary sermons={result.sermons} />;
}

function SermonResultsFallback() {
  return (
    <div aria-live="polite" aria-busy="true" className="space-y-4">
      <p className="text-sm text-[#667085]">
        Loading published sermons…
      </p>
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
        {/* Cinematic pastor hero */}
        <section className="relative isolate min-h-[580px] overflow-hidden bg-[#0B1428] pt-28 sm:pt-32 lg:min-h-[620px] lg:pt-32">
          {/* Pastor image */}
          <div
            aria-hidden="true"
            className="absolute inset-y-0 right-0 -z-20 w-full lg:w-[62%]"
          >
            <Image
              src="/images/sermons.png"
              alt=""
              fill
              priority
              sizes="(max-width: 1023px) 100vw, 62vw"
              className="object-cover object-[center_30%] sm:object-[center_25%]"
            />
          </div>

          {/* Blend the photograph into the navy brand background */}
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-gradient-to-r from-[#0B1428] via-[#0B1428]/95 to-[#0B1428]/35"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-gradient-to-t from-[#0B1428] via-transparent to-[#0B1428]/20"
          />

          {/* Subtle gold atmosphere */}
          <div
            aria-hidden="true"
            className="absolute right-[12%] top-[25%] -z-10 h-64 w-64 rounded-full bg-[#D9B66D]/10 blur-[100px]"
          />

          <div className="mx-auto flex min-h-[450px] max-w-7xl items-center px-5 pb-16 pt-12 sm:px-8 sm:pb-20 lg:min-h-[490px] lg:px-10 lg:pb-24">
            <div className="max-w-2xl">
              <p className="mb-6 inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-[#E6C77D]">
                <span className="h-px w-8 bg-[#D9B66D]" />
                Message Library
              </p>

              <h1 className="max-w-xl font-display text-4xl font-normal leading-[1.08] tracking-[-0.035em] text-white sm:text-5xl lg:text-7xl">
                Messages for your{" "}
                <span className="text-[#D9B66D]">week.</span>
              </h1>

              <p className="mt-6 max-w-xl text-base leading-7 text-white/75 sm:text-lg sm:leading-8">
                Grow in faith through the Word of God. Explore
                messages from VictoryCity Revival Ministry through
                video sermons and audio recordings.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <a
                  href="#sermon-library"
                  className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#D9B66D] px-6 text-sm font-semibold text-[#101B33] transition-colors hover:bg-[#E8CC8B] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                >
                  Explore Messages
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="ml-2 size-4"
                  >
                    <path
                      d="M5 12h14m-6-6 6 6-6 6"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </a>

                <span className="text-sm text-white/65">
                  Video sermons · Audio messages
                </span>
              </div>
            </div>
          </div>

          {/* Gold divider */}
          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#D9B66D]/70 to-transparent"
          />
        </section>

        {/* Existing sermon library */}
        <section
          id="sermon-library"
          className="scroll-mt-24 bg-[#F3F4F6] py-14 sm:py-20"
        >
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="mb-8 flex flex-col gap-3 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9A772E]">
                  VictoryCity Revival Ministry
                </p>
                <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-[#101B33] sm:text-3xl">
                  Sermon library
                </h2>
              </div>

              <p className="max-w-xl text-sm leading-6 text-[#667085]">
                Watch published video messages or play available audio
                recordings directly from the library.
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
