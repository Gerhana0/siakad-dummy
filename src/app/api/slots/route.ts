import { pool, ready } from "@/lib/db";


export async function GET(req: Request) {
  await ready();
  const catalog = Number(new URL(req.url).searchParams.get("catalog"));
  if (catalog !== 1 && catalog !== 2) return Response.json({ error: "catalog" }, { status: 400 });
  const r = await pool.query("SELECT class_key, taken FROM class_slots WHERE catalog=$1", [catalog]);
  const taken: Record<string, number> = {};
  for (const row of r.rows) taken[row.class_key] = row.taken;
  return Response.json({ taken });
}
