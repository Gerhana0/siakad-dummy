import { pool, ready } from "@/lib/db";
import { int, normalizePid, parseRound } from "@/lib/util";
import { bad, getStage, handle, readBody } from "@/lib/server";
import { CONDITION } from "@/lib/catalog";

const WIDGET_TYPES = ["course_picker", "class_picker"];
const bool = (v: unknown) => (v === null || v === undefined ? null : !!v);

export const POST = handle(async (req) => {
  await ready();
  const b = await readBody(req);
  const pid = normalizePid(b.pid);
  const seq = int(b.seq);
  if (!seq || seq < 1 || seq > 7) return bad("seq");
  if (!WIDGET_TYPES.includes(b.widgetType as string)) return bad("widgetType");
  const round = parseRound(b.round);
  if (!round) return bad("round");
  if (typeof b.courseCode !== "string" || !b.courseCode) return bad("courseCode");
  if (!(await getStage(pid))) return bad("pid", 404);
  const clientId = typeof b.clientId === "string" && b.clientId ? b.clientId.slice(0, 64) : null;

  // ON CONFLICT: request yang dicoba ulang (clientId sama) tidak membuat baris ganda.
  await pool.query(
    `INSERT INTO interactions
      (client_id, pid, round, condition, widget_type, course_code, class_code, order_pos, reserved_before,
       a_full_at_pick, got_a, attempts, fail_full, fail_conflict, click_full, click_conflict, wrong_pick, seq,
       dwell_hover_ms, mouse_trace_len, selections, options_display_ms, first_key_latency_ms, keystrokes,
       misclicks, total_ms)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26)
     ON CONFLICT (client_id) DO NOTHING`,
    [
      clientId, pid, round, CONDITION[round], b.widgetType, b.courseCode, b.classCode ?? null,
      int(b.orderPos), int(b.reservedBefore), bool(b.aFullAtPick), bool(b.gotA), int(b.attempts),
      int(b.failFull), int(b.failConflict), int(b.clickFull), int(b.clickConflict), int(b.wrongPick), seq,
      int(b.dwellHoverMs), int(b.mouseTraceLen), int(b.selections), int(b.optionsDisplayMs),
      int(b.firstKeyLatencyMs), int(b.keystrokes), int(b.misclicks), int(b.totalMs),
    ]
  );
  return Response.json({ ok: true });
});
