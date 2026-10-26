import Link from "next/link";
import type { ReactNode } from "react";

import { HeroBackdrop } from "@/components/site/HeroBackdrop";
import { IconArrowRight } from "@/components/ui/Icons";
import { cn } from "@/lib/cn";

/**
 * Header halaman publik — kartu hero terang membulat (gaya referensi),
 * dengan breadcrumb opsional (PRD §9: breadcrumb pada detail).
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  breadcrumb,
  children,
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  /** Jejak navigasi; item terakhir dianggap halaman aktif bila tanpa href. */
  breadcrumb?: Array<{ href?: string; label: string }>;
  /** Konten tambahan di bawah deskripsi (misalnya badge atau tombol). */
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("px-3 sm:px-5", className)}>
      <section className="relative isolate mx-auto max-w-7xl overflow-hidden rounded-hero bg-mist">
        <HeroBackdrop variant="subtle" />
        <div className="relative mx-auto max-w-6xl px-5 pb-14 pt-10 text-center sm:px-8 sm:pb-20 sm:pt-14">
          {breadcrumb && breadcrumb.length > 0 ? (
            <nav aria-label="Breadcrumb" className="mb-8 flex justify-center">
              <ol className="inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-full bg-white px-4 py-1.5 text-sm text-navy-600 ring-1 ring-inset ring-navy-200/80">
                {breadcrumb.map((item, index) => {
                  const terakhir = index === breadcrumb.length - 1;
                  return (
                    <li key={`${item.label}-${index}`} className="flex items-center gap-2">
                      {item.href && !terakhir ? (
                        <Link href={item.href} className="transition-colors hover:text-navy-950">
                          {item.label}
                        </Link>
                      ) : (
                        <span aria-current={terakhir ? "page" : undefined} className="line-clamp-1 font-medium text-navy-950">
                          {item.label}
                        </span>
                      )}
                      {!terakhir ? (
                        <span aria-hidden="true" className="text-navy-300">
                          ·
                        </span>
                      ) : null}
                    </li>
                  );
                })}
              </ol>
            </nav>
          ) : null}

          <div className="mx-auto max-w-3xl animate-fade-up">
            {eyebrow ? (
              <p className="text-sm font-medium text-navy-600">{eyebrow}</p>
            ) : null}
            <h1 className="mt-3 text-4xl font-bold leading-[1.05] tracking-display text-navy-950 text-balance sm:text-6xl">
              {title}
            </h1>
            {description ? (
              <div className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-navy-600 sm:text-lg">
                {description}
              </div>
            ) : null}
            {children ? <div className="mt-8">{children}</div> : null}
          </div>
        </div>
      </section>
    </div>
  );
}

/** Judul seksi di dalam halaman — judul tebal + subjudul abu + aksi opsional. */
export function SectionHeading({
  id,
  eyebrow,
  title,
  description,
  action,
  align = "left",
}: {
  id?: string;
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  align?: "left" | "center";
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-end justify-between gap-x-8 gap-y-5",
        align === "center" && "flex-col items-center text-center",
      )}
    >
      <div className={cn("max-w-2xl", align === "center" && "mx-auto")}>
        {eyebrow ? (
          <p className="mb-2 text-sm font-medium text-navy-600">{eyebrow}</p>
        ) : null}
        <h2
          id={id}
          className="text-3xl font-bold leading-tight tracking-heading text-navy-950 text-balance sm:text-[2.125rem]"
        >
          {title}
        </h2>
        {description ? <p className="mt-2.5 text-lg text-navy-600">{description}</p> : null}
      </div>
      {action ? <div className="flex shrink-0 items-center gap-3">{action}</div> : null}
    </div>
  );
}

/** Tautan teks bergaris bawah dengan panah — dipakai untuk "Lihat semua …". */
export function ArrowLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="pressable group inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-medium text-navy-950 ring-1 ring-inset ring-navy-200 hover:bg-navy-50"
    >
      {children}
      <IconArrowRight className="size-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5" />
    </Link>
  );
}
