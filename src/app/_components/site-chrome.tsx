import Link from "next/link";

const navigation = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Events", href: "/events" },
  { label: "Ministries", href: "/ministries" },
  { label: "Services", href: "/#services" },
  { label: "Sermons", href: "/sermons" },
  { label: "Visit", href: "/#visit" },
];

export function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="size-4">
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

function Brand() {
  return (
    <Link
      href="/"
      aria-label="VictoryCity Revival Ministry home"
      className="inline-flex items-center gap-3"
    >
      <span
        aria-hidden="true"
        className="grid size-10 place-items-center rounded-full border border-white/25 bg-white/10 text-[#E6C77D]"
      >
        <svg viewBox="0 0 24 24" fill="none" className="size-5">
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

export function SiteHeader() {
  return (
    <header className="absolute inset-x-0 top-0 z-10 border-b border-white/10">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8 lg:px-10">
        <Brand />
        <nav aria-label="Main navigation" className="hidden items-center gap-7 lg:flex lg:gap-8">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-white/75 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E6C77D]"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <Link
          href="/#visit"
          className="rounded-full bg-[#D9B66D] px-4 py-2.5 text-xs font-semibold text-[#101B33] transition-colors hover:bg-[#E8CC8B] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:px-5 sm:text-sm"
        >
          Plan Your Visit
        </Link>
      </div>
      <nav aria-label="Mobile navigation" className="flex gap-5 overflow-x-auto px-5 pb-3 lg:hidden">
        {navigation.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="shrink-0 text-xs text-white/75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E6C77D]"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="bg-[#0B1428] text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-8 md:grid-cols-[1.3fr_1fr_1fr] lg:px-10">
        <div>
          <Brand />
          <p className="mt-5 max-w-xs text-sm leading-6 text-white/55">
            Massive Grace Explosion. We look forward to welcoming you.
          </p>
        </div>
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-white/45">
            Explore
          </h2>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-3">
            {navigation.slice(1).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-white/75 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E6C77D]"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
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
          <p>VictoryCity Revival Ministry</p>
          <a
            href="https://web.facebook.com/profile.php?id=100067393373513"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-white/65 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E6C77D]"
          >
            Follow us on Facebook <ArrowIcon />
          </a>
        </div>
      </div>
    </footer>
  );
}

