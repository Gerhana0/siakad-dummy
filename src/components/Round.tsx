"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Cls, Course, TARGETS, courseSks, findCourse, getCatalog, isA } from "@/lib/catalog";
import { postJson } from "@/lib/api";
import CoursePicker, { CoursePick } from "./CoursePicker";
import SchedulePicker, { ClassPick, TryResult } from "./SchedulePicker";
import SeqModal from "./SeqModal";
import Icon from "./Icon";

type Props = {
  pid: string;
  round: 1 | 2;
  initialReserved: string[];
  onDone: () => void;
};

type Pending = { kind: "course"; pick: CoursePick } | { kind: "class"; pick: ClassPick };

const TABS = [
  { icon: "book", label: "Mata Kuliah" },
  { icon: "doc", label: "Tugas Akhir/Skripsi" },
  { icon: "briefcase", label: "Magang" },
  { icon: "users", label: "KKN" },
];

export default function Round({ pid, round, initialReserved, onDone }: Props) {
  const classes = useMemo(() => getCatalog(round), [round]);
  const targets = TARGETS[round];
  const targetSks = targets.reduce((s, c) => s + courseSks(c), 0);

  const [taken, setTaken] = useState<Record<string, number>>(() =>
    Object.fromEntries(classes.map((c) => [c.key, c.initialTaken]))
  );
  const [reserved, setReserved] = useState<string[]>(initialReserved);
  const [course, setCourse] = useState<Course | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [saveErr, setSaveErr] = useState(false);
  const [n1, setN1] = useState(0); // kunci reset widget 1 (tracker baru tiap interaksi)
  const [n2, setN2] = useState(0); // kunci reset widget 2

  // Kuota langsung (dibagi antar semua peserta) dipantau tiap 3 detik.
  const fetchSlots = useCallback(async (): Promise<Record<string, number> | null> => {
    try {
      const d = await (await fetch(`/api/slots?catalog=${round}`)).json();
      return d.taken ?? null;
    } catch {
      return null;
    }
  }, [round]);
  const loadSlots = async () => {
    const t = await fetchSlots();
    if (t) setTaken((x) => ({ ...x, ...t }));
  };
  useEffect(() => {
    let on = true;
    const tick = () =>
      fetchSlots().then((t) => {
        if (on && t) setTaken((x) => ({ ...x, ...t }));
      });
    tick();
    const id = setInterval(tick, 3000);
    return () => {
      on = false;
      clearInterval(id);
    };
  }, [fetchSlots]);

  const mine = classes.filter((c) => reserved.includes(c.key));
  const takenCourses = new Set(mine.map((c) => c.course));
  const sks = mine.reduce((s, c) => s + courseSks(c.course), 0);
  const complete = targets.every((t) => takenCourses.has(t));

  const onTry = async (c: Cls): Promise<TryResult> =>
    (await postJson<TryResult>("/api/reserve", { pid, round, classKey: c.key }, 1)) ?? {
      ok: false,
      reason: "error",
    };

  const onPickCourse = (p: CoursePick) => {
    setCourse(p.course);
    setPending({ kind: "course", pick: p });
    setN2((x) => x + 1);
  };

  const onPickClass = (p: ClassPick) => {
    setReserved((r) => [...r, p.cls.key]);
    setPending({ kind: "class", pick: p });
  };

  const submitSeq = async (seq: number) => {
    if (!pending) return;
    const base = { pid, round, widget: "siakad", seq };
    let body: Record<string, unknown>;
    if (pending.kind === "course") {
      const p = pending.pick;
      body = {
        ...base,
        widgetType: "course_picker",
        courseCode: p.course.code,
        orderPos: mine.length + 1,
        reservedBefore: mine.length,
        wrongPick: p.wrongPick,
        ...p.metrics,
      };
    } else {
      const p = pending.pick;
      body = {
        ...base,
        widgetType: "class_picker",
        courseCode: p.cls.course,
        classCode: p.cls.code,
        orderPos: p.res.reservedBefore + 1,
        reservedBefore: p.res.reservedBefore,
        aFullAtPick: p.res.aFull,
        gotA: isA(p.cls.code),
        ...p.counters,
        ...p.metrics,
        optionsDisplayMs: -1, // tidak berlaku: opsi jadwal selalu terlihat
        firstKeyLatencyMs: -1,
      };
    }
    const r = await postJson<{ ok: boolean }>("/api/interaction", body);
    if (!r?.ok) {
      setSaveErr(true); // modal tetap terbuka agar jawaban bisa dikirim ulang
      return;
    }
    setSaveErr(false);
    const wasClass = pending.kind === "class";
    setPending(null);
    if (wasClass) {
      setCourse(null);
      setN1((x) => x + 1);
      setN2((x) => x + 1);
      if (complete) onDone();
    } else {
      setN1((x) => x + 1);
    }
  };

  const cancel = async (c: Cls) => {
    const r = await postJson<{ ok: boolean }>("/api/release", { pid, round, classKey: c.key });
    if (r?.ok) setReserved((rs) => rs.filter((k) => k !== c.key));
    loadSlots();
  };

  const seqStep =
    pending?.kind === "course"
      ? `memilih mata kuliah ${pending.pick.course.name}`
      : pending?.kind === "class"
        ? `memilih jadwal kelas ${pending.pick.cls.code}`
        : "";

  return (
    <div className="krs-grid">
      <div className="card input-card">
        <div className="tabs" role="tablist">
          {TABS.map((t, i) => (
            <span key={t.label} role="tab" aria-selected={i === 0} className={`tab${i === 0 ? " is-active" : ""}`}>
              <Icon name={t.icon} size={18} /> {t.label}
            </span>
          ))}
        </div>

        <div className="info">
          <Icon name="bulb" size={18} />
          <div>
            Pilih mata kuliah, pilih jadwal kelasnya, lalu tambahkan ke KRS. Ambil <b>semua</b> mata kuliah
            paket di bawah dan <b>usahakan kelas A (A1/A2)</b>. Kuota kelas dibagi dengan peserta lain secara
            langsung.
            <div className="paket">
              {targets.map((t) => (
                <span key={t} className={`paket-item${takenCourses.has(t) ? " is-done" : ""}`}>
                  {takenCourses.has(t) && <Icon name="check" size={14} />}
                  {findCourse(t).name}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="step">
          <div className="step-title">
            <span className="step-num">1</span> Pilih mata kuliah
          </div>
          <CoursePicker
            key={`c${n1}`}
            selected={course}
            targets={targets}
            takenCourses={takenCourses}
            locked={!!pending || complete}
            onPick={onPickCourse}
          />
        </div>

        <div className="step">
          <div className="step-title">
            <span className="step-num">2</span> Pilih jadwal kelas
          </div>
          <SchedulePicker
            key={`s${n2}`}
            course={course}
            classes={course ? classes.filter((c) => c.course === course.code) : []}
            mine={mine}
            taken={taken}
            locked={!!pending}
            onTry={onTry}
            onSuccess={onPickClass}
          />
        </div>
      </div>

      <aside className="card krs-card">
        <div className="krs-head">
          <h2>
            <Icon name="checklist" /> KRS Anda
          </h2>
          <button type="button" className="btn-ghost" onClick={loadSlots}>
            <Icon name="refresh" size={16} /> Muat ulang
          </button>
        </div>
        <div className="sks-row">
          <span>SKS diambil</span>
          <b>
            {sks} / {targetSks} SKS
          </b>
        </div>
        <div className="meter thick">
          <span style={{ width: `${(sks / targetSks) * 100}%` }} />
        </div>

        {mine.length === 0 ? (
          <p className="muted empty">Belum ada mata kuliah di KRS.</p>
        ) : (
          <ul className="krs-list">
            {mine.map((c) => (
              <li key={c.key}>
                <div>
                  <div className="name">{findCourse(c.course).name}</div>
                  <div className="muted small">
                    {c.course} · Kelas {c.code}
                  </div>
                </div>
                <b className="sks">{courseSks(c.course)} SKS</b>
                <button
                  type="button"
                  className="trash"
                  aria-label={`Hapus ${findCourse(c.course).name}`}
                  disabled={!!pending || complete}
                  onClick={() => cancel(c)}
                >
                  <Icon name="trash" size={18} />
                </button>
              </li>
            ))}
          </ul>
        )}
        <button type="button" className="btn block" disabled>
          <Icon name="print" size={18} /> Cetak KRS
        </button>
      </aside>

      {pending && (
        <>
          <SeqModal step={seqStep} onSubmit={submitSeq} />
          {saveErr && (
            <p role="alert" className="toast-err">
              Jawaban belum tersimpan (koneksi ke server bermasalah). Pilih angka lagi untuk mengirim ulang.
            </p>
          )}
        </>
      )}
    </div>
  );
}
