import { pool, ready } from "@/lib/db";
import { handle, isAdmin } from "@/lib/server";

const esc = (v: unknown) => {
  if (v === null || v === undefined) return "";
  const s = v instanceof Date ? v.toISOString() : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const SUS_ITEMS = Array.from({ length: 10 }, (_, i) => `a.answers[${i + 1}] AS q${i + 1}`).join(", ");

/** Satu jenis ekspor = satu CSV. */
const QUERIES = {
  // Satu baris per interaksi widget. Baris `cancelled` = kelas matkul itu kemudian dihapus dari KRS.
  interactions: `
    SELECT i.id, i.pid, i.round, i.condition, i.widget_type, i.course_code, i.class_code, i.order_pos,
           i.reserved_before, i.a_full_at_pick, i.got_a, i.attempts, i.fail_full, i.fail_conflict,
           i.click_full, i.click_conflict, i.wrong_pick, i.seq, i.dwell_hover_ms, i.mouse_trace_len,
           i.selections, i.options_display_ms, i.first_key_latency_ms, i.keystrokes, i.misclicks, i.total_ms,
           i.cancelled, s.score AS sus_score, i.created_at
      FROM interactions i
      LEFT JOIN sus_responses s ON s.pid = i.pid AND s.round = i.round
     ORDER BY i.pid, i.round, i.id`,
  // Jawaban SUS per butir (q1..q10, skala 1-5) dan skor 0-100.
  sus: `
    SELECT a.pid, a.round, CASE a.round WHEN 1 THEN 'santai' ELSE 'war' END AS condition,
           ${SUS_ITEMS}, a.score, a.created_at
      FROM sus_responses a
     ORDER BY a.pid, a.round`,
  // Jawaban pertanyaan terbuka.
  feedback: `SELECT pid, preferred, open_text, created_at FROM feedback ORDER BY pid`,
  // Semua peserta, termasuk yang belum punya interaksi, dengan tahap terakhirnya.
  participants: `
    SELECT p.pid, p.stage, p.created_at,
           (SELECT count(*) FROM interactions i WHERE i.pid = p.pid) AS interactions,
           (SELECT count(*) FROM reservations r WHERE r.pid = p.pid AND r.active) AS active_reservations
      FROM participants p
     ORDER BY p.pid`,
  // Log reservasi: ambil, hapus oleh peserta (cancel), atau diakhiri reset kuota (reset).
  reservations: `
    SELECT id, pid, catalog AS round, course_code, class_key, active, created_at, ended_at, ended_by
      FROM reservations
     ORDER BY pid, catalog, id`,
} as const;
type Kind = keyof typeof QUERIES;

export const GET = handle(async (req) => {
  const url = new URL(req.url);
  if (!isAdmin(url.searchParams.get("token"))) return new Response("Unauthorized", { status: 401 });
  const kind = (url.searchParams.get("type") ?? "interactions") as Kind;
  if (!(kind in QUERIES)) return new Response("Jenis ekspor tidak dikenal", { status: 400 });
  await ready();
  const r = await pool.query(QUERIES[kind]);
  const cols = r.fields.map((f) => f.name);
  const lines = [cols.join(","), ...r.rows.map((row) => cols.map((c) => esc(row[c])).join(","))];
  // BOM agar Excel membaca UTF-8 dengan benar.
  return new Response("﻿" + lines.join("\n") + "\n", {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${kind}.csv"`,
    },
  });
});
