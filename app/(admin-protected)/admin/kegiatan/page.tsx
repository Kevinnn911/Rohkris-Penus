import Link from "next/link";

import { AksiEvent } from "@/components/admin/AksiEvent";
import { KartuTabel, KepalaHalamanAdmin, KosongAdmin, kelasTabel } from "@/components/admin/Fields";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { IconCalendar, IconPlus, IconStar } from "@/components/ui/Icons";
import { requireAdmin } from "@/lib/auth/guard";
import { getSemuaEvent } from "@/lib/data/admin";
import { formatTanggalSingkat } from "@/lib/format/date";
import { getRegistrationLabel, getRegistrationState } from "@/lib/events/status";

export const dynamic = "force-dynamic";

const STATUS_TONE = {
  published: "success",
  draft: "warning",
  archived: "neutral",
  cancelled: "danger",
} as const;

const STATUS_LABEL = {
  published: "Terbit",
  draft: "Draft",
  archived: "Arsip",
  cancelled: "Dibatalkan",
} as const;

export default async function KelolaKegiatanPage() {
  await requireAdmin();
  const events = await getSemuaEvent();

  return (
    <div className="space-y-8">
      <KepalaHalamanAdmin
        eyebrow="Konten"
        judul="Kelola Kegiatan"
        deskripsi={
          <>
            <strong className="font-semibold text-navy-900">{events.length} kegiatan</strong>{" "}
            tersimpan. Draft tidak terlihat oleh pengunjung.
          </>
        }
        aksi={
          <ButtonLink href="/admin/kegiatan/baru">
            <IconPlus className="size-4" />
            Buat Kegiatan
          </ButtonLink>
        }
      />

      {events.length === 0 ? (
        <KosongAdmin
          ikon={<IconCalendar />}
          judul="Belum ada kegiatan"
          deskripsi="Mulai dengan membuat kegiatan pertama. Simpan sebagai draft dulu bila belum siap diumumkan."
          aksi={
            <ButtonLink href="/admin/kegiatan/baru">
              <IconPlus className="size-4" />
              Buat Kegiatan
            </ButtonLink>
          }
        />
      ) : (
        <KartuTabel>
          <table className={`${kelasTabel.tabel} min-w-[66rem]`}>
            <caption className="sr-only">Daftar seluruh kegiatan Rohkris</caption>
            <thead className={kelasTabel.thead}>
              <tr>
                <th scope="col" className={kelasTabel.th}>
                  Judul
                </th>
                <th scope="col" className={kelasTabel.th}>
                  Kategori
                </th>
                <th scope="col" className={kelasTabel.th}>
                  Tanggal
                </th>
                <th scope="col" className={kelasTabel.th}>
                  Status
                </th>
                <th scope="col" className={kelasTabel.th}>
                  Pendaftaran
                </th>
                <th scope="col" className={kelasTabel.th}>
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className={kelasTabel.tbody}>
              {events.map((event) => {
                const pendaftaran = getRegistrationLabel(getRegistrationState(event));
                return (
                  <tr key={event.id} className={kelasTabel.tr}>
                    <td className={`${kelasTabel.td} max-w-[18rem]`}>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <Link href={`/admin/kegiatan/${event.id}`} className={kelasTabel.tautanJudul}>
                          {event.title}
                        </Link>
                        {event.is_featured ? (
                          <Badge tone="gold">
                            <IconStar className="size-3.5" />
                            Unggulan
                          </Badge>
                        ) : null}
                      </div>
                      <p className="mt-1 truncate text-xs text-navy-500">/{event.slug}</p>
                    </td>
                    <td className={`${kelasTabel.td} whitespace-nowrap text-navy-700`}>
                      {event.category}
                    </td>
                    <td className={`${kelasTabel.td} whitespace-nowrap tabular-nums text-navy-700`}>
                      {formatTanggalSingkat(event.start_at) ?? "—"}
                    </td>
                    <td className={kelasTabel.td}>
                      <Badge tone={STATUS_TONE[event.status]}>
                        {STATUS_LABEL[event.status]}
                      </Badge>
                    </td>
                    <td className={`${kelasTabel.td} whitespace-nowrap`}>
                      <Badge tone={pendaftaran.tone}>
                        {pendaftaran.text}
                      </Badge>
                      {event.registration_mode === "internal" ? (
                        <Link
                          href={`/admin/kegiatan/${event.id}/respons`}
                          className="mt-1.5 block text-xs text-navy-600 underline-offset-4 hover:text-navy-950 hover:underline"
                        >
                          Formulir internal · {event.form?.responseCount ?? 0}
                          {event.form?.quota ? `/${event.form.quota}` : ""} respons
                        </Link>
                      ) : null}
                    </td>
                    <td className={`${kelasTabel.td} min-w-[25rem]`}>
                      <AksiEvent
                        id={event.id}
                        status={event.status}
                        unggulan={event.is_featured}
                        judul={event.title}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </KartuTabel>
      )}
    </div>
  );
}
