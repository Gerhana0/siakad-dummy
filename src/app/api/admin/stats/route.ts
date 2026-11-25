import { pool, ready } from "@/lib/db";
import { handle, isAdmin } from "@/lib/server";

/** Ringkasan isi database untuk panel peneliti. */
export const GET = handle(async (req) => {
  if (!isAdmin(new URL(req.url).searchParams.get("token"))) return new Response("Unauthorized", { status: 401 });
  await ready();
  const one = async (sql: string) => Number((await pool.query(sql)).rows[0].n);
  const stages = await pool.query("SELECT stage, count(*)::int AS n FROM participants GROUP BY stage");
  return Response.json({
    participants: await one("SELECT count(*) AS n FROM participants"),
    byStage: Object.fromEntries(stages.rows.map((r) => [r.stage, r.n])),
    interactions: await one("SELECT count(*) AS n FROM interactions"),
    cancelled: await one("SELECT count(*) AS n FROM interactions WHERE cancelled"),
    activeReservations: await one("SELECT count(*) AS n FROM reservations WHERE active"),
    sus: await one("SELECT count(*) AS n FROM sus_responses"),
    feedback: await one("SELECT count(*) AS n FROM feedback"),
  });
});
