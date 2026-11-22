"use client";
import { useState } from "react";
import { SUS_ITEMS } from "@/lib/sus";

export default function SusForm({ onSubmit }: { onSubmit: (answers: number[]) => Promise<void> }) {
  const [a, setA] = useState<(number | null)[]>(Array(SUS_ITEMS.length).fill(null));
  const [busy, setBusy] = useState(false);
  const complete = a.every((x) => x !== null);

  return (
    <section className="panel">
      <h2>Penilaian tampilan pemilihan kelas tadi</h2>
      <p className="muted">1 = sangat tidak setuju, 5 = sangat setuju.</p>
      <ol className="sus">
        {SUS_ITEMS.map((t, i) => (
          <li key={i}>
            <p>{t}</p>
            <div className="likert">
              {[1, 2, 3, 4, 5].map((n) => (
                <label key={n}>
                  <input
                    type="radio"
                    name={`q${i}`}
                    checked={a[i] === n}
                    onChange={() => setA(a.map((v, j) => (j === i ? n : v)))}
                  />
                  {n}
                </label>
              ))}
            </div>
          </li>
        ))}
      </ol>
      <button
        className="btn"
        disabled={!complete || busy}
        onClick={async () => {
          setBusy(true);
          await onSubmit(a as number[]);
          setBusy(false);
        }}
      >
        Lanjut
      </button>
    </section>
  );
}
