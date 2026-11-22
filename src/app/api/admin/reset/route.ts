import { pool, ready, seedSlots } from "@/lib/db";
import { isAdmin } from "@/lib/util";

/** Reset kuota + reservasi. Dengan ?all=1 data peserta dan hasil juga dihapus. */
export async function POST(req: Request) {
  const url = new URL(req.url);
  if (!isAdmin(url.searchParams.get("token"))) return new Response("Unauthorized", { status: 401 });
  await ready();
  if (url.searchParams.get("all") === "1") {
    await pool.query("TRUNCATE participants RESTART IDENTITY CASCADE");
  } else {
    await pool.query("UPDATE reservations SET active=false");
  }
  await seedSlots(true);
  return Response.json({ ok: true });
}
