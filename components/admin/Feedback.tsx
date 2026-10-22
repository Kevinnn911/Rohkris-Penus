"use client";

import { useFormStatus } from "react-dom";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/Button";
import { IconAlert, IconCheck } from "@/components/ui/Icons";
import type { ActionResult } from "@/lib/actions/helpers";
import { cn } from "@/lib/cn";

type VarianTombol = "primary" | "secondary" | "danger";

/**
 * Gaya tombol aksi ringkas (dipakai di baris tabel / kartu admin).
 * Varian "danger" sengaja dibuat lembut (teks merah di atas putih) agar daftar
 * tidak dipenuhi blok merah; tombol konfirmasi di dialog tetap merah penuh.
 */
const kelasVarianKecil: Record<VarianTombol, string> = {
  // Pill hitam — aksi utama (seperti "Sign up" pada referensi).
  primary: "bg-navy-950 text-white hover:bg-navy-800",
  // Pill putih bergaris — seperti tombol "Filters" pada referensi.
  secondary: "bg-white text-navy-950 ring-1 ring-inset ring-navy-200 hover:bg-navy-50 hover:ring-navy-300",
  danger: "bg-white text-danger-700 ring-1 ring-inset ring-danger-600/25 hover:bg-danger-50 hover:ring-danger-600/45",
};

const kelasDasarKecil =
  "inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-full font-medium " +
  "transition-[background-color,box-shadow,color] duration-150 ease-out active:translate-y-px " +
  "disabled:cursor-not-allowed disabled:opacity-60 disabled:active:translate-y-0 " +
  "[&>svg]:size-4 [&>svg]:shrink-0";

/** Tombol pill kecil berteks (tinggi 44px — target sentuh nyaman). */
export function kelasTombolKecil(variant: VarianTombol = "secondary", className?: string) {
  return cn(kelasDasarKecil, "min-h-11 gap-1.5 px-4 py-2 text-[0.8125rem]", kelasVarianKecil[variant], className);
}

/** Tombol bulat ikon saja (44px) — label wajib disediakan lewat teks sr-only. */
export function kelasTombolBulat(variant: VarianTombol = "secondary", className?: string) {
  return cn(kelasDasarKecil, "size-11", kelasVarianKecil[variant], className);
}

/** Ikon arsip (kotak) — tidak tersedia di set ikon bersama. Dekoratif. */
export function IkonArsip({ className = "size-5" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="3" y="4" width="18" height="4.5" rx="1.25" />
      <path d="M5 8.5V18a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8.5M10 12.5h4" />
    </svg>
  );
}

/** Indikator putar kecil untuk status memproses (dekoratif). */
function Pemutar({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className={cn("size-4 shrink-0 animate-spin", className)}
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.5" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

/** Pesan hasil aksi — diumumkan ke pembaca layar lewat role yang tepat. */
export function PesanAksi({ result }: { result: ActionResult | null }) {
  if (!result) return null;

  return (
    <div
      role={result.ok ? "status" : "alert"}
      className={cn(
        "flex items-center gap-3.5 rounded-2xl border px-4 py-3.5 text-sm animate-fade-up",
        result.ok
          ? "border-sage-300 bg-sage-100 text-sage-700"
          : "border-danger-600/20 bg-danger-50 text-danger-700",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-full text-white",
          result.ok ? "bg-sage-600" : "bg-danger-600",
        )}
      >
        {result.ok ? <IconCheck className="size-4" /> : <IconAlert className="size-4" />}
      </span>
      <p className="font-medium leading-relaxed">
        {/* Status juga dinyatakan dengan teks, bukan warna saja. */}
        <span className="sr-only">{result.ok ? "Berhasil: " : "Gagal: "}</span>
        {result.message}
      </p>
    </div>
  );
}

/** Tombol submit yang menampilkan status loading. */
export function SubmitButton({
  children,
  labelLoading = "Menyimpan…",
  variant = "primary",
}: {
  children: React.ReactNode;
  labelLoading?: string;
  variant?: VarianTombol;
}) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant={variant} disabled={pending} aria-busy={pending} className="px-6">
      {pending ? (
        <>
          <Pemutar />
          {labelLoading}
        </>
      ) : (
        children
      )}
    </Button>
  );
}

/**
 * Bilah aksi form yang menempel di bawah layar saat menggulir form panjang,
 * sehingga tombol simpan selalu terjangkau.
 */
export function BilahAksiForm({
  children,
  catatan,
  hasil,
}: {
  children: ReactNode;
  catatan?: ReactNode;
  /** Hasil aksi terakhir — ditampilkan tepat di atas tombol agar selalu terlihat. */
  hasil?: ActionResult | null;
}) {
  return (
    <div className="sticky bottom-3 z-20 space-y-2.5 sm:bottom-5">
      {hasil ? <PesanAksi result={hasil} /> : null}
      <div className="flex flex-col gap-3 rounded-[1.75rem] border border-navy-200/60 bg-white p-2.5 shadow-float sm:flex-row sm:items-center sm:justify-between sm:pl-6">
        {catatan ? (
          <p className="hidden text-sm leading-relaxed text-navy-500 sm:block">{catatan}</p>
        ) : (
          <span aria-hidden="true" className="hidden sm:block" />
        )}
        <div className="flex flex-wrap items-center justify-end gap-2">{children}</div>
      </div>
    </div>
  );
}

/**
 * Tombol aksi dengan dialog konfirmasi.
 * Wajib untuk tindakan destruktif (PRD §FR-08).
 */
export function TombolKonfirmasi({
  label,
  pesanKonfirmasi,
  onKonfirmasi,
  variant = "danger",
  labelLoading = "Memproses…",
  ikon,
  ikonSaja = false,
}: {
  label: string;
  pesanKonfirmasi: string;
  onKonfirmasi: () => Promise<ActionResult>;
  variant?: VarianTombol;
  labelLoading?: string;
  /** Ikon dekoratif opsional di depan label tombol pemicu. */
  ikon?: ReactNode;
  /** Tampilkan pemicu sebagai tombol bulat ikon; label tetap terbaca pembaca layar. */
  ikonSaja?: boolean;
}) {
  const [terbuka, setTerbuka] = useState(false);
  const [sedangProses, setSedangProses] = useState(false);
  const [pesan, setPesan] = useState<string | null>(null);

  async function jalankan() {
    setSedangProses(true);
    setPesan(null);
    try {
      const hasil = await onKonfirmasi();
      if (!hasil.ok) {
        setPesan(hasil.message);
        setSedangProses(false);
        return;
      }
      setTerbuka(false);
    } catch {
      setPesan("Terjadi gangguan. Silakan coba lagi.");
    } finally {
      setSedangProses(false);
    }
  }

  const destruktif = variant === "danger";
  const bulat = ikonSaja && Boolean(ikon);

  return (
    <>
      <button
        type="button"
        className={bulat ? kelasTombolBulat(variant) : kelasTombolKecil(variant)}
        title={bulat ? label : undefined}
        onClick={() => setTerbuka(true)}
      >
        {ikon}
        {bulat ? <span className="sr-only">{label}</span> : label}
      </button>

      {terbuka ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-navy-950/50 p-4 backdrop-blur-sm sm:items-center"
          onClick={(event) => {
            if (event.target === event.currentTarget && !sedangProses) setTerbuka(false);
          }}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="judul-konfirmasi"
            className="w-full max-w-md animate-fade-up whitespace-normal rounded-panel bg-white p-6 text-left shadow-float sm:p-8"
          >
            <span
              aria-hidden="true"
              className={cn(
                "grid size-12 place-items-center rounded-full",
                destruktif ? "bg-danger-50 text-danger-600 ring-1 ring-inset ring-danger-600/15" : "bg-gold-300 text-navy-950",
              )}
            >
              <IconAlert className="size-5" />
            </span>
            <h2
              id="judul-konfirmasi"
              className="mt-5 text-2xl font-bold tracking-[-0.03em] text-navy-950"
            >
              Konfirmasi
            </h2>
            <p className="mt-2 text-[0.9375rem] leading-relaxed text-navy-600">{pesanKonfirmasi}</p>

            {pesan ? (
              <p
                role="alert"
                className="mt-5 flex items-start gap-2 rounded-2xl border border-danger-600/20 bg-danger-50 px-4 py-3 text-sm font-medium text-danger-700"
              >
                <IconAlert className="mt-0.5 size-4 shrink-0" />
                <span>{pesan}</span>
              </p>
            ) : null}

            <div className="mt-8 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setTerbuka(false)}
                disabled={sedangProses}
              >
                Batal
              </Button>
              <Button
                type="button"
                variant={variant}
                onClick={jalankan}
                disabled={sedangProses}
                aria-busy={sedangProses}
              >
                {sedangProses ? <Pemutar /> : null}
                {sedangProses ? labelLoading : label}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

/** Tombol aksi sederhana tanpa konfirmasi (publish, arsip, dll). */
export function TombolAksi({
  label,
  onAksi,
  variant = "secondary",
  ikon,
  ikonSaja = false,
}: {
  label: string;
  onAksi: () => Promise<ActionResult>;
  variant?: VarianTombol;
  /** Ikon dekoratif opsional di depan label. */
  ikon?: ReactNode;
  /** Tampilkan sebagai tombol bulat ikon; label tetap terbaca pembaca layar. */
  ikonSaja?: boolean;
}) {
  const [sedangProses, setSedangProses] = useState(false);
  const [pesan, setPesan] = useState<string | null>(null);
  const bulat = ikonSaja && Boolean(ikon);

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        className={bulat ? kelasTombolBulat(variant) : kelasTombolKecil(variant)}
        title={bulat ? label : undefined}
        disabled={sedangProses}
        aria-busy={sedangProses}
        onClick={async () => {
          setSedangProses(true);
          setPesan(null);
          try {
            const hasil = await onAksi();
            if (!hasil.ok) setPesan(hasil.message);
          } catch {
            setPesan("Terjadi gangguan.");
          } finally {
            setSedangProses(false);
          }
        }}
      >
        {sedangProses ? <Pemutar /> : ikon}
        {bulat ? (
          <span className="sr-only">{label}</span>
        ) : (
          /* Label tetap terbaca saat memproses agar lebar tombol stabil. */
          <span className={sedangProses ? "opacity-70" : undefined}>{label}</span>
        )}
        {sedangProses ? <span className="sr-only">(memproses…)</span> : null}
      </button>
      {pesan ? (
        <span
          role="alert"
          className="inline-flex max-w-56 items-start gap-1 text-xs font-medium whitespace-normal text-danger-700"
        >
          <IconAlert className="mt-px size-3.5 shrink-0" />
          {pesan}
        </span>
      ) : null}
    </span>
  );
}
