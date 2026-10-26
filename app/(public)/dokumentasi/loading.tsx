import { Skeleton } from "@/components/ui/States";

/** Pola bento yang sama dengan galeri — lihat components/site/Lightbox.tsx. */
const POLA = ["col-span-2 row-span-2", "", "row-span-2", "", "", "", "col-span-2"];

export default function Loading() {
  return (
    <>
      {/* Kerangka kartu hero terang — selaras dengan <PageHeader>. */}
      <div className="px-3 sm:px-5">
        <div className="mx-auto flex max-w-7xl flex-col items-center rounded-hero bg-mist px-5 pb-14 pt-10 sm:px-8 sm:pb-20 sm:pt-14">
          <div className="h-8 w-48 rounded-full bg-white/80" />
          <div className="mt-8 h-5 w-20 rounded-full bg-white/70" />
          <div className="mt-5 h-12 w-full max-w-lg rounded-2xl bg-white/70 sm:h-16" />
          <div className="mt-5 h-5 w-full max-w-xl rounded-full bg-white/60" />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-8 pt-16 sm:px-8 sm:pt-20">
        <div role="status" aria-label="Memuat dokumentasi">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="mt-4 h-9 w-60" />
          <div className="mt-10 grid grid-flow-row-dense auto-rows-[10rem] grid-cols-2 gap-3 sm:auto-rows-[13rem] sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">
            {POLA.map((kelas, index) => (
              <div key={index} className={`rounded-card border border-navy-200/80 bg-white p-1.5 sm:p-2 ${kelas}`}>
                <Skeleton className="size-full rounded-inner" />
              </div>
            ))}
          </div>
          <span className="sr-only">Memuat…</span>
        </div>
      </div>
    </>
  );
}
