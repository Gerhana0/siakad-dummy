"use client";
import { useState } from "react";
import { Brand } from "@/components/Shell";

export default function Admin() {
  const [token, setToken] = useState("");
  const [msg, setMsg] = useState("");

  const reset = async (all: boolean) => {
    const label = all ? "SEMUA data (peserta, jawaban, kuota)" : "kuota dan reservasi";
    if (!confirm(`Hapus ${label}? Tidak bisa dibatalkan.`)) return;
    const r = await fetch(`/api/admin/reset?token=${encodeURIComponent(token)}${all ? "&all=1" : ""}`, { method: "POST" });
    setMsg(r.ok ? "Selesai direset." : "Gagal (token salah?).");
  };

  return (
    <main className="centered">
      <Brand />
      <section className="card narrow-card">
        <h1>Panel peneliti</h1>
        <label className="label" htmlFor="tk">Token admin</label>
        <input id="tk" className="field" type="password" value={token} onChange={(e) => setToken(e.target.value)} />
        <div className="row">
          <a className="btn" href={`/api/admin/export?token=${encodeURIComponent(token)}`}>Unduh CSV</a>
          <button className="btn alt" onClick={() => reset(false)}>Reset kuota</button>
          <button className="btn danger" onClick={() => reset(true)}>Hapus semua data</button>
        </div>
        {msg && <p role="status">{msg}</p>}
        <p className="muted">Lakukan “Reset kuota” sebelum sesi dimulai agar semua peserta berangkat dari kuota awal yang sama.</p>
      </section>
    </main>
  );
}
