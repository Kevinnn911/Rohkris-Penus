// File: app/(public)/privasi/page.tsx

import type { Metadata } from "next";

import { PageHeader } from "@/components/site/PageHeader";
import { IconShield } from "@/components/ui/Icons";
import { getSiteSettings } from "@/lib/data/public";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Kebijakan Privasi",
  description:
    "Kebijakan privasi website Rohani Kristen SMK PLUS PELITA NUSANTARA.",
};

const DAFTAR_ISI = [
  { id: "data-dikumpulkan", label: "Data yang kami kumpulkan" },
  { id: "dokumentasi", label: "Dokumentasi kegiatan" },
  { id: "layanan-lain", label: "Tautan ke layanan lain" },
  { id: "pertanyaan", label: "Pertanyaan" },
] as const;

export default async function PrivasiPage() {
  const settings = await getSiteSettings();

  return (
    <>
      <PageHeader
        eyebrow="Informasi"
        title="Kebijakan Privasi"
        description="Cara website Rohkris memperlakukan data dan dokumentasi, dijelaskan dengan singkat dan terbuka."
        breadcrumb={[{ href: "/", label: "Beranda" }, { label: "Kebijakan Privasi" }]}
      />

      <div className="mx-auto max-w-6xl px-4 pb-8 pt-16 sm:px-8 sm:pt-20">
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
          <aside className="lg:col-span-4">
            <div className="space-y-5 lg:sticky lg:top-28">
              <nav
                aria-label="Daftar isi"
                className="rounded-[1.75rem] bg-white p-6 shadow-float"
              >
                <p className="text-lg font-semibold text-navy-950">
                  <span className="label-dot">Daftar Isi</span>
                </p>
                <ol className="mt-3 space-y-0.5">
                  {DAFTAR_ISI.map((item, index) => (
                    <li key={item.id}>
                      <a
                        href={`#${item.id}`}
                        className="group flex min-h-11 items-center gap-3 rounded-full px-2 text-sm text-navy-600 transition-colors hover:bg-navy-50 hover:text-navy-950"
                      >
                        <span
                          aria-hidden="true"
                          className="grid size-7 shrink-0 place-items-center rounded-full bg-navy-100 text-xs font-semibold text-navy-950 tabular-nums transition-colors group-hover:bg-gold-300"
                        >
                          {index + 1}
                        </span>
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>

              <div className="flex gap-4 rounded-card border border-navy-200/80 bg-white p-5">
                <span
                  aria-hidden="true"
                  className="grid size-11 shrink-0 place-items-center rounded-full bg-gold-300 text-navy-950"
                >
                  <IconShield className="size-5" />
                </span>
                <p className="text-sm leading-relaxed text-navy-600">
                  <strong className="font-semibold text-navy-950">Singkatnya:</strong> website ini
                  tidak menyimpan data pendaftaran peserta.
                </p>
              </div>
            </div>
          </aside>

          <article className="rounded-panel border border-navy-200/80 bg-white px-6 py-8 sm:px-12 sm:py-12 lg:col-span-8">
            <div className="prose-rohkris text-navy-800 [&>h2:first-child]:mt-0! [&>h2]:scroll-mt-28">
              <h2 id="data-dikumpulkan">Data yang kami kumpulkan</h2>
              <p>
                Website ini <strong>tidak menyimpan data pendaftaran peserta</strong>. Seluruh
                proses pendaftaran kegiatan berlangsung di layanan eksternal seperti Google Forms.
                Ketika Anda menekan tombol <em>Daftar Sekarang</em>, Anda diarahkan ke layanan
                tersebut, dan data yang Anda isi tunduk pada kebijakan privasi penyedia layanan
                itu.
              </p>

              <h2 id="dokumentasi">Dokumentasi kegiatan</h2>
              <p>
                Foto dan video kegiatan yang ditampilkan pada halaman dokumentasi diunggah oleh
                pengurus Rohkris. Penggunaan dokumentasi yang memuat siswa mengikuti kebijakan
                sekolah dan persetujuan yang berlaku. Bila Anda keberatan atas sebuah dokumentasi
                yang menampilkan Anda, silakan hubungi pengurus agar materi tersebut ditinjau
                kembali.
              </p>

              <h2 id="layanan-lain">Tautan ke layanan lain</h2>
              <p>
                Beberapa halaman memuat tautan ke layanan pihak ketiga, misalnya Google Forms atau
                Google Drive. Kami tidak mengendalikan praktik privasi layanan tersebut.
              </p>

              <h2 id="pertanyaan">Pertanyaan</h2>
              <p>
                Untuk pertanyaan terkait kebijakan ini, silakan hubungi pengurus Rohkris
                {settings.contact_email ? (
                  <>
                    {" "}
                    melalui <a href={`mailto:${settings.contact_email}`}>{settings.contact_email}</a>
                  </>
                ) : (
                  " melalui kanal yang tercantum pada halaman Kontak"
                )}
                .
              </p>
            </div>
          </article>
        </div>
      </div>
    </>
  );
}
