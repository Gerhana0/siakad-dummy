import { pool, ready } from "@/lib/db";
import { STAGES } from "@/lib/util";

export async function POST(req: Request) {
  await ready();
  const { pid, stage } = await req.json();
  if (!STAGES.includes(stage)) return Response.json({ ok: false }, { status: 400 });
  await pool.query("UPDATE participants SET stage=$2 WHERE pid=$1", [pid, stage]);
  return Response.json({ ok: true });
}
