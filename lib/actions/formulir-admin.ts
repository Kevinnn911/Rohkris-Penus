"use server";

import { createHash } from "node:crypto";

import { revalidatePath } from "next/cache";

import { requireAdminForAction } from "@/lib/auth/guard";
import { newId, transaction } from "@/lib/db";
import type { EventFormRow, FormResponseFileRow } from "@/lib/db/types";
import { readDefinition } from "@/lib/data/forms";
import { countQuestions, formSettingsSchema, parseDefinition } from "@/lib/forms/definition-schema";
import { hapusBerkasFormulir, hapusFolderFormulir } from "@/lib/forms/storage";
import { allQuestions, type FormDefinition } from "@/lib/forms/types";
import { gagal, pesanErrorDatabase, sukses, type ActionResult } from "@/lib/actions/helpers";

/**
 * Server Action panel admin untuk formulir internal.
 * Setiap aksi memeriksa sesi admin sendiri (requireAdminForAction).
 */

export type SimpanFormulirInput = {
  definition: unknown;
  settings: unknown;
  /** Revisi yang dimuat builder; 0 = formulir belum pernah disimpan. */
  revision: number;
};

export type SimpanFormulirResult =
  | { ok: true; message: string; revision: number; version: number }
  | { ok: false; message: string; issues?: Array<{ message: string; path: Array<string | number> }>; conflict?: boolean };

/** Hash kanonik definisi: menentukan apakah isi formulir berubah (versi baru). */
function hashDefinisi(def: FormDefinition): string {
  return createHash("sha256").update(JSON.stringify(def)).digest("hex");
}

function revalidateFormulir(eventId: string) {
  revalidatePath(`/admin/kegiatan/${eventId}`, "layout");
  revalidatePath("/admin/kegiatan");
  // Jumlah pertanyaan & kuota memengaruhi tombol "Daftar" di halaman publik.
  revalidatePath("/kegiatan/[slug]", "page");
  revalidatePath("/kegiatan");
  revalidatePath("/jadwal");
  revalidatePath("/", "page");
}

export async function simpanFormulir(eventId: string, input: SimpanFormulirInput): Promise<SimpanFormulirResult> {
  const auth = await requireAdminForAction();
  if (!auth.ok) return { ok: false, message: auth.message };

  const def = parseDefinition(input.definition);
  if (!def.ok) {
    return { ok: false, message: "Periksa kembali pertanyaan yang ditandai.", issues: def.issues };
  }
  const settings = formSettingsSchema.safeParse(input.settings);
  if (!settings.success) {
    return {
      ok: false,
      message: settings.error.issues[0]?.message ?? "Pengaturan formulir tidak valid.",
      issues: settings.error.issues.map((i) => ({
        message: i.message,
        path: ["settings", ...i.path.map((p) => (typeof p === "symbol" ? String(p) : p))],
      })),
    };
  }

  const definition = def.definition;
  const s = settings.data;
  const json = JSON.stringify(definition);
  const hash = hashDefinisi(definition);
  const adminId = auth.context.admin.id;

  try {
    return await transaction(async (tx) => {
      const ada = await tx.query<{ id: string }>("SELECT id FROM events WHERE id = ?", [eventId]);
      if (ada.length === 0) return { ok: false, message: "Kegiatan tidak ditemukan." } as const;

      const [lama] = await tx.query<EventFormRow>("SELECT * FROM event_forms WHERE event_id = ? FOR UPDATE", [eventId]);

      const kolom = {
        question_count: countQuestions(definition),
        quota: s.quota,
        collect_email: s.collectEmail ? 1 : 0,
        limit_one_per_email: s.limitOnePerEmail ? 1 : 0,
        allow_edit: s.allowEdit ? 1 : 0,
        send_confirmation: s.sendConfirmation ? 1 : 0,
        confirmation_message: s.confirmationMessage,
        consent_text: s.consentText,
      };

      if (!lama) {
        if (input.revision !== 0) {
          return { ok: false, conflict: true, message: "Formulir ini sudah dihapus. Muat ulang halaman." } as const;
        }
        const formId = newId();
        await tx.execute(
          `INSERT INTO event_forms
             (id, event_id, definition, definition_hash, version, revision, question_count, quota,
              collect_email, limit_one_per_email, allow_edit, send_confirmation, confirmation_message,
              consent_text, created_by, updated_by)
           VALUES (?, ?, ?, ?, 1, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            formId, eventId, json, hash, kolom.question_count, kolom.quota, kolom.collect_email,
            kolom.limit_one_per_email, kolom.allow_edit, kolom.send_confirmation, kolom.confirmation_message,
            kolom.consent_text, adminId, adminId,
          ],
        );
        await tx.execute(
          "INSERT INTO event_form_versions (form_id, version, definition, created_by) VALUES (?, 1, ?, ?)",
          [formId, json, adminId],
        );
        return { ok: true, message: "Formulir disimpan.", revision: 1, version: 1 } as const;
      }

      if (lama.revision !== input.revision) {
        return {
          ok: false,
          conflict: true,
          message: "Formulir baru saja diubah admin lain. Muat ulang halaman agar perubahan tidak saling menimpa.",
        } as const;
      }

      // Setelah ada respons, tipe pertanyaan yang sudah ada tidak boleh diubah
      // (jawaban lama akan menjadi tidak bermakna).
      if (lama.response_count > 0) {
        const sebelumnya = readDefinition(lama.definition);
        if (sebelumnya) {
          const tipeLama = new Map(allQuestions(sebelumnya).map((q) => [q.id, q.kind]));
          for (const q of allQuestions(definition)) {
            const k = tipeLama.get(q.id);
            if (k && k !== q.kind) {
              return {
                ok: false,
                message: `Jenis pertanyaan “${q.title}” tidak bisa diubah karena sudah ada respons. Buat pertanyaan baru sebagai gantinya.`,
              } as const;
            }
          }
        }
      }

      const berubah = lama.definition_hash !== hash;
      const versi = berubah ? lama.version + 1 : lama.version;
      const revisi = lama.revision + 1;

      await tx.execute(
        `UPDATE event_forms SET definition = ?, definition_hash = ?, version = ?, revision = ?,
            question_count = ?, quota = ?, collect_email = ?, limit_one_per_email = ?, allow_edit = ?,
            send_confirmation = ?, confirmation_message = ?, consent_text = ?, updated_by = ?
          WHERE id = ?`,
        [
          json, hash, versi, revisi, kolom.question_count, kolom.quota, kolom.collect_email,
          kolom.limit_one_per_email, kolom.allow_edit, kolom.send_confirmation, kolom.confirmation_message,
          kolom.consent_text, adminId, lama.id,
        ],
      );
      if (berubah) {
        await tx.execute(
          "INSERT INTO event_form_versions (form_id, version, definition, created_by) VALUES (?, ?, ?, ?)",
          [lama.id, versi, json, adminId],
        );
      }
      return { ok: true, message: "Formulir disimpan.", revision: revisi, version: versi } as const;
    }).then((hasil) => {
      if (hasil.ok) revalidateFormulir(eventId);
      return hasil;
    });
  } catch (error) {
    return { ok: false, message: pesanErrorDatabase(error) };
  }
}

/** Menghapus satu respons (beserta berkasnya). */
export async function hapusRespons(eventId: string, responseId: string): Promise<ActionResult> {
  const auth = await requireAdminForAction();
  if (!auth.ok) return gagal(auth.message);

  try {
    const hasil = await transaction(async (tx) => {
      const [form] = await tx.query<Pick<EventFormRow, "id">>(
        "SELECT id FROM event_forms WHERE event_id = ? FOR UPDATE",
        [eventId],
      );
      if (!form) return null;
      const files = await tx.query<Pick<FormResponseFileRow, "storage_key">>(
        `SELECT f.storage_key FROM form_response_files f
           JOIN form_responses r ON r.id = f.response_id
          WHERE r.id = ? AND r.form_id = ?`,
        [responseId, form.id],
      );
      const n = await tx.execute("DELETE FROM form_responses WHERE id = ? AND form_id = ?", [responseId, form.id]);
      if (n === 0) return null;
      await hitungUlang(tx, form.id);
      return { formId: form.id, keys: files.map((f) => f.storage_key) };
    });
    if (!hasil) return gagal("Respons tidak ditemukan.");
    await hapusBerkasFormulir(hasil.keys);
    await hapusFolderFormulir(hasil.formId, responseId);
  } catch (error) {
    return gagal(pesanErrorDatabase(error));
  }

  revalidateFormulir(eventId);
  return sukses("Respons dihapus.");
}

/** Menghapus SEMUA respons formulir sebuah kegiatan. */
export async function hapusSemuaRespons(eventId: string): Promise<ActionResult> {
  const auth = await requireAdminForAction();
  if (!auth.ok) return gagal(auth.message);

  let formId: string | null = null;
  try {
    formId = await transaction(async (tx) => {
      const [form] = await tx.query<Pick<EventFormRow, "id">>(
        "SELECT id FROM event_forms WHERE event_id = ? FOR UPDATE",
        [eventId],
      );
      if (!form) return null;
      await tx.execute("DELETE FROM form_responses WHERE form_id = ?", [form.id]);
      await tx.execute("UPDATE event_forms SET response_count = 0 WHERE id = ?", [form.id]);
      return form.id;
    });
  } catch (error) {
    return gagal(pesanErrorDatabase(error));
  }
  if (!formId) return gagal("Formulir tidak ditemukan.");

  await hapusFolderFormulir(formId);
  revalidateFormulir(eventId);
  return sukses("Semua respons dihapus.");
}

/** Menyelaraskan response_count dengan isi tabel (memperbaiki selisih bila ada). */
async function hitungUlang(tx: { execute(sql: string, params?: ReadonlyArray<unknown>): Promise<number> }, formId: string) {
  await tx.execute(
    "UPDATE event_forms SET response_count = (SELECT COUNT(*) FROM form_responses WHERE form_id = ?) WHERE id = ?",
    [formId, formId],
  );
}
