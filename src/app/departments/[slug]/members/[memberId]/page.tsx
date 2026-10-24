// import type { Metadata } from "next";
// import Link from "next/link";
// import Image from "next/image";
// import { notFound } from "next/navigation";
// import { connection } from "next/server";
// import {
//   SiteFooter,
//   SiteHeader,
// } from "../../../../_components/site-chrome";
// import {
//   getPublishedDepartmentMember,
//   isUuid,
// } from "@/lib/department-public-member";

// export const instant = false;

// type Props = {
//   params: Promise<{ slug: string; memberId: string }>;
// };

// function memberInitials(fullName: string): string {
//   const initials = fullName
//     .split(/\s+/)
//     .filter(Boolean)
//     .slice(0, 2)
//     .map((part) => part[0] ?? "")
//     .join("")
//     .toUpperCase();
//   return initials || "—";
// }

// export async function generateMetadata({
//   params,
// }: Props): Promise<Metadata> {
//   // Defer metadata to request time so the current-time publication filter
//   // is never evaluated during the static prerender (see the page below).
//   await connection();
//   const { slug, memberId } = await params;
//   const result = await getPublishedDepartmentMember(slug, memberId);
//   if (result.kind !== "success") {
//     return { title: "Member | VictoryCity Revival Ministry" };
//   }
//   return {
//     title: `${result.member.fullName} | ${result.departmentName} | VictoryCity Revival Ministry`,
//     description:
//       result.member.roleTitle ??
//       `Meet ${result.member.fullName} of the ${result.departmentName} department at VictoryCity Revival Ministry.`,
//   };
// }

// export default async function DepartmentMemberPage({
//   params,
// }: Props) {
//   await connection();
//   const { slug, memberId } = await params;
//   if (!isUuid(memberId)) notFound();

//   const result = await getPublishedDepartmentMember(slug, memberId);
//   if (result.kind === "not_found") notFound();

//   return (
//     <>
//       <SiteHeader />
//       <main>
//         {result.kind === "error" ? (
//           <section className="bg-[#F7F8FA] px-5 pb-20 pt-44 sm:px-8 sm:pt-48">
//             <div
//               role="alert"
//               className="mx-auto max-w-3xl rounded-2xl border border-[#E4E7EC] bg-white p-8 text-center"
//             >
//               <h1 className="text-2xl font-semibold text-[#101B33]">
//                 This profile is temporarily unavailable
//               </h1>
//               <p className="mt-3 text-sm leading-6 text-[#667085]">
//                 Please try again later.
//               </p>
//               <Link
//                 href={`/departments/${encodeURIComponent(slug)}`}
//                 className="mt-6 inline-flex min-h-11 items-center rounded-full bg-[#101B33] px-5 text-sm font-semibold text-white"
//               >
//                 Back to department
//               </Link>
//             </div>
//           </section>
//         ) : (
//           <>
//             <section className="relative isolate overflow-hidden bg-[#101B33] pb-12 pt-44 sm:pb-14 sm:pt-48">
//               <div
//                 aria-hidden="true"
//                 className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_78%_35%,rgba(217,182,109,0.2),transparent_36%),radial-gradient(ellipse_at_4%_100%,rgba(62,91,145,0.2),transparent_40%)]"
//               />
//               <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
//                 <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
//                   <Link
//                     href={`/departments/${encodeURIComponent(result.departmentSlug)}`}
//                     className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-white/70 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E6C77D]"
//                   >
//                     <span aria-hidden="true">←</span> Back to{" "}
//                     {result.departmentName}
//                   </Link>
//                   <Link
//                     href="/departments"
//                     className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-white/50 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E6C77D]"
//                   >
//                     All departments
//                   </Link>
//                 </div>
//                 <p className="mb-4 mt-9 text-xs font-semibold uppercase tracking-[0.18em] text-[#E6C77D]">
//                   {result.departmentName} · Team member
//                 </p>
//                 <h1 className="text-3xl font-semibold leading-tight text-white sm:text-5xl">
//                   {result.member.fullName}
//                 </h1>
//                 {result.member.roleTitle && (
//                   <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#E6C77D]">
//                     {result.member.roleTitle}
//                   </p>
//                 )}
//               </div>
//             </section>

//             <section className="bg-[#F7F8FA] py-10 sm:py-14">
//               <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
//                 <div className="grid gap-8 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-12">
//                   <div>
//                     <div className="overflow-hidden rounded-2xl border border-[#E4E7EC] bg-white shadow-[0_8px_30px_rgba(16,27,51,0.04)]">
//                       <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#F8F4E9]">
//                         {result.member.photoUrl ? (
//                           <Image
//                             src={result.member.photoUrl}
//                             alt={result.member.fullName}
//                             width={640}
//                             height={800}
//                             unoptimized
//                             priority
//                             className="h-full w-full object-cover object-[center_25%]"
//                           />
//                         ) : (
//                           <div
//                             aria-hidden="true"
//                             className="absolute inset-0 grid place-items-center bg-[#F8F4E9]"
//                           >
//                             <span className="text-5xl font-semibold tracking-wide text-[#9A772E]">
//                               {memberInitials(result.member.fullName)}
//                             </span>
//                           </div>
//                         )}
//                       </div>
//                     </div>
//                   </div>
//                   <article
//                     aria-labelledby="member-profile-heading"
//                     className="rounded-2xl border border-[#E4E7EC] bg-white p-6 sm:p-8"
//                   >
//                     <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9A772E]">
//                       Member profile
//                     </p>
//                     <h2
//                       id="member-profile-heading"
//                       className="mt-2 text-2xl font-semibold tracking-tight text-[#101B33]"
//                     >
//                       About {result.member.fullName}
//                     </h2>
//                     {result.member.biography ? (
//                       <p className="mt-4 whitespace-pre-line text-sm leading-7 text-[#475467] sm:text-base">
//                         {result.member.biography}
//                       </p>
//                     ) : (
//                       <p className="mt-4 text-sm leading-7 text-[#667085]">
//                         Public profile details for this team member
//                         will be added here after the church confirms
//                         them.
//                       </p>
//                     )}
//                   </article>
//                 </div>
//               </div>
//             </section>
//           </>
//         )}
//       </main>
//       <SiteFooter />
//     </>
//   );
// }

import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import {
  SiteFooter,
  SiteHeader,
} from "../../../../_components/site-chrome";
import {
  getPublishedDepartmentMember,
  isUuid,
} from "@/lib/department-public-member";

export const instant = false;

type Props = {
  params: Promise<{ slug: string; memberId: string }>;
};

function memberInitials(fullName: string): string {
  const initials = fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();

  return initials || "—";
}

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  await connection();

  const { slug, memberId } = await params;
  const result = await getPublishedDepartmentMember(slug, memberId);

  if (result.kind !== "success") {
    return { title: "Member | VictoryCity Revival Ministry" };
  }

  return {
    title: `${result.member.fullName} | ${result.departmentName} | VictoryCity Revival Ministry`,
    description:
      result.member.roleTitle ??
      `Meet ${result.member.fullName} of the ${result.departmentName} department at VictoryCity Revival Ministry.`,
  };
}

export default async function DepartmentMemberPage({
  params,
}: Props) {
  await connection();

  const { slug, memberId } = await params;

  if (!isUuid(memberId)) notFound();

  const result = await getPublishedDepartmentMember(slug, memberId);

  if (result.kind === "not_found") notFound();

  return (
    <>
      <SiteHeader />

      <main className="min-h-screen bg-[#FAF9F6]">
        {result.kind === "error" ? (
          <section className="px-5 pb-24 pt-40 sm:px-8 sm:pt-48">
            <div
              role="alert"
              className="mx-auto max-w-2xl rounded-3xl border border-[#E8E3D9] bg-white px-6 py-12 text-center shadow-[0_12px_40px_rgba(16,27,51,0.04)] sm:px-10"
            >
              <span
                aria-hidden="true"
                className="mx-auto grid size-14 place-items-center rounded-full bg-[#F8F1DF] text-2xl text-[#9A772E]"
              >
                !
              </span>

              <h1 className="mt-6 text-2xl font-semibold tracking-tight text-[#101B33] sm:text-3xl">
                This profile is temporarily unavailable
              </h1>

              <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-[#667085] sm:text-base">
                We couldn’t load this profile right now. Please try
                again later.
              </p>

              <Link
                href={`/departments/${encodeURIComponent(slug)}`}
                className="mt-7 inline-flex min-h-11 items-center justify-center rounded-full bg-[#101B33] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#243654] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#9A772E]"
              >
                Back to department
              </Link>
            </div>
          </section>
        ) : (
          <>
            {/* Profile introduction */}
            <section className="relative isolate overflow-hidden bg-[#101B33] pt-36 sm:pt-40 lg:pt-44">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_80%_15%,rgba(217,182,109,0.17),transparent_35%),radial-gradient(ellipse_at_5%_100%,rgba(62,91,145,0.2),transparent_42%)]"
              />

              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-28 top-24 -z-10 size-80 rounded-full border border-white/[0.06] sm:size-[28rem]"
              />

              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-12 top-40 -z-10 size-48 rounded-full border border-[#D9B66D]/15 sm:size-72"
              />

              <div className="mx-auto max-w-7xl px-5 pb-12 sm:px-8 sm:pb-16 lg:px-10 lg:pb-20">
                <nav
                  aria-label="Breadcrumb"
                  className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs font-medium sm:text-sm"
                >
                  <Link
                    href="/departments"
                    className="text-white/55 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E6C77D]"
                  >
                    Departments
                  </Link>

                  <span aria-hidden="true" className="text-white/30">
                    /
                  </span>

                  <Link
                    href={`/departments/${encodeURIComponent(result.departmentSlug)}`}
                    className="text-white/65 transition-colors hover:text-[#E6C77D] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E6C77D]"
                  >
                    {result.departmentName}
                  </Link>

                  <span aria-hidden="true" className="text-white/30">
                    /
                  </span>

                  <span className="text-[#E6C77D]">
                    Member profile
                  </span>
                </nav>

                <div className="mt-12 max-w-4xl sm:mt-16 lg:mt-20">
                  <div className="flex items-center gap-3">
                    <span className="h-px w-9 bg-[#D9B66D]" />
                    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#E6C77D] sm:text-xs">
                      The people behind the ministry
                    </p>
                  </div>

                  <h1 className="mt-6 max-w-4xl text-4xl font-semibold leading-[1.12] tracking-tight text-white sm:text-5xl lg:text-7xl">
                    {result.member.fullName}
                  </h1>

                  {result.member.roleTitle && (
                    <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-[#E6C77D] sm:text-sm sm:tracking-[0.22em]">
                      {result.member.roleTitle}
                    </p>
                  )}

                  <div className="mt-8 flex items-center gap-3">
                    <span className="h-1 w-12 rounded-full bg-[#D9B66D]" />
                    <span className="h-1 w-2 rounded-full bg-white/30" />
                    <span className="h-1 w-2 rounded-full bg-white/15" />
                  </div>
                </div>
              </div>

              <div
                aria-hidden="true"
                className="h-px bg-gradient-to-r from-transparent via-[#D9B66D]/40 to-transparent"
              />
            </section>

            {/* Member portrait and biography */}
            <section className="px-5 py-10 sm:px-8 sm:py-16 lg:px-10 lg:py-20">
              <div className="mx-auto grid max-w-6xl items-start gap-10 lg:grid-cols-[minmax(260px,0.78fr)_minmax(0,1.4fr)] lg:gap-16 xl:gap-20">
                <aside className="mx-auto w-full max-w-sm lg:mx-0">
                  <div className="rounded-[1.75rem]    shadow-[0_20px_60px_rgba(16,27,51,0.09)] sm:p-3">
                    <div className="relative aspect-[4/4.7] overflow-hidden rounded-[1.25rem] bg-[#F3EDDF]">
                      {result.member.photoUrl ? (
                        <Image
                          src={result.member.photoUrl}
                          alt={result.member.fullName}
                          width={640}
                          height={752}
                          unoptimized
                          priority
                          className="h-full w-full object-cover object-[center_25%]"
                        />
                      ) : (
                        <div
                          aria-hidden="true"
                          className="absolute inset-0 grid place-items-center bg-[radial-gradient(ellipse_at_top_right,#FBF7EC,#EEE5D1)]"
                        >
                          <span className="text-6xl font-semibold tracking-wider text-[#9A772E] sm:text-7xl">
                            {memberInitials(result.member.fullName)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 flex items-start gap-3 px-1">
                    <span className="mt-1.5 size-2 shrink-0 rounded-full bg-[#B28A3C]" />
                    <div>
                      <p className="text-sm font-semibold text-[#101B33]">
                        {result.departmentName} Department
                      </p>
                      <p className="mt-1 text-xs leading-5 text-[#7A8494]">
                        VictoryCity Revival Ministry
                      </p>
                    </div>
                  </div>
                </aside>

                <article
                  aria-labelledby="member-profile-heading"
                  className="min-w-0 pt-1 sm:pt-3"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#9A772E] sm:text-xs">
                    A closer introduction
                  </p>

                  <h2
                    id="member-profile-heading"
                    className="mt-4 text-3xl font-semibold leading-tight tracking-tight text-[#101B33] sm:text-4xl"
                  >
                    Get to know{" "}
                    <span className="text-[#9A772E]">
                      {result.member.fullName.split(/\s+/)[0]}
                    </span>
                  </h2>

                  <div className="mt-2 h-px w-full bg-[#E7E2D8]" />

                  {result.member.biography?.trim() ? (
                    <div className="mt-2 min-w-0 max-w-full whitespace-pre-line break-words text-[15px] leading-7 text-[#596579] sm:text-base sm:leading-9  px-2">
                      {result.member.biography}
                    </div>
                  ) : (
                    <div className="mt-7 rounded-2xl border border-dashed border-[#DDD5C5] bg-white/70 p-6 sm:p-8">
                      <p className="text-base font-medium text-[#101B33]">
                        This story is still being prepared.
                      </p>
                      <p className="mt-2 text-sm leading-7 text-[#667085]">
                        More information about this member will be
                        shared once the church has confirmed their
                        profile details.
                      </p>
                    </div>
                  )}

                  <div className="mt-10 border-t border-[#E7E2D8] pt-7">
                    <Link
                      href={`/departments/${encodeURIComponent(result.departmentSlug)}`}
                      className="group inline-flex min-h-11 items-center gap-3 rounded-full border border-[#DCD5C7] bg-white px-5 py-2.5 text-sm font-semibold text-[#101B33] transition-colors hover:border-[#B99A5A] hover:bg-[#F7F1E4] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#9A772E]"
                    >
                      <span
                        aria-hidden="true"
                        className="transition-transform group-hover:-translate-x-1"
                      >
                        ←
                      </span>
                      Meet the rest of the department
                    </Link>
                  </div>
                </article>
              </div>
            </section>

            {/* Ministry closing section */}
            <section className="px-5 pb-14 sm:px-8 sm:pb-20 lg:px-10">
              <div className="mx-auto max-w-6xl overflow-hidden rounded-[1.75rem] bg-[#EEE8DA]">
                <div className="grid gap-6 px-6 py-8 sm:px-10 sm:py-10 md:grid-cols-[1fr_auto] md:items-center md:gap-10 lg:px-12">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8B6B2C] sm:text-xs">
                      One church · Many gifts
                    </p>
                    <h2 className="mt-3 max-w-xl text-2xl font-semibold leading-snug tracking-tight text-[#101B33] sm:text-3xl">
                      Every person has a part to play.
                    </h2>
                    <p className="mt-3 max-w-xl text-sm leading-7 text-[#667085] sm:text-base">
                      Discover the people and departments serving our
                      church community.
                    </p>
                  </div>

                  <Link
                    href="/departments"
                    className="inline-flex min-h-12 items-center justify-center gap-3 self-start rounded-full bg-[#101B33] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#293957] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#9A772E] md:self-center"
                  >
                    Explore Other departments
                    <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </div>
            </section>
          </>
        )}
      </main>

      <SiteFooter />
    </>
  );
}
