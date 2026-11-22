import { pool, ready } from "@/lib/db";
import { firstWidget, normalizePid } from "@/lib/util";

export async function POST(req: Request) {
  await ready();
  const body = await req.json();
  const pid = normalizePid(body.pid);
  if (!pid) return Response.json({ error: "Kode kosong" }, { status: 400 });

  await pool.query(
    "INSERT INTO participants (pid, widget_first) VALUES ($1,$2) ON CONFLICT (pid) DO NOTHING",
    [pid, firstWidget(pid)]
  );
  const p = (
    await pool.query("SELECT pid, widget_first, stage FROM participants WHERE pid=$1", [pid])
  ).rows[0];
  const rs = await pool.query(
    "SELECT catalog, class_key FROM reservations WHERE pid=$1 AND active ORDER BY id",
    [pid]
  );
  const reservations: Record<number, string[]> = { 1: [], 2: [] };
  for (const r of rs.rows) reservations[r.catalog].push(r.class_key);
  return Response.json({
    pid: p.pid,
    widgetFirst: p.widget_first,
    stage: p.stage,
    reservations,
  });
}
