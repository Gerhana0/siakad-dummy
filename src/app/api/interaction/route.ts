import { pool, ready } from "@/lib/db";
import { int } from "@/lib/util";

export async function POST(req: Request) {
  await ready();
  const b = await req.json();
  const seq = int(b.seq);
  if (!seq || seq < 1 || seq > 7) return Response.json({ ok: false }, { status: 400 });
  await pool.query(
    `INSERT INTO interactions
      (pid, round, widget, course_code, class_code, order_pos, reserved_before, a_full_at_pick, got_a,
       attempts, fail_full, fail_conflict, seq, dwell_hover_ms, mouse_trace_len, selections,
       options_display_ms, first_key_latency_ms, keystrokes, misclicks, total_ms)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)`,
    [
      b.pid, int(b.round), b.widget, b.courseCode, b.classCode, int(b.orderPos), int(b.reservedBefore),
      !!b.aFullAtPick, !!b.gotA, int(b.attempts), int(b.failFull), int(b.failConflict), seq,
      int(b.dwellHoverMs), int(b.mouseTraceLen), int(b.selections), int(b.optionsDisplayMs),
      int(b.firstKeyLatencyMs), int(b.keystrokes), int(b.misclicks), int(b.totalMs),
    ]
  );
  return Response.json({ ok: true });
}
