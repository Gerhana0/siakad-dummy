"use client";
import { useRef, useState } from "react";
import { Cls, Course, DAYS, SESSIONS, clash, courseName, sessionLabel } from "@/lib/catalog";
import { Metrics, useTracker } from "@/lib/useTracker";
import Icon from "./Icon";

export type TryResult =
  | { ok: true; aFull: boolean; reservedBefore: number }
  | { ok: false; reason: "full" | "conflict" | "already" | "error"; detail?: string };
export type Counters = { attempts: number; failFull: number; failConflict: number };
export type ClassPick = {
  cls: Cls;
  res: Extract<TryResult, { ok: true }>;
  metrics: Metrics;
  counters: Counters;
};

type Props = {
  course: Course | null;
  classes: Cls[]; // kelas paralel matkul terpilih
  mine: Cls[]; // kelas yang sudah ada di KRS
  taken: Record<string, number>;
  locked: boolean;
  onTry: (c: Cls) => Promise<TryResult>;
  onSuccess: (p: ClassPick) => void;
};

/** Pesan bentrok bergaya SIAKAD. */
function clashMessage(c: Cls, mine: Cls[]) {
  const hits = mine.filter((m) => clash(m, c));
  if (!hits.length) return "";
  const parts = hits.flatMap((h) =>
    SESSIONS[h.slot].map((jam) => `${h.course} - ${courseName(h.course)} pada jam ke-${jam}`)
  );
  return `Terdapat tumbukan jadwal pada hari ${DAYS[c.day]} dengan MK ${parts.join(", ")}.`;
}

/**
 * Widget 2 (class_picker): daftar kartu radio jadwal kelas paralel. Kelas bentrok dan penuh
 * dinonaktifkan. Satu interaksi = dari sentuhan pertama sampai kelas berhasil ditambahkan ke KRS.
 * Klik pada kelas nonaktif dihitung sebagai fail_conflict / fail_full.
 */
export default function SchedulePicker({ course, classes, mine, taken, locked, onTry, onSuccess }: Props) {
  const tr = useTracker();
  const [picked, setPicked] = useState<Cls | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const cnt = useRef<Counters>({ attempts: 0, failFull: 0, failConflict: 0 });

  const filled = (c: Cls) => Math.min(taken[c.key] ?? c.initialTaken, c.quota);
  const sorted = [...classes].sort((a, b) => a.day - b.day || a.slot - b.slot);

  const choose = (c: Cls, disabledBy: "" | "full" | "conflict") => {
    if (locked) return;
    if (disabledBy === "conflict") cnt.current.failConflict++;
    if (disabledBy === "full") cnt.current.failFull++;
    if (disabledBy) return;
    tr.markSelect();
    setPicked(c);
    setMsg("");
  };

  const add = async () => {
    if (!picked || busy || locked) return;
    setBusy(true);
    cnt.current.attempts++;
    const res = await onTry(picked);
    setBusy(false);
    if (res.ok) {
      onSuccess({ cls: picked, res, metrics: tr.finish(), counters: { ...cnt.current } });
      return;
    }
    if (res.reason === "full") {
      cnt.current.failFull++;
      setMsg(`Kelas ${picked.code} sudah penuh. Silakan pilih jadwal kelas lain.`);
    } else if (res.reason === "conflict") {
      cnt.current.failConflict++;
      setMsg(`Jadwal bentrok dengan ${res.detail ?? "kelas yang sudah diambil"}.`);
    } else if (res.reason === "already") {
      setMsg("Mata kuliah ini sudah ada di KRS Anda.");
    } else {
      setMsg("Server tidak merespons. Coba lagi.");
    }
    setPicked(null);
  };

  if (!course) {
    return (
      <div className="step-body">
        <div className="placeholder">
          <Icon name="pointer" size={32} />
          <p>Pilih mata kuliah terlebih dahulu untuk melihat jadwalnya.</p>
        </div>
        <div className="actions">
          <button type="button" className="btn" disabled>
            <Icon name="plus" size={18} /> Tambahkan ke KRS
          </button>
        </div>
      </div>
    );
  }

  return (
    <div {...tr.wrapper} className="step-body">
      <div role="radiogroup" aria-label={`Jadwal kelas ${course.name}`} className="sched-list" data-surface>
        {sorted.map((c) => {
          const n = filled(c);
          const full = n >= c.quota;
          const conflict = clashMessage(c, mine);
          const disabledBy = conflict ? "conflict" : full ? "full" : "";
          const sel = picked?.key === c.key;
          return (
            <div
              key={c.key}
              role="radio"
              aria-checked={sel}
              aria-disabled={!!disabledBy}
              tabIndex={disabledBy ? -1 : 0}
              data-interactive
              className={`sched${sel ? " is-sel" : ""}${disabledBy ? " is-off" : ""}`}
              onClick={() => choose(c, disabledBy)}
              onKeyDown={(e) => (e.key === " " || e.key === "Enter") && (e.preventDefault(), choose(c, disabledBy))}
            >
              <span className="radio" aria-hidden />
              <div className="sched-main">
                <div className="sched-top">
                  <span className="sched-when">
                    {DAYS[c.day]}, {sessionLabel(c.slot)}
                  </span>
                  <span className="badge">Kelas {c.code}</span>
                </div>
                <div className="muted small">
                  Terisi {n} dari {c.quota} kursi{full && " · Kelas penuh"}
                </div>
                <div className="meter">
                  <span style={{ width: `${(n / c.quota) * 100}%` }} />
                </div>
                {conflict && (
                  <p className="sched-err">
                    <Icon name="xCircle" size={16} /> {conflict}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {msg && (
        <p role="alert" className="alert-err">
          <Icon name="xCircle" size={16} /> {msg}
        </p>
      )}
      <div className="actions">
        <button type="button" data-interactive className="btn" disabled={!picked || busy || locked} onClick={add}>
          <Icon name="plus" size={18} /> {busy ? "Memproses…" : "Tambahkan ke KRS"}
        </button>
      </div>
    </div>
  );
}
