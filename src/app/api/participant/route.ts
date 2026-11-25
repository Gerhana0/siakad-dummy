import { pool, ready } from "@/lib/db";
import { normalizePid } from "@/lib/util";
import { bad, handle, readBody } from "@/lib/server";

export const POST = handle(async (req) => {
  await ready();
  const pid = normalizePid((await readBody(req)).pid);
  if (!pid) return bad("Kode kosong");

  await pool.query("INSERT INTO participants (pid) VALUES ($1) ON CONFLICT (pid) DO NOTHING", [pid]);
  const p = (await pool.query("SELECT pid, stage FROM participants WHERE pid=$1", [pid])).rows[0];
  const rs = await pool.query(
    "SELECT catalog, class_key FROM reservations WHERE pid=$1 AND active ORDER BY id",
    [pid]
  );
  const reservations: Record<number, string[]> = { 1: [], 2: [] };
  for (const r of rs.rows) reservations[r.catalog]?.push(r.class_key);
  return Response.json({ pid: p.pid, stage: p.stage, reservations });
});
