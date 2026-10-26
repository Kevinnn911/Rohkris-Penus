import type { ReactNode } from "react";

import { IconAlert, IconDatabase, IconDove } from "@/components/ui/Icons";
import { cn } from "@/lib/cn";

/**
 * Empty / error / loading state.
 * PRD §6.1 mewajibkan ketiganya tersedia di semua halaman data utama.
 */

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  /** Ikon pengganti; bawaan berupa merpati. */
  icon?: ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-panel border border-navy-200/80 bg-white px-6 py-16 text-center">
      <div className="relative">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-navy-50 text-navy-700 ring-1 ring-inset ring-navy-200/80">
          {icon ?? <IconDove className="size-6" />}
        </span>
        <h3 className="mt-5 text-xl font-semibold tracking-heading text-navy-950">{title}</h3>
        {description ? (
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-navy-600">{description}</p>
        ) : null}
        {action ? <div className="mt-7 flex justify-center">{action}</div> : null}
      </div>
    </div>
  );
}

export function ErrorState({
  title = "Terjadi gangguan",
  description = "Data tidak dapat dimuat saat ini. Silakan muat ulang halaman beberapa saat lagi.",
  action,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div
      role="alert"
      className="rounded-panel border border-danger-600/15 bg-danger-50 px-6 py-12 text-center"
    >
      <span className="mx-auto grid size-14 place-items-center rounded-full bg-white text-danger-600 shadow-soft ring-1 ring-danger-600/15">
        <IconAlert className="size-6" />
      </span>
      <h3 className="mt-5 text-xl font-semibold text-danger-700">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-navy-700">{description}</p>
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  );
}

/** Blok berkilau untuk loading.tsx. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-shimmer rounded-lg bg-[linear-gradient(90deg,var(--color-navy-100)_0%,var(--color-ivory-50)_50%,var(--color-navy-100)_100%)] bg-[length:200%_100%]",
        className,
      )}
    />
  );
}

export function EventCardSkeleton() {
  return (
    <div className="rounded-card border border-navy-200/80 bg-white p-2.5">
      <Skeleton className="aspect-[4/3] rounded-inner" />
      <div className="space-y-3 px-3 pb-3 pt-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}

export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div
      className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
      role="status"
      aria-label="Memuat data"
    >
      {Array.from({ length: count }, (_, index) => (
        <EventCardSkeleton key={index} />
      ))}
      <span className="sr-only">Memuat…</span>
    </div>
  );
}

/** Pesan ketika database belum dikonfigurasi — memandu, bukan menampilkan error mentah. */
export function SetupNotice() {
  return (
    <div className="flex flex-col gap-4 rounded-card border border-navy-200/80 bg-white px-6 py-5 sm:flex-row sm:items-start">
      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-navy-50 text-navy-700 ring-1 ring-inset ring-navy-200/80">
        <IconDatabase className="size-5" />
      </span>
      <div>
        <h3 className="font-semibold text-navy-950">Website belum terhubung ke database</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-navy-700">
          Salin berkas <code className="rounded-md bg-navy-100 px-1.5 py-0.5">.env.example</code>{" "}
          menjadi <code className="rounded-md bg-navy-100 px-1.5 py-0.5">.env.local</code>, lalu isi
          data koneksi database MySQL Anda. Petunjuk lengkap tersedia di <strong>README.md</strong> bagian
          “Menyiapkan database MySQL”.
        </p>
      </div>
    </div>
  );
}
