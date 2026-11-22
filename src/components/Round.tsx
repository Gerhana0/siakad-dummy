"use client";
import { useEffect, useMemo, useState } from "react";
import { COURSES, Cls, DAYS, SLOTS, TOTAL_SKS, courseName, courseSks, getCatalog } from "@/lib/catalog";
import type { Widget } from "@/lib/util";
import ClassPicker, { SuccessPayload, TryResult } from "./ClassPicker";
import SeqModal from "./SeqModal";

type Props = {
  pid: string;
  round: 1 | 2;
  widget: Widget;
  initialReserved: string[];
  onDone: () => void;
};

const post = (url: string, body: unknown) =>
  fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

export default function Round({ pid, round, widget, initialReserved, onDone }: Props) {
  const classes = useMemo(() => getCatalog(round), [round]);
  const [taken, setTaken] = useState<Record<string, number>>(() =>
    Object.fromEntries(classes.map((c) => [c.key, c.initialTaken]))
  );
  const [reserved, setReserved] = useState<string[]>(initialReserved);
  const [pending, setPending] = useState<SuccessPayload | null>(null);
  const [n, setN] = useState(0); // kunci untuk mereset widget & tracker tiap interaksi

  // Kuota langsung (dibagi antar semua partisipan) dipantau tiap 3 detik.
  useEffect(() => {
    let on = true;
    const load = async () => {
      try {
        const d = await (await fetch(`/api/slots?catalog=${round}`)).json();
        if (on && d.taken) setTaken(d.taken);
      } catch {}
    };
    load();
    const id = setInterval(load, 3000);
    return () => {
      on = false;
      clearInterval(id);
    };
  }, [round]);

  const mine = classes.filter((c) => reserved.includes(c.key));
  const reservedCourses = new Set(mine.map((c) => c.course));
  const sks = mine.reduce((s, c) => s + courseSks(c.course), 0);

  const onTry = async (c: Cls): Promise<TryResult> => {
    try {
      const r = await post("/api/reserve", { pid, round, classKey: c.key });
      return await r.json();
    } catch {
      return { ok: false, reason: "error" };
    }
  };

  const onSuccess = (p: SuccessPayload) => {
    setReserved((r) => [...r, p.cls.key]);
    setPending(p);
  };

  const submitSeq = async (score: number) => {
    if (!pending) return;
    const p = pending;
    await post("/api/interaction", {
      pid, round, widget,
      courseCode: p.cls.course,
      classCode: p.cls.code,
      orderPos: p.res.reservedBefore + 1,
      reservedBefore: p.res.reservedBefore,
      aFullAtPick: p.res.aFull,
      gotA: p.cls.code === "A",
      ...p.counters,
      ...p.metrics,
      seq: score,
    }).catch(() => {});
    setPending(null);
    setN((x) => x + 1);
    if (reserved.length >= COURSES.length) onDone();
  };

  const cancel = async (c: Cls) => {
    await post("/api/release", { pid, round, classKey: c.key }).catch(() => {});
    setReserved((r) => r.filter((k) => k !== c.key));
  };

  const complete = reserved.length >= COURSES.length;

  return (
    <div className="round">
      <section className="panel">
        <h2>Isi KRS: {COURSES.length} mata kuliah, {TOTAL_SKS} SKS</h2>
        <p>
          Ambil semua mata kuliah di bawah ini. <b>Usahakan semua kelas A.</b> Jika kelas A penuh, pilih kelas
          lain yang jadwalnya tidak bentrok. Kuota tiap kelas dibagi dengan peserta lain secara langsung.
        </p>
        <ul className="need">
          {COURSES.map((c) => (
            <li key={c.code} className={reservedCourses.has(c.code) ? "ok" : ""}>
              {c.code} {c.name} ({c.sks} SKS)
            </li>
          ))}
        </ul>
        {!complete && (
          <ClassPicker
            key={n}
            variant={widget}
            classes={classes}
            taken={taken}
            reservedCourses={reservedCourses}
            locked={!!pending}
            onTry={onTry}
            onSuccess={onSuccess}
          />
        )}
        {complete && !pending && <p className="ok-msg">KRS lengkap. Lanjut ke penilaian.</p>}
      </section>

      <aside className="panel">
        <h3>KRS saya ({sks}/{TOTAL_SKS} SKS)</h3>
        {mine.length === 0 ? (
          <p className="muted">Belum ada kelas yang diambil.</p>
        ) : (
          <table className="krs">
            <thead>
              <tr><th>Mata kuliah</th><th>Kelas</th><th>Jadwal</th><th /></tr>
            </thead>
            <tbody>
              {mine.map((c) => (
                <tr key={c.key}>
                  <td>{courseName(c.course)}</td>
                  <td>{c.code}</td>
                  <td>{DAYS[c.day]} {SLOTS[c.slot]}</td>
                  <td>
                    {!pending && !complete && (
                      <button className="link" onClick={() => cancel(c)}>Batalkan</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </aside>

      {pending && <SeqModal onSubmit={submitSeq} />}
    </div>
  );
}
