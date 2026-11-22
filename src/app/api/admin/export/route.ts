import { pool, ready } from "@/lib/db";
import { isAdmin } from "@/lib/util";


const esc = (v: unknown) => {
  if (v === null || v === undefined) return "";
  const s = v instanceof Date ? v.toISOString() : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export async function GET(req: Request) {
  if (!isAdmin(new URL(req.url).searchParams.get("token")))
    return new Response("Unauthorized", { status: 401 });
  await ready();
  const r = await pool.query(
    `SELECT i.*, p.widget_first, s.score AS sus_score
       FROM interactions i
       JOIN participants p ON p.pid = i.pid
       LEFT JOIN sus_responses s ON s.pid = i.pid AND s.round = i.round
      ORDER BY i.pid, i.round, i.id`
  );
  const cols = r.fields.map((f) => f.name);
  const lines = [cols.join(","), ...r.rows.map((row) => cols.map((c) => esc(row[c])).join(","))];
  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="interactions.csv"',
    },
  });
}
