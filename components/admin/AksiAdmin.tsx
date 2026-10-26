"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { TombolAksi, TombolKonfirmasi } from "@/components/admin/Feedback";
import { IconLock } from "@/components/ui/Icons";
import { ubahPeranAdmin, ubahStatusAdmin } from "@/lib/actions/settings";
import { cn } from "@/lib/cn";
import type { AdminRole } from "@/lib/db/types";

/**
 * Tautan menu panel admin dengan penanda halaman aktif (pill kuning).
 * Dipakai oleh layout admin (server component) — penentuan halaman aktif
 * memerlukan usePathname sehingga harus berada di berkas klien.
 */
export function NavAdminLink({
  href,
  exact = false,
  children,
}: {
  href: string;
  exact?: boolean;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const aktif = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      aria-current={aktif ? "page" : undefined}
      className={cn(
        "pressable group flex min-h-11 items-center gap-3 whitespace-nowrap rounded-full px-4 text-sm",
        aktif
          ? "bg-gold-300 font-medium text-navy-950"
          : "bg-white text-navy-700 ring-1 ring-inset ring-navy-200 hover:bg-navy-50 hover:text-navy-950 lg:ring-0",
      )}
    >
      {children}
    </Link>
  );
}

export function AksiAdmin({
  id,
  aktif,
  role,
  nama,
  diriSendiri,
}: {
  id: string;
  aktif: boolean;
  role: AdminRole;
  nama: string;
  diriSendiri: boolean;
}) {
  const router = useRouter();

  async function jalankan<T>(aksi: Promise<T>): Promise<T> {
    const hasil = await aksi;
    router.refresh();
    return hasil;
  }

  // Cegah super admin mengunci dirinya sendiri dari panel.
  if (diriSendiri) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-navy-50 px-3 py-1.5 text-xs font-medium text-navy-600 ring-1 ring-inset ring-navy-200">
        <IconLock className="size-3.5 text-navy-500" />
        Akun Anda sendiri
      </span>
    );
  }

  return (
    <div className="flex flex-wrap items-start gap-2">
      {aktif ? (
        <TombolKonfirmasi
          label="Cabut akses"
          pesanKonfirmasi={`Cabut akses admin untuk ${nama}? Akun ini langsung kehilangan hak begitu permintaan berikutnya diperiksa.`}
          onKonfirmasi={() => jalankan(ubahStatusAdmin(id, false))}
          labelLoading="Memproses…"
        />
      ) : (
        <TombolAksi
          label="Aktifkan"
          variant="primary"
          onAksi={() => jalankan(ubahStatusAdmin(id, true))}
        />
      )}

      {role !== "super_admin" ? (
        <TombolAksi
          label="Jadikan Super Admin"
          onAksi={() => jalankan(ubahPeranAdmin(id, "super_admin"))}
        />
      ) : (
        <TombolAksi
          label="Turunkan ke Admin"
          onAksi={() => jalankan(ubahPeranAdmin(id, "admin"))}
        />
      )}
    </div>
  );
}
