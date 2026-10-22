"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import { IconChevronLeft, IconChevronRight, IconFilter } from "@/components/ui/Icons";
import { cn } from "@/lib/cn";

/**
 * Baris kartu yang dapat digeser (scroll-snap) dengan tombol sebelumnya/berikutnya.
 * Tanpa JavaScript pun tetap bisa digulir secara horizontal.
 */
export function KategoriCarousel({
  judulId,
  heading,
  children,
}: {
  judulId: string;
  heading: ReactNode;
  children: ReactNode;
}) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [bisaKiri, setBisaKiri] = useState(false);
  const [bisaKanan, setBisaKanan] = useState(true);

  const perbarui = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setBisaKiri(el.scrollLeft > 4);
    setBisaKanan(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    perbarui();
    el.addEventListener("scroll", perbarui, { passive: true });
    window.addEventListener("resize", perbarui);
    return () => {
      el.removeEventListener("scroll", perbarui);
      window.removeEventListener("resize", perbarui);
    };
  }, [perbarui]);

  function geser(arah: 1 | -1) {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: arah * el.clientWidth * 0.8, behavior: "smooth" });
  }

  const tombol =
    "grid size-12 place-items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <section aria-labelledby={judulId}>
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
        {heading}
        <div className="flex items-center gap-3">
          <Link
            href="/kegiatan"
            className="inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-5 text-sm font-medium text-navy-950 ring-1 ring-inset ring-navy-200 transition-colors hover:bg-navy-50"
          >
            <IconFilter className="size-4" />
            Filter
          </Link>
          <button
            type="button"
            onClick={() => geser(-1)}
            disabled={!bisaKiri}
            className={cn(tombol, "bg-white text-navy-950 ring-1 ring-inset ring-navy-200 enabled:hover:bg-navy-50")}
          >
            <IconChevronLeft className="size-5" />
            <span className="sr-only">Kategori sebelumnya</span>
          </button>
          <button
            type="button"
            onClick={() => geser(1)}
            disabled={!bisaKanan}
            className={cn(tombol, "bg-gold-300 text-navy-950 shadow-glow enabled:hover:bg-gold-200")}
          >
            <IconChevronRight className="size-5" />
            <span className="sr-only">Kategori berikutnya</span>
          </button>
        </div>
      </div>

      <ul
        ref={trackRef}
        className="scrollbar-none -mx-3 mt-9 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-3 pb-6 pt-1"
      >
        {children}
      </ul>
    </section>
  );
}
