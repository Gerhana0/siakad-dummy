"use client";
import { useState } from "react";
import Round from "@/components/Round";
import SusForm from "@/components/SusForm";
import Shell, { Brand, ProfileCard } from "@/components/Shell";
import { postJson } from "@/lib/api";
import { Stage } from "@/lib/util";

type Participant = {
  pid: string;
  stage: Stage;
  reservations: Record<number, string[]>;
};

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <main className="centered">
      <Brand />
      <section className="card narrow-card">{children}</section>
      <p className="muted small">Hak cipta © 2026 SIAKAD Simulasi · Untuk keperluan penelitian</p>
    </main>
  );
}

export default function Home() {
  const [code, setCode] = useState("");
  const [agree, setAgree] = useState(false);
  const [p, setP] = useState<Participant | null>(null);
  const [started, setStarted] = useState<Record<number, boolean>>({});
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const setStage = async (stage: Stage) => {
    const r = await postJson<{ ok: boolean }>("/api/stage", { pid: p!.pid, stage });
    if (!r?.ok) {
      setError("Gagal menyimpan. Periksa koneksi lalu coba lagi.");
      return false;
    }
    setError("");
    setP({ ...p!, stage });
    return true;
  };

  const login = async () => {
    setError("");
    setBusy(true);
    const r = await postJson<Participant & { error?: string }>("/api/participant", { pid: code });
    setBusy(false);
    if (!r || r.error) setError("Tidak dapat terhubung ke server. Hubungi peneliti.");
    else setP(r);
  };

  if (!p) {
    return (
      <Centered>
        <h1>Simulasi pengisian KRS</h1>
        <p>
          Penelitian ini mempelajari kemudahan memilih kelas pada sistem informasi akademik. Anda akan mengisi
          KRS simulasi dua kali dan menjawab beberapa pertanyaan singkat (sekitar 20 menit).
        </p>
        <p>
          Yang direkam: gerakan mouse, klik, dan ketikan pada halaman pengisian KRS, serta jawaban Anda. Tidak
          ada data pribadi yang dikumpulkan. Partisipasi sukarela dan boleh dihentikan kapan saja.
        </p>
        <label className="label" htmlFor="code">
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
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
          Saya memahami informasi di atas dan bersedia berpartisipasi.
        </label>
        {error && (
          <p role="alert" className="alert-err">
            {error}
          </p>
        )}
        <button className="btn block" disabled={!code.trim() || !agree || busy} onClick={login}>
          Mulai
        </button>
      </Centered>
    );
  }

  const round: 1 | 2 | null = p.stage === "round1" ? 1 : p.stage === "round2" ? 2 : null;

  if (round) {
    return (
      <Shell title="Input KRS" crumbs={["Registrasi", "KRS"]} badge={`Ronde ${round} dari 2`}>
        <ProfileCard pid={p.pid} />
        {!started[round] ? (
          <div className="card start-card">
            <h2>Ronde {round} dari 2</h2>
            <p>
              Isi KRS dengan semua mata kuliah paket dan usahakan mendapat kelas A. Kuota kelas dibagi dengan
              peserta lain, jadi siapa cepat dia dapat. Setiap selesai satu langkah, Anda akan diminta menilai
              seberapa mudah langkah tersebut.
            </p>
            <p>
              <b>Tunggu aba-aba peneliti</b>, lalu tekan tombol di bawah agar semua peserta mulai bersamaan.
            </p>
            <button className="btn" onClick={() => setStarted({ ...started, [round]: true })}>
              Mulai ronde {round}
            </button>
          </div>
        ) : (
          <Round
            key={round}
            pid={p.pid}
            round={round}
            initialReserved={p.reservations[round] ?? []}
            onDone={() => setStage(round === 1 ? "sus1" : "sus2")}
          />
        )}
        {error && (
          <p role="alert" className="toast-err">
            {error}
          </p>
        )}
      </Shell>
    );
  }

  if (p.stage === "sus1" || p.stage === "sus2") {
    const r: 1 | 2 = p.stage === "sus1" ? 1 : 2;
    return (
      <Centered>
        <SusForm
          key={r}
          round={r}
          onSubmit={async (answers) => {
            const res = await postJson<{ ok: boolean }>("/api/sus", { pid: p.pid, round: r, widget: "siakad", answers });
            if (!res?.ok) {
              setError("Jawaban belum tersimpan. Periksa koneksi lalu tekan Lanjut lagi.");
              return;
            }
            await setStage(r === 1 ? "round2" : "feedback");
          }}
        />
        {error && (
          <p role="alert" className="alert-err">
            {error}
          </p>
        )}
      </Centered>
    );
  }

  if (p.stage === "feedback") {
    return (
      <Centered>
        <h2>Satu pertanyaan terakhir</h2>
        <label className="label" htmlFor="t">
          Bagian mana yang paling merepotkan saat mengisi KRS tadi?
        </label>
        <textarea id="t" className="field" rows={5} value={text} onChange={(e) => setText(e.target.value)} />
        {error && (
          <p role="alert" className="alert-err">
            {error}
          </p>
        )}
        <button
          className="btn block"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            const r = await postJson<{ ok: boolean }>("/api/feedback", { pid: p.pid, preferred: null, text });
            setBusy(false);
            if (!r?.ok) setError("Jawaban belum tersimpan. Coba lagi.");
            else await setStage("done");
          }}
        >
          Kirim
        </button>
      </Centered>
    );
  }

  return (
    <Centered>
      <h1>Terima kasih</h1>
      <p>Sesi Anda selesai. Anda boleh menutup halaman ini.</p>
    </Centered>
  );
}
