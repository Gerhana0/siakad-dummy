// Uji API terhadap server yang sedang berjalan.
// Jalankan: ADMIN_TOKEN=<token> npm run e2e            (berhenti bila database sudah berisi peserta)
//           ADMIN_TOKEN=<token> npm run e2e -- --force (tetap jalan dan MENGHAPUS SEMUA DATA)
import { getCatalog, clash, isA, TARGETS } from "../src/lib/catalog";
const B = process.env.BASE_URL ?? "http://localhost:3000";
const TOKEN = process.env.ADMIN_TOKEN;
const FORCE = process.argv.includes("--force");
const post = async (u: string, b: unknown) =>
  (await fetch(B + u, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) })).json();
const csvOf = async (type: string) => (await (await fetch(`${B}/api/admin/export?type=${type}&token=${TOKEN}`)).text()).replace(/^﻿/, "").trim().split("\n");
const assert = (c: boolean, m: string) => {
  console.log(c ? "PASS" : "FAIL", m);
  if (!c) process.exitCode = 1;
};

(async () => {
  if (!TOKEN) {
    console.error("ADMIN_TOKEN belum diset. Contoh: ADMIN_TOKEN=xxx npm run e2e");
    process.exit(1);
  }
  const st = await fetch(`${B}/api/admin/stats?token=${TOKEN}`);
  if (st.status === 401) {
    console.error("ADMIN_TOKEN tidak cocok dengan server.");
    process.exit(1);
  }
  const before = await st.json();
  if (before.participants > 0 && !FORCE) {
    console.error(
      `Database di ${B} sudah berisi ${before.participants} peserta dan ${before.interactions} interaksi.\n` +
        "e2e MENGHAPUS SEMUA DATA. Jalankan ulang dengan --force bila memang database uji."
    );
    process.exit(1);
  }

  await fetch(B + `/api/admin/reset?token=${TOKEN}&all=1`, { method: "POST" });
  const cat = getCatalog(2); // ronde 2 = war (kuota diperebutkan)
  const pids = Array.from({ length: 12 }, (_, i) => `E2E${String(i + 1).padStart(2, "0")}`);
  await Promise.all(pids.map((pid) => post("/api/participant", { pid })));

  // 1) WAR: 12 peserta rebut satu kelas A yang belum penuh -> tepat sebanyak sisa kursi yang berhasil
  const openA = cat.find((c) => isA(c.code) && c.initialTaken < c.quota)!;
  const left = openA.quota - openA.initialTaken;
  const rs = await Promise.all(pids.map((pid) => post("/api/reserve", { pid, round: 2, classKey: openA.key })));
  const ok = rs.filter((r) => r.ok).length, full = rs.filter((r) => r.reason === "full").length;
  assert(ok === left && full === 12 - left, `kuota atomik: ${ok} berhasil, ${full} penuh (harus ${left} dan ${12 - left})`);
  const slots = await (await fetch(B + "/api/slots?catalog=2")).json();
  assert(slots.taken[openA.key] === openA.quota, `slots menampilkan ${openA.quota}/${openA.quota}`);

  // 2) kelas A yang sudah penuh sejak awal (A1 dan A2 penuh -> aFull)
  const preFull = cat.find((c) => isA(c.code) && c.initialTaken === c.quota)!;
  const r2 = await post("/api/reserve", { pid: "E2E12", round: 2, classKey: preFull.key });
  assert(!r2.ok && r2.reason === "full" && r2.aFull === true, "kelas A pre-full ditolak, aFull=true");

  // 3) bentrok jadwal
  const winner = pids.find((_, i) => rs[i].ok)!;
  const open = cat.filter((c) => c.initialTaken < c.quota && c.course !== openA.course);
  const pair = open.flatMap((x) => open.filter((y) => clash(x, y)).map((y) => [x, y] as const))[0];
  if (pair) {
    const loser = pids.find((_, i) => !rs[i].ok)!;
    const rx = await post("/api/reserve", { pid: loser, round: 2, classKey: pair[0].key });
    const r3 = await post("/api/reserve", { pid: loser, round: 2, classKey: pair[1].key });
    assert(rx.ok && !r3.ok && r3.reason === "conflict", `bentrok ditolak (${r3.detail})`);
  } else console.log("SKIP bentrok (katalog tidak punya pasangan kelas bentrok)");

  // 4) matkul sama dua kali
  const sameCourse = cat.find((c) => c.course === openA.course && c.key !== openA.key)!;
  const r4 = await post("/api/reserve", { pid: winner, round: 2, classKey: sameCourse.key });
  assert(!r4.ok && r4.reason === "already", "matkul yang sama ditolak (already)");

  // 5) interaksi + batal -> kursi kembali, interaksi ditandai cancelled, log reservasi tercatat
  const iw = await post("/api/interaction", { clientId: "e2e-war-1", pid: winner, round: 2, widgetType: "class_picker", courseCode: openA.course, classCode: openA.code, seq: 3 });
  assert(iw.ok, "interaksi war tersimpan");
  await post("/api/release", { pid: winner, round: 2, classKey: openA.key });
  const s2 = await (await fetch(B + "/api/slots?catalog=2")).json();
  assert(s2.taken[openA.key] === openA.quota - 1, `release mengembalikan kursi (${openA.quota - 1}/${openA.quota})`);
  const resLog = await csvOf("reservations");
  assert(resLog.some((l) => l.includes(winner) && l.includes(openA.key) && l.endsWith(",cancel")), "log reservasi mencatat ended_by=cancel");
  const badRel = await post("/api/release", { pid: winner, round: "x", classKey: openA.key });
  assert(!badRel.ok, "release dengan round tidak valid ditolak");

  // 5b) SANTAI (ronde 1): kuota privat
  const cat1 = getCatalog(1);
  const s1 = cat1.find((c) => isA(c.code) && c.initialTaken < c.quota)!;
  const rs1 = await Promise.all(pids.map((pid) => post("/api/reserve", { pid, round: 1, classKey: s1.key })));
  assert(rs1.every((r) => r.ok), `santai: ${rs1.filter((r) => r.ok).length}/12 berhasil ambil kelas yang sama`);
  const sl1 = await (await fetch(B + "/api/slots?catalog=1")).json();
  assert(sl1.taken[s1.key] === s1.initialTaken, "santai: kuota bersama tidak berkurang");
  const pf1 = cat1.find((c) => c.initialTaken >= c.quota)!;
  const r5 = await post("/api/reserve", { pid: "E2E01", round: 1, classKey: pf1.key });
  assert(!r5.ok && r5.reason === "full", "santai: kelas yang penuh sejak awal tetap ditolak");

  // 6) SUS
  const sus = await post("/api/sus", { pid: winner, round: 1, answers: [5, 1, 5, 1, 5, 1, 5, 1, 5, 1] });
  assert(sus.score === 100, `skor SUS maksimal = ${sus.score}`);
  const susBad = await post("/api/sus", { pid: winner, round: 3, answers: [5, 1, 5, 1, 5, 1, 5, 1, 5, 1] });
  const susFrac = await post("/api/sus", { pid: winner, round: 1, answers: [2.5, 1, 5, 1, 5, 1, 5, 1, 5, 1] });
  const susNoPid = await post("/api/sus", { pid: "TIDAKADA", round: 1, answers: [5, 1, 5, 1, 5, 1, 5, 1, 5, 1] });
  assert(!susBad.ok && !susFrac.ok && !susNoPid.ok, "SUS menolak round salah, jawaban pecahan, dan pid tak dikenal");

  // 7) interaksi dua widget, anti-duplikat, ekspor
  const course = TARGETS[1][0];
  const i1body = { clientId: "e2e-1", pid: winner, round: 1, widgetType: "course_picker", courseCode: course, orderPos: 1, reservedBefore: 0, wrongPick: 1, seq: 5, dwellHoverMs: 3000, mouseTraceLen: 900, selections: 2, optionsDisplayMs: 2500, firstKeyLatencyMs: 400, keystrokes: 6, misclicks: 0, totalMs: 4000 };
  const i1 = await post("/api/interaction", i1body);
  const i1dup = await post("/api/interaction", i1body); // dikirim ulang (retry)
  const i2 = await post("/api/interaction", { clientId: "e2e-2", pid: winner, round: 1, widgetType: "class_picker", courseCode: course, classCode: "A1", orderPos: 1, reservedBefore: 0, aFullAtPick: false, gotA: true, attempts: 1, failFull: 0, failConflict: 0, clickFull: 2, clickConflict: 1, seq: 6, dwellHoverMs: 4200, mouseTraceLen: 1800, selections: 1, optionsDisplayMs: -1, firstKeyLatencyMs: -1, keystrokes: 0, misclicks: 0, totalMs: 6000 });
  assert(i1.ok && i1dup.ok && i2.ok, "interaksi course_picker dan class_picker tersimpan");
  const bad = await post("/api/interaction", { pid: winner, round: 1, widgetType: "lain", seq: 4 });
  assert(!bad.ok, "widgetType tidak dikenal ditolak");

  const lines = await csvOf("interactions");
  const head = lines[0].split(",");
  assert(lines.length === 4, `CSV interaksi: 3 baris data, retry tidak dobel (dapat ${lines.length - 1})`);
  assert(["condition", "widget_type", "wrong_pick", "click_full", "cancelled", "sus_score"].every((c) => head.includes(c)) && !head.includes("widget") && !head.includes("widget_first"), "kolom CSV interaksi sesuai (tanpa kolom widget lama)");
  const row = (l: string) => Object.fromEntries(l.split(",").map((v, i) => [head[i], v]));
  const rows = lines.slice(1).map(row);
  assert(rows.find((r) => r.round === "2")?.cancelled === "true", "interaksi matkul yang dibatalkan bertanda cancelled=true");
  const cp = rows.find((r) => r.widget_type === "course_picker")!;
  assert(cp.attempts === "" && cp.sus_score === "100", "kolom yang tidak berlaku kosong (bukan 0), sus_score ikut");
  assert((await csvOf("sus"))[0].includes("q10"), "ekspor SUS per butir");
  await post("/api/feedback", { pid: winner, text: "teks, dengan \"koma\"" });
  assert((await csvOf("feedback")).length === 2, "ekspor jawaban terbuka");
  assert((await csvOf("participants")).length === 13, "ekspor peserta (12 peserta)");
  const unauth = await fetch(`${B}/api/admin/export?token=salah`);
  assert(unauth.status === 401, "admin menolak token salah");

  // 8) stage hanya boleh maju satu langkah
  const p = "E2E05";
  const jump = await post("/api/stage", { pid: p, stage: "done" });
  const step = await post("/api/stage", { pid: p, stage: "sus1" });
  const again = await post("/api/stage", { pid: p, stage: "sus1" });
  const back = await post("/api/stage", { pid: p, stage: "round1" });
  const ghost = await post("/api/stage", { pid: "TIDAKADA", stage: "sus1" });
  assert(!jump.ok && step.ok && again.ok && !back.ok && !ghost.ok, "stage: lompat/mundur/pid asing ditolak, maju satu langkah diterima");

  // 9) reset kuota mempertahankan hasil, menandai reservasi ended_by=reset
  await fetch(B + `/api/admin/reset?token=${TOKEN}`, { method: "POST" });
  const after = await (await fetch(`${B}/api/admin/stats?token=${TOKEN}`)).json();
  assert(after.interactions === 3 && after.activeReservations === 0, "reset kuota: interaksi tetap, reservasi aktif = 0");
  assert((await csvOf("reservations")).some((l) => l.endsWith(",reset")), "reset kuota tercatat ended_by=reset");

  await fetch(B + `/api/admin/reset?token=${TOKEN}&all=1`, { method: "POST" });
})();
