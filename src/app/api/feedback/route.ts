import { pool, ready } from "@/lib/db";
import { normalizePid } from "@/lib/util";
import { bad, getStage, handle, readBody } from "@/lib/server";

export const POST = handle(async (req) => {
  await ready();
  const b = await readBody(req);
  const pid = normalizePid(b.pid);
  if (!(await getStage(pid))) return bad("pid", 404);
  const preferred = b.preferred == null ? null : String(b.preferred).slice(0, 20);
  await pool.query(
    `INSERT INTO feedback (pid, preferred, open_text) VALUES ($1,$2,$3)
     ON CONFLICT (pid) DO UPDATE SET preferred=EXCLUDED.preferred, open_text=EXCLUDED.open_text`,
    [pid, preferred, String(b.text ?? "").slice(0, 2000)]
  );
  return Response.json({ ok: true });
});
