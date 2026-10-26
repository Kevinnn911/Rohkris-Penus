import "server-only";

import { mkdir, readFile, rm, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import { getFormUploadDir, getUploadDir } from "@/lib/env";

/**
 * Penyimpanan PRIVAT berkas unggahan peserta formulir internal.
 *
 * Berkas disimpan di FORM_UPLOAD_DIR dengan kunci
 * "<formId>/<responseId>/<fileId>" (tanpa ekstensi, sehingga tidak pernah
 * dieksekusi/ditebak server web) dan HANYA disajikan lewat route admin
 * yang memeriksa sesi. Folder ini dilarang bertumpuk dengan UPLOAD_DIR,
 * karena isi UPLOAD_DIR disajikan publik lewat /uploads.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const KUNCI = /^[0-9a-f-]{36}\/[0-9a-f-]{36}\/[0-9a-f-]{36}$/;

function didalam(induk: string, anak: string): boolean {
  const rel = path.relative(induk, anak);
  return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
}

/** Folder akar berkas formulir; melempar galat bila konfigurasinya tidak aman. */
export function formUploadRoot(): string {
  const root = path.resolve(getFormUploadDir());
  const publik = path.resolve(getUploadDir());
  if (didalam(publik, root) || didalam(root, publik)) {
    throw new Error(
      "FORM_UPLOAD_DIR tidak boleh berada di dalam (atau berisi) UPLOAD_DIR yang disajikan publik.",
    );
  }
  return root;
}

export function storageKey(formId: string, responseId: string, fileId: string): string {
  if (![formId, responseId, fileId].every((x) => UUID.test(x))) throw new Error("Id berkas tidak valid.");
  return `${formId}/${responseId}/${fileId}`;
}

function resolveKey(key: string): string {
  if (!KUNCI.test(key)) throw new Error("Kunci berkas tidak valid.");
  const root = formUploadRoot();
  const target = path.resolve(root, ...key.split("/"));
  if (!didalam(root, target) || target === root) throw new Error("Kunci berkas di luar folder.");
  return target;
}

export async function simpanBerkasFormulir(key: string, bytes: Uint8Array): Promise<void> {
  const target = resolveKey(key);
  await mkdir(path.dirname(target), { recursive: true });
  // "wx": jangan pernah menimpa berkas yang sudah ada.
  await writeFile(target, bytes, { flag: "wx" });
}

export async function bacaBerkasFormulir(key: string): Promise<Buffer> {
  return readFile(resolveKey(key));
}

/** Menghapus berkas; kegagalan hanya dicatat (tidak pernah menggagalkan aksi). */
export async function hapusBerkasFormulir(keys: string[]): Promise<void> {
  for (const key of keys) {
    try {
      await unlink(resolveKey(key));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        console.error("Gagal menghapus berkas formulir:", (error as Error).message);
      }
    }
  }
}

/** Menghapus seluruh folder satu respons atau satu formulir. */
export async function hapusFolderFormulir(formId: string, responseId?: string): Promise<void> {
  if (!UUID.test(formId) || (responseId !== undefined && !UUID.test(responseId))) return;
  try {
    const root = formUploadRoot();
    const target = path.resolve(root, formId, ...(responseId ? [responseId] : []));
    if (!didalam(root, target) || target === root) return;
    await rm(target, { recursive: true, force: true });
  } catch (error) {
    console.error("Gagal menghapus folder formulir:", (error as Error).message);
  }
}
