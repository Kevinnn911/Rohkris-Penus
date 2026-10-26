import { CardGridSkeleton, Skeleton } from "@/components/ui/States";

export default function Loading() {
  return (
    <>
      {/* Kerangka kartu header terang */}
      <div className="px-3 sm:px-5">
        <div className="mx-auto flex max-w-7xl flex-col items-center rounded-hero bg-mist px-5 pb-20 pt-14 sm:pb-24 sm:pt-20">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="mt-6 h-12 w-full max-w-md rounded-2xl sm:h-16" />
          <Skeleton className="mt-5 h-5 w-full max-w-xl" />
          <Skeleton className="mt-2 h-5 w-full max-w-sm" />
        </div>
      </div>

      {/* Kerangka toolbar filter melayang */}
      <div className="relative z-10 mx-auto -mt-8 max-w-6xl px-4 sm:-mt-10 sm:px-8">
        <div className="rounded-bar bg-white p-4 shadow-float sm:p-6">
          <div className="flex items-center gap-3 px-1 pb-4">
            <Skeleton className="size-11 rounded-full" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="space-y-4 border-t border-navy-100 pt-5">
            {[8, 4].map((jumlah, baris) => (
              <div key={baris} className="flex flex-wrap gap-2">
                {Array.from({ length: jumlah }, (_, index) => (
                  <Skeleton key={index} className="h-11 w-28 rounded-full" />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-8 pt-14 sm:px-8 sm:pt-16">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-40" />
        </div>
        <CardGridSkeleton />
      </div>
    </>
  );
}
