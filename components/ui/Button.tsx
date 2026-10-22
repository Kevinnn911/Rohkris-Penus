import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "gold" | "glass";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-medium " +
  "transition-[background-color,box-shadow,transform,color] duration-200 ease-out " +
  "active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60 disabled:active:translate-y-0";

const variants: Record<Variant, string> = {
  // Pill hitam — CTA utama (seperti "Sign up" pada referensi).
  primary: "bg-navy-950 text-white shadow-[0_10px_24px_-12px_rgb(13_13_15/0.7)] hover:bg-navy-800",
  secondary:
    "bg-white text-navy-950 ring-1 ring-inset ring-navy-200 hover:bg-navy-50 hover:ring-navy-300",
  ghost: "text-navy-800 hover:bg-navy-100 hover:text-navy-950",
  danger: "bg-danger-600 text-white hover:bg-danger-700",
  // Kuning sorotan — aksen paling menonjol.
  gold: "bg-gold-300 text-navy-950 shadow-glow hover:bg-gold-200",
  // Transparan tipis — CTA sekunder di atas latar gelap.
  glass:
    "bg-white/10 text-white ring-1 ring-inset ring-white/25 backdrop-blur hover:bg-white/15 hover:ring-white/40",
};

// Tinggi minimal 44px pada ukuran md/lg agar nyaman disentuh di ponsel.
const sizes: Record<Size, string> = {
  sm: "px-3.5 py-2 text-sm",
  md: "px-5 py-2.5 text-sm min-h-11",
  lg: "px-7 py-3 text-[0.9375rem] min-h-12",
};

export function buttonClasses(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentPropsWithoutRef<"button"> & { variant?: Variant; size?: Size }) {
  return <button className={buttonClasses(variant, size, className)} {...props} />;
}

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<typeof Link> & {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={buttonClasses(variant, size, className)} {...props}>
      {children}
    </Link>
  );
}

/**
 * Tautan ke layanan luar (Google Forms/Drive).
 * Selalu memakai rel="noopener noreferrer" saat membuka tab baru (PRD §FR-09).
 */
export function ExternalButtonLink({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<"a"> & {
  href: string;
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={buttonClasses(variant, size, className)}
      {...props}
    >
      {children}
    </a>
  );
}
