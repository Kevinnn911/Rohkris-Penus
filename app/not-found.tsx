import { HeroBackdrop } from "@/components/site/HeroBackdrop";
import { ButtonLink } from "@/components/ui/Button";
import { IconArrowLeft, IconCalendar } from "@/components/ui/Icons";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col bg-ivory-100 p-3 sm:p-5">
      <section className="relative isolate mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-center overflow-hidden rounded-hero bg-mist px-5 py-16 text-center sm:px-8 sm:py-20">
        <HeroBackdrop variant="subtle" />

        <div className="flex max-w-2xl animate-fade-up flex-col items-center">
          <p
            aria-hidden="true"
            className="text-[7.5rem] font-bold leading-none tracking-display text-navy-950/90 tabular-nums sm:text-[11rem]"
          >
            404
          </p>

          <h1 className="mt-4 text-3xl font-bold leading-tight tracking-heading text-navy-950 text-balance sm:text-5xl">
            Halaman tidak ditemukan
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-navy-600 sm:text-lg">
            Halaman yang Anda cari mungkin sudah dipindahkan, dihapus, atau tautannya keliru.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/" variant="primary" size="lg">
              <IconArrowLeft className="size-4" />
              Kembali ke Beranda
            </ButtonLink>
            <ButtonLink href="/kegiatan" variant="secondary" size="lg">
              <IconCalendar className="size-4" />
              Lihat Kegiatan
            </ButtonLink>
          </div>
        </div>
      </section>
    </main>
  );
}
