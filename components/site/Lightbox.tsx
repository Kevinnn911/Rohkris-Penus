"use client";

import { useCallback, useEffect, useRef, useState, type SVGProps } from "react";

import { IconChevronLeft, IconChevronRight, IconClose } from "@/components/ui/Icons";
import type { MediaItemRow } from "@/lib/db/types";
import { formatTanggalSingkat } from "@/lib/format/date";

/**
 * Galeri dengan lightbox yang aksesibel.
 *
 * Aksesibilitas (PRD §9):
 *  - Dibuka lewat tombol sungguhan sehingga bisa difokus dengan keyboard.
 *  - role="dialog" + aria-modal, dengan focus trap di dalam dialog.
 *  - Escape menutup; fokus dikembalikan ke pemicu setelah ditutup.
 *  - Panah kiri/kanan untuk berpindah gambar.
 */
export function GaleriLightbox({ items }: { items: MediaItemRow[] }) {
  const [indeksAktif, setIndeksAktif] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const pemicuRef = useRef<HTMLButtonElement | null>(null);

  const tutup = useCallback(() => {
    setIndeksAktif(null);
    // Kembalikan fokus ke tombol yang membuka dialog.
    pemicuRef.current?.focus();
  }, []);

  const berpindah = useCallback(
    (arah: 1 | -1) => {
      setIndeksAktif((sekarang) => {
        if (sekarang === null) return null;
        const berikutnya = sekarang + arah;
        if (berikutnya < 0) return items.length - 1;
        if (berikutnya >= items.length) return 0;
        return berikutnya;
      });
    },
    [items.length],
  );

  useEffect(() => {
    if (indeksAktif === null) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        tutup();
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        berpindah(1);
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        berpindah(-1);
        return;
      }
      // Focus trap: jaga Tab tetap berputar di dalam dialog.
      if (event.key === "Tab" && dialogRef.current) {
        const fokusable = dialogRef.current.querySelectorAll<HTMLElement>("button");
        if (fokusable.length === 0) return;
        const pertama = fokusable[0];
        const terakhir = fokusable[fokusable.length - 1];
        if (!pertama || !terakhir) return;

        if (event.shiftKey && document.activeElement === pertama) {
          event.preventDefault();
          terakhir.focus();
        } else if (!event.shiftKey && document.activeElement === terakhir) {
          event.preventDefault();
          pertama.focus();
        }
      }
    }

    document.addEventListener("keydown", onKeyDown);
    // Kunci scroll latar selama dialog terbuka.
    const overflowAwal = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflowAwal;
    };
  }, [indeksAktif, tutup, berpindah]);

  // Pindahkan fokus ke dialog saat dibuka.
  useEffect(() => {
    if (indeksAktif !== null) {
      dialogRef.current?.querySelector<HTMLElement>("button")?.focus();
    }
  }, [indeksAktif]);


  const aktif = indeksAktif === null ? null : items[indeksAktif];
  const nomorAktif = (indeksAktif ?? 0) + 1;

  return (
    <>
      <ul className="grid grid-flow-row-dense auto-rows-[10rem] grid-cols-2 gap-3 sm:auto-rows-[13rem] sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">
        {items.map((item, index) => (
          <li key={item.id} className={kelasUbin(index, items.length)}>
            <button
              type="button"
              onClick={(event) => {
                pemicuRef.current = event.currentTarget;
                setIndeksAktif(index);
              }}
              className="group relative block size-full rounded-card border border-navy-200/80 bg-white p-1.5 text-left transition-[box-shadow,transform,border-color] duration-300 ease-out hover:-translate-y-1 hover:border-navy-300 hover:shadow-lift focus-visible:rounded-card! sm:p-2"
            >
              <span className="relative block size-full overflow-hidden rounded-[1.1rem] bg-navy-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.media_url}
                  alt={item.alt_text}
                  loading="lazy"
                  className="absolute inset-0 size-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05] group-focus-visible:scale-[1.05]"
                />

                {/* Lapisan tipis + tombol perbesar kuning: muncul saat hover/fokus. */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-navy-950/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100"
                />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute right-2.5 top-2.5 grid size-9 scale-90 place-items-center rounded-full bg-gold-300 text-navy-950 opacity-0 shadow-sm transition-[opacity,transform] duration-300 group-hover:scale-100 group-hover:opacity-100 group-focus-visible:scale-100 group-focus-visible:opacity-100"
                >
                  <IkonPerbesar className="size-4" />
                </span>

                {/* Keterangan: kartu putih kecil di pojok bawah — selalu tampil (judul dulu selalu terlihat di bawah gambar). */}
                {item.title || item.taken_at ? (
                  <span className="pointer-events-none absolute inset-x-2 bottom-2 block rounded-2xl bg-white/95 px-3 py-2 shadow-soft backdrop-blur sm:inset-x-3 sm:bottom-3 sm:px-3.5 sm:py-2.5">
                    {item.title ? (
                      <span className="line-clamp-2 block text-xs font-semibold leading-snug text-navy-950 sm:text-sm">
                        {item.title}
                      </span>
                    ) : null}
                    {item.taken_at ? (
                      <span className="mt-0.5 block text-[0.6875rem] text-navy-500">
                        {formatTanggalSingkat(item.taken_at)}
                      </span>
                    ) : null}
                  </span>
                ) : null}
              </span>
              <span className="sr-only">Perbesar gambar: {item.alt_text}</span>
            </button>
          </li>
        ))}
      </ul>

      {aktif ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/95 p-3 backdrop-blur-md sm:p-6"
          onClick={(event) => {
            if (event.target === event.currentTarget) tutup();
          }}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={aktif.title ?? aktif.alt_text}
            className="relative flex max-h-full w-full max-w-5xl flex-col overflow-y-auto p-1.5 text-white xl:overflow-visible"
          >
            <div className="flex items-center justify-between gap-4 pb-3 sm:pb-4">
              {items.length > 1 ? (
                <p
                  className="inline-flex min-h-9 items-center rounded-full bg-white/10 px-4 text-sm font-medium tabular-nums text-white ring-1 ring-inset ring-white/15"
                  role="status"
                >
                  <span aria-hidden="true">
                    {nomorAktif}
                    <span className="px-1.5 text-navy-300">/</span>
                    {items.length}
                  </span>
                  <span className="sr-only">
                    {nomorAktif} dari {items.length}
                  </span>
                </p>
              ) : (
                <span />
              )}
              <button type="button" onClick={tutup} className={`${TOMBOL_BULAT} ${TOMBOL_PUTIH}`}>
                <IconClose className="size-5" />
                <span className="sr-only">Tutup galeri</span>
              </button>
            </div>

            <figure className="flex min-h-0 flex-1 flex-col">
              <div className="relative flex min-h-0 items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  key={aktif.id}
                  src={aktif.media_url}
                  alt={aktif.alt_text}
                  className="max-h-[68vh] w-auto max-w-full animate-fade-up rounded-card object-contain shadow-[0_30px_80px_-20px_rgb(0_0_0/0.7)]"
                />

                {items.length > 1 ? (
                  <>
                    <button
                      type="button"
                      onClick={() => berpindah(-1)}
                      className={`${TOMBOL_BULAT} ${TOMBOL_PUTIH} absolute left-2 top-1/2 -translate-y-1/2 sm:left-3 xl:-left-20`}
                    >
                      <IconChevronLeft className="size-5" />
                      <span className="sr-only">Sebelumnya</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => berpindah(1)}
                      className={`${TOMBOL_BULAT} ${TOMBOL_KUNING} absolute right-2 top-1/2 -translate-y-1/2 sm:right-3 xl:-right-20`}
                    >
                      <IconChevronRight className="size-5" />
                      <span className="sr-only">Berikutnya</span>
                    </button>
                  </>
                ) : null}
              </div>

              {aktif.title || aktif.taken_at || aktif.caption ? (
                <figcaption className="mx-auto mt-5 w-full max-w-2xl text-center">
                  {aktif.taken_at ? (
                    <p className="inline-flex rounded-full bg-gold-300 px-3 py-0.5 text-xs font-medium text-navy-950">
                      {formatTanggalSingkat(aktif.taken_at)}
                    </p>
                  ) : null}
                  {aktif.title ? (
                    <h2 className="mt-2.5 text-xl font-bold leading-snug tracking-[-0.025em] text-white text-balance sm:text-2xl">
                      {aktif.title}
                    </h2>
                  ) : null}
                  {aktif.caption ? (
                    <p className="mt-2 text-sm leading-relaxed text-navy-300">{aktif.caption}</p>
                  ) : null}
                </figcaption>
              ) : null}
            </figure>
          </div>
        </div>
      ) : null}
    </>
  );
}

/**
 * Tombol bulat kontrol lightbox (48px, nyaman disentuh) — seperti tombol
 * carousel referensi: putih untuk tutup/sebelumnya, kuning untuk berikutnya.
 * Garis fokus putih agar tetap terlihat di atas latar gelap.
 */
const TOMBOL_BULAT =
  "grid size-12 shrink-0 place-items-center rounded-full text-navy-950 shadow-[0_10px_30px_-10px_rgb(0_0_0/0.6)] transition-[background-color,transform] duration-200 active:scale-95 focus-visible:rounded-full! focus-visible:outline-white!";
const TOMBOL_PUTIH = "bg-white hover:bg-navy-100";
const TOMBOL_KUNING = "bg-gold-300 hover:bg-gold-200";

/**
 * Pola ubin bento: 7 gambar mengisi tepat 12 sel, sehingga rapi tanpa celah
 * pada grid 2, 3, maupun 4 kolom. Sisa gambar di luar kelompok utuh memakai
 * ubin biasa agar baris terakhir tidak berlubang.
 */
const POLA_BENTO = [
  "col-span-2 row-span-2",
  "",
  "row-span-2",
  "",
  "",
  "",
  "col-span-2",
];

function kelasUbin(index: number, total: number) {
  const batasPola = Math.floor(total / POLA_BENTO.length) * POLA_BENTO.length;
  if (index >= batasPola) return "";
  return POLA_BENTO[index % POLA_BENTO.length];
}

/** Ikon "perbesar" (panah ke dua sudut) — dekoratif. */
function IkonPerbesar(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
    </svg>
  );
}
