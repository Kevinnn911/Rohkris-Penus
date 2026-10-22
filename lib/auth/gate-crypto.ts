// File: lib/auth/gate-crypto.ts

import { createHash } from "node:crypto";

import { getAdminSecretKey } from "@/lib/env";

export const GATE_COOKIE_NAME = "rohkris_admin_gate";
export const GATE_COOKIE_MAX_AGE = 60 * 60 * 24; // 24 jam

/** Menghasilkan hash SHA-256 dari kunci rahasia agar nilai mentah tidak tersimpan di cookie. */
export function hashGateKey(key: string): string {
  const cleanKey = key.trim().replace(/\s+/g, "-");
  return createHash("sha256").update(cleanKey).digest("hex");
}

/** Memeriksa apakah parameter kunci cocok dengan ADMIN_SECRET_KEY (mendukung toleransi spasi ke tanda hubung). */
export function isGateKeyValid(key?: string | null): boolean {
  if (!key) return false;
  const configuredKey = getAdminSecretKey();
  if (!configuredKey) return false;
  const cleanKey = key.trim().replace(/\s+/g, "-");
  return cleanKey === configuredKey;
}

