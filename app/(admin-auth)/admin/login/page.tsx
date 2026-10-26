// File: app/(admin-auth)/admin/login/page.tsx

import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { FormLogin } from "@/components/admin/FormLogin";
import { HeroBackdrop } from "@/components/site/HeroBackdrop";
import { Brand } from "@/components/site/Navbar";
import { IconAlert, IconArrowLeft, IconLock, IconShield } from "@/components/ui/Icons";
import { SetupNotice } from "@/components/ui/States";
import { hasAdminGateAccess, isGateKeyValid } from "@/lib/auth/gate";
import { getAdminContext } from "@/lib/auth/guard";
import { isDatabaseConfigured } from "@/lib/env";

export const metadata: Metadata = {
  title: "Masuk Admin",
  robots: { index: false, follow: false, nocache: true },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; key?: string }>;
}) {
  const params = await searchParams;

  // Bila sudah menjadi admin aktif, langsung ke dashboard.
  const context = await getAdminContext();
  if (context) redirect("/admin");

  const hasGate = await hasAdminGateAccess();
  const hasKeyParam = isGateKeyValid(params.key);

  // Akses ditolak dan disajikan 404 bila tidak memiliki izin gerbang admin.
  if (!hasGate && !hasKeyParam) {
    notFound();
  }


  const pesanError =
    params.error === "unauthorized"
      ? "Anda perlu masuk sebagai admin aktif untuk membuka panel."
      : null;

  return (
    <div className="min-h-dvh bg-ivory-100 p-3 sm:p-5">
      <div className="mx-auto grid max-w-7xl gap-4 sm:gap-5 lg:min-h-[calc(100dvh-2.5rem)] lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        {/* Panel branding — kartu kabut terang */}
        <section
          aria-label="Tentang panel admin"
          className="relative isolate flex flex-col overflow-hidden rounded-hero bg-mist px-5 pb-10 pt-6 sm:px-10 sm:pt-8 lg:px-12 lg:pb-12"
        >
          <HeroBackdrop variant="subtle" />

          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="rounded-xl">
              <Brand />
              <span className="sr-only"> — ke beranda</span>
            </Link>
            <Link
              href="/"
              className="pressable inline-flex size-11 shrink-0 items-center justify-center gap-1.5 rounded-full bg-white text-sm font-medium text-navy-950 ring-1 ring-inset ring-navy-200 hover:bg-navy-50 sm:size-auto sm:min-h-11 sm:px-4"
            >
              <IconArrowLeft className="size-4" />
              <span className="sr-only sm:not-sr-only">Kembali ke website</span>
            </Link>
          </div>

          <div className="mt-10 text-center sm:mt-14 lg:my-auto lg:py-12">
            <p className="text-sm font-medium text-navy-600">Ruang Pengurus</p>
            <h1 className="mt-3 text-5xl font-bold leading-[1.02] tracking-display text-navy-950 text-balance sm:text-7xl">
              Panel Admin
            </h1>
            <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-navy-600 sm:text-lg">
              Masuk untuk mengelola kegiatan, dokumentasi, dan berita Rohani Kristen SMK PLUS
              Pelita Nusantara.
            </p>

            <ul className="mx-auto mt-8 hidden max-w-md flex-wrap justify-center gap-2.5 text-sm text-navy-800 sm:flex">
              <li className="inline-flex items-center gap-2 rounded-full bg-white py-1.5 pl-1.5 pr-4 ring-1 ring-inset ring-navy-200/80">
                <span className="grid size-8 place-items-center rounded-full bg-navy-100 text-navy-950">
                  <IconShield className="size-4" />
                </span>
                Akses hanya untuk pengurus yang terdaftar aktif
              </li>
              <li className="inline-flex items-center gap-2 rounded-full bg-white py-1.5 pl-1.5 pr-4 ring-1 ring-inset ring-navy-200/80">
                <span className="grid size-8 place-items-center rounded-full bg-navy-100 text-navy-950">
                  <IconLock className="size-4" />
                </span>
                Sesi diverifikasi di server pada setiap permintaan
              </li>
            </ul>
          </div>

          {/* Ayat tema — kutipan tenang di dasar panel */}
          <figure className="mx-auto mt-10 hidden max-w-sm border-l-2 border-gold-400 pl-4 text-left lg:block">
            <blockquote className="text-base font-semibold leading-snug tracking-tight text-navy-950 text-balance">
              “Kamu adalah terang dunia. Kota yang terletak di atas gunung tidak mungkin
              tersembunyi.”
            </blockquote>
            <figcaption className="mt-2 text-xs text-navy-600">
              <span className="font-medium text-navy-950">Matius 5:14</span> · Ayat tema
            </figcaption>
          </figure>
        </section>

        {/* Panel formulir */}
        <section
          aria-labelledby="judul-masuk"
          className="flex items-start justify-center py-4 sm:py-8 lg:items-center lg:py-0"
        >
          <div className="w-full max-w-md">
            <div className="rounded-bar bg-white p-6 shadow-float sm:p-9">
              <span className="grid size-11 place-items-center rounded-full bg-navy-950 text-white">
                <IconLock className="size-5" />
              </span>
              <h2
                id="judul-masuk"
                className="mt-5 text-3xl font-bold tracking-heading text-navy-950 text-balance"
              >
                Masuk ke panel
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-navy-500">
                Gunakan email dan kata sandi akun admin Anda.
              </p>

              {!isDatabaseConfigured() ? (
                <div className="mt-6">
                  <SetupNotice />
                </div>
              ) : null}

              {pesanError ? (
                <p
                  role="alert"
                  className="mt-6 flex items-start gap-2.5 rounded-2xl border border-warning-600/25 bg-warning-50 px-4 py-3 text-sm font-medium text-warning-700"
                >
                  <IconAlert className="mt-0.5 size-4 shrink-0" />
                  {pesanError}
                </p>
              ) : null}

              <div className="mt-7">
                <FormLogin secretKey={hasKeyParam ? (params.key?.trim() ?? undefined) : undefined} />
              </div>
            </div>

            <p className="mt-6 text-center text-xs text-navy-600">
              © 2026 Rohkris SMK PLUS Pelita Nusantara
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
