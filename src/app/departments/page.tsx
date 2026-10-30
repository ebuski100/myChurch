import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import Image from "next/image";
import { SiteFooter, SiteHeader } from "../_components/site-chrome";
import {
  getPublishedDepartments,
  type PublicDepartment,
} from "@/lib/department-data";
import {
  ChoirSceneIllustration,
  CtaCrossArtwork,
  DepartmentIcon,
  HeroCommunityIllustration,
  InfoIcon,
} from "./_components/department-artwork";

export const metadata: Metadata = {
  title: "Departments | VictoryCity Revival Ministry",
  description:
    "Explore the departments serving at VictoryCity Revival Ministry — different gifts, one mission. Find where you can serve, grow, and make an impact.",
};

export const instant = false;

const CHURCH_PHONE = "08069552039";

/** Canonical order and card copy shown in the reference design. */
const CARD_ORDER = [
  "choir",
  "media",
  "pastors",
  "ushering",
  "intercessory",
];

const CARD_FALLBACK_COPY: Record<
  string,
  { name: string; detail: string }
> = {
  choir: {
    name: "Choir",
    detail:
      "Worship through music and help lead our church in praise.",
  },
  media: {
    name: "Media",
    detail: "Share the gospel through creative media and technology.",
  },
  pastors: {
    name: "Pastors",
    detail: "Shepherd, teach and lead the church in God's Word.",
  },
  ushering: {
    name: "Ushering",
    detail: "Welcome & serve with excellence at every service.",
  },
  intercessory: {
    name: "Intercessory",
    detail: "Pray for our church, our community and beyond.",
  },
};

function orderDepartments(
  departments: PublicDepartment[],
): PublicDepartment[] {
  const bySlug = new Map(departments.map((d) => [d.slug, d]));
  const ordered = CARD_ORDER.flatMap((slug) =>
    bySlug.has(slug) ? [bySlug.get(slug)!] : [],
  );
  const extras = departments.filter(
    (d) => !CARD_ORDER.includes(d.slug),
  );
  return [...ordered, ...extras];
}

function cardDetail(department: PublicDepartment): string {
  if (department.shortDescription?.trim())
    return department.shortDescription;
  return (
    CARD_FALLBACK_COPY[department.slug]?.detail ??
    `Learn about the ${department.name.toLowerCase()} department and how to get involved.`
  );
}

function DepartmentCard({
  department,
}: {
  department: PublicDepartment;
}) {
  const fallback = CARD_FALLBACK_COPY[department.slug];
  return (
    <Link
      href={`/departments/${department.slug}`}
      aria-label={`Learn more about the ${department.name} department`}
      className="group flex flex-col overflow-hidden rounded-lg bg-white shadow-[0_2px_12px_rgba(16,27,51,0.08)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_14px_32px_rgba(16,27,51,0.16)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#9A772E]"
    >
      <div className="relative grid aspect-[16/9] place-items-center overflow-hidden bg-[#0B1B3D]">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_120%,rgba(217,182,109,0.35),transparent_55%),radial-gradient(ellipse_at_15%_0%,rgba(62,91,145,0.5),transparent_50%),linear-gradient(160deg,#12244A_0%,#0B1B3D_60%,#060D1F_100%)]"
        />
        <DepartmentIcon
          slug={department.slug}
          className="relative size-12 text-[#D9B66D] transition duration-200 group-hover:scale-110 sm:size-14"
        />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-[17px] font-bold text-[#101B33]">
          {fallback?.name ?? department.name}
        </h3>
        <p className="mt-1.5 min-h-12 flex-1 text-[13px] leading-5 text-[#667085]">
          {cardDetail(department)}
        </p>
        <span className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#C49A43] transition group-hover:gap-2.5 group-hover:text-[#785B1F]">
          Learn More
          <span aria-hidden="true">→</span>
        </span>
      </div>
    </Link>
  );
}

function InfoCell({
  icon,
  title,
  children,
}: {
  icon: "people" | "calendar" | "pin" | "user";
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-4 px-2 py-2 sm:px-6 sm:py-1">
      <span aria-hidden="true" className="shrink-0 text-[#D9B66D]">
        <InfoIcon name={icon} />
      </span>
      <div>
        <h3 className="text-sm font-bold text-[#101B33]">{title}</h3>
        <div className="mt-1 text-[13px] leading-5 text-[#667085]">
          {children}
        </div>
      </div>
    </div>
  );
}

function DepartmentsHero() {
  return (
    <section
      aria-labelledby="departments-hero-heading"
      className="relative isolate overflow-hidden bg-[#0B1428]"
    >
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_82%_110%,rgba(217,182,109,0.35),transparent_40%),radial-gradient(ellipse_at_55%_-20%,rgba(43,74,128,0.7),transparent_55%),linear-gradient(115deg,#0B1428_0%,#0F2148_55%,#0B1428_100%)]" />
        <div className="absolute -right-24 top-0 h-full w-[520px] -skew-x-12 border-l border-[#D9B66D]/40 bg-gradient-to-b from-transparent via-[#D9B66D]/[0.06] to-transparent" />
        <div className="absolute -right-8 top-0 h-full w-px -skew-x-12 bg-[#D9B66D]/50" />
      </div>
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 pb-16 pt-36 sm:px-8 sm:pt-40 lg:grid-cols-2 lg:gap-6 lg:px-10 lg:pb-20">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D9B66D]">
            Our Departments
          </p>
          <h1
            id="departments-hero-heading"
            className="mt-4 font-display text-5xl font-normal leading-[1.05] tracking-tight text-white sm:text-6xl"
          >
            Different Gifts.
            <br />
            <span className="text-[#D9B66D]">One Mission.</span>
          </h1>
          <p className="mt-6 max-w-md text-[15px] leading-7 text-white/70">
            Our church is built on a family of believers, each serving
            with unique gifts and calling. Explore our departments and
            find where you can serve, grow, and make an impact.
          </p>
        </div>
        <div className="hidden justify-end lg:flex">
          <HeroCommunityIllustration className="h-auto w-full max-w-md" />
        </div>
      </div>
    </section>
  );
}

function CardsSection({
  departments,
}: {
  departments: PublicDepartment[];
}) {
  return (
    <section
      aria-labelledby="departments-grid-heading"
      className="bg-[#F7F8FA]"
    >
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-16 lg:px-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C49A43]">
          Our Departments
        </p>
        <h2
          id="departments-grid-heading"
          className="mt-3 max-w-xl font-display text-4xl font-normal leading-tight text-[#101B33] sm:text-[44px]"
        >
          Serve. Grow. Make an Impact.
        </h2>
        <p className="mt-4 max-w-xl text-[15px] leading-7 text-[#101B33]/80">
          Each department plays a vital role in the life of our
          church. Find your place and get involved.
        </p>
        {departments.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-[#C9CDD5] bg-white p-8 text-center">
            <h3 className="text-lg font-semibold text-[#101B33]">
              Department profiles are being prepared
            </h3>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#667085]">
              Please check back soon for more information about the
              teams serving at VictoryCity Revival Ministry.
            </p>
          </div>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {departments.map((department) => (
              <DepartmentCard
                key={department.id}
                department={department}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function FeaturedSection({
  featured,
}: {
  featured: PublicDepartment | null;
}) {
  if (!featured) return null;
  const fallback = CARD_FALLBACK_COPY[featured.slug];
  return (
    <section
      aria-labelledby="featured-department-heading"
      className="bg-[#F7F8FA]"
    >
      <div className="mx-auto max-w-7xl px-5 pb-14 sm:px-8 lg:px-10">
        <div className="overflow-hidden rounded-xl bg-[#0B1428] p-6 sm:p-10 lg:p-12">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D9B66D]">
                Featured Department
              </p>
              <h2
                id="featured-department-heading"
                className="mt-3 font-display text-5xl font-normal text-white"
              >
                {fallback?.name ?? featured.name}
              </h2>
              <p className="mt-2 text-[15px] font-semibold text-[#E8CC8B]">
                {fallback
                  ? fallback.detail.split(".")[0] + "."
                  : (featured.shortDescription ?? "")}
              </p>
              <p className="mt-4 max-w-md text-sm leading-6 text-white/70">
                {featured.description?.trim() ||
                  `The ${fallback?.name ?? featured.name} is more than just a group — it's a family of worshippers who use their voices to glorify God, lead the congregation, and create an atmosphere for His presence.`}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={`/departments/${featured.slug}`}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#D9B66D] px-6 text-sm font-semibold text-[#101B33] transition-colors hover:bg-[#E8CC8B] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                >
                  Join the {fallback?.name ?? featured.name}{" "}
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>

            {/* <div className="group relative aspect-[16/10] overflow-hidden rounded-lg border border-white/15">
              <Image
                src="/images/choir.jpg"
                alt="Choir of VictoryCity Revival Ministry worshipping together"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />

             
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-[#0B1428]/90 via-[#0B1428]/25 to-[#0B1428]/10"
              />

            
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_100%,rgba(217,182,109,0.22),transparent_60%)]"
              />
            </div> */}

            <div className="group relative aspect-[16/10] overflow-hidden rounded-lg border border-white/15">
              <Image
                src="/images/choir.jpg"
                alt="Choir of VictoryCity Revival Ministry worshipping together"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />

              {/* Full-image dark navy overlay */}
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-[#0B1428]/50"
              />
            </div>
          </div>
        </div>

        <div className="grid gap-6 rounded-b-xl border border-t-0 border-[#E4E7EC] bg-white px-4 py-6 sm:grid-cols-2 sm:py-7 lg:grid-cols-4">
          <InfoCell icon="people" title="Open to All">
            <p>No audition required.</p>
            <p>Just a heart to worship.</p>
          </InfoCell>
          <div className="lg:border-l lg:border-[#E4E7EC]">
            <InfoCell icon="calendar" title="Rehearsals">
              <p>Every Sunday</p>
              <p>before service.</p>
            </InfoCell>
          </div>
          <div className="lg:border-l lg:border-[#E4E7EC]">
            <InfoCell icon="pin" title="Where We Meet">
              <p>Church Auditorium</p>
              <p>(Main Sanctuary)</p>
            </InfoCell>
          </div>
          <div className="lg:border-l lg:border-[#E4E7EC]">
            <InfoCell icon="user" title="Contact">
              <p>
                For more information, reach out to the church office.
              </p>
              <p className="mt-1 font-semibold text-[#101B33]">
                {CHURCH_PHONE}
              </p>
            </InfoCell>
          </div>
        </div>
      </div>
    </section>
  );
}

function CtaSection() {
  return (
    <section
      aria-labelledby="departments-cta-heading"
      className="relative isolate overflow-hidden bg-[#0B1428]"
    >
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[linear-gradient(100deg,#0B1428_30%,#12244A_70%,#0B1428_100%)]" />
      </div>
      <CtaCrossArtwork className="absolute -left-10 bottom-0 -z-10 h-full w-auto max-w-none opacity-90" />
      <div className="mx-auto grid max-w-7xl items-center gap-8 px-5 py-14 sm:px-8 lg:grid-cols-[1fr_auto] lg:px-10">
        <div className="lg:pl-[300px]">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D9B66D]">
            Get Involved
          </p>
          <h2
            id="departments-cta-heading"
            className="mt-3 font-display text-4xl font-normal text-white"
          >
            Find Your Place
          </h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-white/70">
            Discover the department that matches your gifts and
            passion. Together, we can make a greater impact.
          </p>
        </div>
      </div>
    </section>
  );
}

export default async function DepartmentsPage() {
  await connection();
  const result = await getPublishedDepartments();
  const departments =
    result.kind === "success"
      ? orderDepartments(result.departments)
      : [];
  const featured =
    departments.find((d) => d.slug === "choir") ??
    departments[0] ??
    null;

  return (
    <>
      <SiteHeader activeHref="/departments" />
      <main className="bg-[#F7F8FA]">
        <DepartmentsHero />
        <CardsSection departments={departments} />
        <FeaturedSection featured={featured} />
        <CtaSection />
      </main>
      <SiteFooter />
    </>
  );
}
