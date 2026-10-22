import type { Metadata } from "next";
import Link from "next/link";

import { NavAdminLink } from "@/components/admin/AksiAdmin";
import { Brand } from "@/components/site/Navbar";
import {
  IconArrowUpRight,
  IconCalendar,
  IconGrid,
  IconImage,
  IconLogout,
  IconMegaphone,
  IconNewspaper,
  IconSettings,
  IconShield,
} from "@/components/ui/Icons";
import { keluar } from "@/lib/actions/auth";
import { requireAdmin } from "@/lib/auth/guard";

export const metadata: Metadata = {
  title: "Panel Admin",
  // Panel admin tidak pernah diindeks mesin pencari.
  robots: { index: false, follow: false, nocache: true },
};

const MENU = [
  { href: "/admin", label: "Dashboard", exact: true, Icon: IconGrid },
  { href: "/admin/kegiatan", label: "Kegiatan", exact: false, Icon: IconCalendar },
  { href: "/admin/galeri", label: "Dokumentasi", exact: false, Icon: IconImage },
  { href: "/admin/berita", label: "Berita", exact: false, Icon: IconNewspaper },
  { href: "/admin/pengumuman", label: "Pengumuman", exact: false, Icon: IconMegaphone },
  { href: "/admin/pengaturan", label: "Pengaturan", exact: false, Icon: IconSettings },
] as const;

const ROLE_LABEL = {
  super_admin: "Super Admin",
  admin: "Admin",
  editor: "Editor",
} as const;

/** Inisial nama untuk avatar — murni dekoratif. */
function inisial(nama: string) {
  return (
    nama
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((kata) => kata.charAt(0))
      .join("")
      .toUpperCase() || "A"
  );
}

/**
 * GERBANG PANEL ADMIN.
 *
 * requireAdmin() memverifikasi sesi di server DAN mencocokkannya dengan baris
 * aktif di admin_users. Bila gagal, pengguna dialihkan ke halaman login.
 *
 * Ini bukan satu-satunya lapisan: setiap Server Action memeriksa ulang, dan
 * RLS database menjadi penjaga terakhir.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { admin, email } = await requireAdmin();

  const menu =
    admin.role === "super_admin"
      ? [...MENU, { href: "/admin/akses", label: "Kelola Admin", exact: false, Icon: IconShield }]
      : MENU;

  const labelPeran = ROLE_LABEL[admin.role] ?? admin.role.replace("_", " ");

  return (
    <div className="min-h-screen bg-ivory-100 lg:flex lg:gap-6 lg:p-5">
      <a
        href="#konten-admin"
        className="skip-link rounded-full bg-navy-950 px-4 py-2 text-sm font-medium text-white"
      >
        Lewati ke konten utama
      </a>

      {/* Sidebar (desktop: kartu putih melayang) / header bertumpuk (ponsel) */}
      <header className="border-b border-navy-200/80 bg-white lg:sticky lg:top-5 lg:flex lg:h-[calc(100vh-2.5rem)] lg:w-72 lg:shrink-0 lg:flex-col lg:rounded-panel lg:border lg:shadow-soft">
        {/* Merek + aksi ringkas */}
        <div className="flex items-center justify-between gap-3 px-4 pb-3 pt-4 sm:px-6 lg:block lg:px-6 lg:pb-5 lg:pt-7">
          <Link href="/admin" className="min-w-0 rounded-xl">
            <Brand />
            <span className="sr-only">— Panel Admin, ke dashboard</span>
          </Link>
          <p className="mt-3 hidden lg:block">
            <span className="inline-flex rounded-full bg-gold-300 px-3 py-1 text-xs font-medium text-navy-950">
              Panel Admin
            </span>
          </p>

          {/* Aksi ringkas di ponsel */}
          <div className="flex shrink-0 items-center gap-2 lg:hidden">
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="grid size-11 place-items-center rounded-full bg-white text-navy-950 ring-1 ring-inset ring-navy-200 transition-colors hover:bg-navy-50"
            >
              <IconArrowUpRight className="size-[1.125rem]" />
              <span className="sr-only">Lihat situs (tab baru)</span>
            </Link>
            <form action={keluar}>
              <button
                type="submit"
                className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-full bg-navy-950 px-4 text-sm font-medium text-white transition-colors hover:bg-navy-800 max-[25rem]:px-0"
              >
                <IconLogout className="size-4" />
                <span className="max-[25rem]:sr-only">Keluar</span>
              </button>
            </form>
          </div>
        </div>

        {/* Identitas (ponsel) */}
        <p className="truncate px-4 pb-3 text-xs text-navy-600 sm:px-6 lg:hidden">
          <span className="font-semibold text-navy-950">Panel Admin</span> · {admin.display_name}
          {email ? ` · ${email}` : ""} ·{" "}
          <span className="font-semibold text-navy-950">{labelPeran}</span>
        </p>

        <nav
          aria-label="Navigasi admin"
          className="border-t border-navy-100 lg:flex-1 lg:overflow-y-auto lg:border-t-0"
        >
          <p className="hidden px-6 pb-2 text-sm font-medium text-navy-500 lg:block">
            <span className="label-dot">Menu</span>
          </p>
          <ul className="scrollbar-none flex gap-2 overflow-x-auto px-4 py-3 sm:px-6 lg:flex-col lg:gap-1 lg:overflow-visible lg:px-4 lg:py-0">
            {menu.map((item) => (
              <li key={item.href} className="shrink-0">
                <NavAdminLink href={item.href} exact={item.exact}>
                  <item.Icon className="size-[1.125rem] shrink-0" />
                  {item.label}
                </NavAdminLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Kartu akun (desktop) */}
        <div className="hidden p-4 lg:block">
          <div className="rounded-card border border-navy-200/80 bg-ivory-100 p-4">
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="grid size-11 shrink-0 place-items-center rounded-full bg-gold-300 text-sm font-bold text-navy-950"
              >
                {inisial(admin.display_name)}
              </span>
              <div className="min-w-0 leading-tight">
                <p className="truncate text-sm font-semibold text-navy-950">{admin.display_name}</p>
                {email ? <p className="mt-0.5 truncate text-xs text-navy-600">{email}</p> : null}
              </div>
            </div>
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-navy-800 ring-1 ring-inset ring-navy-200">
              <IconShield className="size-3.5" />
              {labelPeran}
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <Link
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full bg-white text-sm font-medium text-navy-950 ring-1 ring-inset ring-navy-200 transition-colors hover:bg-navy-50"
              >
                Lihat situs
                <IconArrowUpRight className="size-4" />
                <span className="sr-only">(tab baru)</span>
              </Link>
              <form action={keluar}>
                <button
                  type="submit"
                  className="inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-full bg-navy-950 text-sm font-medium text-white transition-colors hover:bg-navy-800"
                >
                  <IconLogout className="size-4" />
                  Keluar
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <main id="konten-admin" className="min-w-0 flex-1">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-6 lg:py-8">{children}</div>
      </main>
    </div>
  );
}
