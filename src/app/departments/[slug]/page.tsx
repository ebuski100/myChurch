import type { Metadata } from "next";
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
            <section className="relative isolate overflow-hidden bg-[#101B33] pb-14 pt-44 sm:pb-16 sm:pt-48">
              <div
                aria-hidden="true"
                className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_78%_35%,rgba(217,182,109,0.2),transparent_36%),radial-gradient(ellipse_at_4%_100%,rgba(62,91,145,0.2),transparent_40%)]"
              />
              <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
                <Link
                  href="/departments"
                  className="inline-flex items-center gap-2 text-sm font-medium text-white/70 hover:text-white"
                >
                  <span aria-hidden="true">←</span> All departments
                </Link>
                <p className="mt-8 text-xs font-semibold uppercase tracking-[0.2em] text-[#E6C77D]">
                  VictoryCity departments
                </p>
                <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
                  {result.department.name}
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-7 text-white/70 sm:text-lg sm:leading-8">
                  {result.department.shortDescription ??
                    `Discover the work of the ${result.department.name.toLowerCase()} department and learn how to connect with the team.`}
                </p>
              </div>
            </section>

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
                      {result.department.description ??
                        `More information about the ${result.department.name.toLowerCase()} department will be added here once it has been confirmed by the church.`}
                    </p>
                    {result.department.mission && (
                      <div className="mt-7 border-t border-[#EAECF0] pt-6">
                        <h3 className="text-lg font-semibold text-[#101B33]">
                          Our mission
                        </h3>
                        <p className="mt-2 whitespace-pre-line text-sm leading-7 text-[#667085]">
                          {result.department.mission}
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
                        {result.department.members.length} public
                        profile
                        {result.department.members.length === 1
                          ? ""
                          : "s"}
                      </span>
                    </div>
                    {result.department.members.length === 0 ? (
                      <p className="mt-5 rounded-xl bg-[#F7F8FA] p-5 text-sm leading-6 text-[#667085]">
                        Team profiles will appear here after the
                        church has approved the members’ names and
                        public information.
                      </p>
                    ) : (
                      <ul className="mt-8 grid md:grid-cols-2 items-stretch gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
                        {result.department.members.map((member) => (
                          <MemberCard
                            key={member.id}
                            member={member}
                            departmentSlug={result.department.slug}
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
                      Visit VictoryCity and speak with a church leader
                      about the department and current opportunities
                      to participate.
                    </p>
                    {result.department.contactLabel &&
                    result.department.contactUrl ? (
                      <a
                        href={result.department.contactUrl}
                        className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-[#D9B66D] px-5 text-sm font-semibold text-[#101B33] hover:bg-[#E8CC8B]"
                      >
                        {result.department.contactLabel}
                      </a>
                    ) : (
                      <Link
                        href="/#visit"
                        className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-[#D9B66D] px-5 text-sm font-semibold text-[#101B33] hover:bg-[#E8CC8B]"
                      >
                        Plan your visit
                      </Link>
                    )}
                  </section>
                  {result.department.meetingInformation && (
                    <section className="rounded-2xl border border-[#E4E7EC] bg-white p-6 sm:p-7">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9A772E]">
                        Gatherings
                      </p>
                      <h2 className="mt-2 text-lg font-semibold text-[#101B33]">
                        Meeting information
                      </h2>
                      <p className="mt-3 whitespace-pre-line text-sm leading-6 text-[#667085]">
                        {result.department.meetingInformation}
                      </p>
                    </section>
                  )}
                  <Link
                    href="/departments"
                    className="flex min-h-12 items-center justify-between rounded-xl border border-[#D0D5DD] bg-white px-5 text-sm font-semibold text-[#101B33] hover:border-[#D9B66D]"
                  >
                    Explore other departments{" "}
                    <span aria-hidden="true">→</span>
                  </Link>
                </aside>
              </div>
            </section>
          </>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
