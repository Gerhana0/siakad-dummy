import { pool, ready } from "@/lib/db";
import { normalizePid, parseRound } from "@/lib/util";
import { bad, getStage, handle, readBody } from "@/lib/server";

export const POST = handle(async (req) => {
  await ready();
  const b = await readBody(req);
  const pid = normalizePid(b.pid);
  const round = parseRound(b.round);
  const answers = b.answers;
  if (!round) return bad("round");
  if (!Array.isArray(answers) || answers.length !== 10 || !answers.every((a) => Number.isInteger(a) && a >= 1 && a <= 5))
    return bad("answers");
  if (!(await getStage(pid))) return bad("pid", 404);
  // Butir ganjil (indeks 0,2,..): jawaban - 1. Butir genap: 5 - jawaban. Jumlah x 2,5.
  const sum = (answers as number[]).reduce((s, a, i) => s + (i % 2 === 0 ? a - 1 : 5 - a), 0);
  const score = sum * 2.5;
  await pool.query(
    `INSERT INTO sus_responses (pid, round, answers, score) VALUES ($1,$2,$3,$4)
     ON CONFLICT (pid, round) DO UPDATE SET answers=EXCLUDED.answers, score=EXCLUDED.score`,
    [pid, round, answers, score]
  );
  return Response.json({ ok: true, score });
});
