import { pool, ready } from "@/lib/db";
import { CONDITION } from "@/lib/catalog";

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
    // Kursi dikembalikan hanya pada ronde war (ronde santai memakai kuota privat).
    if (r.rowCount && CONDITION[round as 1 | 2] === "war") {
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
