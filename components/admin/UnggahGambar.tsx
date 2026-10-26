"use client";

import { useRef, useState, useTransition } from "react";

import { kelasTombolKecil } from "@/components/admin/Feedback";
import { Button } from "@/components/ui/Button";
import { IconAlert, IconCheck, IconGlobe, IconTrash, IconUpload } from "@/components/ui/Icons";
import { unggahBerkas } from "@/lib/actions/media";
import { cn } from "@/lib/cn";
import { UPLOAD_LIMITS, validateUploadFile } from "@/lib/validation/schemas";

/**
 * Field gambar: unggah berkas ke folder hosting (/uploads) ATAU tempel URL eksternal.
 *
 * Validasi tipe/ukuran dilakukan dua kali — di sini agar admin segera tahu,
 * dan di server (lib/actions/media.ts) sebagai kontrol sebenarnya.
 */
export function UnggahGambar({
  id,
  name,
  label,
  value,
  onChange,
  error,
}: {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (url: string) => void;
  error?: string[];
}) {
  const [pesan, setPesan] = useState<string | null>(null);
  const [gagal, setGagal] = useState(false);
  const [pending, startTransition] = useTransition();
  const [sedangSeret, setSedangSeret] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function pilihBerkas(file: File) {
    const cek = validateUploadFile({ type: file.type, size: file.size });
    if (!cek.ok) {
      setGagal(true);
      setPesan(cek.message);
      return;
    }

    setGagal(false);
    setPesan("Mengunggah…");

    const formData = new FormData();
    formData.append("file", file);

    startTransition(async () => {
      try {
        const hasil = await unggahBerkas(null, formData);
        if (hasil.ok) {
          // Pada aksi unggah, `message` berisi URL publik hasil unggahan.
          onChange(hasil.message);
          setPesan("Berkas berhasil diunggah.");
          setGagal(false);
        } else {
          setPesan(hasil.message);
          setGagal(true);
        }
      } catch {
        // Gangguan jaringan atau berkas ditolak server/hosting sebelum aksi
        // berjalan (mis. melebihi batas ukuran) — jangan sampai isian form
        // hilang karena halaman error.
        setPesan("Berkas gagal diunggah. Periksa koneksi atau perkecil ukuran gambar, lalu coba lagi.");
        setGagal(true);
      } finally {
        if (inputRef.current) inputRef.current.value = "";
      }
    });
  }

  const adaError = Boolean(error?.length);
  const batasMb = Math.round(UPLOAD_LIMITS.maxBytes / 1024 / 1024);

  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-semibold text-navy-950"
      >
        {label}
      </label>
      <p id={`${id}-bantuan`} className="mt-1 text-sm leading-relaxed text-navy-500">
        Unggah berkas (JPG, PNG, WebP, AVIF — maksimal {batasMb} MB) atau tempel URL gambar yang
        diawali https://
      </p>

      <input
        ref={inputRef}
        id={`${id}-file`}
        type="file"
        accept={UPLOAD_LIMITS.allowedImageTypes.join(",")}
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) pilihBerkas(file);
        }}
      />

      {/* Area unggah — klik tombol, atau seret berkas gambar ke sini. */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!pending) setSedangSeret(true);
        }}
        onDragLeave={(e) => {
          if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
          setSedangSeret(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setSedangSeret(false);
          const file = e.dataTransfer.files?.[0];
          if (file && !pending) pilihBerkas(file);
        }}
        className={cn(
          "mt-3 overflow-hidden rounded-card border-2 border-dashed transition-colors duration-150",
          sedangSeret
            ? "border-navy-950 bg-gold-50"
            : adaError
              ? "border-danger-500/60 bg-danger-50/50"
              : "border-navy-300 bg-navy-50/60 hover:border-navy-400 hover:bg-navy-50",
        )}
      >
        {value ? (
          <div className="p-2.5">
            <div className="relative overflow-hidden rounded-inner bg-[repeating-conic-gradient(var(--color-navy-100)_0%_25%,white_0%_50%)] bg-[length:20px_20px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                key={value}
                src={value}
                alt="Pratinjau gambar yang dipilih"
                className="mx-auto max-h-72 w-full object-contain"
                onError={(e) => {
                  // Tangani gambar gagal dimuat (prompt §10).
                  e.currentTarget.style.display = "none";
                  setGagal(true);
                  setPesan("Gambar tidak dapat dimuat. Periksa kembali URL-nya.");
                }}
              />
              <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-medium text-navy-950 shadow-sm">
                Pratinjau
              </span>
              {pending ? (
                <div className="absolute inset-0 grid place-items-center bg-white/75 backdrop-blur-[2px]">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-navy-950 shadow-soft">
                    <IconUpload className="size-4" />
                    Mengunggah…
                  </span>
                </div>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2 px-1.5 pb-1 pt-3">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="min-h-11"
                disabled={pending}
                onClick={() => inputRef.current?.click()}
              >
                <IconUpload className="size-4" />
                {pending ? "Mengunggah…" : "Ganti berkas…"}
              </Button>
              <button
                type="button"
                className={kelasTombolKecil("danger")}
                onClick={() => onChange("")}
              >
                <IconTrash className="size-4" />
                Hapus gambar
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center px-6 py-10 text-center">
            <span
              aria-hidden="true"
              className="grid size-14 place-items-center rounded-full bg-white text-navy-700 ring-1 ring-inset ring-navy-200/80"
            >
              <IconUpload className="size-6" />
            </span>
            <p className="mt-4 text-base font-semibold text-navy-950">
              {sedangSeret ? "Lepaskan untuk mengunggah" : "Seret gambar ke sini"}
            </p>
            <p className="mt-1 text-sm text-navy-500">
              JPG, PNG, WebP, atau AVIF hingga {batasMb} MB
            </p>
            <Button
              type="button"
              variant="primary"
              size="sm"
              className="mt-5 min-h-11 px-5"
              disabled={pending}
              onClick={() => inputRef.current?.click()}
            >
              <IconUpload className="size-4" />
              {pending ? "Mengunggah…" : "Pilih berkas…"}
            </Button>
          </div>
        )}
      </div>

      {/* URL tersimpan — inilah nilai yang dikirim ke server. */}
      <div className="mt-4">
        <p aria-hidden="true" className="mb-2 text-sm text-navy-500">
          atau tempel URL gambar
        </p>
        <div className="relative">
          <IconGlobe className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-navy-500" />
          <input
            id={id}
            name={name}
            // Bukan type="url": nilai bisa berupa path unggahan lokal ("/uploads/…")
            // yang ditolak validasi bawaan browser. Format divalidasi di server.
            type="text"
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://"
            aria-describedby={`${id}-bantuan${error?.length ? ` ${id}-error` : ""}`}
            aria-invalid={error?.length ? true : undefined}
            className={cn(
              "block min-h-12 w-full rounded-2xl border py-3 pl-11 pr-4 text-md text-navy-950",
              "placeholder:text-navy-400",
              "transition-[border-color,box-shadow] duration-150 ease-out",
              "focus:outline-none focus:ring-4 focus-visible:outline-none",
              adaError
                ? "border-danger-500 bg-danger-50 focus:border-danger-600 focus:ring-danger-500/15"
                : "border-navy-200 bg-white hover:border-navy-300 focus:border-navy-950 focus:ring-gold-200",
            )}
          />
        </div>
      </div>

      {pesan ? (
        <p
          role={gagal ? "alert" : "status"}
          className={cn(
            "mt-2.5 flex items-start gap-1.5 text-sm font-medium",
            gagal ? "text-danger-700" : "text-sage-700",
          )}
        >
          {gagal ? (
            <IconAlert className="mt-0.5 size-4 shrink-0" />
          ) : (
            <IconCheck className="mt-0.5 size-4 shrink-0" />
          )}
          <span>{pesan}</span>
        </p>
      ) : null}

      {error?.length ? (
        <p
          id={`${id}-error`}
          role="alert"
          className="mt-2 flex items-start gap-1.5 text-sm font-medium text-danger-700"
        >
          <IconAlert className="mt-0.5 size-4 shrink-0" />
          <span>{error.join(" ")}</span>
        </p>
      ) : null}
    </div>
  );
}
