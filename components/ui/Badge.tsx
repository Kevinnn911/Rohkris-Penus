import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export type BadgeTone = "success" | "warning" | "danger" | "neutral" | "info" | "gold";

const toneClasses: Record<BadgeTone, string> = {
  success: "bg-success-50 text-success-700 ring-success-600/20",
  warning: "bg-warning-50 text-warning-700 ring-warning-600/20",
  danger: "bg-danger-50 text-danger-700 ring-danger-600/20",
  info: "bg-info-50 text-info-700 ring-info-600/20",
  neutral: "bg-navy-100 text-navy-800 ring-navy-600/10",
  gold: "bg-gold-100 text-gold-700 ring-gold-500/30",
};

/**
 * Badge status.
 *
 * Aksesibilitas: status tidak pernah disampaikan lewat warna saja — teks di
 * dalam badge selalu menjelaskan maknanya (PRD §9).
 */
export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
