import { cn } from "@/lib/cn";

/**
 * Gaya tombol aksi ringkas panel admin (baris tabel / kartu).
 *
 * Sengaja di modul tanpa "use client" agar bisa dipanggil dari Server
 * Component maupun Client Component. (Fungsi yang diekspor dari berkas
 * "use client" tidak boleh dipanggil di server.)
 *
 * Varian "danger" sengaja dibuat lembut (teks merah di atas putih) agar daftar
 * tidak dipenuhi blok merah; tombol konfirmasi di dialog tetap merah penuh.
 */

export type VarianTombol = "primary" | "secondary" | "danger";

const kelasVarianKecil: Record<VarianTombol, string> = {
  // Pill hitam — aksi utama.
  primary: "bg-navy-950 text-white hover:bg-navy-800",
  // Pill putih bergaris.
  secondary: "bg-white text-navy-950 ring-1 ring-inset ring-navy-200 hover:bg-navy-50 hover:ring-navy-300",
  danger: "bg-white text-danger-700 ring-1 ring-inset ring-danger-600/25 hover:bg-danger-50 hover:ring-danger-600/45",
};

const kelasDasarKecil =
  "pressable inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-full font-medium " +
  "disabled:cursor-not-allowed disabled:opacity-60 " +
  "[&>svg]:size-4 [&>svg]:shrink-0";

/** Tombol pill kecil berteks (tinggi 44px — target sentuh nyaman). */
export function kelasTombolKecil(variant: VarianTombol = "secondary", className?: string) {
  return cn(kelasDasarKecil, "min-h-11 gap-1.5 px-4 py-2 text-[0.8125rem]", kelasVarianKecil[variant], className);
}

/** Tombol bulat ikon saja (44px) — label wajib disediakan lewat teks sr-only. */
export function kelasTombolBulat(variant: VarianTombol = "secondary", className?: string) {
  return cn(kelasDasarKecil, "size-11", kelasVarianKecil[variant], className);
}
