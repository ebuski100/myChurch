import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { SiteFooter, SiteHeader } from "../_components/site-chrome";
import { getPublishedDepartments } from "@/lib/department-data";

export const metadata: Metadata = {
  title: "Departments | VictoryCity Revival Ministry",
  description:
    "Meet the departments serving at VictoryCity Revival Ministry and learn how to connect with the church community.",
};

export const instant = false;

const departmentThemes: Record<string, { label: string; symbol: string }> = {
  choir: { label: "Worship & music", symbol: "♪" },
  media: { label: "Media & communications", symbol: "◉" },
  pastors: { label: "Pastoral leadership", symbol: "✦" },
  ushering: { label: "Welcome & hospitality", symbol: "↗" },
  intercessory: { label: "Prayer ministry", symbol: "✧" },
};

function DepartmentCard({
  department,
}: {
  department: {
    slug: string;
    name: string;
    shortDescription: string | null;
    members: { id: string }[];
  };
}) {
  const theme = departmentThemes[department.slug] ?? {
    label: "Church department",
    symbol: "✦",
  };

  return (
    <Link
      href={`/departments/${department.slug}`}
      aria-label={`Explore the ${department.name} department`}
      className="group block rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#9A772E]"
    >
      <article className="flex h-full min-h-64 flex-col overflow-hidden rounded-2xl border border-[#E4E7EC] bg-white shadow-[0_8px_30px_rgba(16,27,51,0.04)] transition-[transform,box-shadow] duration-200 group-hover:-translate-y-1 group-hover:shadow-[0_18px_42px_rgba(16,27,51,0.12)]">
        <div className="relative flex min-h-36 items-end overflow-hidden bg-[#101B33] p-6">
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[radial-gradient(circle_at_78%_15%,rgba(217,182,109,0.28),transparent_38%),linear-gradient(135deg,transparent_30%,rgba(255,255,255,0.04))]"
          />
          <span className="relative grid size-12 place-items-center rounded-2xl border border-[#D9B66D]/40 bg-white/5 text-3xl text-[#E6C77D]">
            {theme.symbol}
          </span>
          <span className="relative ml-auto rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/70">
            Department
          </span>
        </div>
        <div className="flex flex-1 flex-col p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#9A772E]">
            {theme.label}
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-[#101B33]">
            {department.name}
          </h2>
          <p className="mt-3 flex-1 text-sm leading-6 text-[#667085]">
            {department.shortDescription ??
              `Learn about the ${department.name.toLowerCase()} department, meet its approved team members, and find out how to connect.`}
          </p>
          <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#101B33]">
            Explore department
            <span
              aria-hidden="true"
              className="transition-transform group-hover:translate-x-1"
            >
              →
            </span>
          </span>
        </div>
      </article>
    </Link>
  );
}

export default async function DepartmentsPage() {
  await connection();
  const result = await getPublishedDepartments();

  return (
    <>
      <SiteHeader />
      <main>
        <section className="relative isolate overflow-hidden bg-[#101B33] pb-14 pt-44 sm:pb-16 sm:pt-48">
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_78%_35%,rgba(217,182,109,0.2),transparent_36%),radial-gradient(ellipse_at_4%_100%,rgba(62,91,145,0.2),transparent_40%)]"
          />
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#E6C77D]">
              Serving together
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
              One church. Many ways to serve.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/70 sm:text-lg sm:leading-8">
              Discover the teams that help make church life meaningful—from
              worship and prayer to hospitality, media, and pastoral care.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 text-xs font-medium text-white/75">
              {["Worship", "Service", "Community", "Prayer"].map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-white/15 bg-white/5 px-4 py-2"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#F7F8FA] py-12 sm:py-16 lg:py-20">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="mb-8 flex flex-col gap-3 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9A772E]">
                  Find your place
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#101B33] sm:text-3xl">
                  Our departments
                </h2>
              </div>
              <p className="max-w-xl text-sm leading-6 text-[#667085]">
                Every department contributes to the life of the church. Select a
                department to learn more about its work and team.
              </p>
            </div>

            {result.kind === "error" ? (
              <div role="alert" className="rounded-2xl border border-[#E4E7EC] bg-white p-8 text-center">
                <h3 className="text-lg font-semibold text-[#101B33]">
                  Departments are temporarily unavailable
                </h3>
                <p className="mt-2 text-sm leading-6 text-[#667085]">
                  Please try again later.
                </p>
              </div>
            ) : result.departments.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#C9CDD5] bg-white p-8 text-center">
                <h3 className="text-lg font-semibold text-[#101B33]">
                  Department profiles are being prepared
                </h3>
                <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#667085]">
                  Please check back soon for more information about the teams
                  serving at VictoryCity Revival Ministry.
                </p>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {result.departments.map((department) => (
                  <DepartmentCard key={department.id} department={department} />
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="bg-white py-12 sm:py-16">
          <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-10">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9A772E]">
                Get connected
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#101B33]">
                Interested in serving?
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#667085]">
                Visit the church and speak with a church leader to learn about
                current opportunities to get involved.
              </p>
            </div>
            <Link
              href="/#visit"
              className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full bg-[#101B33] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#1D3158] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#9A772E]"
            >
              Plan your visit
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
