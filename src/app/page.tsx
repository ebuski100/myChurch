const navigation = [
  { label: "Home", href: "#home" },
  { label: "Our Ministry", href: "#ministry" },
  { label: "Services", href: "#services" },
  { label: "Sermons", href: "#sermons" },
  { label: "Visit", href: "#visit" },
];

function ArrowIcon() {
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

function Brand({ light = false }: { light?: boolean }) {
  return (
    <a
      href="#home"
      aria-label="VictoryCity Revival Ministry home"
      className="inline-flex items-center gap-3"
    >
      <span
        aria-hidden="true"
        className={`grid size-10 place-items-center rounded-full border ${light ? "border-white/25 bg-white/10 text-[#E6C77D]" : "border-[#D9B66D]/50 bg-[#D9B66D]/10 text-[#9A772E]"}`}
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
        <span
          className={`block text-sm font-semibold tracking-wide ${light ? "text-white" : "text-[#101B33]"}`}
        >
          VictoryCity
        </span>
        <span
          className={`mt-1 block text-[10px] font-medium uppercase tracking-[0.16em] ${light ? "text-white/65" : "text-[#667085]"}`}
        >
          Revival Ministry
        </span>
      </span>
    </a>
  );
}

function SectionEyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#9A772E]">
      {children}
    </p>
  );
}

function ServiceCard({
  day,
  time,
  detail,
  icon,
}: {
  day: string;
  time: string;
  detail: string;
  icon: ReactNode;
}) {
  return (
    <article className="rounded-2xl border border-[#E4E7EC] bg-white p-6 shadow-[0_8px_30px_rgba(16,27,51,0.04)] sm:p-8">
      <div className="mb-8 grid size-12 place-items-center rounded-xl bg-[#F8F4E9] text-[#9A772E]">
        {icon}
      </div>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#667085]">
        {day}
      </p>
      <h3 className="mt-2 text-2xl font-semibold tracking-tight text-[#101B33]">
        {time}
      </h3>
      <p className="mt-2 text-sm leading-6 text-[#667085]">
        {detail}
      </p>
    </article>
  );
}

export default function Home() {
  return (
    <>
      <header className="absolute inset-x-0 top-0 z-10 border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8 lg:px-10">
          <Brand light />
          <nav
            aria-label="Main navigation"
            className="hidden items-center gap-8 md:flex"
          >
            {navigation.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-sm text-white/75 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E6C77D]"
              >
                {item.label}
              </a>
            ))}
          </nav>
          <a
            href="#visit"
            className="rounded-full bg-[#D9B66D] px-4 py-2.5 text-xs font-semibold text-[#101B33] transition-colors hover:bg-[#E8CC8B] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:px-5 sm:text-sm"
          >
            Plan Your Visit
          </a>
        </div>
        <nav
          aria-label="Mobile navigation"
          className="flex gap-5 overflow-x-auto px-5 pb-3 md:hidden"
        >
          {navigation.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="shrink-0 text-xs text-white/75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E6C77D]"
            >
              {item.label}
            </a>
          ))}
        </nav>
      </header>

      <main>
        <section
          id="home"
          className="relative isolate flex min-h-[690px] items-center overflow-hidden bg-[#101B33] pb-16 pt-40 sm:min-h-[720px] sm:pt-36"
        >
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_76%_40%,rgba(217,182,109,0.18),transparent_36%),radial-gradient(ellipse_at_4%_100%,rgba(62,91,145,0.22),transparent_40%)]"
          />
          <div
            aria-hidden="true"
            className="absolute -right-24 top-1/4 -z-10 size-[430px] rounded-full border border-white/[0.06] sm:right-[8%] sm:size-[560px]"
          >
            <div className="absolute inset-8 rounded-full border border-white/[0.06]" />
            <div className="absolute inset-16 rounded-full border border-[#D9B66D]/15" />
            <div className="absolute inset-28 rounded-full border border-white/[0.06]" />
          </div>
          <div className="mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="max-w-3xl">
              <p className="mb-6 inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-[#E6C77D]">
                {/* <span className="h-px w-8 bg-[#D9B66D]" /> */}
                God&apos;s Massive Grace Explosion Center
              </p>
              <h1 className="max-w-3xl text-4xl font-semibold leading-[1.12] tracking-[-0.04em] text-white sm:text-6xl lg:text-7xl">
                Experience the power of God&apos;s grace.
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-white/70 sm:text-lg sm:leading-8">
                You are welcome at VictoryCity Revival Ministry. Join
                us for worship, fellowship, and a time together in
                God&apos;s presence.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#sermons"
                  className="inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-[#D9B66D] px-6 text-sm font-semibold text-[#101B33] transition-colors hover:bg-[#E8CC8B] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                >
                  Listen to Sermons <ArrowIcon />
                </a>
                <a
                  href="#visit"
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/25 px-6 text-sm font-semibold text-white transition-colors hover:border-white/60 hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E6C77D]"
                >
                  Plan Your Visit
                </a>
              </div>
            </div>
            <div className="mt-16 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-white/15 pt-6 text-sm text-white/65 sm:mt-20">
              <span>Coal Camp, Zone 6, Agric Quarters</span>
              <span className="hidden h-1 w-1 rounded-full bg-[#D9B66D] sm:block" />
              <span>Sunday service · 8:00 AM</span>
            </div>
          </div>
        </section>

        <section
          id="services"
          className="scroll-mt-8 bg-[#F3F4F6] py-20 sm:py-24"
        >
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="mx-auto max-w-2xl text-center">
              <SectionEyebrow>Gather with us</SectionEyebrow>
              <h2 className="text-3xl font-semibold tracking-tight text-[#101B33] sm:text-4xl">
                There&apos;s a place for you here.
              </h2>
              <p className="mt-4 text-base leading-7 text-[#667085]">
                Come as you are. We look forward to welcoming you at
                our weekly services.
              </p>
            </div>
            <div className="mx-auto mt-10 grid max-w-4xl gap-5 sm:grid-cols-2 sm:gap-6">
              <ServiceCard
                day="Every Sunday"
                time="8:00 AM – 11:00 AM"
                detail="Sunday service"
                icon={
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="size-6"
                  >
                    <rect
                      x="3.5"
                      y="5"
                      width="17"
                      height="15.5"
                      rx="2"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M7.5 3.5v3M16.5 3.5v3M3.5 9.5h17"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                }
              />
              <ServiceCard
                day="Every Wednesday"
                time="4:00 PM – 6:00 PM"
                detail="Midweek service"
                icon={
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="size-6"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="8.5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M12 7v5l3.5 2"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                }
              />
            </div>
          </div>
        </section>

        <section
          id="ministry"
          className="scroll-mt-8 bg-white py-20 sm:py-28"
        >
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 sm:px-8 md:grid-cols-[0.8fr_1.2fr] md:gap-20 lg:px-10">
            <div className="relative flex min-h-64 items-center justify-center overflow-hidden rounded-3xl bg-[#101B33] p-8 sm:min-h-80">
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(217,182,109,0.18),transparent_58%)]"
              />
              <div className="relative text-center">
                <span className="mx-auto mb-5 grid size-14 place-items-center rounded-full border border-[#D9B66D]/40 text-[#E6C77D]">
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="size-7"
                  >
                    <path
                      d="M12 3v18M5 9h14M7 17l5-5 5 5"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <p className="text-xs uppercase tracking-[0.22em] text-[#E6C77D]">
                  Our heart
                </p>
                <p className="mt-3 max-w-xs text-2xl font-medium leading-snug text-white">
                  Massive Grace Explosion
                </p>
              </div>
            </div>
            <div>
              <SectionEyebrow>Welcome to VictoryCity</SectionEyebrow>
              <h2 className="max-w-xl text-3xl font-semibold leading-tight tracking-tight text-[#101B33] sm:text-4xl">
                A community ready to welcome you.
              </h2>
              <p className="mt-5 max-w-2xl leading-7 text-[#667085]">
                VictoryCity Revival Ministry is a place to gather,
                worship, and grow in community. Whether you are
                joining us for the first time or returning, you are
                welcome here.
              </p>
              <p className="mt-4 max-w-2xl leading-7 text-[#667085]">
                Our pastor, Pst. Nelson, and our church family look
                forward to meeting you.
              </p>
              <a
                href="#visit"
                className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-[#785B1F] hover:text-[#101B33] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#9A772E]"
              >
                Find your way here <ArrowIcon />
              </a>
            </div>
          </div>
        </section>

        <section
          id="sermons"
          className="scroll-mt-8 bg-[#F3F4F6] py-20 sm:py-24"
        >
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="mx-auto max-w-2xl text-center">
              <SectionEyebrow>Messages</SectionEyebrow>
              <h2 className="text-3xl font-semibold tracking-tight text-[#101B33] sm:text-4xl">
                Sermons to encourage your walk.
              </h2>
              <p className="mt-4 leading-7 text-[#667085]">
                We&apos;re preparing a collection of messages to share
                with you.
              </p>
            </div>
            <div className="mx-auto mt-9 flex max-w-3xl flex-col items-center rounded-2xl border border-dashed border-[#C9CDD5] bg-white px-6 py-10 text-center sm:py-12">
              <span className="grid size-12 place-items-center rounded-full bg-[#F8F4E9] text-[#9A772E]">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="size-5"
                >
                  <path
                    d="M9 18V5l12-2v13M9 18c0 1.1-1.6 2-3.5 2S2 19.1 2 18s1.6-2 3.5-2S9 16.9 9 18Zm12-2c0 1.1-1.6 2-3.5 2S14 17.1 14 16s1.6-2 3.5-2 3.5.9 3.5 2ZM9 9l12-2"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <h3 className="mt-4 text-lg font-semibold text-[#101B33]">
                Sermon library coming soon
              </h3>
              <p className="mt-2 max-w-md text-sm leading-6 text-[#667085]">
                There are no messages available online yet. Join us in
                person for a service.
              </p>
            </div>
          </div>
        </section>

        <section
          id="visit"
          className="scroll-mt-8 bg-white py-20 sm:py-24"
        >
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="overflow-hidden rounded-3xl bg-[#101B33]">
              <div className="grid md:grid-cols-[1.1fr_0.9fr]">
                <div className="p-7 sm:p-12 lg:p-16">
                  <SectionEyebrow>Plan your visit</SectionEyebrow>
                  <h2 className="max-w-lg text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                    We&apos;d love to see you.
                  </h2>
                  <p className="mt-4 max-w-lg leading-7 text-white/65">
                    Join us at VictoryCity Revival Ministry.
                    We&apos;re happy to help you plan your first
                    visit.
                  </p>
                  <div className="mt-8 space-y-6">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/45">
                        Our location
                      </p>
                      <p className="mt-2 text-base leading-6 text-white">
                        Coal Camp, Zone 6, Agric Quarters
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/45">
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
                <div className="border-t border-white/10 bg-white/[0.03] p-7 sm:p-12 md:border-l md:border-t-0 lg:p-16">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#E6C77D]">
                    Join us this week
                  </p>
                  <div className="mt-6 border-b border-white/10 pb-6">
                    <p className="font-medium text-white">
                      Sunday service
                    </p>
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
                    href="tel:08069552039"
                    className="mt-8 inline-flex min-h-11 items-center gap-2 rounded-full border border-white/25 px-5 text-sm font-semibold text-white transition-colors hover:border-[#D9B66D] hover:text-[#E6C77D] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E6C77D]"
                  >
                    Call to plan your visit <ArrowIcon />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[#0B1428] text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-8 md:grid-cols-[1.3fr_1fr_1fr] lg:px-10">
          <div>
            <Brand light />
            <p className="mt-5 max-w-xs text-sm leading-6 text-white/55">
              Massive Grace Explosion. We look forward to welcoming
              you.
            </p>
          </div>
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-white/45">
              Explore
            </h2>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-3">
              {navigation.slice(1).map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="text-sm text-white/75 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E6C77D]"
                >
                  {item.label}
                </a>
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
    </>
  );
}
import type { ReactNode } from "react";
