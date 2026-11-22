import { pool, ready } from "@/lib/db";

export async function POST(req: Request) {
  await ready();
  const { pid, round, classKey } = await req.json();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const r = await client.query(
      "UPDATE reservations SET active=false WHERE pid=$1 AND catalog=$2 AND class_key=$3 AND active RETURNING id",
      [pid, round, classKey]
    );
    if (r.rowCount) {
      await client.query("UPDATE class_slots SET taken = GREATEST(taken - 1, 0) WHERE class_key=$1", [
        classKey,
      ]);
    }
    await client.query("COMMIT");
    return Response.json({ ok: true });
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    console.error(e);
    return Response.json({ ok: false }, { status: 500 });
  } finally {
    client.release();
  }
}
