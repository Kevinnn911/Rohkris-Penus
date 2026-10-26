"use client";

import { useEffect } from "react";

import { HeroBackdrop } from "@/components/site/HeroBackdrop";
import { Button, ButtonLink } from "@/components/ui/Button";
import { IconAlert, IconArrowLeft } from "@/components/ui/Icons";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Catat ke konsol server/klien tanpa membocorkan detail ke pengguna.
    console.error("Terjadi kesalahan pada halaman:", error.message);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col bg-ivory-100 p-3 sm:p-5">
      <section className="relative isolate mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-center overflow-hidden rounded-hero bg-mist px-5 py-16 text-center sm:px-8 sm:py-20">
        <HeroBackdrop variant="subtle" />

        <div className="flex max-w-2xl animate-fade-up flex-col items-center">
          <span
            aria-hidden="true"
            className="grid size-14 place-items-center rounded-full bg-white text-danger-600 shadow-soft ring-1 ring-inset ring-navy-200/80"
          >
            <IconAlert className="size-6" />
          </span>

          <p className="mt-6 text-sm font-medium text-navy-600">Ada yang tidak beres</p>
          <h1 className="mt-3 text-4xl font-bold leading-[1.05] tracking-display text-navy-950 text-balance sm:text-6xl">
            Terjadi gangguan
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-navy-600 sm:text-lg">
            Halaman ini tidak dapat dimuat. Silakan coba lagi beberapa saat lagi.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Button type="button" onClick={reset} variant="primary" size="lg">
              Coba lagi
            </Button>
            <ButtonLink href="/" variant="secondary" size="lg">
              <IconArrowLeft className="size-4" />
              Kembali ke Beranda
            </ButtonLink>
          </div>
        </div>
      </section>
    </div>
  );
}
