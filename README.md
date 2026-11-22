# Simulasi KRS — instrumen penelitian

Next.js (App Router) + PostgreSQL. Mensimulasikan war KRS (7 matkul, 20 SKS, target kelas A, kuota 5 per kelas,
bentrok jadwal) sambil merekam _micro-measures_ widget dan SEQ per interaksi, SUS per ronde.

## Menjalankan

```bash
npm install
cp .env.example .env.local        # isi DATABASE_URL dan ADMIN_TOKEN
docker compose up -d              # Postgres lokal (atau pakai Postgres sendiri)
npm run dev                       # http://localhost:3000
```

Tabel dan kuota awal dibuat otomatis saat request pertama. Tidak ada langkah migrasi.

**Sesi serentak lewat WiFi yang sama:** `npm run build && npm start -- -H 0.0.0.0`, lalu peserta membuka
`http://<IP-laptop>:3000`.

## Alur peserta

Persetujuan + kode (P01, P02, …) → Ronde 1 → SUS → Ronde 2 → SUS → 2 pertanyaan akhir.

- Widget ditentukan sistem dari kode: kode ganjil mulai dropdown, genap mulai typing (counterbalancing).
- Ronde 1 memakai katalog 1, ronde 2 katalog 2 (jadwal dan bentrok berbeda, kesulitan setara: 3 kelas A penuh
  sejak awal, 2 pasang kelas A bentrok, maksimal 3 kelas A yang bisa diperoleh).
- Urutan matkul bebas. Kuota diperebutkan nyata antar peserta (pengurangan atomik di Postgres).
- Widget memuat semua 42 kelas (7 matkul × 6 kelas).
- Peserta menekan "Mulai ronde" setelah aba-aba peneliti agar semua mulai bersamaan.

## Panel peneliti (`/admin`)

Masukkan `ADMIN_TOKEN`. **Reset kuota** sebelum tiap sesi, **Unduh CSV** setelahnya, **Hapus semua data** untuk
membersihkan uji coba.

## Data (CSV)

Satu baris = satu interaksi (satu kelas berhasil diambil). Kolom utama:

- Target (y): `seq` (1–7)
- Fitur: `dwell_hover_ms`, `mouse_trace_len`, `selections`, `options_display_ms`, `first_key_latency_ms`,
  `keystrokes`, `misclicks`, `total_ms`, `attempts`, `fail_full`, `fail_conflict`
- Kovariat: `widget`, `round`, `order_pos`, `reserved_before`, `a_full_at_pick`, `got_a`, `widget_first`
- Validasi: `sus_score` (skor SUS ronde itu, diulang di tiap baris ronde yang sama)

Untuk model, pisahkan data per partisipan (`GroupKFold` pada `pid`).

## Hal yang perlu Anda putuskan atau periksa

1. **Butir SUS** di `src/lib/sus.ts` masih terjemahan sementara. Ganti dengan versi Indonesia yang tervalidasi.
2. **Jumlah peserta**: tiap matkul berkapasitas 30 kursi (5 × 6), sehingga aman untuk sampai sekitar 24 peserta.
3. `npm run seeds` mencari ulang seed katalog bila Anda mengubah jumlah matkul, kelas, atau jadwal.
4. `npm run e2e` menguji API (kuota serentak, bentrok, SUS, CSV) terhadap server yang sedang berjalan.
