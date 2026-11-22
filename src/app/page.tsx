"use client";
import { useState } from "react";
import Round from "@/components/Round";
import SusForm from "@/components/SusForm";
import { Stage, Widget, otherWidget } from "@/lib/util";

type Participant = {
  pid: string;
  widgetFirst: Widget;
  stage: Stage;
  reservations: Record<number, string[]>;
};

const post = (url: string, body: unknown) =>
  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

const WIDGET_LABEL: Record<Widget, string> = {
  dropdown: "daftar pilihan (dropdown)",
  typing: "kolom pencarian (ketik untuk mencari)",
};

export default function Home() {
  const [code, setCode] = useState("");
  const [agree, setAgree] = useState(false);
  const [p, setP] = useState<Participant | null>(null);
  const [started, setStarted] = useState<Record<number, boolean>>({});
  const [pref, setPref] = useState("");
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  const widgetFor = (round: 1 | 2): Widget =>
    round === 1 ? p!.widgetFirst : otherWidget(p!.widgetFirst);

  const setStage = async (stage: Stage) => {
    await post("/api/stage", { pid: p!.pid, stage });
    setP({ ...p!, stage });
  };

  const login = async () => {
    setError("");
    try {
      const r = await post("/api/participant", { pid: code });
      if (!r.ok) throw new Error();
      setP(await r.json());
    } catch {
      setError("Tidak dapat terhubung ke server. Hubungi peneliti.");
    }
  };

  if (!p) {
    return (
      <main className="shell narrow">
        <section className="panel">
          <h1>Simulasi pengisian KRS</h1>
          <p>
            Penelitian ini mempelajari kemudahan memilih kelas pada sistem
            informasi akademik. Anda akan mengisi KRS simulasi dua kali dan
            menjawab beberapa pertanyaan singkat (sekitar 20 menit).
          </p>
          <p>
            Yang direkam: gerakan mouse, klik, dan ketikan pada kolom pemilihan
            kelas, serta jawaban Anda. Tidak ada data pribadi yang dikumpulkan.
            Partisipasi sukarela dan boleh dihentikan kapan saja.
          </p>
          <label className="picker-label" htmlFor="code">
            Kode partisipan (dari peneliti)
          </label>
          <input
            id="code"
            className="field"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Contoh: P01"
          />
          <label className="check">
            <input
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
            />
            Saya memahami informasi di atas dan bersedia berpartisipasi.
          </label>
          {error && (
            <p role="alert" className="err">
              {error}
            </p>
          )}
          <button
            className="btn"
            disabled={!code.trim() || !agree}
            onClick={login}
          >
            Mulai
          </button>
        </section>
      </main>
    );
  }

  const round: 1 | 2 | null =
    p.stage === "round1" ? 1 : p.stage === "round2" ? 2 : null;

  if (round) {
    const widget = widgetFor(round);
    if (!started[round]) {
      return (
        <main className="shell narrow">
          <section className="panel">
            <h1>Ronde {round} dari 2</h1>
            <p>
              Pada ronde ini daftar kelas ditampilkan sebagai{" "}
              <b>{WIDGET_LABEL[widget]}</b>. Tunggu aba-aba peneliti, lalu tekan
              tombol di bawah agar semua peserta mulai bersamaan.
            </p>
            <button
              className="btn"
              onClick={() => setStarted({ ...started, [round]: true })}
            >
              Mulai ronde {round}
            </button>
          </section>
        </main>
      );
    }
    return (
      <main className="shell">
        <header className="bar">
          <span>Ronde {round} dari 2</span>
          <span className="muted">{p.pid}</span>
        </header>
        <Round
          key={round}
          pid={p.pid}
          round={round}
          widget={widget}
          initialReserved={p.reservations[round] ?? []}
          onDone={() => setStage(round === 1 ? "sus1" : "sus2")}
        />
      </main>
    );
  }

  if (p.stage === "sus1" || p.stage === "sus2") {
    const r: 1 | 2 = p.stage === "sus1" ? 1 : 2;
    return (
      <main className="shell narrow">
        <SusForm
          onSubmit={async (answers) => {
            await post("/api/sus", {
              pid: p.pid,
              round: r,
              widget: widgetFor(r),
              answers,
            });
            await setStage(r === 1 ? "round2" : "feedback");
          }}
        />
      </main>
    );
  }

  if (p.stage === "feedback") {
    return (
      <main className="shell narrow">
        <section className="panel">
          <h2>Dua pertanyaan terakhir</h2>
          <p>Tampilan mana yang lebih Anda sukai?</p>
          {[
            ["dropdown", "Daftar pilihan (dropdown)"],
            ["typing", "Kolom pencarian (ketik)"],
            ["same", "Sama saja"],
          ].map(([v, l]) => (
            <label key={v} className="check">
              <input
                type="radio"
                name="pref"
                checked={pref === v}
                onChange={() => setPref(v)}
              />
              {l}
            </label>
          ))}
          <label className="picker-label" htmlFor="t">
            Bagian mana yang paling merepotkan saat memilih kelas?
          </label>
          <textarea
            id="t"
            className="field"
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button
            className="btn"
            disabled={!pref}
            onClick={async () => {
              await post("/api/feedback", {
                pid: p.pid,
                preferred: pref,
                text,
              });
              await setStage("done");
            }}
          >
            Kirim
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="shell narrow">
      <section className="panel">
        <h1>Terima kasih</h1>
        <p>Sesi Anda selesai. Anda boleh menutup halaman ini.</p>
      </section>
    </main>
  );
}
