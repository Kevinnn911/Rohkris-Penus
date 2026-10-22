import Link from "next/link";

import { AksiPengumuman } from "@/components/admin/AksiPengumuman";
import { KartuTabel, KepalaHalamanAdmin, KosongAdmin, kelasTabel } from "@/components/admin/Fields";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { IconMegaphone, IconPlus } from "@/components/ui/Icons";
import { requireAdmin } from "@/lib/auth/guard";
import { getSemuaPengumuman } from "@/lib/data/admin";
import { formatTanggalSingkat } from "@/lib/format/date";

export const dynamic = "force-dynamic";

const STATUS_TONE = { published: "success", draft: "warning", archived: "neutral" } as const;
const STATUS_LABEL = { published: "Terbit", draft: "Draft", archived: "Arsip" } as const;

export default async function KelolaPengumumanPage() {
  await requireAdmin();
  const pengumuman = await getSemuaPengumuman();

  return (
    <div className="space-y-8">
      <KepalaHalamanAdmin
        eyebrow="Konten"
        judul="Kelola Pengumuman"
        deskripsi="Pengumuman aktif tampil di beranda sesuai masa tayang dan prioritasnya."
        aksi={
          <ButtonLink href="/admin/pengumuman/baru">
            <IconPlus className="size-4" />
            Buat Pengumuman
          </ButtonLink>
        }
      />

      {pengumuman.length === 0 ? (
        <KosongAdmin
          ikon={<IconMegaphone />}
          judul="Belum ada pengumuman"
          deskripsi="Buat pengumuman singkat untuk informasi penting yang perlu segera dilihat pengunjung."
          aksi={
            <ButtonLink href="/admin/pengumuman/baru">
              <IconPlus className="size-4" />
              Buat Pengumuman
            </ButtonLink>
          }
        />
      ) : (
        <KartuTabel>
          <table className={`${kelasTabel.tabel} min-w-[52rem]`}>
            <caption className="sr-only">Daftar pengumuman</caption>
            <thead className={kelasTabel.thead}>
              <tr>
                <th scope="col" className={kelasTabel.th}>
                  Judul
                </th>
                <th scope="col" className={kelasTabel.th}>
                  Masa tayang
                </th>
                <th scope="col" className={kelasTabel.th}>
                  Prioritas
                </th>
                <th scope="col" className={kelasTabel.th}>
                  Status
                </th>
                <th scope="col" className={kelasTabel.th}>
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className={kelasTabel.tbody}>
              {pengumuman.map((item) => (
                <tr key={item.id} className={kelasTabel.tr}>
                  <td className={`${kelasTabel.td} max-w-[20rem]`}>
                    <Link href={`/admin/pengumuman/${item.id}`} className={kelasTabel.tautanJudul}>
                      {item.title}
                    </Link>
                  </td>
                  <td className={`${kelasTabel.td} whitespace-nowrap tabular-nums text-navy-700`}>
                    {formatTanggalSingkat(item.starts_at) ?? "Kapan saja"}{" "}
                    <span className="text-navy-500">–</span>{" "}
                    {formatTanggalSingkat(item.ends_at) ?? "tanpa batas"}
                  </td>
                  <td className={kelasTabel.td}>
                    <span className="inline-flex min-w-9 items-center justify-center rounded-full bg-navy-50 px-2.5 py-1 text-xs font-semibold tabular-nums text-navy-800 ring-1 ring-inset ring-navy-600/10">
                      {item.priority}
                    </span>
                  </td>
                  <td className={kelasTabel.td}>
                    <Badge tone={STATUS_TONE[item.status]}>
                      {STATUS_LABEL[item.status]}
                    </Badge>
                  </td>
                  <td className={`${kelasTabel.td} min-w-[11rem]`}>
                    <AksiPengumuman id={item.id} judul={item.title} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </KartuTabel>
      )}
    </div>
  );
}
