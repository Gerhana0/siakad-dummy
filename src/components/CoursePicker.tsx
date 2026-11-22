"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Course, POOL } from "@/lib/catalog";
import { Metrics, useTracker } from "@/lib/useTracker";
import Icon from "./Icon";

export type CoursePick = { course: Course; metrics: Metrics; wrongPick: number };

type Props = {
  selected: Course | null;
  targets: string[];
  takenCourses: Set<string>;
  locked: boolean;
  onPick: (p: CoursePick) => void;
};

/**
 * Widget 1 (course_picker): tombol "Pilih mata kuliah" membuka modal berisi kolom pencarian dan
 * grid kartu mata kuliah. Satu interaksi = dari sentuhan pertama sampai mata kuliah paket dipilih.
 */
export default function CoursePicker({ selected, targets, takenCourses, locked, onPick }: Props) {
  const tr = useTracker();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [warn, setWarn] = useState("");
  const wrong = useRef(0);
  const input = useRef<HTMLInputElement>(null);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return POOL;
    return POOL.filter((c) => `${c.code} ${c.name}`.toLowerCase().includes(q));
  }, [query]);

  const show = () => {
    if (locked) return;
    tr.markOpen();
    setOpen(true);
    setWarn("");
  };
  const hide = () => {
    tr.markClose();
    setOpen(false);
    setQuery("");
  };

  useEffect(() => {
    if (!open) return;
    input.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && hide();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const choose = (c: Course) => {
    tr.markSelect();
    if (takenCourses.has(c.code)) return;
    if (!targets.includes(c.code)) {
      wrong.current++;
      setWarn(`${c.name} tidak termasuk paket KRS Anda pada ronde ini.`);
      return;
    }
    hide();
    onPick({ course: c, metrics: tr.finish(), wrongPick: wrong.current });
  };

  return (
    <div {...tr.wrapper} className="step-body">
      {selected && (
        <div className="picked-course">
          <Icon name="book" size={24} />
          <div>
            <div className="code">{selected.code}</div>
            <div className="name">{selected.name}</div>
            <div className="muted small">{selected.sks} SKS</div>
          </div>
          <button type="button" data-interactive className="btn-ghost" onClick={show} disabled={locked}>
            Ganti
          </button>
        </div>
      )}
      <button type="button" data-interactive className="btn" onClick={show} disabled={locked}>
        <Icon name="search" size={18} /> Pilih mata kuliah
      </button>

      {open && (
        <div
          className="overlay"
          data-interactive
          onClick={(e) => e.target === e.currentTarget && hide()}
        >
          <div className="modal course-modal" role="dialog" aria-modal="true" aria-labelledby="pmk" data-surface>
            <div className="modal-head">
              <h2 id="pmk">Pilih mata kuliah</h2>
              <button type="button" data-interactive className="icon-close" aria-label="Tutup" onClick={hide}>
                <Icon name="x" />
              </button>
            </div>
            <input
              ref={input}
              data-interactive
              className="field"
              placeholder="Cari kode atau nama mata kuliah"
              value={query}
              onFocus={tr.markFocus}
              onKeyDown={tr.markKey}
              onChange={(e) => setQuery(e.target.value)}
            />
            {warn && (
              <p role="alert" className="alert-err">
                <Icon name="xCircle" size={16} /> {warn}
              </p>
            )}
            <div className="course-grid" data-surface>
              {list.map((c) => {
                const taken = takenCourses.has(c.code);
                return (
                  <button
                    type="button"
                    key={c.code}
                    data-interactive
                    className={`course-card${taken ? " is-taken" : ""}`}
                    aria-disabled={taken}
                    onClick={() => choose(c)}
                  >
                    <span className="code">{c.code}</span>
                    <span className="name">{c.name}</span>
                    <span className="muted small">{taken ? "Sudah ada di KRS" : `${c.sks} SKS`}</span>
                  </button>
                );
              })}
              {list.length === 0 && <p className="muted empty">Mata kuliah tidak ditemukan.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
