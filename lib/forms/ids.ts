/**
 * Id stabil untuk bagian, pertanyaan, opsi, dan baris/kolom kisi.
 *
 * 10 karakter base36 acak. Panjangnya tidak mungkin bertabrakan dengan target
 * khusus "next"/"submit", dan cukup acak untuk satu dokumen formulir.
 */

export const FORM_ID_PATTERN = /^[a-z0-9]{8,16}$/;

const ALFABET = "abcdefghijklmnopqrstuvwxyz0123456789";

export function newFormId(length = 10): string {
  const bytes = new Uint8Array(length);
  globalThis.crypto.getRandomValues(bytes);
  let id = "";
  for (const byte of bytes) id += ALFABET[byte % ALFABET.length];
  // Awali huruf agar id tidak pernah tampak seperti angka di CSV/spreadsheet.
  return /^[a-z]/.test(id) ? id : `q${id.slice(1)}`;
}
