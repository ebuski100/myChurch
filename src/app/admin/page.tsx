import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { getAdminAccess } from "@/lib/admin-auth";
import Image from "next/image";
import {
  getAdminDashboardCounts,
  type AdminDashboardCounts,
} from "@/lib/admin-dashboard-data";
import {
  AdminSectionIcon,
  AdminWorkspace,
  type AdminWorkspaceSection,
} from "./admin-shell";

export const instant = false;

const countCards = [
  {
    id: "sermons",
    label: "Published sermons",
    key: "sermons",
    description: "Audio messages ready for the public library.",
    icon: "sermons",
    tint: "bg-[#F8F4E9] text-[#9A772E]",
  },
  {
    id: "events",
    label: "Published events",
    key: "events",
    description: "Gatherings currently visible to visitors.",
    icon: "events",
    tint: "bg-[#F0F5F2] text-[#4B7660]",
  },
] as const;

function CountCards({ counts }: { counts: AdminDashboardCounts }) {
  const hasError = Object.values(counts).some(
    (count) => count === null,
  );

  return (
    <>
      {hasError && (
        <p
          role="status"
          className="mb-5 rounded-xl border border-[#F2D7A1] bg-[#FFF9EC] px-4 py-3 text-sm leading-6 text-[#77591F]"
        >
          Some summary counts could not be loaded. Other available
          counts are still shown.
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {countCards.map((card) => {
          const count = counts[card.key];
          return (
            <article
              id={card.id}
              key={card.key}
              className="scroll-mt-6 rounded-2xl border border-[#E4E7EC] bg-white p-5 shadow-[0_4px_18px_rgba(16,27,51,0.035)] sm:p-6"
            >
              <div className="flex items-start justify-between gap-3">
                <span
                  className={`grid size-11 place-items-center rounded-xl ${card.tint}`}
                >
                  <AdminSectionIcon name={card.icon} />
                </span>
                <span className="rounded-full border border-[#EAECF0] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#667085]">
                  Published
                </span>
              </div>
              <p className="mt-5 text-sm font-medium text-[#667085]">
                {card.label}
              </p>
              <p
                className="mt-1 text-3xl font-semibold tracking-tight text-[#101B33]"
                aria-label={
                  count === null
                    ? `${card.label} count unavailable`
                    : `${count} ${card.label.toLowerCase()}`
                }
              >
                {count === null ? "—" : count}
              </p>
              <p className="mt-2 min-h-10 text-xs leading-5 text-[#8A93A3]">
                {count === null
                  ? "Count unavailable. Check the Supabase connection and try again."
                  : count === 0
                    ? "No published items yet."
                    : card.description}
              </p>
            </article>
          );
        })}
      </div>
    </>
  );
}

async function DashboardOverview() {
  const counts = await getAdminDashboardCounts();

  return <CountCards counts={counts} />;
}

function DashboardLoading() {
  return (
    <div aria-live="polite" aria-busy="true">
      <p className="mb-4 text-sm text-[#667085]">
        Loading published content counts…
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {[0, 1].map((item) => (
          <div
            key={item}
            aria-hidden="true"
            className="h-52 animate-pulse rounded-2xl border border-[#E4E7EC] bg-white"
          />
        ))}
      </div>
    </div>
  );
}

function PreviewLink({
  href,
  label,
  detail,
  icon,
}: {
  href: string;
  label: string;
  detail: string;
  icon: AdminWorkspaceSection;
}) {
  return (
    <Link
      href={href}
      className="group flex min-h-16 items-center gap-4 rounded-xl border border-[#EAECF0] bg-white px-4 py-3 transition-colors hover:border-[#D9B66D] hover:bg-[#FFFEFB] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9A772E]"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-[#F3F4F6] text-[#475467] transition-colors group-hover:bg-[#F8F4E9] group-hover:text-[#785B1F]">
        <AdminSectionIcon name={icon} className="size-[18px]" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-[#101B33]">
          {label}
        </span>
        <span className="mt-1 block text-xs leading-5 text-[#667085]">
          {detail}
        </span>
      </span>
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        fill="none"
        className="size-4 shrink-0 text-[#98A2B3] transition-transform group-hover:translate-x-0.5 group-hover:text-[#785B1F]"
      >
        <path
          d="M4 10h12m-5-5 5 5-5 5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Link>
  );
}

export default async function AdminPage() {
  await connection();
  const access = await getAdminAccess();

  if (access.status === "unauthenticated") redirect("/admin/login");
  if (access.status === "forbidden")
    redirect("/admin/login?error=not_admin");

  return (
    <AdminWorkspace activeSection="overview">
      <main
        id="overview"
        className="mx-auto w-full max-w-[1500px] px-5 py-7 sm:px-8 sm:py-9 xl:px-10"
      >
        <div className="mb-7 hidden items-center justify-between lg:flex">
          <div className="flex items-center gap-2 text-xs text-[#98A2B3]">
            <span>Admin</span>
            <span aria-hidden="true">/</span>
            <span className="font-medium text-[#475467]">
              Overview
            </span>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-[#E4E7EC] bg-white px-3 py-1.5 text-xs font-medium text-[#475467]">
            <span className="size-1.5 rounded-full bg-[#63A67A]" />
            Authorized session
          </span>
        </div>

        <section className="relative isolate overflow-hidden rounded-2xl bg-[#101B33] px-6 py-7 shadow-[0_12px_32px_rgba(16,27,51,0.12)] sm:px-8 sm:py-9">
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_84%_18%,rgba(217,182,109,0.2),transparent_35%),radial-gradient(ellipse_at_2%_100%,rgba(62,91,145,0.24),transparent_44%)]"
          />
          <div
            aria-hidden="true"
            className="absolute -right-16 -top-24 -z-10 size-72 rounded-full border border-white/[0.07] sm:right-[9%] sm:size-96"
          >
            <div className="absolute inset-8 rounded-full border border-[#D9B66D]/15" />
            <div className="absolute inset-16 rounded-full border border-white/[0.06]" />
          </div>
          <div className="relative max-w-3xl">
            <p className="mb-4 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#E6C77D] sm:text-xs">
              <span className="h-px w-6 bg-[#D9B66D]" />
              VictoryCity Revival Ministry
            </p>
            <h1 className="text-3xl font-semibold leading-tight tracking-[-0.035em] text-white sm:text-4xl">
              Welcome to your content workspace.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65 sm:text-base sm:leading-7">
              See what is currently published across the ministry and
              preview the public pages. Your editorial tools will grow
              here in the next phase.
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex min-h-10 items-center gap-2 rounded-full bg-[#D9B66D] px-4 text-sm font-semibold text-[#101B33] transition-colors hover:bg-[#E8CC8B] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            >
              Preview website <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </section>

        <section aria-labelledby="summary-heading" className="mt-9">
          <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9A772E]">
                At a glance
              </p>
              <h2
                id="summary-heading"
                className="mt-2 text-xl font-semibold tracking-tight text-[#101B33] sm:text-2xl"
              >
                Published content
              </h2>
            </div>
            <p className="text-xs leading-5 text-[#8A93A3]">
              Counts include items visible to the public right now.
            </p>
          </div>
          <Suspense fallback={<DashboardLoading />}>
            <DashboardOverview />
          </Suspense>
        </section>

        <section
          aria-labelledby="quick-access-heading"
          className="mt-9 grid gap-6 xl:grid-cols-[1.35fr_0.9fr]"
        >
          <div className="rounded-2xl border border-[#E4E7EC] bg-white p-5 shadow-[0_4px_18px_rgba(16,27,51,0.035)] sm:p-6">
            <div className="mb-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9A772E]">
                Quick access
              </p>
              <h2
                id="quick-access-heading"
                className="mt-2 text-xl font-semibold tracking-tight text-[#101B33]"
              >
                Preview public pages
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#667085]">
                Check how published ministry content appears to
                visitors.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <PreviewLink
                href="/sermons"
                label="Sermon library"
                detail="Listen to published messages"
                icon="sermons"
              />
              <PreviewLink
                href="/events"
                label="Events page"
                detail="See public event information"
                icon="events"
              />
              <PreviewLink
                href="/departments"
                label="Departments"
                detail="Preview church departments and approved members"
                icon="departments"
              />
              <PreviewLink
                href="/admin/departments"
                label="Manage departments"
                detail="Edit department profiles and member visibility"
                icon="departments"
              />
              <PreviewLink
                href="/about"
                label="About the ministry"
                detail="Preview the public introduction"
                icon="overview"
              />
            </div>
          </div>

          <aside className="rounded-2xl border border-[#E9E0CB] bg-[#FBF8F0] p-5 sm:p-6">
            {/* <span className="grid size-10 place-items-center rounded-xl bg-white text-[#9A772E] shadow-sm">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="size-5"><path d="M12 3v18M5 9h14M7 17l5-5 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg></span> */}

            <Image
              src="/images/victory-city-logo.png"
              alt="VictoryCity Revival Ministry logo"
              width={48}
              height={48}
              priority
              className="size-12 shrink-0 rounded-full object-contain"
            />

            <h2 className="mt-4 text-base font-semibold text-[#101B33]">
              A note for this phase
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#667085]">
              This overview is read-only. Content editing, uploads,
              and publishing controls are not available here yet.
            </p>
            <div className="mt-5 border-t border-[#E8DEC6] pt-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#785B1F]">
                Your access
              </p>
              <p className="mt-1 text-sm text-[#475467]">
                Signed in with an authorized admin account.
              </p>
            </div>
          </aside>
        </section>

        <footer className="mt-10 flex flex-col gap-3 border-t border-[#E4E7EC] py-5 text-xs text-[#98A2B3] sm:flex-row sm:items-center sm:justify-between">
          <span>VictoryCity Revival Ministry · Admin workspace</span>
          <Link
            href="/"
            className="font-medium text-[#667085] hover:text-[#101B33] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9A772E]"
          >
            Return to public website
          </Link>
        </footer>
      </main>
    </AdminWorkspace>
  );
}
