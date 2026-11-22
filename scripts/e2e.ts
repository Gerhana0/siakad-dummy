// Uji API terhadap server yang sedang berjalan. Jalankan: npm run e2e
// PERINGATAN: menghapus semua data di database.
import { getCatalog, clash, isA, TARGETS } from "../src/lib/catalog";
const B = process.env.BASE_URL ?? "http://localhost:3000";
const TOKEN = process.env.ADMIN_TOKEN ?? "rahasia123";
const post = async (u: string, b: unknown) => (await fetch(B + u, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) })).json();
const assert = (c: boolean, m: string) => { console.log(c ? "PASS" : "FAIL", m); if (!c) process.exitCode = 1; };

(async () => {
  await fetch(B + `/api/admin/reset?token=${TOKEN}&all=1`, { method: "POST" });
  const cat = getCatalog(1);
  const pids = Array.from({ length: 12 }, (_, i) => `P${String(i + 1).padStart(2, "0")}`);
  await Promise.all(pids.map((pid) => post("/api/participant", { pid })));

  // 1) 12 peserta rebut satu kelas A yang belum penuh -> tepat sebanyak sisa kursi yang berhasil
  const openA = cat.find((c) => isA(c.code) && c.initialTaken < c.quota)!;
  const left = openA.quota - openA.initialTaken;
  const rs = await Promise.all(pids.map((pid) => post("/api/reserve", { pid, round: 1, classKey: openA.key })));
  const ok = rs.filter((r) => r.ok).length, full = rs.filter((r) => r.reason === "full").length;
  assert(ok === left && full === 12 - left, `kuota atomik: ${ok} berhasil, ${full} penuh (harus ${left} dan ${12 - left})`);
  const slots = await (await fetch(B + "/api/slots?catalog=1")).json();
  assert(slots.taken[openA.key] === openA.quota, `slots menampilkan ${openA.quota}/${openA.quota}`);

  // 2) kelas A yang sudah penuh sejak awal (A1 dan A2 penuh -> aFull)
  const preFull = cat.find((c) => isA(c.code) && c.initialTaken === c.quota)!;
  const r2 = await post("/api/reserve", { pid: "P12", round: 1, classKey: preFull.key });
  assert(!r2.ok && r2.reason === "full" && r2.aFull === true, "kelas A pre-full ditolak, aFull=true");

  // 3) bentrok jadwal: P12 (belum punya kelas) ambil kelas x, lalu kelas y yang bentrok dengan x
  const winner = pids.find((_, i) => rs[i].ok)!;
  const open = cat.filter((c) => c.initialTaken < c.quota && c.course !== openA.course);
  const pair = open.flatMap((x) => open.filter((y) => clash(x, y)).map((y) => [x, y] as const))[0];
  if (pair) {
    const loser = pids.find((_, i) => !rs[i].ok)!;
    const rx = await post("/api/reserve", { pid: loser, round: 1, classKey: pair[0].key });
    const r3 = await post("/api/reserve", { pid: loser, round: 1, classKey: pair[1].key });
    assert(rx.ok && !r3.ok && r3.reason === "conflict", `bentrok ditolak (${r3.detail})`);
  } else console.log("SKIP bentrok (katalog tidak punya pasangan kelas bentrok)");

  // 4) matkul sama dua kali
  const sameCourse = cat.find((c) => c.course === openA.course && c.key !== openA.key)!;
  const r4 = await post("/api/reserve", { pid: winner, round: 1, classKey: sameCourse.key });
  assert(!r4.ok && r4.reason === "already", "matkul yang sama ditolak (already)");

  // 5) batal -> kursi kembali
  await post("/api/release", { pid: winner, round: 1, classKey: openA.key });
  const s2 = await (await fetch(B + "/api/slots?catalog=1")).json();
  assert(s2.taken[openA.key] === openA.quota - 1, `release mengembalikan kursi (${openA.quota - 1}/${openA.quota})`);

  // 6) SUS: 5 di butir ganjil, 1 di genap -> 100
  const sus = await post("/api/sus", { pid: winner, round: 1, widget: "siakad", answers: [5, 1, 5, 1, 5, 1, 5, 1, 5, 1] });
  assert(sus.score === 100, `skor SUS maksimal = ${sus.score}`);

  // 7) interaksi dua widget + ekspor CSV
  const course = TARGETS[1][0];
  const i1 = await post("/api/interaction", { pid: winner, round: 1, widgetType: "course_picker", courseCode: course, orderPos: 1, reservedBefore: 0, wrongPick: 1, seq: 5, dwellHoverMs: 3000, mouseTraceLen: 900, selections: 2, optionsDisplayMs: 2500, firstKeyLatencyMs: 400, keystrokes: 6, misclicks: 0, totalMs: 4000 });
  const i2 = await post("/api/interaction", { pid: winner, round: 1, widgetType: "class_picker", courseCode: course, classCode: "A1", orderPos: 1, reservedBefore: 0, aFullAtPick: false, gotA: true, attempts: 1, failFull: 0, failConflict: 1, seq: 6, dwellHoverMs: 4200, mouseTraceLen: 1800, selections: 1, optionsDisplayMs: -1, firstKeyLatencyMs: -1, keystrokes: 0, misclicks: 0, totalMs: 6000 });
  assert(i1.ok && i2.ok, "interaksi course_picker dan class_picker tersimpan");
  const bad = await post("/api/interaction", { pid: winner, round: 1, widgetType: "lain", seq: 4 });
  assert(!bad.ok, "widgetType tidak dikenal ditolak");
  const csv = await (await fetch(`${B}/api/admin/export?token=${TOKEN}`)).text();
  const lines = csv.split("\n");
  assert(lines.length === 3 && lines[0].includes("widget_type") && lines[0].includes("wrong_pick") && csv.includes(",100"), "CSV berisi 2 baris data + widget_type, wrong_pick, sus_score");
  const unauth = await fetch(`${B}/api/admin/export?token=salah`);
  assert(unauth.status === 401, "admin menolak token salah");

  await fetch(B + `/api/admin/reset?token=${TOKEN}&all=1`, { method: "POST" });
})();
