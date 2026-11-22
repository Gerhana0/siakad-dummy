"use client";

export default function SeqModal({ step, onSubmit }: { step: string; onSubmit: (n: number) => void }) {
  return (
    <div className="overlay">
      <div className="modal seq-modal" role="dialog" aria-modal="true" aria-labelledby="seq-q">
        <p className="muted small">Langkah: {step}</p>
        <p id="seq-q" className="modal-q">
          Seberapa mudah menyelesaikan langkah ini?
        </p>
        <div className="scale">
          {[1, 2, 3, 4, 5, 6, 7].map((n) => (
            <button key={n} type="button" className="scale-btn" onClick={() => onSubmit(n)}>
              {n}
            </button>
          ))}
        </div>
        <div className="scale-ends">
          <span>1 = Sangat sulit</span>
          <span>7 = Sangat mudah</span>
        </div>
      </div>
    </div>
  );
}
