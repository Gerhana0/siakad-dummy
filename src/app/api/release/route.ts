import { pool, ready } from "@/lib/db";
import { CONDITION, getCatalog } from "@/lib/catalog";
import { normalizePid, parseRound } from "@/lib/util";
import { bad, handle, readBody } from "@/lib/server";

/** Hapus kelas dari KRS. Reservasi ditandai berakhir, interaksi matkul itu ditandai `cancelled`. */
export const POST = handle(async (req) => {
  await ready();
  const b = await readBody(req);
  const pid = normalizePid(b.pid);
  const round = parseRound(b.round);
  if (!round) return bad("round");
  const cls = getCatalog(round).find((c) => c.key === b.classKey);
  if (!cls) return bad("classKey");

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    // Serialkan dengan /api/reserve milik partisipan yang sama.
    const lock = await client.query("SELECT 1 FROM participants WHERE pid=$1 FOR UPDATE", [pid]);
    if (!lock.rowCount) {
      await client.query("ROLLBACK");
      return bad("pid", 404);
    }
    const r = await client.query(
      `UPDATE reservations SET active=false, ended_at=now(), ended_by='cancel'
        WHERE pid=$1 AND catalog=$2 AND class_key=$3 AND active RETURNING id`,
      [pid, round, cls.key]
    );
    if (r.rowCount) {
      // Kursi dikembalikan hanya pada ronde war (ronde santai memakai kuota privat).
      if (CONDITION[round] === "war") {
        await client.query("UPDATE class_slots SET taken = GREATEST(taken - 1, 0) WHERE class_key=$1", [cls.key]);
      }
      await client.query(
        "UPDATE interactions SET cancelled=true WHERE pid=$1 AND round=$2 AND course_code=$3 AND NOT cancelled",
        [pid, round, cls.course]
      );
    }
    await client.query("COMMIT");
    return Response.json({ ok: true });
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    client.release();
  }
});
