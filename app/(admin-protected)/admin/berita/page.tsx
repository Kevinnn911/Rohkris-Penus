import Link from "next/link";

import { AksiBerita } from "@/components/admin/AksiBerita";
import { KartuTabel, KepalaHalamanAdmin, KosongAdmin, kelasTabel } from "@/components/admin/Fields";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { IconNewspaper, IconPlus } from "@/components/ui/Icons";
import { requireAdmin } from "@/lib/auth/guard";
import { getSemuaBerita } from "@/lib/data/admin";
import { formatTanggalSingkat } from "@/lib/format/date";

export const dynamic = "force-dynamic";

const STATUS_TONE = { published: "success", draft: "warning", archived: "neutral" } as const;
const STATUS_LABEL = { published: "Terbit", draft: "Draft", archived: "Arsip" } as const;

export default async function KelolaBeritaPage() {
  await requireAdmin();
  const berita = await getSemuaBerita();

  return (
    <div className="space-y-8">
      <KepalaHalamanAdmin
        eyebrow="Konten"
        judul="Kelola Berita"
        deskripsi={
          <>
            <strong className="font-semibold text-navy-900">{berita.length} berita</strong>{" "}
            tersimpan.
          </>
        }
        aksi={
          <ButtonLink href="/admin/berita/baru">
            <IconPlus className="size-4" />
            Tulis Berita
          </ButtonLink>
        }
      />

      {berita.length === 0 ? (
        <KosongAdmin
          ikon={<IconNewspaper />}
          judul="Belum ada berita"
          deskripsi="Tulis recap setelah kegiatan terlaksana agar jejaknya terdokumentasi."
          aksi={
            <ButtonLink href="/admin/berita/baru">
              <IconPlus className="size-4" />
              Tulis Berita
            </ButtonLink>
          }
        />
      ) : (
        <KartuTabel>
          <table className={`${kelasTabel.tabel} min-w-[48rem]`}>
            <caption className="sr-only">Daftar berita dan recap kegiatan</caption>
            <thead className={kelasTabel.thead}>
              <tr>
                <th scope="col" className={kelasTabel.th}>
                  Judul
                </th>
                <th scope="col" className={kelasTabel.th}>
                  Terbit
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
              {berita.map((post) => (
                <tr key={post.id} className={kelasTabel.tr}>
                  <td className={`${kelasTabel.td} max-w-[22rem]`}>
                    <Link href={`/admin/berita/${post.id}`} className={kelasTabel.tautanJudul}>
                      {post.title}
                    </Link>
                    <p className="mt-1 truncate text-xs text-navy-500">/{post.slug}</p>
                  </td>
                  <td className={`${kelasTabel.td} whitespace-nowrap tabular-nums text-navy-700`}>
                    {formatTanggalSingkat(post.published_at) ?? "—"}
                  </td>
                  <td className={kelasTabel.td}>
                    <Badge tone={STATUS_TONE[post.status]}>
                      {STATUS_LABEL[post.status]}
                    </Badge>
                  </td>
                  <td className={`${kelasTabel.td} min-w-[17rem]`}>
                    <AksiBerita id={post.id} status={post.status} judul={post.title} />
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
