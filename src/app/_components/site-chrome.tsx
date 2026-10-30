"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";

const navigation = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Sermons", href: "/sermons" },
  { label: "Events", href: "/events" },
  { label: "Services", href: "/#services" },
  { label: "Departments", href: "/departments" },
];

function isNavigationItemActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  // Services links to a section on the homepage, not a separate page.
  if (href.startsWith("/#")) {
    return false;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

const activeLinkClass =
  "relative pb-1.5 text-[#E8CC8B] after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:rounded-full after:bg-[#D9B66D]";

const inactiveLinkClass = "text-white/75 hover:text-white";

const focusClass =
  "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E6C77D]";

export function ArrowIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      className="size-4"
    >
      <path
        d="M4 10h12m-5-5 5 5-5 5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// function Brand() {
//   return (
//     <Link
//       href="/"
//       aria-label="VictoryCity Revival Ministry home"
//       className="inline-flex items-center gap-3"
//     >
//       <span
//         aria-hidden="true"
//         className="grid size-10 place-items-center rounded-full border border-white/25 bg-white/10 text-[#E6C77D]"
//       >
//         <svg viewBox="0 0 24 24" fill="none" className="size-5">
//           <path
//             d="M12 3v18M5 9h14M7 17l5-5 5 5"
//             stroke="currentColor"
//             strokeWidth="1.5"
//             strokeLinecap="round"
//             strokeLinejoin="round"
//           />
//         </svg>
//       </span>

//       <span className="leading-tight">
//         <span className="block text-sm font-semibold tracking-wide text-white">
//           VictoryCity
//         </span>
//         <span className="mt-1 block text-[10px] font-medium uppercase tracking-[0.16em] text-white/65">
//           Revival Ministry
//         </span>
//       </span>
//     </Link>
//   );
// }

function Brand() {
  return (
    <Link
      href="/"
      aria-label="VictoryCity Revival Ministry home"
      className="inline-flex items-center gap-3"
    >
      <Image
        src="/images/victory-city-logo.png"
        alt="VictoryCity Revival Ministry logo"
        width={48}
        height={48}
        priority
        className="size-12 rounded-full shrink-0 object-contain"
      />

      <span className="leading-tight">
        <span className="block text-sm font-semibold tracking-wide text-white">
          VictoryCity
        </span>
        <span className="mt-1 block text-[10px] font-medium uppercase tracking-[0.16em] text-white/65">
          Revival Ministry
        </span>
      </span>
    </Link>
  );
}

export function SiteHeader({
  activeHref,
}: { activeHref?: string } = {}) {
  const pathname = usePathname();

  return (
    <header className="fixed left-0 inset-x-0 top-0 z-10 border-b border-white/10 bg-[#0B1220]">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8 lg:px-10">
        <Brand />

        <nav
          aria-label="Main navigation"
          className="hidden items-center gap-7 lg:flex lg:gap-8"
        >
          {navigation.map((item) => {
            const isActive =
              activeHref !== undefined
                ? activeHref === item.href
                : isNavigationItemActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`relative pb-1.5 text-sm transition-colors ${focusClass} ${
                  isActive ? activeLinkClass : inactiveLinkClass
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/#visit"
          className={`rounded-full bg-[#D9B66D] px-4 py-2.5 text-xs font-semibold text-[#101B33] transition-colors hover:bg-[#E8CC8B] ${focusClass} focus-visible:outline-white sm:px-5 sm:text-sm`}
        >
          Plan Your Visit
        </Link>
      </div>

      <nav
        aria-label="Mobile navigation"
        className="flex gap-5 overflow-x-auto px-5 pb-3 lg:hidden"
      >
        {navigation.map((item) => {
          const isActive =
            activeHref !== undefined
              ? activeHref === item.href
              : isNavigationItemActive(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`shrink-0 text-xs transition-colors ${focusClass} ${
                isActive ? activeLinkClass : inactiveLinkClass
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="bg-[#0B1428] text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-8 md:grid-cols-[1.3fr_1fr_1fr_1fr] lg:px-10">
        <div>
          <Brand />
          <p className="mt-5 max-w-xs text-sm leading-6 text-white/55">
            Massive Grace Explosion. We look forward to welcoming you.
          </p>
        </div>

        <nav aria-label="Footer">
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-white/45">
            Explore
          </h2>
          <ul className="mt-4 space-y-3">
            {[
              { label: "About", href: "/about" },
              { label: "Sermons", href: "/sermons" },
              { label: "Events", href: "/events" },
            ].map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`text-sm text-white/75 hover:text-white ${focusClass}`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Footer ministries">
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-white/45">
            Ministries
          </h2>
          <ul className="mt-4 space-y-3">
            {[
              { label: "Services", href: "/#services" },
              { label: "Departments", href: "/departments" },
            ].map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`text-sm text-white/75 hover:text-white ${focusClass}`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-white/45">
            Service times
          </h2>
          <p className="mt-4 text-sm leading-6 text-white/75">
            Sunday · 8:00 AM – 11:00 AM
            <br />
            Wednesday · 4:00 PM – 6:00 PM
          </p>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-5 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
          <p>VictoryCity Revival Ministry. All rights reserved.</p>
          <a
            href="https://web.facebook.com/profile.php?id=100067393373513"
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-2 text-white/65 hover:text-white ${focusClass}`}
          >
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="size-4"
              aria-hidden="true"
            >
              <path d="M13.5 21v-7.2h2.4l.4-2.8h-2.8V9.2c0-.8.2-1.4 1.4-1.4h1.5V5.3c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8v2H8v2.8h2.5V21h3Z" />
            </svg>
            Follow us on Facebook
            <ArrowIcon />
          </a>
        </div>
      </div>
    </footer>
  );
}
