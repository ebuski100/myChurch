import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingContentArchivePage() {
  return (
    <main
      aria-busy="true"
      aria-live="polite"
      className="mx-auto w-full max-w-[1500px] px-5 py-7 sm:px-8 sm:py-9 xl:px-10"
    >
      <Skeleton className="h-3 w-36" />
      <Skeleton className="mt-7 h-9 w-72" />
      <Skeleton className="mt-3 h-5 w-full max-w-3xl" />

      <section aria-hidden="true" className="mt-9">
        <Skeleton className="h-6 w-48" />
        <div className="mt-4 space-y-3">
          {[0, 1, 2].map((item) => (
            <Skeleton
              key={item}
              className="h-24 rounded-2xl bg-white"
            />
          ))}
        </div>
      </section>

      <section aria-hidden="true" className="mt-10">
        <Skeleton className="h-6 w-52" />
        <div className="mt-4 space-y-3">
          {[0, 1, 2].map((item) => (
            <Skeleton
              key={item}
              className="h-14 rounded-2xl bg-white"
            />
          ))}
        </div>
      </section>
      <p className="sr-only">Loading the content archive</p>
    </main>
  );
}
