import { AksiAdmin } from "@/components/admin/AksiAdmin";
import { FormTambahAdmin } from "@/components/admin/FormTambahAdmin";
import { Badge } from "@/components/ui/Badge";
import { IconInfo, IconPlus, IconShield, IconUsers } from "@/components/ui/Icons";
import { requireSuperAdmin } from "@/lib/auth/guard";
import { getSemuaAdmin } from "@/lib/data/admin";
import { formatTanggalSingkat } from "@/lib/format/date";

export const dynamic = "force-dynamic";

const ROLE_LABEL = {
  super_admin: "Super Admin",
  admin: "Admin",
  editor: "Editor",
} as const;

const ikonBulat = "grid size-11 shrink-0 place-items-center rounded-full text-navy-950";

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

export default async function KelolaAksesPage() {
  // Hanya super admin — requireSuperAdmin() mengalihkan yang lain.
  const { admin: saya } = await requireSuperAdmin();
  const daftarAdmin = await getSemuaAdmin();
  const jumlahAktif = daftarAdmin.filter((admin) => admin.is_active).length;

  return (
    <div className="mx-auto max-w-5xl space-y-12 animate-fade-up">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-2xl">
          <p className="inline-flex items-center rounded-full bg-gold-300 px-3.5 py-1 text-sm font-medium text-navy-950">
            Akses Panel
          </p>
          <h1 className="mt-4 text-4xl font-bold leading-[1.05] tracking-[-0.04em] text-navy-950 text-balance sm:text-5xl">
            Kelola Admin
          </h1>
          <p className="mt-3 text-base leading-relaxed text-navy-600 sm:text-lg">
            Hanya Super Admin yang dapat menambah, menonaktifkan, atau mengubah peran admin.
          </p>
        </div>
        <p className="inline-flex min-h-11 items-center gap-2.5 rounded-full bg-white py-1.5 pl-1.5 pr-4 text-sm text-navy-600 ring-1 ring-inset ring-navy-200">
          <span aria-hidden="true" className="grid size-8 place-items-center rounded-full bg-gold-300 text-navy-950">
            <IconUsers className="size-4" />
          </span>
          <span>
            <strong className="font-semibold text-navy-950">{jumlahAktif}</strong> aktif dari{" "}
            <strong className="font-semibold text-navy-950">{daftarAdmin.length}</strong> akun
          </span>
        </p>
      </header>

      <section
        aria-labelledby="judul-daftar-admin"
        className="overflow-hidden rounded-card border border-navy-200/80 bg-white"
      >
        <div className="flex items-center gap-3 px-5 pb-4 pt-5 sm:px-6">
          <span aria-hidden="true" className={`${ikonBulat} bg-navy-100`}>
            <IconShield className="size-5" />
          </span>
          <div>
            <h2 id="judul-daftar-admin" className="text-lg font-bold tracking-[-0.02em] text-navy-950">
              Daftar admin
            </h2>
            <p className="text-sm text-navy-500">Pengguna yang memiliki akses ke panel ini.</p>
          </div>
        </div>
        <div className="overflow-x-auto px-2.5 pb-2.5">
          <table className="w-full min-w-[46rem] text-left text-sm">
            <caption className="sr-only">Daftar pengguna dengan akses panel admin</caption>
            <thead className="text-xs text-navy-600 [&_th]:bg-ivory-100 [&_th:first-child]:rounded-l-full [&_th:last-child]:rounded-r-full">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">Nama</th>
                <th scope="col" className="px-4 py-3 font-semibold">Peran</th>
                <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                <th scope="col" className="px-4 py-3 font-semibold">Ditambahkan</th>
                <th scope="col" className="px-4 py-3 font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-100">
              {daftarAdmin.map((admin) => (
                <tr key={admin.id} className="align-middle transition-colors hover:bg-navy-50/70">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <span
                        aria-hidden="true"
                        className={
                          admin.role === "super_admin"
                            ? "grid size-11 shrink-0 place-items-center rounded-full bg-gold-300 text-sm font-bold text-navy-950"
                            : "grid size-11 shrink-0 place-items-center rounded-full bg-navy-100 text-sm font-bold text-navy-800"
                        }
                      >
                        {inisial(admin.display_name)}
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold text-navy-950">
                          {admin.display_name}
                          {admin.id === saya.id ? (
                            <span className="ml-2 rounded-full bg-sage-100 px-2 py-0.5 text-[0.72rem] font-medium text-sage-700">
                              (Anda)
                            </span>
                          ) : null}
                        </p>
                        <p className="mt-0.5 max-w-[16rem] truncate text-xs text-navy-600">
                          {admin.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <Badge tone={admin.role === "super_admin" ? "gold" : "neutral"} className="whitespace-nowrap">
                      {ROLE_LABEL[admin.role]}
                    </Badge>
                  </td>
                  <td className="px-4 py-4">
                    <Badge tone={admin.is_active ? "success" : "danger"} className="whitespace-nowrap">
                      {admin.is_active ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-navy-700">
                    {formatTanggalSingkat(admin.created_at) ?? "—"}
                  </td>
                  <td className="px-4 py-4">
                    <AksiAdmin
                      id={admin.id}
                      aktif={admin.is_active}
                      role={admin.role}
                      nama={admin.display_name}
                      diriSendiri={admin.id === saya.id}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="judul-tambah-admin" className="space-y-5">
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className={`${ikonBulat} bg-gold-300`}>
            <IconPlus className="size-5" />
          </span>
          <div>
            <h2 id="judul-tambah-admin" className="text-2xl font-bold tracking-[-0.03em] text-navy-950">
              Tambah Admin
            </h2>
            <p className="text-sm text-navy-600">Buat akun login untuk pengurus panel.</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="h-fit rounded-card border border-navy-200/80 bg-white p-6 text-sm text-navy-700 sm:p-7">
            <div className="flex items-start justify-between gap-3">
              <span aria-hidden="true" className={`${ikonBulat} bg-navy-100`}>
                <IconInfo className="size-5" />
              </span>
              <span className="inline-flex rounded-full bg-gold-100 px-2.5 py-1 text-[0.72rem] font-medium text-gold-700">
                Panduan
              </span>
            </div>
            <p className="mt-4 text-base font-semibold text-navy-950">Langkah menambah admin baru</p>
            <ol className="mt-4 space-y-3">
              {[
                <>
                  Isi <strong>email</strong> dan <strong>nama</strong> pengurus pada formulir.
                </>,
                <>
                  Buat <strong>kata sandi awal</strong> yang kuat (minimal 10 karakter).
                </>,
                <>Sampaikan kata sandi itu langsung kepada pengurus — jangan lewat grup chat.</>,
              ].map((langkah, index) => (
                <li key={index} className="flex gap-3">
                  <span
                    aria-hidden="true"
                    className="grid size-7 shrink-0 place-items-center rounded-full bg-gold-300 text-xs font-bold text-navy-950"
                  >
                    {index + 1}
                  </span>
                  <span className="sr-only">Langkah {index + 1}: </span>
                  <span className="pt-0.5 leading-relaxed">{langkah}</span>
                </li>
              ))}
            </ol>
            <p className="mt-5 rounded-2xl bg-ivory-100 px-4 py-3 text-xs leading-relaxed text-navy-600">
              Akun yang dinonaktifkan langsung keluar dari semua perangkat dan tidak bisa masuk lagi
              sampai diaktifkan kembali.
            </p>
          </div>

          <FormTambahAdmin />
        </div>
      </section>
    </div>
  );
}
