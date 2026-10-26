"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/cn";

/**
 * Tab halaman kegiatan di panel admin: Detail | Formulir | Respons.
 * Tab Formulir/Respons hanya relevan untuk mode pendaftaran internal, tetapi
 * tetap ditampilkan (dengan keterangan di halamannya) agar mudah ditemukan.
 */
export function SubNavKegiatan({
  eventId,
  jumlahRespons,
  onNavigate,
}: {
  eventId: string;
  jumlahRespons: number | null;
  /** Dipanggil sebelum berpindah tab — builder memakainya untuk menahan perubahan belum disimpan. */
  onNavigate?: (event: { preventDefault: () => void }) => void;
}) {
  const pathname = usePathname();
  const dasar = `/admin/kegiatan/${eventId}`;
  const tab = [
    { href: dasar, label: "Detail", aktif: pathname === dasar },
    { href: `${dasar}/formulir`, label: "Formulir", aktif: pathname.startsWith(`${dasar}/formulir`) },
    {
      href: `${dasar}/respons`,
      label: "Respons",
      aktif: pathname.startsWith(`${dasar}/respons`),
      jumlah: jumlahRespons,
    },
  ];

  return (
    <nav aria-label="Bagian kegiatan" className="-mx-1 overflow-x-auto px-1 scrollbar-none">
      <ul className="inline-flex gap-1 rounded-full bg-white p-1 ring-1 ring-inset ring-navy-200/80">
        {tab.map((t) => (
          <li key={t.href}>
            <Link
              href={t.href}
              aria-current={t.aktif ? "page" : undefined}
              onNavigate={onNavigate}
              className={cn(
                "pressable inline-flex min-h-10 items-center gap-2 whitespace-nowrap rounded-full px-4 text-sm",
                t.aktif ? "bg-navy-950 font-medium text-white" : "text-navy-700 hover:bg-navy-50 hover:text-navy-950",
              )}
            >
              {t.label}
              {typeof t.jumlah === "number" ? (
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-medium tabular-nums",
                    t.aktif ? "bg-white/15 text-white" : "bg-navy-100 text-navy-800",
                  )}
                >
                  {t.jumlah}
                  <span className="sr-only"> respons</span>
                </span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
