import type { ReactNode } from "react";
import Link from "next/link";
import { signOutAction } from "./actions";

export type AdminWorkspaceSection =
  | "overview"
  | "sermons"
  | "events"
  | "departments";

const sections: {
  id: AdminWorkspaceSection;
  label: string;
  href: string;
}[] = [
  { id: "overview", label: "Overview", href: "/admin#overview" },
  { id: "sermons", label: "Sermons", href: "/admin/sermons" },
  { id: "events", label: "Events", href: "/admin/events" },
  {
    id: "departments",
    label: "Departments",
    href: "/admin/departments",
  },
];

function MinistryMark({ dark = false }: { dark?: boolean }) {
  return (
    <Link
      href="/admin#overview"
      className="inline-flex items-center gap-3"
      aria-label="VictoryCity admin overview"
    >
      <span
        className={`grid size-10 place-items-center rounded-full border ${dark ? "border-white/20 bg-white/10 text-[#E6C77D]" : "border-[#D9B66D]/40 bg-[#D9B66D]/10 text-[#9A772E]"}`}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          className="size-5"
        >
          <path
            d="M12 3v18M5 9h14M7 17l5-5 5 5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="leading-tight">
        <span
          className={`block text-sm font-semibold tracking-wide ${dark ? "text-white" : "text-[#101B33]"}`}
        >
          VictoryCity
        </span>
        <span
          className={`mt-1 block text-[10px] font-medium uppercase tracking-[0.16em] ${dark ? "text-white/55" : "text-[#667085]"}`}
        >
          Admin workspace
        </span>
      </span>
    </Link>
  );
}

export function AdminSectionIcon({
  name,
  className = "size-5",
}: {
  name: AdminWorkspaceSection;
  className?: string;
}) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (name) {
    case "overview":
      return (
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className={className}
          {...common}
        >
          <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
          <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
          <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
          <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
        </svg>
      );
    case "sermons":
      return (
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className={className}
          {...common}
        >
          <path d="M9 18V5l11-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="17" cy="16" r="3" />
        </svg>
      );
    case "events":
      return (
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className={className}
          {...common}
        >
          <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
          <path d="M7.5 3.5v3M16.5 3.5v3M3.5 9.5h17M8 13h3M8 16.5h3M14 13h2.5" />
        </svg>
      );
    case "departments":
      return (
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className={className}
          {...common}
        >
          <circle cx="12" cy="7" r="3" />
          <circle cx="5" cy="17" r="2.5" />
          <circle cx="19" cy="17" r="2.5" />
          <path d="M10 9.5 6.5 14.5M14 9.5l3.5 5M7.5 17h9" />
        </svg>
      );
  }
}

function SignOutButton({ compact = false }: { compact?: boolean }) {
  const colors = compact
    ? "border-[#D0D5DD] text-[#475467] hover:border-[#D9B66D] hover:bg-[#FBF8F0] hover:text-[#101B33] focus-visible:outline-[#9A772E]"
    : "border-white/15 text-white/80 hover:border-[#D9B66D]/70 hover:bg-white/5 hover:text-white focus-visible:outline-[#E6C77D]";

  return (
    <form action={signOutAction}>
      <button
        type="submit"
        className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 ${colors} ${compact ? "px-3" : "w-full"}`}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          fill="none"
          className="size-4"
        >
          <path
            d="M8 4H4.5v12H8M11 6l4 4-4 4m4-4H7"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Sign out
      </button>
    </form>
  );
}

function AdminNavigation({
  activeSection,
  mobile = false,
}: {
  activeSection: AdminWorkspaceSection;
  mobile?: boolean;
}) {
  return (
    <nav
      aria-label="Admin navigation"
      className={
        mobile
          ? "flex gap-2 overflow-x-auto px-5 pb-3 lg:hidden"
          : "mt-10 space-y-1"
      }
    >
      {sections.map((section) => {
        const active = section.id === activeSection;
        return (
          <Link
            key={section.id}
            href={section.href}
            aria-current={active ? "page" : undefined}
            className={
              mobile
                ? `inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9A772E] ${active ? "bg-[#101B33] text-white" : "border border-[#E4E7EC] bg-white text-[#475467] hover:border-[#D9B66D] hover:text-[#101B33]"}`
                : `flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E6C77D] ${active ? "bg-white/10 text-white" : "text-white/65 hover:bg-white/5 hover:text-white"}`
            }
          >
            <AdminSectionIcon
              name={section.id}
              className="size-[18px]"
            />
            {section.label}
            {active && !mobile && (
              <span className="ml-auto size-1.5 rounded-full bg-[#E6C77D]" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminWorkspace({
  activeSection,
  children,
}: {
  activeSection: AdminWorkspaceSection;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F5F6F8] lg:flex">
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col overflow-y-auto bg-[#101B33] px-5 py-6 lg:flex xl:w-72 xl:px-7">
        <MinistryMark dark />
        <div className="mt-12 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#E6C77D]">
            Ministry workspace
          </p>
          <p className="mt-2 text-sm leading-5 text-white/65">
            A clear view of the content shared with your community.
          </p>
        </div>
        <AdminNavigation activeSection={activeSection} />
        <div className="mt-auto border-t border-white/10 pt-5">
          <Link
            href="/"
            className="mb-4 flex min-h-10 items-center gap-3 px-3 text-sm text-white/60 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E6C77D]"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              fill="none"
              className="size-[18px]"
            >
              <path
                d="M8 4H4.5v12H8M11 6l4 4-4 4m4-4H7"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            View public website
          </Link>
          <SignOutButton />
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="border-b border-[#E4E7EC] bg-white lg:hidden">
          <div className="flex items-center justify-between px-5 py-4">
            <MinistryMark />
            <SignOutButton compact />
          </div>
          <AdminNavigation activeSection={activeSection} mobile />
        </header>
        {children}
      </div>
    </div>
  );
}
