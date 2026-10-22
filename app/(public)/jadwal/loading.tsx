import { Skeleton } from "@/components/ui/States";

export default function Loading() {
  return (
    <>
      {/* Kerangka kartu header terang */}
      <div className="px-3 sm:px-5">
        <div className="mx-auto flex max-w-7xl flex-col items-center rounded-hero bg-mist px-5 pb-14 pt-10 sm:pb-20 sm:pt-14">
          <Skeleton className="h-7 w-20 rounded-full" />
          <Skeleton className="mt-6 h-12 w-full max-w-md rounded-2xl sm:h-16" />
          <Skeleton className="mt-5 h-5 w-full max-w-lg" />
        </div>
      </div>

      <div
        className="mx-auto max-w-4xl space-y-12 px-4 pb-8 pt-14 sm:px-8 sm:pt-20"
        role="status"
        aria-label="Memuat jadwal"
      >
        {[3, 2].map((jumlah, grup) => (
          <div key={grup}>
            <div className="flex items-center gap-4">
              <Skeleton className="h-7 w-44" />
              <div className="h-px flex-1 bg-navy-200" />
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="mt-6 space-y-4">
              {Array.from({ length: jumlah }, (_, index) => (
                <div
                  key={index}
                  className="flex items-stretch gap-4 rounded-card border border-navy-200/80 bg-white p-2.5 pr-4 sm:gap-6 sm:pr-6"
                >
                  <Skeleton className="h-28 w-[4.75rem] shrink-0 rounded-[1.1rem] sm:w-24" />
                  <div className="flex-1 space-y-2.5 py-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-1/3" />
                    <div className="flex gap-2 pt-1">
                      <Skeleton className="h-6 w-20 rounded-full" />
                      <Skeleton className="h-6 w-28 rounded-full" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        <span className="sr-only">Memuat…</span>
      </div>
    </>
  );
}
