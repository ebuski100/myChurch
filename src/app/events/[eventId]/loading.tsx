import {
  SiteFooter,
  SiteHeader,
} from "../../_components/site-chrome";

export default function EventDetailsLoading() {
  return (
    <>
      <SiteHeader />
      <main aria-busy="true" aria-live="polite">
        <section className="bg-[#101B33] pb-14 pt-44 sm:pb-16 sm:pt-48">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="h-5 w-28 animate-pulse rounded bg-white/15" />
            <div className="mt-10 h-10 max-w-2xl animate-pulse rounded bg-white/15 sm:h-14" />
            <div className="mt-5 h-5 max-w-md animate-pulse rounded bg-white/10" />
          </div>
        </section>
        <section className="bg-[#F3F4F6] py-10 sm:py-14">
          <div className="mx-auto grid max-w-7xl gap-8 px-5 sm:px-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] lg:gap-12 lg:px-10">
            <div
              aria-hidden="true"
              className="aspect-[4/3] animate-pulse rounded-2xl bg-[#E2E5EA] sm:aspect-[16/10]"
            />
            <div aria-hidden="true" className="space-y-5">
              <div className="h-6 w-44 animate-pulse rounded bg-[#E2E5EA]" />
              <div className="h-20 animate-pulse rounded bg-[#E2E5EA]" />
              <div className="h-16 animate-pulse rounded bg-[#E2E5EA]" />
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
