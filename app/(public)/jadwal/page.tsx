import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/site/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { IconArrowRight, IconCalendar, IconClock, IconMapPin } from "@/components/ui/Icons";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { getUpcomingEvents } from "@/lib/data/public";
import { getRegistrationLabel, getRegistrationState } from "@/lib/events/status";
import { TIMEZONE, formatJam, formatTanggal, toDateTimeAttr } from "@/lib/format/date";
import { cn } from "@/lib/cn";
import type { EventRow } from "@/lib/db/types";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Jadwal",
  description:
    "Jadwal kegiatan Rohani Kristen SMK PLUS PELITA NUSANTARA yang akan datang, diurutkan dari tanggal terdekat.",
};

/** Bagian tanggal (WIB) untuk "blok tanggal" dan pengelompokan per bulan — murni presentasional. */
function bagianTanggal(value: string) {
  const date = new Date(value);
  const fmt = (options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("id-ID", { timeZone: TIMEZONE, ...options }).format(date);
  return {
    hari: fmt({ day: "numeric" }),
    bulanPendek: fmt({ month: "short" }),
    hariPendek: fmt({ weekday: "short" }),
    bulanTahun: fmt({ month: "long", year: "numeric" }),
  };
}

export default async function JadwalPage() {
  const { data: events, failed } = await getUpcomingEvents();

  // Event dibatalkan tidak dicampur sebagai agenda mendatang (PRD §FR-04).
  const agenda = events.filter((event) => event.status !== "cancelled");

  const denganTanggal = agenda.filter((event) => event.start_at);
  const tanpaTanggal = agenda.filter((event) => !event.start_at);

  // Kelompokkan agenda bertanggal per bulan, urutan tetap seperti data (terdekat dulu).
  const perBulan: Array<{ bulan: string; items: EventRow[] }> = [];
  for (const event of denganTanggal) {
    const bulan = bagianTanggal(event.start_at as string).bulanTahun;
    const terakhir = perBulan[perBulan.length - 1];
    if (terakhir && terakhir.bulan === bulan) terakhir.items.push(event);
    else perBulan.push({ bulan, items: [event] });
  }
  const idTerdekat = denganTanggal[0]?.id;

  return (
    <>
      <PageHeader
        eyebrow="Jadwal"
        title="Jadwal Kegiatan"
        description="Agenda Rohkris yang akan datang, diurutkan dari tanggal terdekat."
      />

      <div className="mx-auto max-w-4xl px-4 pb-8 pt-14 sm:px-8 sm:pt-20">
        {failed ? (
          <ErrorState />
        ) : agenda.length === 0 ? (
          <EmptyState
            title="Belum ada agenda terjadwal"
            description="Jadwal kegiatan berikutnya akan muncul di sini setelah pengurus menambahkannya."
            action={
              <ButtonLink href="/kegiatan" variant="secondary">
                Lihat semua kegiatan
              </ButtonLink>
            }
            icon={<IconCalendar className="size-7" />}
          />
        ) : (
          <div className="space-y-16">
            {perBulan.length > 0 ? (
              <ol className="space-y-12">
                {perBulan.map((grup) => (
                  <li key={grup.bulan}>
                    <div className="flex items-center gap-4">
                      <h2 className="text-xl font-bold tracking-heading text-navy-950 sm:text-2xl">
                        <span className="capitalize">{grup.bulan}</span>
                      </h2>
                      <span aria-hidden="true" className="h-px flex-1 bg-navy-200" />
                      <span className="shrink-0 text-sm font-medium text-navy-500">
                        {grup.items.length} agenda
                      </span>
                    </div>

                    <ol className="relative mt-6 space-y-4">
                      {grup.items.map((event) => {
                        const label = getRegistrationLabel(getRegistrationState(event));
                        const tgl = bagianTanggal(event.start_at as string);
                        const terdekat = event.id === idTerdekat;
                        const jam = formatJam(event.start_at);
                        return (
                          <li key={event.id}>
                            <Link
                              href={`/kegiatan/${event.slug}`}
                              className={cn(
                                "card-interactive group flex items-stretch gap-4 rounded-card border bg-white p-2.5 pr-4 sm:gap-6 sm:pr-6",
                                // Agenda terdekat mempertahankan tepi gelapnya saat hover (card-interactive memudarkannya).
                                terdekat ? "border-navy-950/80 shadow-soft hover:border-navy-950/80!" : "border-navy-200/80",
                              )}
                            >
                              {/* Blok tanggal */}
                              <div
                                aria-hidden="true"
                                className={cn(
                                  "flex w-[4.75rem] shrink-0 flex-col items-center justify-center rounded-inner py-3 text-navy-950 sm:w-24",
                                  terdekat ? "bg-gold-300" : "bg-navy-100",
                                )}
                              >
                                <span className="text-xs font-medium capitalize">{tgl.hariPendek}</span>
                                <span className="text-3xl font-bold leading-none tracking-display sm:text-4xl">
                                  {tgl.hari}
                                </span>
                                <span className="mt-1 text-xs font-medium uppercase">{tgl.bulanPendek}</span>
                              </div>

                              <div className="min-w-0 flex-1 py-2">
                                {terdekat ? (
                                  <p className="mb-1 text-xs font-medium text-navy-600">
                                    Paling dekat
                                  </p>
                                ) : null}
                                <h3 className="text-lg font-semibold leading-snug tracking-heading text-navy-950 [overflow-wrap:anywhere]">
                                  {event.title}
                                </h3>

                                <div className="mt-2 space-y-1 text-sm text-navy-600">
                                  <p className="flex items-start gap-2">
                                    <IconClock className="mt-0.5 size-4 shrink-0 text-navy-500" />
                                    <time dateTime={toDateTimeAttr(event.start_at)}>
                                      {formatTanggal(event.start_at)}
                                      {jam ? ` • ${jam}` : ""}
                                    </time>
                                  </p>
                                  {event.location ? (
                                    <p className="flex items-start gap-2">
                                      <IconMapPin className="mt-0.5 size-4 shrink-0 text-navy-500" />
                                      <span className="min-w-0 [overflow-wrap:anywhere]">{event.location}</span>
                                    </p>
                                  ) : null}
                                </div>

                                <div className="mt-3 flex flex-wrap items-center gap-2">
                                  <Badge tone="gold">{event.category}</Badge>
                                  <Badge tone={label.tone}>
                                    {label.text}
                                  </Badge>
                                </div>
                              </div>

                              <span
                                aria-hidden="true"
                                className="hidden size-11 shrink-0 place-items-center self-center rounded-full bg-navy-100 text-navy-950 transition-colors duration-200 group-hover:bg-navy-200 sm:grid"
                              >
                                <IconArrowRight className="size-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5" />
                              </span>
                            </Link>
                          </li>
                        );
                      })}
                    </ol>
                  </li>
                ))}
              </ol>
            ) : null}

            {/* Event tanpa tanggal tetap tampil dengan label jelas (PRD §FR-04) */}
            {tanpaTanggal.length > 0 ? (
              <section aria-labelledby="judul-belum-dijadwalkan">
                <h2
                  id="judul-belum-dijadwalkan"
                  className="text-xl font-bold tracking-heading text-navy-950 sm:text-2xl"
                >
                  Belum Dijadwalkan
                </h2>
                <p className="mt-1.5 text-sm text-navy-600">
                  Kegiatan berikut sudah direncanakan, tetapi tanggalnya belum ditentukan.
                </p>
                <ul className="mt-6 grid gap-4 sm:grid-cols-2">
                  {tanpaTanggal.map((event) => (
                    <li key={event.id}>
                      <Link
                        href={`/kegiatan/${event.slug}`}
                        className="card-interactive flex h-full items-start gap-4 rounded-card border border-dashed border-navy-300 bg-white/60 p-5"
                      >
                        <span
                          aria-hidden="true"
                          className="grid size-11 shrink-0 place-items-center rounded-full bg-navy-100 text-navy-950"
                        >
                          <IconCalendar className="size-5" />
                        </span>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge tone="gold">{event.category}</Badge>
                            <Badge tone="neutral">Tanggal akan diumumkan</Badge>
                          </div>
                          <h3 className="mt-2.5 font-semibold tracking-heading text-navy-950 [overflow-wrap:anywhere]">{event.title}</h3>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        )}
      </div>
    </>
  );
}
