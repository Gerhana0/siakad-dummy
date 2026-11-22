"use client";
import { useMemo, useRef, useState } from "react";
import { Cls, DAYS, SLOTS, courseName } from "@/lib/catalog";
import { Metrics, useTracker } from "@/lib/useTracker";
import type { Widget } from "@/lib/util";

export type TryResult =
  | { ok: true; aFull: boolean; reservedBefore: number }
  | { ok: false; reason: "full" | "conflict" | "already" | "error"; detail?: string };
export type Counters = { attempts: number; failFull: number; failConflict: number };
export type SuccessPayload = {
  cls: Cls;
  res: Extract<TryResult, { ok: true }>;
  metrics: Metrics;
  counters: Counters;
};

type Props = {
  variant: Widget;
  classes: Cls[];
  taken: Record<string, number>;
  reservedCourses: Set<string>;
  locked: boolean;
  onTry: (c: Cls) => Promise<TryResult>;
  onSuccess: (p: SuccessPayload) => void;
};

const when = (c: Cls) => `${DAYS[c.day]} ${SLOTS[c.slot]}`;
const searchText = (c: Cls) =>
  `${c.course} ${courseName(c.course)} kelas ${c.code} ${DAYS[c.day]} ${SLOTS[c.slot]}`.toLowerCase();

export default function ClassPicker({
  variant, classes, taken, reservedCourses, locked, onTry, onSuccess,
}: Props) {
  const tr = useTracker();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<Cls | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const cnt = useRef<Counters>({ attempts: 0, failFull: 0, failConflict: 0 });

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (variant !== "typing" || !q) return classes;
    return classes.filter((c) => searchText(c).includes(q));
  }, [variant, query, classes]);

  const left = (c: Cls) => Math.max(c.quota - (taken[c.key] ?? c.initialTaken), 0);

  const toggle = () => {
    if (open) tr.markClose();
    else tr.markOpen();
    setOpen(!open);
  };
  const choose = (c: Cls) => {
    tr.markSelect();
    tr.markClose();
    setPicked(c);
    setOpen(false);
    setQuery("");
    setMsg("");
  };

  const confirm = async () => {
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
      setMsg(`Kelas ${picked.code} ${courseName(picked.course)} sudah penuh.`);
    } else if (res.reason === "conflict") {
      cnt.current.failConflict++;
      setMsg(`Jadwal bentrok dengan ${res.detail ?? "kelas yang sudah diambil"}.`);
    } else if (res.reason === "already") {
      setMsg("Mata kuliah ini sudah Anda ambil.");
    } else {
      setMsg("Terjadi gangguan jaringan. Coba lagi.");
    }
    setPicked(null);
  };

  const row = (c: Cls) => {
    const done = reservedCourses.has(c.course);
    const full = left(c) === 0;
    return (
      <li
        key={c.key}
        data-interactive
        role="option"
        aria-selected={picked?.key === c.key}
        aria-disabled={done}
        onClick={() => !done && choose(c)}
        className={`opt${full ? " is-full" : ""}${done ? " is-done" : ""}`}
      >
        <span className="opt-main">
          {c.course} {courseName(c.course)} — Kelas {c.code}
        </span>
        <span className="opt-meta">
          {when(c)} · {done ? "sudah diambil" : full ? "PENUH" : `sisa ${left(c)}/${c.quota}`}
        </span>
      </li>
    );
  };

  return (
    <div {...tr.wrapper} className="picker">
      <label className="picker-label">Pilih kelas</label>

      {variant === "dropdown" ? (
        <button type="button" data-interactive className="field" onClick={toggle} disabled={locked}>
          {picked ? `${picked.course} ${courseName(picked.course)} — Kelas ${picked.code}` : "Pilih kelas…"}
          <span aria-hidden>▾</span>
        </button>
      ) : (
        <input
          data-interactive
          className="field"
          value={query}
          disabled={locked}
          placeholder="Ketik kode, nama mata kuliah, atau hari…"
          onFocus={() => {
            tr.markFocus();
            if (!open) {
              tr.markOpen();
              setOpen(true);
            }
          }}
          onKeyDown={tr.markKey}
          onChange={(e) => setQuery(e.target.value)}
        />
      )}

      {open && (
        <ul role="listbox" className="listbox">
          {list.map(row)}
          {list.length === 0 && <li className="opt-empty">Tidak ada kelas yang cocok.</li>}
        </ul>
      )}

      {picked && !open && (
        <p className="picked">
          Dipilih: <b>{picked.course} {courseName(picked.course)}, Kelas {picked.code}</b> ({when(picked)})
        </p>
      )}
      {msg && (
        <p role="alert" className="err">
          {msg}
        </p>
      )}

      <button type="button" data-interactive className="btn" disabled={!picked || busy || locked} onClick={confirm}>
        {busy ? "Memproses…" : "Ambil kelas"}
      </button>
    </div>
  );
}
