import "server-only";

import { randomUUID } from "node:crypto";

import mysql, { type Pool, type PoolConnection, type ResultSetHeader, type RowDataPacket } from "mysql2/promise";

import { getDatabaseConfig } from "@/lib/env";

/**
 * Akses MySQL untuk seluruh aplikasi (menggantikan klien Supabase).
 *
 * - Satu pool per proses, disimpan di globalThis agar hot reload saat
 *   pengembangan tidak membuka koneksi baru terus-menerus.
 * - Koneksi memakai zona waktu UTC (+00:00); kolom DATETIME dikembalikan
 *   sebagai string ISO 8601 berakhiran "Z" sehingga seluruh helper format
 *   tanggal (lib/format/date.ts) tetap bekerja seperti sebelumnya.
 * - Semua query memakai placeholder `?` (prepared/escaped) — TIDAK ada
 *   penyambungan string SQL dari input pengguna.
 */

const globalForDb = globalThis as unknown as { __rohkrisPool?: Pool };

export function getPool(): Pool {
  if (globalForDb.__rohkrisPool) return globalForDb.__rohkrisPool;

  const config = getDatabaseConfig();
  const pool = mysql.createPool({
    ...config,
    waitForConnections: true,
    connectionLimit: 5,
    maxIdle: 5,
    idleTimeout: 60_000,
    enableKeepAlive: true,
    charset: "utf8mb4",
    timezone: "+00:00",
    dateStrings: true,
    supportBigNumbers: true,
    // Kolom DATETIME → ISO UTC; TINYINT(1) → boolean.
    typeCast(field, next) {
      if (field.type === "DATETIME" || field.type === "TIMESTAMP") {
        const value = field.string();
        return value ? `${value.replace(" ", "T")}Z` : null;
      }
      if (field.type === "TINY" && field.length === 1) {
        const value = field.string();
        return value === null ? null : value === "1";
      }
      return next();
    },
  });

  // Pastikan setiap koneksi baru memakai UTC di sisi server MySQL juga
  // (memengaruhi NOW()/CURRENT_TIMESTAMP).
  pool.on("connection", (connection) => {
    connection.query("SET time_zone = '+00:00'");
  });

  globalForDb.__rohkrisPool = pool;
  return pool;
}

type Params = ReadonlyArray<unknown>;

/**
 * Semua parameter melewati toDbValue(): string tanggal ISO ("…T…Z") yang
 * dikembalikan typeCast diubah ke format DATETIME MySQL, boolean → 1/0.
 * Tanpa ini, mengirim balik nilai tanggal dari database akan ditolak MySQL
 * (mode STRICT: "Incorrect datetime value").
 */
function normalisasi(params: Params): unknown[] {
  return params.map(toDbValue);
}

/** SELECT banyak baris. */
export async function query<T>(sql: string, params: Params = []): Promise<T[]> {
  const [rows] = await getPool().query<RowDataPacket[]>(sql, normalisasi(params));
  return rows as unknown as T[];
}

/** SELECT satu baris (atau null). */
export async function queryOne<T>(sql: string, params: Params = []): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}

/** INSERT/UPDATE/DELETE. Mengembalikan jumlah baris yang terpengaruh. */
export async function execute(sql: string, params: Params = []): Promise<number> {
  const [result] = await getPool().query<ResultSetHeader>(sql, normalisasi(params));
  return result.affectedRows;
}

/** Koneksi dalam transaksi; parameternya juga dinormalisasi seperti query(). */
export interface TxConnection {
  query<T = RowDataPacket>(sql: string, params?: Params): Promise<T[]>;
  execute(sql: string, params?: Params): Promise<number>;
}

/** Menjalankan beberapa perintah dalam satu transaksi. */
export async function transaction<T>(fn: (conn: TxConnection) => Promise<T>): Promise<T> {
  const conn: PoolConnection = await getPool().getConnection();
  const tx: TxConnection = {
    async query<R>(sql: string, params: Params = []) {
      const [rows] = await conn.query<RowDataPacket[]>(sql, normalisasi(params));
      return rows as unknown as R[];
    },
    async execute(sql: string, params: Params = []) {
      const [result] = await conn.query<ResultSetHeader>(sql, normalisasi(params));
      return result.affectedRows;
    },
  };
  try {
    await conn.beginTransaction();
    const result = await fn(tx);
    await conn.commit();
    return result;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

/** UUID v4 untuk primary key baru. */
export function newId(): string {
  return randomUUID();
}

/**
 * Mengubah nilai JS menjadi parameter MySQL:
 * string ISO tanggal → "YYYY-MM-DD HH:MM:SS.mmm" (UTC), boolean → 1/0.
 */
export function toDbValue(value: unknown): unknown {
  if (value === undefined) return null;
  if (typeof value === "boolean") return value ? 1 : 0;
  if (typeof value === "string" && ISO_DATETIME.test(value)) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return toMysqlDatetime(date);
  }
  if (value instanceof Date) return toMysqlDatetime(value);
  return value;
}

const ISO_DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/;

export function toMysqlDatetime(date: Date): string {
  return date.toISOString().replace("T", " ").replace("Z", "");
}

/** Waktu sekarang dalam format kolom DATETIME (UTC). */
export function nowDb(): string {
  return toMysqlDatetime(new Date());
}

/**
 * Membangun "INSERT INTO t (a,b) VALUES (?,?)" dari objek.
 * Nama kolom hanya berasal dari kode (bukan input pengguna), tetap di-quote.
 */
export function buildInsert(table: string, row: Record<string, unknown>) {
  const columns = Object.keys(row);
  const sql = `INSERT INTO ${quoteId(table)} (${columns.map(quoteId).join(", ")}) VALUES (${columns
    .map(() => "?")
    .join(", ")})`;
  return { sql, params: columns.map((column) => toDbValue(row[column])) };
}

/** Membangun "UPDATE t SET a=?, b=? WHERE id = ?". */
export function buildUpdate(table: string, row: Record<string, unknown>, id: string) {
  const columns = Object.keys(row);
  const sql = `UPDATE ${quoteId(table)} SET ${columns.map((column) => `${quoteId(column)} = ?`).join(", ")} WHERE id = ?`;
  return { sql, params: [...columns.map((column) => toDbValue(row[column])), id] };
}

function quoteId(identifier: string): string {
  if (!/^[a-z_][a-z0-9_]*$/.test(identifier)) {
    throw new Error(`Nama kolom/tabel tidak valid: ${identifier}`);
  }
  return `\`${identifier}\``;
}

/** Bentuk error MySQL yang relevan untuk pesan ramah. */
export type DbError = { code?: string; errno?: number; sqlMessage?: string; message: string };

export function isDbError(error: unknown): error is DbError {
  return typeof error === "object" && error !== null && "message" in error;
}
