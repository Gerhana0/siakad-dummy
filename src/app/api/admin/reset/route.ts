import { pool, ready, seedSlots } from "@/lib/db";
import { handle, isAdmin } from "@/lib/server";

/**
 * Tanpa parameter: reset kuota untuk sesi baru. Reservasi yang masih aktif diakhiri (ended_by='reset'),
 * data hasil (interaksi, SUS, jawaban terbuka) TETAP disimpan karena berasal dari sesi sebelumnya.
 * Dengan ?all=1: hapus SEMUA data (peserta, hasil, reservasi), mis. setelah uji coba/pilot.
 */
export const POST = handle(async (req) => {
  const url = new URL(req.url);
  if (!isAdmin(url.searchParams.get("token"))) return new Response("Unauthorized", { status: 401 });
  await ready();
  if (url.searchParams.get("all") === "1") {
    await pool.query("TRUNCATE participants, reservations RESTART IDENTITY CASCADE");
  } else {
    await pool.query("UPDATE reservations SET active=false, ended_at=now(), ended_by='reset' WHERE active");
  }
  await seedSlots(true);
  return Response.json({ ok: true });
});
