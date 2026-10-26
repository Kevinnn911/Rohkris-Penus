import { cn } from "@/lib/cn";

/**
 * Latar hero: siluet kapel bersalib di atas bukit, diburamkan seperti foto
 * berkedalaman rendah. Digambar sebagai SVG agar tidak memakai aset foto
 * berhak cipta (PRD §9) dan tetap ringan. Sepenuhnya dekoratif.
 *
 * Bila sekolah sudah memiliki foto sendiri, ganti isi komponen ini dengan
 * <Image fill className="object-cover blur-sm" /> tanpa mengubah pemakainya.
 */
export function HeroBackdrop({ variant = "full" }: { variant?: "full" | "subtle" }) {
  const subtle = variant === "subtle";

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <svg
        viewBox="0 0 1440 520"
        preserveAspectRatio="xMidYMax slice"
        className={cn(
          "absolute inset-x-0 bottom-0 h-[62%] w-full",
          subtle ? "opacity-30 blur-[7px]" : "opacity-75 blur-[6px]",
        )}
      >
        <defs>
          <linearGradient id="hb-hill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#c9ced5" />
            <stop offset="1" stopColor="#eef0f2" />
          </linearGradient>
          <linearGradient id="hb-roof" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#1c1d22" />
            <stop offset="1" stopColor="#3a3c44" />
          </linearGradient>
          <linearGradient id="hb-wall" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#f7f7f7" />
            <stop offset="1" stopColor="#d7dadf" />
          </linearGradient>
        </defs>

        {/* Bukit belakang */}
        <path d="M0 360 C 240 300, 420 330, 620 300 S 1040 250, 1440 320 L1440 520 L0 520 Z" fill="url(#hb-hill)" opacity="0.6" />

        {/* Kapel utama */}
        <g transform="translate(520 150)">
          {/* Menara + salib */}
          <rect x="66" y="-70" width="6" height="90" fill="#2a2b31" />
          <rect x="48" y="-48" width="42" height="6" fill="#2a2b31" />
          {/* Atap */}
          <path d="M-60 170 L70 30 L250 30 L330 170 Z" fill="url(#hb-roof)" />
          {/* Dinding */}
          <path d="M-30 170 L70 62 L170 170 Z" fill="url(#hb-wall)" />
          <rect x="-30" y="170" width="200" height="140" fill="url(#hb-wall)" />
          <rect x="170" y="170" width="140" height="140" fill="#c5c9cf" />
          {/* Pintu & jendela */}
          <path d="M50 310 V245 a20 20 0 0 1 40 0 V310 Z" fill="#2a2b31" />
          <rect x="205" y="205" width="22" height="36" rx="11" fill="#3a3c44" />
          <rect x="250" y="205" width="22" height="36" rx="11" fill="#3a3c44" />
        </g>

        {/* Bangunan kecil di kanan */}
        <g transform="translate(960 250)">
          <path d="M-40 90 L60 0 L200 0 L260 90 Z" fill="url(#hb-roof)" opacity="0.9" />
          <rect x="-20" y="90" width="260" height="110" fill="#d9dce1" />
        </g>

        {/* Tanah depan */}
        <path d="M0 450 C 300 420, 600 440, 900 430 S 1300 420, 1440 440 L1440 520 L0 520 Z" fill="#e9ebee" />
      </svg>

      {/* Kabut terang di belakang judul agar teks selalu terbaca */}
      <div className="absolute left-1/2 top-[18%] h-[55%] w-[min(56rem,95%)] -translate-x-1/2 rounded-full bg-white/60 blur-3xl" />

      {/* Kabut putih di bawah agar konten tetap terbaca */}
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-white/70 to-transparent" />
    </div>
  );
}
