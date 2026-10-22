"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, useEffect, useState } from "react";

import { IconClose, IconCross, IconMenu } from "@/components/ui/Icons";
import { cn } from "@/lib/cn";

const NAV_ITEMS = [
  { href: "/", label: "Beranda" },
  { href: "/kegiatan", label: "Kegiatan" },
  { href: "/jadwal", label: "Jadwal" },
  { href: "/dokumentasi", label: "Dokumentasi" },
  { href: "/berita", label: "Berita" },
  { href: "/tentang", label: "Tentang" },
] as const;

/** Logo placeholder — ganti dengan logo resmi sekolah bila tersedia. */
export function LogoMark({ className, inverted = false }: { className?: string; inverted?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-[0.8rem]",
        inverted ? "bg-white text-navy-950" : "bg-navy-950 text-gold-300",
        className,
      )}
    >
      <IconCross className="size-[1.15rem]" strokeWidth={2.5} />
    </span>
  );
}

/** Logo + nama — dipakai di navbar dan footer. */
export function Brand({ inverted = false }: { inverted?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark inverted={inverted} />
      <span className={cn("text-[1.35rem] leading-none tracking-tight", inverted ? "text-white" : "text-navy-950")}>
        <span className="font-bold">Rohkris</span>
        <span className="font-light">Pelita</span>
      </span>
    </span>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [pathTerakhir, setPathTerakhir] = useState(pathname);

  // Tutup menu saat berpindah halaman — disetel ketika render, bukan di dalam
  // effect, agar tidak memicu render berantai.
  if (pathname !== pathTerakhir) {
    setPathTerakhir(pathname);
    setOpen(false);
  }

  // Tutup menu dengan tombol Escape (aksesibilitas keyboard).
  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  // Navbar mendapat latar putih berkaca setelah halaman digulir.
  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 12);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <header className="sticky top-0 z-40 px-3 pt-3 sm:px-5">
      <div
        className={cn(
          "mx-auto max-w-7xl rounded-[1.75rem] transition-[background-color,box-shadow] duration-300",
          scrolled || open ? "bg-white/85 shadow-float backdrop-blur-xl" : "bg-transparent",
        )}
      >
        <nav
          className="flex h-16 items-center justify-between gap-4 px-4 sm:h-[4.5rem] sm:px-7"
          aria-label="Navigasi utama"
        >
          <Link href="/" className="rounded-xl">
            <Brand />
            <span className="sr-only">— Beranda Rohani Kristen SMK PLUS Pelita Nusantara</span>
          </Link>

          {/* Navigasi desktop — dipisah titik, item aktif berupa pill kuning */}
          <ul className="hidden items-center lg:flex">
            {NAV_ITEMS.map((item, index) => (
              <Fragment key={item.href}>
                {index > 0 ? (
                  <li aria-hidden="true" className="px-1 text-navy-400">
                    ·
                  </li>
                ) : null}
                <li>
                  <Link
                    href={item.href}
                    aria-current={isActive(item.href) ? "page" : undefined}
                    className={cn(
                      "block rounded-full px-3.5 py-1.5 text-[0.9375rem] transition-colors duration-200",
                      isActive(item.href)
                        ? "bg-gold-300 font-medium text-navy-950"
                        : "text-navy-900 hover:bg-navy-100",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              </Fragment>
            ))}
          </ul>

          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/kontak"
              aria-current={isActive("/kontak") ? "page" : undefined}
              className="hidden text-[0.9375rem] text-navy-900 underline-offset-4 hover:underline lg:inline"
            >
              Kontak
            </Link>
            <Link
              href="/kegiatan?status=pendaftaran"
              className="hidden min-h-11 items-center rounded-full bg-navy-950 px-6 text-[0.9375rem] font-semibold text-white shadow-[0_10px_24px_-12px_rgb(13_13_15/0.7)] transition-colors hover:bg-navy-800 sm:inline-flex"
            >
              Daftar Kegiatan
            </Link>

            {/* Tombol menu ponsel */}
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              aria-expanded={open}
              aria-controls="menu-ponsel"
              className="inline-flex size-11 items-center justify-center rounded-full bg-white text-navy-950 shadow-soft ring-1 ring-navy-100 transition-colors hover:bg-navy-50 lg:hidden"
            >
              <span className="sr-only">{open ? "Tutup menu navigasi" : "Buka menu navigasi"}</span>
              {open ? <IconClose className="size-5" /> : <IconMenu className="size-5" />}
            </button>
          </div>
        </nav>

        {open ? (
          <div id="menu-ponsel" className="px-3 pb-4 lg:hidden">
            <ul className="grid gap-1 border-t border-navy-100 pt-3">
              {[...NAV_ITEMS, { href: "/kontak", label: "Kontak" } as const].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isActive(item.href) ? "page" : undefined}
                    className={cn(
                      "flex items-center justify-between rounded-2xl px-4 py-3.5 text-[0.95rem]",
                      isActive(item.href)
                        ? "bg-gold-300 font-medium text-navy-950"
                        : "text-navy-900 hover:bg-navy-50",
                    )}
                  >
                    {item.label}
                    <span aria-hidden="true" className="text-navy-400">
                      →
                    </span>
                  </Link>
                </li>
              ))}
              <li className="pt-2 sm:hidden">
                <Link
                  href="/kegiatan?status=pendaftaran"
                  className="flex min-h-12 items-center justify-center rounded-full bg-navy-950 text-[0.95rem] font-semibold text-white"
                >
                  Daftar Kegiatan
                </Link>
              </li>
            </ul>
          </div>
        ) : null}
      </div>
    </header>
  );
}
