// File: components/site/KategoriFleksibel.tsx
"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode, type TouchEvent } from "react";

import {
  IconArrowRight,
  IconChevronLeft,
  IconChevronRight,
  IconFilter,
} from "@/components/ui/Icons";
import { cn } from "@/lib/cn";
import { EVENT_CATEGORIES, type EventCategory } from "@/lib/db/types";
import { KATEGORI_INFO } from "@/components/site/Kategori";

export interface KategoriFleksibelProps {
  judulId: string;
  heading: ReactNode;
  kategoriList?: readonly EventCategory[];
  jumlahPerKategori?: Partial<Record<EventCategory, number>>;
}

/**
 * Komponen KategoriFleksibel Ultra-Smooth (GPU-Accelerated Canva Magic Move):
 * - Animasi komposit GPU murni (transform scale & translate3d + opacity) tanpa reflow CPU.
 * - Deselerasi kurva mewah ala Apple/Canva: cubic-bezier(0.16, 1, 0.3, 1) berdurasi 600ms saat slide.
 * - Transisi hover halus (300ms) saat kursor diarahkan ke kartu samping (tab putih), melayang lembut
 *   tanpa hentakan instan.
 * - 5-Set Continuous Buffer Track menjamin sirkularitas tak terbatas tanpa guncangan di seluruh tab.
 */
export function KategoriFleksibel({
  judulId,
  heading,
  kategoriList = EVENT_CATEGORIES,
  jumlahPerKategori,
}: KategoriFleksibelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(1000);

  const total = kategoriList.length;

  // 5 set kategori kontinu untuk pergeseran mulus tanpa henti
  const extendedList = useMemo(() => {
    return [
      ...kategoriList,
      ...kategoriList,
      ...kategoriList,
      ...kategoriList,
      ...kategoriList,
    ];
  }, [kategoriList]);

  // Mulai di Set 2 (indeks = 2 * total, yaitu 16 untuk 8 kategori)
  const [currentIndex, setCurrentIndex] = useState(2 * total);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isNormalizing, setIsNormalizing] = useState(false);

  // Kunci navigasi untuk mencegah spam klik selama transisi aktif
  const isNavigatingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  // Mengamati perubahan lebar container via ResizeObserver
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const w = el.getBoundingClientRect().width;
    if (w > 0) {
      setContainerWidth(w);
    }

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const measured = entry.contentRect.width;
        if (measured > 0) {
          setContainerWidth(measured);
        }
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Membersihkan timer saat unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // Navigasi perpindahan kartu
  const navigasi = useCallback(
    (arah: 1 | -1) => {
      if (isNavigatingRef.current) return;
      isNavigatingRef.current = true;

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      setIsTransitioning(true);
      setCurrentIndex((prev) => prev + arah);

      timerRef.current = setTimeout(() => {
        setCurrentIndex((curr) => {
          let target = curr;
          // Normalisasi koordinat silent jika bergerak sangat jauh ke tepi buffer
          if (curr >= 4 * total) {
            target = curr - 2 * total;
          } else if (curr < total) {
            target = curr + 2 * total;
          }

          if (target !== curr) {
            setIsTransitioning(false);
            setIsNormalizing(true);
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                setIsNormalizing(false);
                isNavigatingRef.current = false;
              });
            });
            return target;
          }

          setIsTransitioning(false);
          isNavigatingRef.current = false;
          return curr;
        });
      }, 600);
    },
    [total],
  );

  // Navigasi tombol panah keyboard
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowLeft") {
        navigasi(-1);
      } else if (event.key === "ArrowRight") {
        navigasi(1);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigasi]);

  // Dukungan gesture sentuh (touch swipe)
  function handleTouchStart(e: TouchEvent) {
    setTouchStartX(e.touches[0]?.clientX ?? null);
  }

  function handleTouchEnd(e: TouchEvent) {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0]?.clientX ?? 0;
    const selisih = touchStartX - touchEndX;
    if (Math.abs(selisih) > 40) {
      if (selisih > 0) {
        navigasi(1);
      } else {
        navigasi(-1);
      }
    }
    setTouchStartX(null);
  }

  // Kalkulasi dimensi kartu dan offset pergeseran presisi
  const cardWidth = containerWidth < 640 ? Math.min(containerWidth * 0.72, 280) : 340;
  const gap = containerWidth < 640 ? 12 : 24;
  const step = cardWidth + gap;

  // Offset tepat di mana kartu currentIndex berada tepat di tengah layar
  const currentOffset = (containerWidth - cardWidth) / 2 - currentIndex * step;

  // Indeks kategori aktif modulo (0 hingga total - 1) untuk indikator
  const activeKategoriIndex = ((currentIndex % total) + total) % total;

  const tombolNav =
    "grid size-11 place-items-center rounded-full transition-all duration-200 active:scale-90 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-950 cursor-pointer";

  // Transisi cerdas: 600ms saat pergeseran slide, 300ms saat kursor hover, dan none saat 1 frame silent normalization
  const cardTransition = isTransitioning
    ? "transition-all duration-600 ease-[cubic-bezier(0.16,1,0.3,1)]"
    : isNormalizing
      ? "transition-none"
      : "transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]";

  return (
    <section aria-labelledby={judulId} className="space-y-7">
      {/* Baris heading dan kontrol navigasi */}
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        {heading}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Link
            href="/kegiatan"
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-4 text-sm font-medium text-navy-950 ring-1 ring-inset ring-navy-200 transition-all duration-200 hover:bg-navy-50 active:scale-95"
          >
            <IconFilter className="size-4" />
            <span className="hidden sm:inline">Semua</span> Kegiatan
          </Link>

          <button
            type="button"
            onClick={() => navigasi(-1)}
            aria-label="Kategori sebelumnya"
            className={cn(tombolNav, "bg-white text-navy-950 ring-1 ring-inset ring-navy-200 hover:bg-navy-50")}
          >
            <IconChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => navigasi(1)}
            aria-label="Kategori berikutnya"
            className={cn(tombolNav, "bg-gold-300 text-navy-950 shadow-glow hover:bg-gold-200")}
          >
            <IconChevronRight className="size-5" />
          </button>
        </div>
      </div>

      {/* Viewport Carousel dengan Tinggi Terkunci Permanen (Zero-CLS) */}
      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative mx-auto w-full min-h-[21rem] sm:min-h-[25rem] overflow-hidden py-3"
      >
        <div
          style={{
            transform: `translate3d(${currentOffset}px, 0, 0)`,
            transition: isTransitioning
              ? "transform 600ms cubic-bezier(0.16, 1, 0.3, 1)"
              : "none",
            gap: `${gap}px`,
          }}
          className="flex items-end will-change-transform transform-gpu"
        >
          {extendedList.map((kategori, i) => {
            const diff = i - currentIndex;
            const isCenter = diff === 0;
            const isLeft = diff === -1;
            const isRight = diff === 1;
            const isInteractive = isLeft || isRight;
            const isVisible = Math.abs(diff) <= 2;
            const nomorKategori = (i % total) + 1;

            const info = KATEGORI_INFO[kategori] ?? {
              Icon: IconFilter,
              deskripsi: "Kegiatan Rohkris",
            };

            return (
              <div
                key={i}
                style={{ width: `${cardWidth}px` }}
                aria-current={isCenter ? "true" : undefined}
                aria-hidden={!isVisible ? "true" : undefined}
                role={isInteractive ? "button" : undefined}
                tabIndex={isInteractive ? 0 : -1}
                aria-label={isInteractive ? `Pilih kategori ${kategori}` : undefined}
                onClick={() => {
                  if (isLeft) navigasi(-1);
                  if (isRight) navigasi(1);
                }}
                onKeyDown={(e) => {
                  if (isInteractive && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    if (isLeft) navigasi(-1);
                    if (isRight) navigasi(1);
                  }
                }}
                className={cn(
                  "group relative shrink-0 select-none transform-gpu",
                  isCenter
                    ? "z-20 cursor-default"
                    : isInteractive
                      ? "z-10 cursor-pointer"
                      : "z-0 pointer-events-none",
                )}
              >
                {/* Kontainer kartu dengan efek hover halus melayang (300ms cubic-bezier) */}
                <div
                  className={cn(
                    "relative flex flex-col justify-between overflow-hidden rounded-[1.75rem] sm:rounded-[2.25rem] border p-5 sm:p-7 h-[19.5rem] sm:h-[23.5rem] origin-bottom transform-gpu",
                    cardTransition,
                    isCenter
                      ? "bg-navy-950 text-white border-navy-900 shadow-[0_24px_50px_-12px_rgba(10,15,30,0.45)] ring-1 ring-white/10 scale-100 translate-y-0 opacity-100"
                      : isInteractive
                        ? "bg-white text-navy-950 border-navy-200/90 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.08)] scale-[0.88] translate-y-2 opacity-85 group-hover:opacity-100 group-hover:scale-[0.91] group-hover:-translate-y-1 group-hover:border-navy-400 group-hover:shadow-lift"
                        : "bg-white/70 text-navy-950 border-navy-200/40 scale-[0.78] translate-y-6 opacity-0 pointer-events-none",
                  )}
                >
                  {/* Baris Atas: Nomor Urut Riil & Ikon Kategori */}
                  <div className="flex items-start justify-between gap-2 sm:gap-3">
                    <span
                      className={cn(
                        "grid font-mono font-bold transform-gpu",
                        cardTransition,
                        isCenter
                          ? "size-8 sm:size-11 place-items-center rounded-xl sm:rounded-2xl bg-white/15 text-xs sm:text-sm text-gold-300 ring-1 ring-white/20"
                          : "size-7 sm:size-9 place-items-center rounded-lg sm:rounded-xl bg-navy-100 text-[0.7rem] sm:text-xs text-navy-800 group-hover:scale-105 group-hover:bg-navy-200",
                      )}
                    >
                      {nomorKategori}
                    </span>

                    <div
                      className={cn(
                        "grid place-items-center transform-gpu",
                        cardTransition,
                        isCenter
                          ? "size-9 sm:size-12 rounded-xl sm:rounded-2xl bg-white/10 text-gold-300 ring-1 ring-white/10"
                          : "size-6 sm:size-9 rounded-lg sm:rounded-xl bg-transparent text-navy-950 group-hover:scale-110",
                      )}
                    >
                      <info.Icon
                        className={cn(
                          cardTransition,
                          isCenter ? "size-5 sm:size-7" : "size-5 sm:size-8",
                        )}
                        strokeWidth={isCenter ? 1.5 : 1.4}
                      />
                    </div>
                  </div>

                  {/* Bagian Tengah: Label Navigasi Sisi, Judul Kategori, dan Deskripsi */}
                  <div className="my-auto py-1 sm:py-2">
                    <div
                      className={cn(
                        "overflow-hidden transition-all duration-300",
                        isInteractive ? "opacity-100 translate-y-0 mb-1" : "opacity-0 -translate-y-1 mb-0 pointer-events-none",
                      )}
                    >
                      <p className="text-[0.65rem] sm:text-xs font-semibold uppercase tracking-wider text-navy-400 group-hover:text-gold-600 transition-colors duration-300 truncate">
                        {isLeft ? "Sebelumnya" : "Berikutnya"}
                      </p>
                    </div>

                    <h3
                      className={cn(
                        "text-lg sm:text-2xl md:text-3xl font-bold tracking-tight leading-tight transform-gpu",
                        cardTransition,
                        isCenter ? "text-white" : "text-navy-950 truncate group-hover:text-navy-900",
                      )}
                    >
                      {kategori}
                    </h3>

                    <p
                      className={cn(
                        "mt-1 sm:mt-1.5 text-xs sm:text-sm leading-relaxed line-clamp-2",
                        cardTransition,
                        isCenter ? "text-navy-200 opacity-100" : "text-navy-500 opacity-80",
                      )}
                    >
                      {info.deskripsi}
                    </p>

                    {jumlahPerKategori?.[kategori] !== undefined ? (
                      <p
                        className={cn(
                          "mt-1 text-[0.7rem] sm:text-xs font-medium",
                          cardTransition,
                          isCenter ? "text-gold-200" : "text-navy-400",
                        )}
                      >
                        {jumlahPerKategori[kategori]} kegiatan aktif
                      </p>
                    ) : null}
                  </div>

                  {/* Baris Bawah: Tombol CTA Interaktif */}
                  <div
                    className={cn(
                      "pt-2 sm:pt-3 transform-gpu",
                      cardTransition,
                      isCenter
                        ? "opacity-100 translate-y-0 pointer-events-auto"
                        : "opacity-0 translate-y-3 pointer-events-none",
                    )}
                  >
                    <Link
                      href={`/kegiatan?kategori=${encodeURIComponent(kategori)}`}
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      className="group/cta inline-flex w-full items-center justify-between gap-1.5 sm:gap-2 rounded-full bg-gold-300 px-3.5 py-2.5 sm:px-5 sm:py-3 text-xs sm:text-sm font-semibold text-navy-950 shadow-glow transition-all duration-200 hover:scale-[1.02] hover:bg-gold-200 active:scale-98"
                    >
                      <span className="truncate">
                        Lihat Kegiatan <span className="hidden sm:inline">{kategori}</span>
                      </span>
                      <IconArrowRight className="size-3.5 sm:size-4 shrink-0 transition-transform duration-200 group-hover/cta:translate-x-1" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Indikator posisi numerik dan titik navigasi */}
      <div className="flex items-center justify-center gap-2 pt-1 text-xs text-navy-500">
        <span className="tabular-nums font-medium">{activeKategoriIndex + 1}</span>
        <div className="flex gap-1.5" aria-hidden="true">
          {kategoriList.map((_, idx) => (
            <span
              key={idx}
              className={cn(
                "h-1.5 rounded-full transition-all duration-500 ease-out",
                idx === activeKategoriIndex ? "w-7 bg-navy-950 shadow-sm" : "w-1.5 bg-navy-200",
              )}
            />
          ))}
        </div>
        <span className="tabular-nums font-medium">{total}</span>
      </div>
    </section>
  );
}
