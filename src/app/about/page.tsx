import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowIcon,
  SiteFooter,
  SiteHeader,
} from "../_components/site-chrome";
import {
  FamilyCtaArtwork,
  MissionIcon,
  StoryChurchIllustration,
} from "./_components/about-artwork";

export const metadata: Metadata = {
  title: "About Us | VictoryCity Revival Ministry",
  description:
    "Learn about VictoryCity Revival Ministry — our mission, vision, values, story, and leadership. Join us in Coal Camp, Zone 6, Agric Quarters.",
};

/**
 * NOTE on copy: the mission, vision, values, story, and leadership wording
 * below reproduces the approved design mockup verbatim so the page matches
 * the reference. The project does not yet hold confirmed wording for these
 * statements (the previous page noted they were "not yet provided"), so
 * treat this copy as proposed until the ministry confirms it. Real,
 * established facts used here: brand, "Pst. Nelson", location, service
 * times, phone, and existing routes.
 */

function GoldButton({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#D9B66D] px-6 text-sm font-semibold text-[#101B33] transition-colors hover:bg-[#E8CC8B] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#9A772E]"
    >
      {children} <ArrowIcon />
    </Link>
  );
}

function HeroSection() {
  return (
    <section
      aria-labelledby="about-hero-heading"
      className="relative isolate overflow-hidden bg-[#0B1428]"
    >
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_75%_20%,rgba(43,74,128,0.6),transparent_55%),linear-gradient(100deg,#0B1428_35%,#0F2148_75%,#0B1428_100%)]" />
      </div>

      <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 pb-2 pt-36 sm:px-8 sm:pt-40 lg:grid-cols-2 lg:px-10 lg:pb-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D9B66D]">
            About VictoryCity Revival Ministry
          </p>
          <h1
            id="about-hero-heading"
            className="mt-4 font-display text-5xl font-normal leading-[1.05] tracking-tight text-white sm:text-6xl"
          >
            A Church with a<br />
            <span className="text-[#D9B66D]">Greater Purpose.</span>
          </h1>
          <p className="mt-6 max-w-md text-[15px] leading-7 text-white/75">
            We are a family of believers, called to worship God, reach
            people, and make a lasting impact in our community and
            beyond. Join us on this journey of faith, hope, and love.
          </p>
        </div>
        <div className="overflow-hidden rounded-xl lg:hidden"></div>
      </div>
    </section>
  );
}

const VALUE_ITEMS = [
  "The Word of God",
  "Prayer & Dependence on God",
  "Authentic Community",
  "Excellence in Service",
  "Kingdom Impact",
];

function MissionVisionValuesSection() {
  return (
    <section
      id="mission"
      aria-labelledby="mission-heading"
      className="scroll-mt-8 bg-[#F7F8FA]"
    >
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 sm:py-16 lg:grid-cols-[0.9fr_1.6fr] lg:gap-14 lg:px-10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C49A43]">
            Our Mission, Vision &amp; Values
          </p>
          <h2
            id="mission-heading"
            className="mt-3 font-display text-4xl font-normal leading-tight text-[#101B33] sm:text-[40px]"
          >
            Building people.
            <br />
            Transforming lives.
          </h2>
          <p className="my-5 max-w-md text-[15px] leading-7 text-[#101B33]/75 ">
            At VictoryCity Revival Ministry, we exist to see lives
            changed by the power of God&apos;s Word, empowered by the
            Holy Spirit, and connected through a loving community.
          </p>
          {/* <div className="mt-7">
            <GoldButton href="#values">Our Beliefs</GoldButton>
          </div> */}
          <hr />
        </div>
        <div className="grid gap-8 sm:grid-cols-3  sm:divide-x sm:divide-[#E4E7EC]">
          <div className=" border border-gray-300 p-3 rounded-2xl">
            <span aria-hidden="true" className="text-[#D9B66D]">
              <MissionIcon name="mission" />
            </span>
            <h3 className="mt-4 text-[17px] font-bold text-[#101B33]">
              Our Mission
            </h3>
            <p className="mt-2 text-sm leading-6 text-[#667085]">
              To win souls, build believers, and establish God&apos;s
              kingdom through worship, discipleship, and community
              outreach.
            </p>
          </div>
          <div className=" border border-gray-300 p-3 rounded-2xl shadow-sm">
            <span aria-hidden="true" className="text-[#D9B66D]">
              <MissionIcon name="vision" />
            </span>
            <h3 className="mt-4 text-[17px] font-bold text-[#101B33]">
              Our Vision
            </h3>
            <p className="mt-2 text-sm leading-6 text-[#667085]">
              A thriving church, a transformed community, and a
              generation impacting the world for Christ.
            </p>
          </div>
          <div
            id="values"
            className="scroll-mt-8 sm:px-7 sm:first:pl-0 sm:last:pr-0 border border-gray-300 p-3 rounded-2xl shadow-sm"
          >
            <span aria-hidden="true" className="text-[#D9B66D]">
              <MissionIcon name="values" />
            </span>
            <h3 className="mt-4 text-[17px] font-bold text-[#101B33]">
              Our Values
            </h3>
            <ul className="mt-2 space-y-1.5 text-sm leading-6 text-[#667085]">
              {VALUE_ITEMS.map((value) => (
                <li key={value} className="flex items-start gap-2">
                  <span
                    aria-hidden="true"
                    className="mt-[9px] size-1.5 shrink-0 rounded-full bg-[#D9B66D]"
                  />
                  {value}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function StorySection() {
  return (
    <section
      id="story"
      aria-labelledby="story-heading"
      className="relative scroll-mt-8 bg-[#0B1428]"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10 lg:pr-[calc(27%+2.5rem)]">
        <div className="grid items-center gap-10 py-14 sm:py-16 lg:grid-cols-2 lg:gap-12">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D9B66D]">
              Our Story
            </p>
            <h2
              id="story-heading"
              className="mt-3 font-display text-4xl font-normal leading-tight text-white sm:text-[44px]"
            >
              From a Vision
              <br />
              to a Family
            </h2>
            <p className="mt-5 max-w-md text-sm leading-6 text-white/70">
              VictoryCity Revival Ministry began with a simple but
              powerful vision — to create a place where people could
              encounter God, grow in their faith, and find true
              community. What started as a small gathering has grown
              into a thriving church family, and the journey is far
              from over.
            </p>
            <div className="mt-7">
              <GoldButton href="#story">Our Journey</GoldButton>
            </div>
          </div>
          {/* <div className="overflow-hidden rounded-lg border border-white/15">
            <StoryChurchIllustration className="aspect-[16/10] h-auto w-full" />
          </div> */}
        </div>
      </div>
      {/* Scripture panel docked to the right edge at desktop size. */}
      <aside
        id="scripture"
        aria-label="Scripture: Zechariah chapter 4, verse 6"
        className="scroll-mt-8 bg-[#FAF6EC] px-8 py-10 sm:px-12 lg:absolute lg:inset-y-0 lg:right-0 lg:flex lg:w-[27%] lg:items-center lg:px-10"
      >
        <div>
          <p className="font-display text-[26px] font-normal italic leading-snug text-[#101B33]">
            &ldquo;Not by might, nor by power, but by my
            Spirit,&rdquo; saith the Lord.
          </p>
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.2em] text-[#C49A43]">
            Zechariah 4:6
          </p>
        </div>
      </aside>
    </section>
  );
}

function LeadershipSection() {
  return (
    <section
      id="leadership"
      aria-labelledby="leadership-heading"
      className="scroll-mt-8 bg-[#F7F8FA]"
    >
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-14 sm:px-8 sm:py-16 lg:grid-cols-2 lg:gap-14 lg:px-10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C49A43]">
            Our Leadership
          </p>
          <h2
            id="leadership-heading"
            className="mt-3 font-display text-4xl font-normal leading-tight text-[#101B33] sm:text-[40px]"
          >
            Led by a Faithful Shepherd
          </h2>
          <p className="mt-5 max-w-md text-[15px] leading-7 text-[#101B33]/75">
            Our church is led by a dedicated team of leaders who are
            passionate about God&apos;s Word and committed to
            shepherding our church family with love, wisdom, and
            integrity.
          </p>
          <div className="mt-7">
            <GoldButton href="/departments/pastors">
              Meet Our Leadership
            </GoldButton>
          </div>
        </div>
        <article
          id="pastor-card"
          aria-labelledby="pastor-name"
          className="grid scroll-mt-8 gap-6 rounded-xl border border-[#E4E7EC] bg-white p-6 shadow-[0_2px_12px_rgba(16,27,51,0.06)] sm:grid-cols-[220px_1fr] sm:p-7"
        >
          {/* <div className="overflow-hidden rounded-lg">
            <PastorPulpitIllustration className="aspect-[4/5] h-full min-h-56 w-full sm:aspect-auto" />
          </div> */}

          <div className="relative min-h-72 overflow-hidden rounded-lg bg-[#101B33] sm:min-h-0 sm:aspect-[4/5]">
            <Image
              src="/images/pastor.jpg"
              alt="Pastor Nelson preaching at the pulpit"
              fill
              sizes="(max-width: 639px) 100vw, 220px"
              className="object-cover object-[center_20%]"
            />
            <div
              aria-hidden="true"
              className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#101B33]/50 to-transparent"
            />
          </div>

          <div className="flex flex-col">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#C49A43]">
              Senior Pastor
            </p>
            <h3
              id="pastor-name"
              className="mt-2 font-display text-[28px] font-normal text-[#101B33]"
            >
              Pst. Nelson
            </h3>
            <p className="mt-3 flex-1 text-sm leading-6 text-[#667085]">
              Pastor Nelson leads VictoryCity Revival Ministry with a
              heart for God&apos;s people and a vision for spiritual
              growth and community transformation.
            </p>
            {/* <div className="mt-5">
              <Link
                href="/departments"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#D9B66D] px-6 text-sm font-semibold text-[#101B33] transition-colors hover:bg-[#FBF8F0] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#9A772E]"
              >
                Learn More <ArrowIcon />
              </Link>
            </div> */}
          </div>
        </article>
      </div>
    </section>
  );
}

function FamilyCtaSection() {
  return (
    <section
      aria-labelledby="family-cta-heading"
      className="relative isolate overflow-hidden bg-[#0B1428]"
    >
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[linear-gradient(100deg,#0B1428_25%,#12244A_65%,#0B1428_100%)]" />
      </div>
      <FamilyCtaArtwork className="absolute inset-y-0 left-1/2 hidden h-full w-[760px] -translate-x-1/2 lg:block" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-5 py-14 sm:px-8 sm:py-16 lg:grid-cols-2 lg:px-10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D9B66D]">
            Be a Part of Our Story
          </p>
          <h2
            id="family-cta-heading"
            className="mt-3 font-display text-4xl font-normal text-white sm:text-[40px]"
          >
            Join Our Church Family
          </h2>
          <p className="mt-4 max-w-md text-sm leading-6 text-white/70">
            There&apos;s a place for you at VictoryCity Revival
            Ministry. Come as you are and experience God&apos;s love,
            community, and purpose.
          </p>
        </div>
        <div className="flex flex-col items-start gap-4 lg:items-end">
          <GoldButton href="/#visit">Plan Your Visit</GoldButton>
          <Link
            href="/departments"
            className="inline-flex items-center gap-2 text-sm font-semibold text-white transition-colors hover:text-[#E8CC8B] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E6C77D]"
          >
            Learn About Our Departments <ArrowIcon />
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function AboutPage() {
  return (
    <>
      <SiteHeader activeHref="/about" />
      <main>
        <HeroSection />
        <MissionVisionValuesSection />
        <StorySection />
        <LeadershipSection />
        <FamilyCtaSection />
      </main>
      <SiteFooter />
    </>
  );
}
