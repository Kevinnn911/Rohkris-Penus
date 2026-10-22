// File: lib/auth/gate.ts

import "server-only";

import { cookies } from "next/headers";

import {
  GATE_COOKIE_MAX_AGE,
  GATE_COOKIE_NAME,
  hashGateKey,
  isGateKeyValid,
} from "@/lib/auth/gate-crypto";
import { getAdminSecretKey } from "@/lib/env";

export { GATE_COOKIE_MAX_AGE, GATE_COOKIE_NAME, hashGateKey, isGateKeyValid };

/** Memeriksa apakah permintaan saat ini memiliki izin gerbang admin yang valid via cookie. */
export async function hasAdminGateAccess(): Promise<boolean> {
  const configuredKey = getAdminSecretKey();
  if (!configuredKey) return false;

  const cookieStore = await cookies();
  const token = cookieStore.get(GATE_COOKIE_NAME)?.value;
  if (!token) return false;

  const expectedHash = hashGateKey(configuredKey);
  return token === expectedHash;
}


/** Menyetel cookie gerbang admin yang aman (HttpOnly, SameSite Lax). */
export async function setAdminGateCookie(key: string): Promise<boolean> {
  if (!isGateKeyValid(key)) return false;

  const cookieStore = await cookies();
  cookieStore.set(GATE_COOKIE_NAME, hashGateKey(key), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: GATE_COOKIE_MAX_AGE,
  });

  return true;
}

/** Menghapus cookie gerbang admin (misal saat logout). */
export async function clearAdminGateCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(GATE_COOKIE_NAME);
}
