import { pool, ready } from "@/lib/db";

export async function POST(req: Request) {
  await ready();
  const { pid, round, widget, answers } = await req.json();
  if (!Array.isArray(answers) || answers.length !== 10 || answers.some((a) => !(a >= 1 && a <= 5)))
    return Response.json({ ok: false }, { status: 400 });
  // Butir ganjil (indeks 0,2,..): jawaban - 1. Butir genap: 5 - jawaban. Jumlah x 2,5.
  const sum = (answers as number[]).reduce((s, a, i) => s + (i % 2 === 0 ? a - 1 : 5 - a), 0);
  const score = sum * 2.5;
  await pool.query(
    `INSERT INTO sus_responses (pid, round, widget, answers, score) VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (pid, round) DO UPDATE SET answers=EXCLUDED.answers, score=EXCLUDED.score`,
    [pid, round, widget, answers, score]
  );
  return Response.json({ ok: true, score });
}
