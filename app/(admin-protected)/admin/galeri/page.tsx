import Link from "next/link";

import { AksiMedia } from "@/components/admin/AksiMedia";
import { KepalaHalamanAdmin, KosongAdmin } from "@/components/admin/Fields";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { IconImage, IconPlus } from "@/components/ui/Icons";
import { requireAdmin } from "@/lib/auth/guard";
import { getSemuaMedia } from "@/lib/data/admin";

export const dynamic = "force-dynamic";

const STATUS_TONE = { published: "success", draft: "warning", archived: "neutral" } as const;
const STATUS_LABEL = { published: "Terbit", draft: "Draft", archived: "Arsip" } as const;

export default async function KelolaGaleriPage() {
  await requireAdmin();
  const media = await getSemuaMedia();

  return (
    <div className="space-y-8">
      <KepalaHalamanAdmin
        eyebrow="Konten"
        judul="Kelola Dokumentasi"
        deskripsi={
          <>
            <strong className="font-semibold text-navy-900">{media.length} item</strong>{" "}
            dokumentasi tersimpan.
          </>
        }
        aksi={
          <ButtonLink href="/admin/galeri/baru">
            <IconPlus className="size-4" />
            Tambah Dokumentasi
          </ButtonLink>
        }
      />

      {media.length === 0 ? (
        <KosongAdmin
          ikon={<IconImage />}
          judul="Belum ada dokumentasi"
          deskripsi="Unggah foto kegiatan agar jemaat dan siswa dapat melihat kembali momen yang sudah berlalu. Pastikan Anda memiliki izin untuk memuat foto siswa."
          aksi={
            <ButtonLink href="/admin/galeri/baru">
              <IconPlus className="size-4" />
              Tambah Dokumentasi
            </ButtonLink>
          }
        />
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {media.map((item) => (
            <li
              key={item.id}
              className="flex flex-col rounded-card border border-navy-200/80 bg-white p-2.5"
            >
              <div className="relative aspect-video overflow-hidden rounded-inner bg-navy-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.media_url}
                  alt={item.alt_text}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
                <span className="absolute right-3 top-3">
                  <Badge tone={STATUS_TONE[item.status]} className="shadow-sm">
                    {STATUS_LABEL[item.status]}
                  </Badge>
                </span>
              </div>
              <div className="flex flex-1 flex-col px-3 pb-2 pt-4">
                <h2 className="truncate text-base font-semibold tracking-heading text-navy-950">
                  <Link
                    href={`/admin/galeri/${item.id}`}
                    className="underline-offset-4 decoration-gold-500 decoration-[3px] hover:underline"
                  >
                    {item.title ?? item.alt_text}
                  </Link>
                </h2>
                <p className="mt-1 text-sm text-navy-500">
                  Urutan tampil{" "}
                  <span className="font-semibold tabular-nums text-navy-700">{item.sort_order}</span>
                </p>
                <div className="mt-auto pt-4">
                  <div className="border-t border-navy-100 pt-3.5">
                    <AksiMedia
                      id={item.id}
                      status={item.status}
                      judul={item.title ?? item.alt_text}
                    />
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
