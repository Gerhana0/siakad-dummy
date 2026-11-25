import { Pool } from "pg";
import { SCHEMA } from "./schema";
import { getCatalog } from "./catalog";

const g = globalThis as unknown as { __pool?: Pool; __ready?: Promise<void> };

export const pool: Pool =
  g.__pool ?? (g.__pool = new Pool({ connectionString: process.env.DATABASE_URL }));

/** Buat tabel dan isi kuota awal (sekali per proses server). */
export function ready(): Promise<void> {
  if (!g.__ready) {
    g.__ready = (async () => {
      await pool.query(SCHEMA);
      await seedSlots(false);
    })().catch((e) => {
      g.__ready = undefined;
      throw e;
    });
  }
  return g.__ready;
}

export async function seedSlots(reset: boolean) {
  const c = await pool.connect();
  try {
    await c.query("BEGIN");
    if (reset) await c.query("DELETE FROM class_slots");
    for (const no of [1, 2] as const) {
      for (const k of getCatalog(no)) {
        await c.query(
          `INSERT INTO class_slots (class_key, catalog, course_code, class_code, quota, taken)
           VALUES ($1,$2,$3,$4,$5,$6)
           ON CONFLICT (class_key) DO UPDATE SET
             quota = EXCLUDED.quota,
             -- Bila kuota di katalog berubah, kursi terisi dikembalikan ke kondisi awal.
             -- Bila tidak berubah (mis. server di-restart di tengah sesi), kursi terisi dipertahankan.
             taken = CASE WHEN class_slots.quota <> EXCLUDED.quota THEN EXCLUDED.taken ELSE class_slots.taken END`,
          [k.key, no, k.course, k.code, k.quota, k.initialTaken]
        );
      }
    }
    await c.query("COMMIT");
  } catch (e) {
    await c.query("ROLLBACK");
    throw e;
  } finally {
    c.release();
  }
}
