import { pool, ready } from "@/lib/db";
import { STAGES, Stage, normalizePid } from "@/lib/util";
import { bad, getStage, handle, readBody } from "@/lib/server";

/** Pindah stage. Hanya boleh tetap atau maju satu langkah (tidak bisa melompat atau mundur). */
export const POST = handle(async (req) => {
  await ready();
  const b = await readBody(req);
  const pid = normalizePid(b.pid);
  const stage = b.stage as Stage;
  if (!STAGES.includes(stage)) return bad("stage");
  const cur = await getStage(pid);
  if (!cur) return bad("pid", 404);
  const from = STAGES.indexOf(cur);
  const to = STAGES.indexOf(stage);
  if (to === from) return Response.json({ ok: true, stage: cur }); // permintaan ulang
  if (to !== from + 1) return bad("transition", 409);
  // Bersyarat pada stage lama agar dua request bersamaan tidak melompat dua langkah.
  const r = await pool.query("UPDATE participants SET stage=$3 WHERE pid=$1 AND stage=$2", [pid, cur, stage]);
  return Response.json({ ok: true, stage: r.rowCount ? stage : await getStage(pid) });
});
