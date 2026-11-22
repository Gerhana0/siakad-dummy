import { pool, ready } from "@/lib/db";

export async function POST(req: Request) {
  await ready();
  const { pid, preferred, text } = await req.json();
  await pool.query(
    `INSERT INTO feedback (pid, preferred, open_text) VALUES ($1,$2,$3)
     ON CONFLICT (pid) DO UPDATE SET preferred=EXCLUDED.preferred, open_text=EXCLUDED.open_text`,
    [pid, String(preferred ?? "").slice(0, 20), String(text ?? "").slice(0, 2000)]
  );
  return Response.json({ ok: true });
}
