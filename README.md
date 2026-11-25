# Simulasi KRS: instrumen penelitian

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
  kelas A 3 kursi (langka), kelas B 12 kursi, dan 2 matkul kelas A-nya penuh sejak awal. Aman sampai sekitar 24 peserta.
- Urutan matkul bebas. Kuota diperebutkan nyata antar peserta (pengurangan atomik di Postgres).

## Panel peneliti (`/admin`)

Masukkan `ADMIN_TOKEN`. **Reset kuota** sebelum tiap sesi, **Unduh CSV** setelahnya, **Hapus semua data** untuk
membersihkan uji coba.

## Data (CSV)

Satu baris = satu interaksi pada satu widget (`widget_type`: `course_picker` atau `class_picker`). Kolom utama:

- Target (y): `seq` (1–7)
- Fitur: `dwell_hover_ms`, `mouse_trace_len`, `selections`, `options_display_ms` (lama modal terbuka; -1 untuk
  `class_picker`), `first_key_latency_ms`, `keystrokes`, `misclicks`, `total_ms`, `attempts`, `fail_full`,
  `fail_conflict` (termasuk klik pada kelas yang dinonaktifkan), `wrong_pick`
- Kovariat: `widget_type`, `condition`, `round`, `order_pos`, `reserved_before`, `a_full_at_pick`, `got_a`
- Validasi: `sus_score` (skor SUS ronde itu, diulang di tiap baris ronde yang sama)

Untuk model, pisahkan data per partisipan (`GroupKFold` pada `pid`).

## Hal yang perlu Anda putuskan atau periksa

1. **Butir SUS** di `src/lib/sus.ts` masih terjemahan sementara. Ganti dengan versi Indonesia yang tervalidasi.
2. **Jumlah peserta**: kuota diatur di `QUOTA` pada `src/lib/catalog.ts` (A1 + A2 = 6 kursi, B1 + B2 = 24 kursi; aman sampai sekitar 24 peserta). Kalau kuota diubah, kursi terisi otomatis di-reset saat server start.
3. `npm run seeds` mencari ulang seed katalog bila Anda mengubah paket matkul, kelas, atau sesi.
4. `npm run e2e` menguji API (kuota serentak, bentrok, SUS, CSV) terhadap server yang sedang berjalan. **Menghapus semua data.**
