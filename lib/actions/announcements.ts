"use server";

import { z } from "zod";

import { requireAdminForAction } from "@/lib/auth/guard";
import {
  gagal,
  pesanErrorDatabase,
  revalidateKonten,
  sukses,
  type ActionResult,
} from "@/lib/actions/helpers";
import { fromDatetimeLocalValue } from "@/lib/format/date";
import { buildInsert, buildUpdate, execute, newId } from "@/lib/db";
import { announcementFormSchema } from "@/lib/validation/schemas";

function ambilData(formData: FormData) {
  return {
    title: String(formData.get("title") ?? ""),
    body: String(formData.get("body") ?? ""),
    starts_at: String(formData.get("starts_at") ?? ""),
    ends_at: String(formData.get("ends_at") ?? ""),
    priority: String(formData.get("priority") ?? "0"),
    status: String(formData.get("status") ?? "draft"),
  };
}

export async function buatPengumuman(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const auth = await requireAdminForAction();
  if (!auth.ok) return gagal(auth.message);

  const hasil = announcementFormSchema.safeParse(ambilData(formData));
  if (!hasil.success) {
    const { fieldErrors } = z.flattenError(hasil.error);
    return gagal("Periksa kembali isian yang ditandai.", fieldErrors as Record<string, string[]>);
  }

  try {
    const { sql, params } = buildInsert("announcements", {
      id: newId(),
      ...hasil.data,
      starts_at: fromDatetimeLocalValue(hasil.data.starts_at),
      ends_at: fromDatetimeLocalValue(hasil.data.ends_at),
      created_by: auth.context.admin.id,
    });
    await execute(sql, params);
  } catch (error) {
    return gagal(pesanErrorDatabase(error));
  }

  revalidateKonten("pengumuman");
  return sukses("Pengumuman berhasil disimpan.");
}

export async function perbaruiPengumuman(
  id: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const auth = await requireAdminForAction();
  if (!auth.ok) return gagal(auth.message);

  const hasil = announcementFormSchema.safeParse(ambilData(formData));
  if (!hasil.success) {
    const { fieldErrors } = z.flattenError(hasil.error);
    return gagal("Periksa kembali isian yang ditandai.", fieldErrors as Record<string, string[]>);
  }

  try {
    const { sql, params } = buildUpdate(
      "announcements",
      {
        ...hasil.data,
        starts_at: fromDatetimeLocalValue(hasil.data.starts_at),
        ends_at: fromDatetimeLocalValue(hasil.data.ends_at),
      },
      id,
    );
    await execute(sql, params);
  } catch (error) {
    return gagal(pesanErrorDatabase(error));
  }

  revalidateKonten("pengumuman");
  return sukses("Perubahan pengumuman berhasil disimpan.");
}

export async function hapusPengumuman(id: string): Promise<ActionResult> {
  const auth = await requireAdminForAction();
  if (!auth.ok) return gagal(auth.message);

  try {
    await execute("DELETE FROM announcements WHERE id = ?", [id]);
  } catch (error) {
    return gagal(pesanErrorDatabase(error));
  }

  revalidateKonten("pengumuman");
  return sukses("Pengumuman berhasil dihapus.");
}
