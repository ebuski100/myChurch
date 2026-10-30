import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import {
  SiteFooter,
  SiteHeader,
} from "../../_components/site-chrome";
import { getPublishedDepartment } from "@/lib/department-data";
import { MemberCard } from "./member-card";

export const instant = false;

type Props = { params: Promise<{ slug: string }> };

const DEPARTMENT_HERO_IMAGES: Record<
  string,
  { src: string; alt: string }
> = {
  choir: {
    src: "/images/choir.jpg",
    alt: "The church choir leading worship together",
  },
  media: {
    src: "/images/media.jpg",
    alt: "The church media team capturing a worship service",
  },
  pastors: {
    src: "/images/pastor.jpg",
    alt: "Church pastors serving and guiding the congregation",
  },
  ushering: {
    src: "/images/ushering.png",
    alt: "Church ushers welcoming and assisting members",
  },
  intercessory: {
    src: "/images/intercessory.png",
    alt: "Church members gathered together in prayer",
  },
};

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  await connection();

  const { slug } = await params;
  const result = await getPublishedDepartment(slug);

  if (result.kind !== "success") {
    return { title: "Department | VictoryCity Revival Ministry" };
  }

  return {
    title: `${result.department.name} | Departments | VictoryCity Revival Ministry`,
    description:
      result.department.shortDescription ??
      `Learn about the ${result.department.name} department at VictoryCity Revival Ministry.`,
  };
}

export default async function DepartmentDetailPage({
  params,
}: Props) {
  await connection();

  const { slug } = await params;
  const result = await getPublishedDepartment(slug);

  if (result.kind === "not_found") notFound();

  return (
    <>
      <SiteHeader />

      <main>
        {result.kind === "error" ? (
          <section className="bg-[#F7F8FA] px-5 pb-20 pt-44 sm:px-8 sm:pt-48">
            <div
              role="alert"
              className="mx-auto max-w-3xl rounded-2xl border border-[#E4E7EC] bg-white p-8 text-center"
            >
              <h1 className="text-2xl font-semibold text-[#101B33]">
                This department is temporarily unavailable
              </h1>

              <p className="mt-3 text-sm leading-6 text-[#667085]">
                Please try again later.
              </p>

              <Link
                href="/departments"
                className="mt-6 inline-flex min-h-11 items-center rounded-full bg-[#101B33] px-5 text-sm font-semibold text-white"
              >
                Back to departments
              </Link>
            </div>
          </section>
        ) : (
          <>
            {(() => {
              const department = result.department;
              const heroImage =
                DEPARTMENT_HERO_IMAGES[department.slug];

              return (
                <>
                  {/* Cinematic department hero */}
                  <section className="relative isolate flex min-h-[540px] items-end overflow-hidden bg-[#0B1428] pt-36 sm:min-h-[600px] sm:pt-40 lg:min-h-[660px]">
                    {heroImage && (
                      <Image
                        src={heroImage.src}
                        alt={heroImage.alt}
                        fill
                        priority
                        sizes="100vw"
                        className="object-cover object-center"
                      />
                    )}

                    {/* Deep navy overlay for readable text */}
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 bg-gradient-to-r from-[#07101F]/95 via-[#0B1428]/75 to-[#0B1428]/20"
                    />

                    {/* Darken the bottom to ground the composition */}
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 bg-gradient-to-t from-[#0B1428] via-[#0B1428]/25 to-[#0B1428]/10"
                    />

                    {/* Soft gold cinematic light */}
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 bg-[radial-gradient(ellipse_at_78%_28%,rgba(217,182,109,0.24),transparent_42%)]"
                    />

                    {/* Subtle navy fallback texture */}
                    {!heroImage && (
                      <div
                        aria-hidden="true"
                        className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_78%_35%,rgba(217,182,109,0.2),transparent_36%),linear-gradient(120deg,#0B1428,#14264A,#0B1428)]"
                      />
                    )}

                    <div className="relative z-10 mx-auto w-full max-w-7xl px-5 pb-16 sm:px-8 sm:pb-20 lg:px-10 lg:pb-24">
                      <Link
                        href="/departments"
                        className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/15 px-4 py-2 text-sm font-medium text-white/80 backdrop-blur-sm transition hover:border-[#D9B66D]/70 hover:text-white"
                      >
                        <span aria-hidden="true">←</span>
                        All departments
                      </Link>

                      <div className="mt-12 max-w-3xl sm:mt-16">
                        {/* <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.24em] text-[#E8CC8B] sm:text-sm">
                          <span
                            aria-hidden="true"
                            className="h-px w-8 bg-[#D9B66D]"
                          />
                          VictoryCity departments
                        </p> */}

                        <h1 className=" font-display text-5xl font-normal leading-[1.04] tracking-tight text-[#E8CC8B] sm:text-6xl lg:text-7xl">
                          {department.name}
                        </h1>

                        <p className="mt-6 max-w-2xl text-base leading-7 text-white/80 sm:text-lg sm:leading-8">
                          {department.shortDescription ??
                            `Discover the work of the ${department.name.toLowerCase()} department and learn how to connect with the team.`}
                        </p>

                        <div
                          aria-hidden="true"
                          className="mt-8 h-1 w-20 rounded-full bg-gradient-to-r from-[#D9B66D] to-[#E8CC8B]/20"
                        />
                      </div>
                    </div>
                  </section>

                  {/* Department information and team */}
                  <section className="bg-[#F7F8FA] py-12 sm:py-16 lg:py-20">
                    <div className="mx-auto grid max-w-7xl gap-8 px-5 sm:px-8 lg:grid-cols-[1.5fr_0.8fr] lg:px-10">
                      <div className="space-y-8">
                        <article className="rounded-2xl border border-[#E4E7EC] bg-white p-6 sm:p-8">
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9A772E]">
                            About the department
                          </p>

                          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#101B33]">
                            Serving the church together
                          </h2>

                          <p className="mt-4 whitespace-pre-line text-sm leading-7 text-[#667085]">
                            {department.description ??
                              `More information about the ${department.name.toLowerCase()} department will be added here once it has been confirmed by the church.`}
                          </p>

                          {department.mission && (
                            <div className="mt-7 border-t border-[#EAECF0] pt-6">
                              <h3 className="text-lg font-semibold text-[#101B33]">
                                Our mission
                              </h3>

                              <p className="mt-2 whitespace-pre-line text-sm leading-7 text-[#667085]">
                                {department.mission}
                              </p>
                            </div>
                          )}
                        </article>

                        <article className="rounded-2xl border border-[#E4E7EC] bg-white p-6 sm:p-8">
                          <div className="flex flex-wrap items-end justify-between gap-3">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9A772E]">
                                The people who serve
                              </p>

                              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#101B33]">
                                Meet the team
                              </h2>
                            </div>

                            <span className="text-sm text-[#667085]">
                              {department.members.length} public
                              profile
                              {department.members.length === 1
                                ? ""
                                : "s"}
                            </span>
                          </div>

                          {department.members.length === 0 ? (
                            <p className="mt-5 rounded-xl bg-[#F7F8FA] p-5 text-sm leading-6 text-[#667085]">
                              Team profiles will appear here after the
                              church has approved the members’ names
                              and public information.
                            </p>
                          ) : (
                            <ul className="mt-8 grid items-stretch gap-3 md:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
                              {department.members.map((member) => (
                                <MemberCard
                                  key={member.id}
                                  member={member}
                                  departmentSlug={department.slug}
                                />
                              ))}
                            </ul>
                          )}
                        </article>
                      </div>

                      <aside className="space-y-5">
                        <section className="rounded-2xl bg-[#101B33] p-6 text-white sm:p-7">
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#E6C77D]">
                            Get connected
                          </p>

                          <h2 className="mt-3 text-xl font-semibold">
                            Interested in serving?
                          </h2>

                          <p className="mt-3 text-sm leading-6 text-white/70">
                            Visit VictoryCity and speak with a church
                            leader about the department and current
                            opportunities to participate.
                          </p>

                          {department.contactLabel &&
                          department.contactUrl ? (
                            <a
                              href={department.contactUrl}
                              className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-[#D9B66D] px-5 text-sm font-semibold text-[#101B33] transition hover:bg-[#E8CC8B]"
                            >
                              {department.contactLabel}
                            </a>
                          ) : (
                            <a
                              href="https://wa.me/2348103653130?text=Hello%2C%20I%20would%20like%20to%20speak%20with%20you."
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#25D366] px-6 py-2 text-sm font-medium text-white transition hover:bg-[#20BA5A]"
                            >
                              Let&apos;s talk
                              <span aria-hidden="true">→</span>
                            </a>
                          )}
                        </section>

                        {department.meetingInformation && (
                          <section className="rounded-2xl border border-[#E4E7EC] bg-white p-6 sm:p-7">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9A772E]">
                              Gatherings
                            </p>

                            <h2 className="mt-2 text-lg font-semibold text-[#101B33]">
                              Meeting information
                            </h2>

                            <p className="mt-3 whitespace-pre-line text-sm leading-6 text-[#667085]">
                              {department.meetingInformation}
                            </p>
                          </section>
                        )}

                        <Link
                          href="/departments"
                          className="flex min-h-12 items-center justify-between rounded-xl border border-[#D0D5DD] bg-white px-5 text-sm font-semibold text-[#101B33] transition hover:border-[#D9B66D]"
                        >
                          Explore other departments
                          <span aria-hidden="true">→</span>
                        </Link>
                      </aside>
                    </div>
                  </section>
                </>
              );
            })()}
          </>
        )}
      </main>

      <SiteFooter />
    </>
  );
}
