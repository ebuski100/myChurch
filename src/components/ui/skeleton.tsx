export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`block animate-pulse rounded-lg bg-[#E9EBEF] motion-reduce:animate-none ${className}`}
    />
  );
}

export function PublicPageSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite" className="flex-1">
      <div
        aria-hidden="true"
        className="border-b border-white/10 bg-[#0B1220]"
      >
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:h-[88px] sm:px-8 lg:px-10">
          <Skeleton className="size-12 rounded-full bg-white/10" />
          <div className="hidden gap-7 lg:flex">
            <Skeleton className="h-4 w-16 bg-white/10" />
            <Skeleton className="h-4 w-16 bg-white/10" />
            <Skeleton className="h-4 w-16 bg-white/10" />
            <Skeleton className="h-4 w-16 bg-white/10" />
          </div>
          <Skeleton className="h-10 w-32 rounded-full bg-white/10" />
        </div>
        <div className="mx-auto flex h-[52px] max-w-7xl items-center gap-4 overflow-hidden px-5 lg:hidden">
          {[0, 1, 2, 3, 4, 5].map((item) => (
            <Skeleton
              key={item}
              className="h-3 w-14 shrink-0 rounded-full bg-white/10"
            />
          ))}
        </div>
      </div>

      <main className="mx-auto w-full max-w-7xl px-5 py-12 sm:px-8 sm:py-16 lg:px-10">
        <div className="max-w-2xl">
          <Skeleton className="h-3 w-36 bg-[#D9B66D]/30" />
          <Skeleton className="mt-5 h-10 w-4/5" />
          <Skeleton className="mt-3 h-5 w-full max-w-xl" />
          <Skeleton className="mt-2 h-5 w-3/4 max-w-lg" />
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              aria-hidden="true"
              className="overflow-hidden rounded-2xl border border-[#E4E7EC] bg-white"
            >
              <Skeleton className="aspect-video rounded-none" />
              <div className="space-y-3 p-5">
                <Skeleton className="h-3 w-1/3" />
                <Skeleton className="h-5 w-4/5" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </main>
      <p className="sr-only">Loading page content</p>
    </div>
  );
}

export function AdminPageSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className="min-h-screen bg-[#F5F6F8] lg:flex"
    >
      <div
        aria-hidden="true"
        className="border-b border-[#E4E7EC] bg-white px-5 py-4 lg:hidden"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Skeleton className="size-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
          <Skeleton className="h-10 w-20 rounded-full" />
        </div>
        <div className="mt-4 flex gap-2 overflow-hidden">
          {[0, 1, 2, 3, 4].map((item) => (
            <Skeleton
              key={item}
              className="h-10 w-24 shrink-0 rounded-full"
            />
          ))}
        </div>
      </div>
      <aside
        aria-hidden="true"
        className="hidden h-dvh w-64 shrink-0 flex-col bg-[#101B33] px-6 py-7 lg:flex xl:w-72"
      >
        <div className="flex items-center gap-3">
          <Skeleton className="size-12 rounded-full bg-white/10" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-24 bg-white/10" />
            <Skeleton className="h-3 w-32 bg-white/10" />
          </div>
        </div>
        <div className="mt-12 space-y-3">
          {[0, 1, 2, 3, 4].map((item) => (
            <Skeleton
              key={item}
              className="h-11 w-full rounded-xl bg-white/10"
            />
          ))}
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-5 py-8 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-[1500px]">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-5 h-9 w-64" />
          <Skeleton className="mt-3 h-5 w-full max-w-xl" />
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {[0, 1].map((item) => (
              <Skeleton
                key={item}
                className="h-44 rounded-2xl bg-white"
              />
            ))}
          </div>
          <Skeleton className="mt-6 h-56 rounded-2xl bg-white" />
        </div>
        <p className="sr-only">Loading administrator workspace</p>
      </main>
    </div>
  );
}
