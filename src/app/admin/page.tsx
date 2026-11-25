"use client";
import { useState } from "react";
import { Brand } from "@/components/Shell";

type Stats = {
  participants: number;
  byStage: Record<string, number>;
  interactions: number;
  cancelled: number;
  activeReservations: number;
  sus: number;
  feedback: number;
};

const EXPORTS = [
  { type: "interactions", label: "Interaksi" },
  { type: "sus", label: "SUS per butir" },
  { type: "feedback", label: "Jawaban terbuka" },
  { type: "participants", label: "Peserta" },
  { type: "reservations", label: "Log reservasi" },
];

export default function Admin() {
  const [token, setToken] = useState("");
  const [msg, setMsg] = useState("");
  const [stats, setStats] = useState<Stats | null>(null);

  const q = `token=${encodeURIComponent(token)}`;

  const loadStats = async () => {
    const r = await fetch(`/api/admin/stats?${q}`);
    if (r.ok) {
      setStats(await r.json());
      setMsg("");
    } else {
      setStats(null);
      setMsg(r.status === 401 ? "Token salah." : "Gagal memuat ringkasan.");
    }
  };

  const reset = async (all: boolean) => {
    const text = all
      ? "Hapus SEMUA data (peserta, interaksi, SUS, jawaban terbuka, kuota)? Tidak bisa dibatalkan."
      : "Reset kuota untuk sesi baru? Reservasi yang masih aktif diakhiri. Data hasil (interaksi, SUS, jawaban) tetap disimpan.";
    if (!confirm(text)) return;
    const r = await fetch(`/api/admin/reset?${q}${all ? "&all=1" : ""}`, { method: "POST" });
    setMsg(r.ok ? "Selesai direset." : r.status === 401 ? "Token salah." : "Gagal mereset.");
    if (r.ok) loadStats();
  };

  return (
    <main className="centered">
      <Brand />
      <section className="card narrow-card">
        <h1>Panel peneliti</h1>
        <label className="label" htmlFor="tk">Token admin</label>
        <input id="tk" className="field" type="password" value={token} onChange={(e) => setToken(e.target.value)} />
        <div className="row">
          <button className="btn alt" onClick={loadStats} disabled={!token}>
            Lihat isi database
          </button>
        </div>

        {stats && (
          <dl className="confirm-table">
            <dt>Peserta</dt>
            <dd>
              {stats.participants}
              {stats.participants > 0 &&
                ` (${Object.entries(stats.byStage)
                  .map(([s, n]) => `${s}: ${n}`)
                  .join(", ")})`}
            </dd>
            <dt>Interaksi</dt>
            <dd>
              {stats.interactions} ({stats.cancelled} dibatalkan)
            </dd>
            <dt>Reservasi aktif</dt>
            <dd>{stats.activeReservations}</dd>
            <dt>SUS</dt>
            <dd>{stats.sus}</dd>
            <dt>Jawaban terbuka</dt>
            <dd>{stats.feedback}</dd>
          </dl>
        )}

        <h2>Unduh CSV</h2>
        <div className="row">
          {EXPORTS.map((e) => (
            <a key={e.type} className="btn" href={`/api/admin/export?type=${e.type}&${q}`}>
              {e.label}
            </a>
          ))}
        </div>

        <h2>Reset</h2>
        <div className="row">
          <button className="btn alt" onClick={() => reset(false)} disabled={!token}>
            Reset kuota (sesi baru)
          </button>
          <button className="btn danger" onClick={() => reset(true)} disabled={!token}>
            Hapus semua data
          </button>
        </div>
        {msg && <p role="status">{msg}</p>}
        <p className="muted">
          <b>Reset kuota</b> sebelum tiap sesi agar semua peserta berangkat dari kuota awal yang sama. Data hasil sesi
          sebelumnya tidak ikut terhapus. Setelah <b>uji coba/pilot</b>, pakai <b>Hapus semua data</b> supaya data pilot
          tidak tercampur ke data asli. Periksa “Lihat isi database” sebelum sesi dimulai: angkanya harus 0 kecuali
          untuk sesi sebelumnya yang memang ingin disimpan.
        </p>
      </section>
    </main>
  );
}
