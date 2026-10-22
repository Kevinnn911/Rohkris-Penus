import clsx, { type ClassValue } from "clsx";

/** Penggabung className ringkas. */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}
