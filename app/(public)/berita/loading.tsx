import { EventCardSkeleton, Skeleton } from "@/components/ui/States";

export default function Loading() {
  return (
    <>
      {/* Kerangka kartu hero terang — selaras dengan <PageHeader>. */}
      <div className="px-3 sm:px-5">
        <div className="mx-auto flex max-w-7xl flex-col items-center rounded-hero bg-mist px-5 pb-14 pt-10 sm:px-8 sm:pb-20 sm:pt-14">
          <div className="h-8 w-44 rounded-full bg-white/80" />
          <div className="mt-8 h-7 w-32 rounded-full bg-gold-300/70" />
          <div className="mt-5 h-12 w-full max-w-md rounded-2xl bg-white/70 sm:h-16" />
          <div className="mt-5 h-5 w-full max-w-xl rounded-full bg-white/60" />
        </div>
      </div>

      <div
        role="status"
        aria-label="Memuat berita"
        className="mx-auto max-w-7xl space-y-20 px-4 pb-8 pt-16 sm:space-y-24 sm:px-8 sm:pt-20"
      >
        {/* Kartu utama */}
        <div>
          <Skeleton className="h-4 w-20" />
          <Skeleton className="mt-4 h-9 w-64" />
          <div className="mt-10 grid gap-2 rounded-panel border border-navy-200/80 bg-white p-2.5 lg:grid-cols-12 lg:gap-4">
            <Skeleton className="aspect-[16/10] rounded-[1.5rem] lg:col-span-7 lg:aspect-auto lg:min-h-[26rem]" />
            <div className="space-y-4 px-4 pb-4 pt-4 sm:px-6 lg:col-span-5 lg:py-8 lg:pl-4 lg:pr-8">
              <Skeleton className="h-7 w-36 rounded-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="mt-8 h-11 w-52 rounded-full" />
            </div>
          </div>
        </div>

        {/* Grid berita lainnya */}
        <div>
          <Skeleton className="h-4 w-16" />
          <Skeleton className="mt-4 h-9 w-56" />
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }, (_, index) => (
              <EventCardSkeleton key={index} />
            ))}
          </div>
        </div>
        <span className="sr-only">Memuat…</span>
      </div>
    </>
  );
}
