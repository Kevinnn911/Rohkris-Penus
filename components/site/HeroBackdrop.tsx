// File: components/site/HeroBackdrop.tsx

import Image from "next/image";

import { cn } from "@/lib/cn";

/**
 * Latar hero: foto gedung SMK Plus Pelita Nusantara penuh hingga ke sudut layar
 * dengan gradasi halus di bagian bawah yang menyatu mulus ke latar halaman.
 */
export function HeroBackdrop({ variant = "full" }: { variant?: "full" | "subtle" }) {
  const subtle = variant === "subtle";

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <Image
        src="/gedung-sekolah.jpg"
        alt=""
        fill
        priority={!subtle}
        unoptimized
        sizes="100vw"
        className={cn(
          "object-cover object-[center_44%] select-none",
          subtle ? "opacity-80" : "opacity-95",
        )}
      />

      {/* Lapisan tipis agar kontras teks tetap terjaga tanpa menutupi warna langit di sudut atas */}
      <div className={cn("absolute inset-0", subtle ? "bg-white/30" : "bg-white/15")} />

      {/* Pendaran lembut di belakang teks utama agar judul selalu tajam terbaca */}
      <div className="absolute left-1/2 top-[44%] h-[46%] w-[min(48rem,90%)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/50 blur-3xl" />

      {/* Gradasi bawah berlapis agar bagian bawah foto menyatu mulus (blend) dengan latar halaman */}
      <div className="absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-ivory-100 from-10% via-ivory-100/80 via-48% to-transparent" />
    </div>
  );
}
