import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "../../../../_components/site-chrome";

export const metadata: Metadata = {
  title: "Member Not Found | VictoryCity Revival Ministry",
  robots: { index: false, follow: false },
};

export default function DepartmentMemberNotFound() {
  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 items-center bg-[#F7F8FA] px-5 py-16 sm:px-8">
        <section className="mx-auto w-full max-w-2xl rounded-2xl border border-[#E4E7EC] bg-white px-6 py-12 text-center shadow-[0_8px_30px_rgba(16,27,51,0.04)] sm:px-12">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9A772E]">
            VictoryCity team members
          </p>
          <h1 className="mt-3 text-2xl font-semibold text-[#101B33] sm:text-3xl">
            This team member isn&apos;t available
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#667085]">
            The profile may have been removed or is not currently
            public.
          </p>
          <Link
            href="/departments"
            className="mt-7 inline-flex min-h-11 items-center justify-center rounded-full bg-[#101B33] px-5 text-sm font-semibold text-white hover:bg-[#263653] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9A772E]"
          >
            Browse departments
          </Link>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
