# Simulasi KRS: instrumen penelitian

Next.js (App Router) + PostgreSQL. Mensimulasikan war KRS (paket 6 matkul per ronde, target kelas A yang langka,
bentrok jadwal, kuota diperebutkan) sambil merekam _micro-measures_ widget dan SEQ per interaksi, SUS per ronde.

## Menjalankan

```bash
npm install
cp .env.example .env.local        # isi DATABASE_URL dan ADMIN_TOKEN
docker compose up -d              # Postgres lokal (atau pakai Postgres sendiri)
npm run dev                       # http://localhost:3000
```

Tabel dan kuota awal dibuat otomatis saat request pertama setelah server start. Tidak ada langkah migrasi, tetapi
**server harus di-restart** setelah `src/lib/schema.ts` berubah agar kolom baru dibuat.

**Sesi serentak lewat WiFi yang sama:** `npm run build && npm start -- -H 0.0.0.0`, lalu peserta membuka
`http://<IP-laptop>:3000`.

## Alur peserta

Persetujuan + kode (P01, P02, …) → Ronde 1 (santai) → SUS → Ronde 2 (war) → SUS → 1 pertanyaan terbuka.

- **Ronde 1, santai:** kuota privat per peserta (tidak diperebutkan), peserta mulai kapan saja.
- **Ronde 2, war:** kuota dibagi semua peserta, siapa cepat dia dapat; mulai bersamaan setelah aba-aba peneliti.
- Kolom `condition` (santai/war) diisi server berdasarkan ronde.

- Tampilan meniru halaman Input KRS SIAKAD (referensi di `docs/referensi UI/`), dengan identitas netral.
- Setiap mata kuliah diambil lewat dua widget, dan **SEQ ditanyakan setelah tiap widget**:
  1. **Pilih mata kuliah** (`course_picker`): modal berisi kolom cari dan grid kartu 39 mata kuliah.
     Memilih matkul di luar paket menampilkan pesan dan dicatat sebagai `wrong_pick`.
  2. **Pilih jadwal kelas** (`class_picker`): kartu radio kelas A1/A2/B1/B2 dengan kuota langsung
     ("Terisi x dari y kursi"). Kelas bentrok dan penuh dinonaktifkan. "Tambahkan ke KRS" membuka modal
     "Konfirmasi mata kuliah"; kursi baru diambil saat "Simpan" ditekan.
- Tiap ronde memakai paket 6 matkul yang berbeda. Kuota adalah jumlah kursi sebenarnya dan semua kosong di awal:
  kelas A 3 kursi (langka), kelas B 18 kursi, dan 2 matkul kelas A-nya penuh sejak awal. Aman sampai sekitar 24 peserta.
- Urutan matkul bebas. Kuota diperebutkan nyata antar peserta (pengurangan atomik di Postgres).
- Peserta boleh menghapus kelas dari KRS. Interaksi matkul itu ditandai `cancelled = true` (tidak dihapus).
- Saat KRS lengkap, ronde selesai otomatis. Bila peserta me-refresh di akhir ronde, tombol "KRS lengkap, lanjut"
  muncul di panel KRS.

## Panel peneliti (`/admin`)

Masukkan `ADMIN_TOKEN` (harus sama dengan nilai `ADMIN_TOKEN` di `.env.local`).

- **Lihat isi database**: jumlah peserta per tahap, interaksi, SUS, dan jawaban terbuka. Cek sebelum sesi dimulai.
- **Reset kuota (sesi baru)** sebelum tiap sesi. Reservasi aktif diakhiri (`ended_by = reset`), data hasil tetap.
- **Hapus semua data** setelah uji coba/pilot, supaya data pilot tidak tercampur ke data asli.
- **Unduh CSV**: lima file, dijelaskan di bawah.

## Data (CSV)

| File | Isi |
|---|---|
| `interactions.csv` | Satu baris = satu interaksi pada satu widget (kolom di bawah) |
| `sus.csv` | Jawaban SUS per butir `q1`–`q10` (1–5) dan `score` (0–100), per peserta per ronde |
| `feedback.csv` | Jawaban pertanyaan terbuka |
| `participants.csv` | Semua peserta (termasuk yang belum punya interaksi) dan tahap terakhirnya |
| `reservations.csv` | Log kelas yang diambil; `ended_by` = `cancel` (dihapus peserta) atau `reset` (reset kuota) |

`interactions.csv` (`widget_type`: `course_picker` atau `class_picker`). Kolom utama:

- Target (y): `seq` (1–7)
- Fitur: `dwell_hover_ms`, `mouse_trace_len`, `selections`, `options_display_ms` (lama modal terbuka; -1 untuk
  `class_picker`), `first_key_latency_ms`, `keystrokes`, `misclicks`, `total_ms`, `attempts` (klik Simpan),
  `fail_full` / `fail_conflict` (Simpan ditolak server: kursi keburu habis / bentrok), `click_full` /
  `click_conflict` (klik pada kelas yang sudah tampil penuh / bentrok), `wrong_pick`
- Kovariat: `widget_type`, `condition`, `round`, `order_pos`, `reserved_before`, `a_full_at_pick`, `got_a`
- Validasi: `sus_score` (skor SUS ronde itu, diulang di tiap baris ronde yang sama)
- `cancelled`: kelas matkul ini kemudian dihapus dari KRS. Biasanya dikeluarkan dari analisis.
- Kolom yang tidak berlaku untuk widget tersebut kosong (bukan 0), mis. `attempts` pada `course_picker`.

Untuk model, pisahkan data per partisipan (`GroupKFold` pada `pid`).

## Hal yang perlu Anda putuskan atau periksa

1. **Butir SUS** di `src/lib/sus.ts` masih terjemahan sementara. Ganti dengan versi Indonesia yang tervalidasi.
2. **Jumlah peserta**: kuota diatur di `QUOTA` pada `src/lib/catalog.ts` (A1 + A2 = 6 kursi, B1 + B2 = 24 kursi; aman sampai sekitar 24 peserta). Kalau kuota diubah, kursi terisi otomatis di-reset saat server start.
3. `npm run seeds` mencari ulang seed katalog bila Anda mengubah paket matkul, kelas, atau sesi.
4. `ADMIN_TOKEN=<token> npm run e2e` menguji API (kuota serentak, bentrok, SUS, CSV, pembatalan, reset) terhadap
   server yang sedang berjalan (`BASE_URL`, default `http://localhost:3000`). **Menghapus semua data**, jadi skrip
   berhenti bila database sudah berisi peserta, kecuali dijalankan dengan `-- --force`. Jangan arahkan ke database
   sesi asli.
