import { pool, ready } from "@/lib/db";
import { parseRound } from "@/lib/util";
import { bad, handle } from "@/lib/server";

export const GET = handle(async (req) => {
  await ready();
  const catalog = parseRound(new URL(req.url).searchParams.get("catalog"));
  if (!catalog) return bad("catalog");
  const r = await pool.query("SELECT class_key, taken FROM class_slots WHERE catalog=$1", [catalog]);
  const taken: Record<string, number> = {};
  for (const row of r.rows) taken[row.class_key] = row.taken;
  return Response.json({ taken });
});
