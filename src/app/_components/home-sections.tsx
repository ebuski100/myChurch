import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { io } from "next/cache";
import { getPublishedSermonLibrary } from "@/lib/sermon-data";
import {
  getPublishedDepartments,
  type PublicDepartment,
} from "@/lib/department-data";
import type { SermonWithMedia } from "@/lib/sermon-media-display";
import { formatDuration } from "@/lib/sermons";
import { ArrowIcon } from "./site-chrome";
import { HomeArtwork } from "./home-artwork";

/* ---------------------------------- shared --------------------------------- */

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#9A772E]">
      {children}
    </p>
  );
}

function EyebrowOnDark({ children }: { children: ReactNode }) {
  return (
    <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#E6C77D]">
      {children}
    </p>
  );
}

function formatSermonDate(date: string | null): string | null {
  if (!date) return null;
  const parsed = new Date(`${date}T00:00:00Z`);
  if (!Number.isFinite(parsed.getTime())) return date;
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(parsed);
}

/* ---------------------------------- welcome --------------------------------- */

function ValueItem({
  title,
  detail,
  icon,
}: {
  title: string;
  detail: string;
  icon: ReactNode;
}) {
  return (
    <div className="flex items-start gap-4">
      <span
        aria-hidden="true"
        className="grid size-11 shrink-0 place-items-center rounded-full bg-[#F8F4E9] text-[#9A772E]"
      >
        {icon}
      </span>
      <div>
        <h3 className="text-sm font-semibold text-[#101B33]">
          {title}
        </h3>
        <p className="mt-1 text-sm leading-6 text-[#667085]">
          {detail}
        </p>
      </div>
    </div>
  );
}

export function WelcomeSection() {
  return (
    <section
      aria-labelledby="welcome-heading"
      className="scroll-mt-8 bg-white py-20 sm:py-24"
    >
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 sm:px-8 lg:grid-cols-[0.9fr_1.1fr_0.8fr] lg:gap-12 lg:px-10">
        <div>
          <Eyebrow>Welcome to VictoryCity</Eyebrow>
          <h2
            id="welcome-heading"
            className="font-display text-3xl font-normal leading-tight tracking-tight text-[#101B33] sm:text-4xl"
          >
            A community ready to welcome you.
          </h2>
          <p className="mt-5 max-w-xl leading-7 text-[#667085]">
            VictoryCity Revival Ministry is a place to gather,
            worship, and grow in community. Whether you are joining us
            for the first time or returning, you are welcome here.
          </p>
          <Link
            href="/about"
            className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#D9B66D] px-6 text-sm font-semibold text-[#101B33] transition-colors hover:bg-[#E8CC8B] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#9A772E]"
          >
            Learn More About Us <ArrowIcon />
          </Link>
        </div>
        <div className="space-y-7 border-t border-[#E4E7EC] pt-8 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
          <ValueItem
            title="Real People"
            detail="A friendly church family"
            icon={
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="size-5"
                aria-hidden="true"
              >
                <circle
                  cx="9"
                  cy="8"
                  r="3.2"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="M3.5 19c.6-3 2.8-4.5 5.5-4.5s4.9 1.5 5.5 4.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <circle
                  cx="16.5"
                  cy="9"
                  r="2.4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="M16 14.6c2.3.2 3.9 1.6 4.4 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            }
          />
          <ValueItem
            title="Authentic Worship"
            detail="God-centered & Spirit-filled"
            icon={
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="size-5"
                aria-hidden="true"
              >
                <path
                  d="M12 20s-7-4.3-7-9.5A4 4 0 0 1 12 7a4 4 0 0 1 7 3.5C19 15.7 12 20 12 20Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </svg>
            }
          />
          <ValueItem
            title="Spiritual Growth"
            detail="For every season of life"
            icon={
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="size-5"
                aria-hidden="true"
              >
                <path
                  d="M12 21v-8"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <path
                  d="M12 13c0-3.5 2.5-6 6-6 0 3.5-2.5 6-6 6Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 13c0-3.5-2.5-6-6-6 0 3.5 2.5 6 6 6Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </svg>
            }
          />
          <p className="font-display text-xl italic text-[#9A772E]">
            You are welcome here
          </p>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ featured sermons ---------------------------- */

function SermonCard({ sermon }: { sermon: SermonWithMedia }) {
  const isVideo = sermon.mediaType === "video" && sermon.video;
  const href = isVideo
    ? `/sermons/${encodeURIComponent(sermon.id)}`
    : "/sermons";
  const label = isVideo
    ? `Watch video sermon: ${sermon.title}`
    : `Listen to sermon in the library: ${sermon.title}`;
  const date = formatSermonDate(sermon.date);
  const duration = formatDuration(sermon.durationSeconds);

  return (
    <Link
      href={href}
      aria-label={label}
      className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_8px_30px_rgba(16,27,51,0.18)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_18px_42px_rgba(16,27,51,0.28)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E6C77D]"
    >
      <div className="relative aspect-video overflow-hidden bg-[#101B33]">
        {isVideo && sermon.video ? (
          <Image
            src={sermon.video.thumbnailUrl}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="object-cover object-center transition duration-300 group-hover:scale-105"
          />
        ) : (
          <HomeArtwork
            slot="sermon"
            className="absolute inset-0 h-full w-full"
          />
        )}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-[#101B33]/50 via-transparent to-transparent"
        />
        <span className="absolute inset-0 grid place-items-center">
          <span className="grid size-12 place-items-center rounded-full border border-white/50 bg-white/95 text-[#101B33] shadow-lg transition duration-200 group-hover:scale-110 group-hover:bg-[#D9B66D]">
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="ml-0.5 size-5"
              aria-hidden="true"
            >
              <path d="M8 5.8c0-.78.85-1.26 1.52-.86l9.52 5.7a1.6 1.6 0 0 1 0 2.74l-9.52 5.7A1 1 0 0 1 8 18.22V5.8Z" />
            </svg>
          </span>
        </span>
        {duration && (
          <span className="absolute bottom-3 right-3 rounded-md bg-[#101B33]/90 px-2 py-1 text-xs font-medium tabular-nums text-white">
            {duration}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="line-clamp-2 text-base font-semibold leading-6 text-[#101B33] transition group-hover:text-[#785B1F]">
          {sermon.title}
        </h3>
        <p className="mt-2 text-xs text-[#667085] sm:text-sm">
          {sermon.preacher || "Preacher not provided"}
          {date ? ` · ${date}` : null}
        </p>
        <div className="mt-4 flex items-center justify-between border-t border-[#F0F1F3] pt-3">
          {sermon.category ? (
            <span className="rounded-full bg-[#F8F4E9] px-3 py-1 text-[11px] font-semibold text-[#785B1F]">
              {sermon.category}
            </span>
          ) : (
            <span className="text-xs font-semibold text-[#785B1F]">
              {isVideo ? "Watch message" : "Listen in library"}
            </span>
          )}
          <svg
            viewBox="0 0 20 20"
            fill="none"
            className="size-4 text-[#785B1F] transition group-hover:translate-x-1"
            aria-hidden="true"
          >
            <path
              d="M4.5 10h11m0 0-4-4m4 4-4 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </Link>
  );
}

async function FeaturedSermonsContent() {
  await io();
  const result = await getPublishedSermonLibrary();

  if (result.kind === "error") {
    return (
      <div
        role="alert"
        className="rounded-2xl border border-white/15 bg-white/5 px-6 py-10 text-center"
      >
        <h3 className="text-lg font-semibold text-white">
          Sermons are temporarily unavailable
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/60">
          We couldn&apos;t load the latest messages. Please visit the
          sermon library to try again.
        </p>
        <Link
          href="/sermons"
          className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#D9B66D] px-5 text-sm font-semibold text-[#101B33] transition-colors hover:bg-[#E8CC8B] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
        >
          Open sermon library <ArrowIcon />
        </Link>
      </div>
    );
  }

  const featured = result.sermons.slice(0, 3);

  if (featured.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 px-6 py-10 text-center">
        <h3 className="text-lg font-semibold text-white">
          Messages are on the way
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/60">
          There are no published messages yet. Join us in person for a
          service — recordings will appear here when available.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {featured.map((sermon) => (
        <SermonCard key={sermon.id} sermon={sermon} />
      ))}
    </div>
  );
}

export function FeaturedSermonsFallback() {
  return (
    <div
      aria-live="polite"
      aria-busy="true"
      className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
    >
      <span className="sr-only">Loading featured sermons…</span>
      {[0, 1, 2].map((item) => (
        <div
          key={item}
          aria-hidden="true"
          className="h-72 animate-pulse rounded-2xl bg-white/10"
        />
      ))}
    </div>
  );
}

export function FeaturedSermonsSection() {
  return (
    <section
      aria-labelledby="featured-sermons-heading"
      className="scroll-mt-8 bg-[#0B1428] py-20 sm:py-24"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-10 px-5 sm:px-8 lg:flex-row lg:gap-12 lg:px-10">
        <div className="lg:w-64 lg:shrink-0">
          <EyebrowOnDark>Featured sermons</EyebrowOnDark>
          <h2
            id="featured-sermons-heading"
            className="font-display text-3xl font-normal leading-tight tracking-tight text-white sm:text-4xl"
          >
            Messages to encourage your walk.
          </h2>
          <p className="mt-4 text-sm leading-6 text-white/60 sm:text-base sm:leading-7">
            Listen to recent sermons and be inspired by God&apos;s
            Word.
          </p>
          <Link
            href="/sermons"
            className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#D9B66D] px-6 text-sm font-semibold text-[#101B33] transition-colors hover:bg-[#E8CC8B] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            View All Sermons <ArrowIcon />
          </Link>
        </div>
        <div className="min-w-0 flex-1">
          <FeaturedSermonsContent />
        </div>
      </div>
    </section>
  );
}

/* -------------------------------- departments ------------------------------- */

const departmentImages: Record<string, string> = {
  choir: "/images/choir.jpg",
  media: "/images/media.jpg",
  pastors: "/images/pastor.jpg",
  ushering: "/images/ushering.png",
  intercessory: "/images/intercessory.png",
};

const departmentIcons: Record<string, ReactNode> = {
  choir: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="size-5"
      aria-hidden="true"
    >
      <path
        d="M9 18V5l12-2v13"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="6.5"
        cy="18"
        r="2.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle
        cx="18.5"
        cy="16"
        r="2.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  ),
  media: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="size-5"
      aria-hidden="true"
    >
      <rect
        x="3"
        y="7"
        width="12"
        height="10"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M15 10.5 20.5 7v10L15 13.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle
        cx="9"
        cy="12"
        r="2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  ),
  pastors: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="size-5"
      aria-hidden="true"
    >
      <path
        d="M12 6c-2-1.2-4.5-1.5-8-1.5v14c3.5 0 6 .3 8 1.5 2-1.2 4.5-1.5 8-1.5v-14c-3.5 0-6 .3-8 1.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M12 6v14" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  ushering: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="size-5"
      aria-hidden="true"
    >
      <circle
        cx="8.5"
        cy="8"
        r="3"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M3.5 19c.6-3 2.6-4.5 5-4.5s4.4 1.5 5 4.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle
        cx="16.5"
        cy="9.5"
        r="2.2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M16 14.7c2 .3 3.4 1.6 3.9 3.8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  ),
  intercessory: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="size-5"
      aria-hidden="true"
    >
      <path
        d="M7 11V6.5a1.5 1.5 0 0 1 3 0V11m0-4.5a1.5 1.5 0 0 1 3 0V11m0-3a1.5 1.5 0 0 1 3 0v6c0 3-2 6-5 6-2 0-3-1-4-2.5L4 14c-.8-1 0-2.3 1.2-2 1 .2 1.8 1 1.8 1"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
};

function DepartmentCard({
  department,
}: {
  department: PublicDepartment;
}) {
  return (
    <Link
      href={`/departments/${department.slug}`}
      aria-label={`Explore the ${department.name} department`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-[#E4E7EC] bg-white shadow-[0_8px_30px_rgba(16,27,51,0.04)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_18px_42px_rgba(16,27,51,0.12)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#9A772E]"
    >
      <div className="relative">
        <Image
          src={
            departmentImages[department.slug] ??
            "/images/departments/choir.jpg"
          }
          alt={`${department.name} department at VictoryCity Revival Ministry`}
          width={800}
          height={600}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 20vw"
          className="aspect-[4/3] w-full object-cover object-center transition duration-300 group-hover:scale-105"
        />
        <span
          aria-hidden="true"
          className="absolute -bottom-5 left-5 grid size-10 place-items-center rounded-full bg-[#D9B66D] text-[#101B33] shadow-md"
        >
          {departmentIcons[department.slug] ?? (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="size-5"
              aria-hidden="true"
            >
              <path
                d="M12 3v18M5 9h14"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          )}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5 pt-8">
        <h3 className="text-base font-semibold text-[#101B33]">
          {department.name}
        </h3>
        <p className="mt-1 line-clamp-2 flex-1 text-sm leading-6 text-[#667085]">
          {department.shortDescription ??
            "Meet the team and learn how to get involved."}
        </p>
        <span className="mt-4 inline-flex items-center justify-between text-sm font-semibold text-[#101B33]">
          <span className="sr-only">Explore {department.name}</span>
          <span
            aria-hidden="true"
            className="transition group-hover:translate-x-1"
          >
            →
          </span>
        </span>
      </div>
    </Link>
  );
}

async function DepartmentsPreviewContent() {
  await io();
  const result = await getPublishedDepartments();

  if (result.kind === "error") {
    return (
      <div
        role="alert"
        className="rounded-2xl border border-[#E4E7EC] bg-white px-6 py-10 text-center"
      >
        <h3 className="text-lg font-semibold text-[#101B33]">
          Departments are temporarily unavailable
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#667085]">
          We couldn&apos;t load the serving teams. Please visit the
          departments page to try again.
        </p>
        <Link
          href="/departments"
          className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#101B33] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#1D3158] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#9A772E]"
        >
          Open departments <ArrowIcon />
        </Link>
      </div>
    );
  }

  const preview = result.departments.slice(0, 5);

  if (preview.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#C9CDD5] bg-white px-6 py-10 text-center">
        <h3 className="text-lg font-semibold text-[#101B33]">
          Serving teams are being prepared
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#667085]">
          Please check back soon for more information about the teams
          serving at VictoryCity Revival Ministry.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {preview.map((department) => (
        <DepartmentCard key={department.id} department={department} />
      ))}
    </div>
  );
}

export function DepartmentsPreviewFallback() {
  return (
    <div
      aria-live="polite"
      aria-busy="true"
      className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
    >
      <span className="sr-only">Loading departments…</span>
      {[0, 1, 2, 3, 4].map((item) => (
        <div
          key={item}
          aria-hidden="true"
          className="h-64 animate-pulse rounded-2xl border border-[#E4E7EC] bg-white"
        />
      ))}
    </div>
  );
}

export function DepartmentsPreviewSection() {
  return (
    <section
      aria-labelledby="departments-heading"
      className="scroll-mt-8 bg-[#F3F4F6] py-20 sm:py-24"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-10 px-5 sm:px-8 lg:flex-row lg:gap-12 lg:px-10">
        <div className="lg:w-64 lg:shrink-0">
          <Eyebrow>Our departments</Eyebrow>
          <h2
            id="departments-heading"
            className="font-display text-3xl font-normal leading-tight tracking-tight text-[#101B33] sm:text-4xl"
          >
            Serving together for a greater purpose.
          </h2>
          <p className="mt-4 text-sm leading-6 text-[#667085] sm:text-base sm:leading-7">
            Each department plays a vital role in the life of our
            church. Find your place and get involved.
          </p>
          <Link
            href="/departments"
            className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#D9B66D] px-6 text-sm font-semibold text-[#101B33] transition-colors hover:bg-[#E8CC8B] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#9A772E]"
          >
            Explore All Departments <ArrowIcon />
          </Link>
        </div>
        <div className="min-w-0 flex-1">
          <DepartmentsPreviewContent />
        </div>
      </div>
    </section>
  );
}

/* ----------------------------------- visit ---------------------------------- */

/* ---------------------------------- services -------------------------------- */

export function ServicesSection() {
  const services = [
    {
      day: "Sunday",
      name: "Sunday Worship Service",
      time: "8:00 AM – 11:00 AM",
      description:
        "Gather with us for worship, the Word of God, and fellowship as a church family.",
      number: "01",
    },
    {
      day: "Wednesday",
      name: "Midweek Service",
      time: "4:00 PM – 6:00 PM",
      description:
        "Join us during the week for spiritual growth, prayer, and a deeper walk with God.",
      number: "02",
    },
  ];

  return (
    <section
      id="services"
      aria-labelledby="services-heading"
      className="scroll-mt-8 bg-[#F3F4F6] py-20 sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="mb-10 flex flex-col gap-5 sm:mb-12 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#9A772E]">
              Worship with us
            </p>
            <h2
              id="services-heading"
              className="font-display text-3xl font-normal leading-tight tracking-tight text-[#101B33] sm:text-4xl lg:text-5xl"
            >
              Make room for what matters.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-[#667085] sm:text-base">
              There is a place for you at VictoryCity Revival
              Ministry. Join us for our weekly services and grow with
              our church family.
            </p>
          </div>

          <Link
            href="/#visit"
            className="inline-flex min-h-11 w-fit items-center gap-2 rounded-full border border-[#D9B66D] px-5 text-sm font-semibold text-[#101B33] transition-colors hover:bg-[#D9B66D]/20 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#9A772E]"
          >
            Plan your visit <ArrowIcon />
          </Link>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {services.map((service) => (
            <article
              key={service.day}
              className="group relative overflow-hidden rounded-2xl border border-[#E4E7EC] bg-white p-7 shadow-[0_8px_30px_rgba(16,27,51,0.04)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_18px_42px_rgba(16,27,51,0.10)] sm:p-9"
            >
              <span
                aria-hidden="true"
                className="absolute right-6 top-4 font-display text-6xl font-normal text-[#F3F0E8] transition-colors group-hover:text-[#EDE3CB] sm:right-8 sm:top-5 sm:text-7xl"
              >
                {service.number}
              </span>

              <p className="relative text-xs font-semibold uppercase tracking-[0.18em] text-[#9A772E]">
                {service.day}
              </p>

              <h3 className="relative mt-3 max-w-sm font-display text-2xl font-normal leading-snug text-[#101B33] sm:text-3xl">
                {service.name}
              </h3>

              <p className="relative mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[#785B1F]">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="size-5"
                  aria-hidden="true"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="8.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M12 7v5l3 2"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {service.time}
              </p>

              <p className="relative mt-5 max-w-lg text-sm leading-7 text-[#667085]">
                {service.description}
              </p>
            </article>
          ))}
        </div>

        <p className="mt-7 text-center text-sm text-[#667085]">
          We look forward to welcoming you.
        </p>
      </div>
    </section>
  );
}

export function VisitSection() {
  return (
    <section
      id="visit"
      aria-labelledby="visit-heading"
      className="scroll-mt-8 bg-white py-20 sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="grid overflow-hidden rounded-3xl bg-[#101B33] md:grid-cols-[0.9fr_1.1fr_0.9fr]">
          <HomeArtwork
            slot="visit"
            className="min-h-60 sm:min-h-72 md:min-h-full"
          />
          <div className="p-7 sm:p-10 lg:p-12">
            <EyebrowOnDark>Plan your visit</EyebrowOnDark>
            <h2
              id="visit-heading"
              className="font-display text-3xl font-normal tracking-tight text-white sm:text-4xl"
            >
              We&rsquo;d love to see you.
            </h2>
            <p className="mt-4 text-sm leading-6 text-white/65 sm:text-base sm:leading-7">
              Join us at VictoryCity Revival Ministry. We&rsquo;re
              happy to help you plan your first visit.
            </p>
            <div className="mt-8 space-y-6">
              <div>
                <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/45">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="size-4 text-[#D9B66D]"
                    aria-hidden="true"
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
                  Our location
                </p>
                <p className="mt-2 text-base leading-6 text-white">
                  Coal Camp, Zone 6, Agric Quarters
                </p>
              </div>
              <div>
                <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/45">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="size-4 text-[#D9B66D]"
                    aria-hidden="true"
                  >
                    <path
                      d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Call or WhatsApp
                </p>
                <a
                  href="tel:08069552039"
                  className="mt-2 inline-block text-base text-white underline decoration-white/30 underline-offset-4 hover:decoration-[#E6C77D] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E6C77D]"
                >
                  08069552039
                </a>
              </div>
            </div>
          </div>
          <div
            id="services"
            className="scroll-mt-24 border-t border-white/10 bg-white/[0.03] p-7 sm:p-10 md:border-l md:border-t-0 lg:p-12"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#E6C77D]">
              Join us this week
            </p>
            <div className="mt-6 border-b border-white/10 pb-6">
              <p className="font-medium text-white">Sunday service</p>
              <p className="mt-1 text-sm text-white/60">
                8:00 AM – 11:00 AM
              </p>
            </div>
            <div className="pt-6">
              <p className="font-medium text-white">
                Wednesday midweek service
              </p>
              <p className="mt-1 text-sm text-white/60">
                4:00 PM – 6:00 PM
              </p>
            </div>
            <a
              href="https://www.google.com/maps/search/?api=1&query=Coal+Camp+Zone+6+Agric+Quarters"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex min-h-11 items-center gap-2 rounded-full border border-[#D9B66D]/60 px-5 text-sm font-semibold text-[#E6C77D] transition-colors hover:border-[#D9B66D] hover:bg-[#D9B66D]/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E6C77D]"
            >
              Get Directions <ArrowIcon />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
