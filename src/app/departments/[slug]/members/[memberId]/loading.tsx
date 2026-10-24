import {
  SiteFooter,
  SiteHeader,
} from "../../../../_components/site-chrome";

export default function DepartmentMemberDetailsLoading() {
  return (
    <>
      <SiteHeader />
      <main aria-busy="true" aria-live="polite">
        <section className="bg-[#101B33] pb-12 pt-44 sm:pb-14 sm:pt-48">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="h-5 w-24 animate-pulse rounded bg-white/15" />
            <div className="mt-10 h-10 max-w-2xl animate-pulse rounded bg-white/15 sm:h-14" />
            <div className="mt-5 h-5 max-w-md animate-pulse rounded bg-white/10" />
          </div>
        </section>
        <section className="bg-[#F7F8FA] py-10 sm:py-14">
          <div className="mx-auto grid max-w-7xl gap-8 px-5 sm:px-8 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:px-10">
            <div
              aria-hidden="true"
              className="aspect-[4/5] animate-pulse rounded-2xl border border-[#E4E7EC] bg-white"
            />
            <div
              aria-hidden="true"
              className="h-64 animate-pulse rounded-2xl border border-[#E4E7EC] bg-white"
            />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
