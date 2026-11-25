import { pool, ready } from "@/lib/db";
import { CONDITION, clash, courseName, getCatalog, isA } from "@/lib/catalog";

export async function POST(req: Request) {
  await ready();
  const { pid, round, classKey } = await req.json();
  if (round !== 1 && round !== 2) return Response.json({ ok: false, reason: "error" }, { status: 400 });
  const cat = getCatalog(round);
  const cls = cat.find((c) => c.key === classKey);
  if (!cls) return Response.json({ ok: false, reason: "error" }, { status: 400 });
  const war = CONDITION[round as 1 | 2] === "war";

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    // Serialkan permintaan milik partisipan yang sama.
    const lock = await client.query("SELECT 1 FROM participants WHERE pid=$1 FOR UPDATE", [pid]);
    if (!lock.rowCount) {
      await client.query("ROLLBACK");
      return Response.json({ ok: false, reason: "error" }, { status: 404 });
    }

    const active = await client.query(
      "SELECT class_key, course_code FROM reservations WHERE pid=$1 AND catalog=$2 AND active",
      [pid, round]
    );
    if (active.rows.some((r) => r.course_code === cls.course)) {
      await client.query("ROLLBACK");
      return Response.json({ ok: false, reason: "already" });
    }
    const mine = active.rows.map((r) => cat.find((c) => c.key === r.class_key)!);
    const hit = mine.find((m) => clash(m, cls));
    if (hit) {
      await client.query("ROLLBACK");
      return Response.json({
        ok: false,
        reason: "conflict",
        detail: `${courseName(hit.course)} kelas ${hit.code}`,
      });
    }

    // Status kelas A (A1 dan A2) matkul ini saat dicoba (untuk analisis "A penuh vs tersedia").
    const aClasses = cat.filter((c) => c.course === cls.course && isA(c.code));
    let aFull: boolean;
    if (war) {
      const a = await client.query("SELECT taken, quota FROM class_slots WHERE class_key = ANY($1)", [
        aClasses.map((c) => c.key),
      ]);
      aFull = a.rows.length > 0 && a.rows.every((r) => r.taken >= r.quota);
    } else {
      // Santai: kuota privat, jadi hanya kursi yang penuh sejak awal yang tidak tersedia.
      aFull = aClasses.every((c) => c.initialTaken >= c.quota);
    }

    if (war) {
      // Pengurangan kuota atomik: hanya berhasil bila masih ada kursi.
      const up = await client.query(
        "UPDATE class_slots SET taken = taken + 1 WHERE class_key=$1 AND taken < quota RETURNING taken",
        [classKey]
      );
      if (!up.rowCount) {
        await client.query("ROLLBACK");
        return Response.json({ ok: false, reason: "full", aFull });
      }
    } else if (cls.initialTaken >= cls.quota) {
      await client.query("ROLLBACK");
      return Response.json({ ok: false, reason: "full", aFull });
    }

    await client.query(
      "INSERT INTO reservations (pid, catalog, course_code, class_key) VALUES ($1,$2,$3,$4)",
      [pid, round, cls.course, classKey]
    );
    await client.query("COMMIT");
    return Response.json({ ok: true, aFull, reservedBefore: active.rowCount });
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    console.error(e);
    return Response.json({ ok: false, reason: "error" }, { status: 500 });
  } finally {
    client.release();
  }
}
