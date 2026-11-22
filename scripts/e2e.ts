import { getCatalog, clash, COURSES } from "../src/lib/catalog";
const B = process.env.BASE_URL ?? "http://localhost:3100";
const TOKEN = process.env.ADMIN_TOKEN ?? "rahasia123";
const post = async (u: string, b: unknown) => (await fetch(B + u, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) })).json();
const assert = (c: boolean, m: string) => { console.log(c ? "PASS" : "FAIL", m); if (!c) process.exitCode = 1; };

(async () => {
  await fetch(B + `/api/admin/reset?token=${TOKEN}&all=1`, { method: "POST" });
  const cat = getCatalog(1);
  const pids = Array.from({ length: 12 }, (_, i) => `P${String(i + 1).padStart(2, "0")}`);
  const ps = await Promise.all(pids.map((pid) => post("/api/participant", { pid })));
  assert(ps[0].widgetFirst === "dropdown" && ps[1].widgetFirst === "typing", "counterbalancing P01=dropdown, P02=typing");

  // 1) 12 peserta rebut satu kelas A yang belum penuh -> tepat 5 berhasil
  const openA = cat.find((c) => c.code === "A" && c.initialTaken === 0)!;
  const rs = await Promise.all(pids.map((pid) => post("/api/reserve", { pid, round: 1, classKey: openA.key })));
  const ok = rs.filter((r) => r.ok).length, full = rs.filter((r) => r.reason === "full").length;
  assert(ok === 5 && full === 7, `kuota atomik: ${ok} berhasil, ${full} penuh (harus 5 dan 7)`);
  const slots = await (await fetch(B + "/api/slots?catalog=1")).json();
  assert(slots.taken[openA.key] === 5, "slots menampilkan 5/5");

  // 2) kelas A yang sudah penuh sejak awal
  const preFull = cat.find((c) => c.code === "A" && c.initialTaken === 5)!;
  const r2 = await post("/api/reserve", { pid: "P12", round: 1, classKey: preFull.key });
  assert(!r2.ok && r2.reason === "full" && r2.aFull === true, "kelas A pre-full ditolak, aFull=true");

  // 3) bentrok jadwal: P12 ambil kelas X, lalu kelas matkul lain di jam sama
  const winner = pids.find((_, i) => rs[i].ok)!;
  const mineA = openA;
  const clashing = cat.find((c) => clash(c, mineA) && c.initialTaken === 0 && c.course !== mineA.course);
  if (clashing) {
    const r3 = await post("/api/reserve", { pid: winner, round: 1, classKey: clashing.key });
    assert(!r3.ok && r3.reason === "conflict", `bentrok ditolak (${r3.detail})`);
  } else console.log("SKIP bentrok (tidak ada kelas bentrok)");

  // 4) matkul sama dua kali
  const sameCourse = cat.find((c) => c.course === mineA.course && c.key !== mineA.key)!;
  const r4 = await post("/api/reserve", { pid: winner, round: 1, classKey: sameCourse.key });
  assert(!r4.ok && r4.reason === "already", "matkul yang sama ditolak (already)");

  // 5) batal -> kursi kembali
  await post("/api/release", { pid: winner, round: 1, classKey: openA.key });
  const s2 = await (await fetch(B + "/api/slots?catalog=1")).json();
  assert(s2.taken[openA.key] === 4, "release mengembalikan kursi (4/5)");

  // 6) SUS: 5 di butir ganjil, 1 di genap -> 100
  const sus = await post("/api/sus", { pid: winner, round: 1, widget: "dropdown", answers: [5, 1, 5, 1, 5, 1, 5, 1, 5, 1] });
  assert(sus.score === 100, `skor SUS maksimal = ${sus.score}`);

  // 7) interaksi + ekspor CSV
  const i = await post("/api/interaction", { pid: winner, round: 1, widget: "dropdown", courseCode: "IF2101", classCode: "A", orderPos: 1, reservedBefore: 0, aFullAtPick: false, gotA: true, attempts: 1, failFull: 0, failConflict: 0, seq: 6, dwellHoverMs: 4200, mouseTraceLen: 1800, selections: 1, optionsDisplayMs: 3000, firstKeyLatencyMs: -1, keystrokes: 0, misclicks: 0, totalMs: 6000 });
  assert(i.ok, "interaksi tersimpan");
  const csv = await (await fetch(`${B}/api/admin/export?token=${TOKEN}`)).text();
  assert(csv.split("\n").length === 2 && csv.includes("sus_score") && csv.includes(",100"), "CSV berisi 1 baris data + sus_score");
  const bad = await fetch(`${B}/api/admin/export?token=salah`);
  assert(bad.status === 401, "admin menolak token salah");
  console.log("jumlah matkul:", COURSES.length);
})();
