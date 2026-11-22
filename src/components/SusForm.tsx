"use client";
import { useState } from "react";
import { SUS_ITEMS } from "@/lib/sus";

export default function SusForm({
  round,
  onSubmit,
}: {
  round: 1 | 2;
  onSubmit: (answers: number[]) => Promise<void>;
}) {
  const [a, setA] = useState<(number | null)[]>(Array(SUS_ITEMS.length).fill(null));
  const [busy, setBusy] = useState(false);
  const complete = a.every((x) => x !== null);

  return (
    <div>
      <h2>Penilaian pengisian KRS (ronde {round})</h2>
      <p className="muted">Nilai tampilan pengisian KRS yang baru Anda pakai. 1 = sangat tidak setuju, 5 = sangat setuju.</p>
      <ol className="sus">
        {SUS_ITEMS.map((t, i) => (
          <li key={i}>
            <p>{t}</p>
            <div className="likert" role="radiogroup" aria-label={`Butir ${i + 1}`}>
              {[1, 2, 3, 4, 5].map((n) => (
                <label key={n} className={a[i] === n ? "is-on" : ""}>
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
        className="btn block"
        disabled={!complete || busy}
        onClick={async () => {
          setBusy(true);
          await onSubmit(a as number[]);
          setBusy(false);
        }}
      >
        Lanjut
      </button>
    </div>
  );
}
