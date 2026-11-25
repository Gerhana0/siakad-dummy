# PRD: Simulasi War KRS (SIAKAD Dummy) untuk Penelitian Interaction Effort

| | |
|---|---|
| **Proyek** | Proyek IMK, Kelompok 7 |
| **Judul penelitian** | Prediksi Otomatis Interaction Effort pada Widget Pemilihan Kelas SIAKAD Menggunakan Micro-measures dan Single Ease Question (SEQ) |
| **Dokumen acuan** | `docs/Proyek IMK.pdf` (proposal), `docs/referensi UI/` (screenshot SIAKAD) |
| **Status** | Draf v2, 22 November 2026 |
| **Repo** | `siakad-dummy` (Next.js 16 + PostgreSQL) |

**Perubahan dari v1:** perbandingan versi widget (dropdown vs search, radio panjang vs ringkas) dihapus. Aplikasi kini **meniru satu desain, yaitu halaman Input KRS SIAKAD apa adanya**, dan fokus penelitian adalah **prediksi** effort, bukan perbandingan desain.

---

## 1. Ringkasan

**Tujuan penelitian:** mengetahui apakah beban interaksi (*interaction effort*) mahasiswa saat war KRS bisa **diprediksi otomatis dari perilaku mouse dan keyboard**, tanpa harus menanyai mereka satu per satu.

Aplikasi ini adalah **instrumen** untuk mengumpulkan data latihnya:
- Meniru halaman Input KRS SIAKAD (tata letak dan alur sama, identitas visual netral).
- Peserta berada di **satu ruangan dan mulai pada waktu yang sama**, lalu memperebutkan kuota kelas yang terbatas (**siapa cepat dia dapat**).
- Selama mengisi, aplikasi merekam **micro-measures** dari event DOM di setiap widget.
- Setiap widget yang selesai diisi diikuti **SEQ** (1–7) sebagai *ground truth* effort.

> **Penting:** SEQ tetap ditanyakan selama pengambilan data, karena SEQ adalah label untuk **melatih** model. "Tanpa menanyai" adalah hasil akhir yang diharapkan: setelah model terlatih, effort cukup diprediksi dari micro-measures.

Data dipakai untuk:
1. melatih model (Decision Tree dan pembanding) yang memprediksi SEQ dari micro-measures, dan
2. melihat pengaruh kondisi war terhadap effort.

## 2. Revisi terhadap proposal

| Aspek | Proposal awal | Revisi (PRD ini) | Alasan |
|---|---|---|---|
| Pelaksanaan | Remote lewat tautan | **Sesi lab serentak**: satu ruangan, satu waktu, satu jaringan | Memungkinkan perebutan kuota nyata |
| Sumber tekanan | Countdown dan kuota habis terjadwal | **Perebutan kuota nyata antar peserta** | Lebih mirip war KRS asli; tekanan muncul alami |
| Desain widget | Dua versi tiap widget (dropdown vs search; radio panjang vs ringkas) | **Satu desain: tiru SIAKAD asli** (modal cari + grid kartu, lalu kartu radio jadwal) | Fokus ke prediksi; validitas ekologis lebih tinggi; widget yang diteliti adalah widget yang benar-benar dipakai mahasiswa |
| Faktor kondisi | Santai vs time-pressure | **Santai vs war** | H4 tetap bisa diuji |
| Urutan | Latin square | Urutan tetap: latihan → santai → war | Blok war harus serentak untuk semua orang |
| H3 | Dropdown vs searchable input | **Diganti:** perbandingan effort antara widget pilih matkul dan widget pilih jadwal | Tidak ada lagi dua versi widget; perbandingan antar widget asli tetap memberi pelajaran desain |

Konsekuensi untuk proposal:
- Klaim research gap *"membandingkan dua desain widget"* diganti menjadi *"mengidentifikasi widget SIAKAD mana yang paling membebani, berdasarkan model prediksi"*.
- Bagian metode, prosedur, dan validitas disesuaikan dengan tabel di atas.

## 3. Hipotesis dan kebutuhan data

| ID | Pertanyaan penelitian | Hipotesis | Data dari aplikasi |
|---|---|---|---|
| H1 | Seberapa akurat Decision Tree memprediksi SEQ dari micro-measures? | MAE ≤ 0,5 dan R² ≥ 0,5 | Fitur micro-measures + `seq` + `pid` |
| H2 | Metrik apa yang punya Gini importance tertinggi di tiap jenis widget? | Dwell+Hover dan Selections dominan; Misclicks paling rendah | Sama seperti H1, ditambah `widget_type` |
| H3 (revisi) | Apakah effort berbeda antara widget pilih matkul dan widget pilih jadwal? | Pilih jadwal lebih berat (informasi padat, bentrok, kuota) | `widget_type`, `seq`, metrik |
| H4 | Apakah kondisi war mengubah micro-measures dan SEQ? | War menaikkan Dwell+Hover dan Selections serta menurunkan SEQ | `condition`; analisis tambahan: `a_full_at_pick`, `fail_full` |
| H5 | Apakah SEQ berkorelasi dengan SUS? | Spearman ρ ≥ 0,5 | Rata-rata SEQ per blok dan skor SUS blok itu |
| H6 | Apakah Decision Tree kompetitif dibanding model lain? | DT ≥ LR dan sebanding dengan RF | Sama seperti H1 |

## 4. Pengguna

| Peran | Kebutuhan utama |
|---|---|
| **Peserta** (15–20 mahasiswa aktif yang pernah mengisi KRS) | Tampilan yang familiar seperti SIAKAD, tanpa instalasi, durasi sekitar 20 menit |
| **Peneliti** (operator sesi) | Menyiapkan sesi, mengatur kuota sesuai jumlah peserta, memulai blok war serentak, memantau progres, mengunduh data |
| **Analis data** (tim) | CSV yang lengkap dan terdokumentasi, termasuk alasan data dikeluarkan |

## 5. Desain eksperimen

### 5.1 Variabel
- **Unit analisis:** satu interaksi pada satu widget.
- **Target (y):** SEQ 1–7.
- **Fitur (x):** micro-measures (bagian 8.2).
- **Jenis widget** (`widget_type`): `course_picker` (pilih mata kuliah) dan `class_picker` (pilih jadwal kelas).
- **Kondisi** (`condition`): `santai` vs `war`, within-subject.

### 5.2 Struktur sesi

| Langkah | Isi | Perkiraan waktu |
|---|---|---|
| 0 | Persetujuan + kode peserta | 1 menit |
| 1 | Demografi singkat (angkatan, frekuensi memakai SIAKAD, perangkat input) | 1 menit |
| 2 | **Latihan**: 1 matkul, data tidak dipakai untuk analisis | 1–2 menit |
| 3 | **Blok santai**: paket 6 matkul, dikerjakan sendiri, kuota tidak diperebutkan | 5 menit |
| 4 | SUS blok santai | 2 menit |
| 5 | **Blok war** (serentak): paket 6 matkul lain, kuota diperebutkan | 5 menit |
| 6 | SUS blok war | 2 menit |
| 7 | Pertanyaan terbuka | 1–2 menit |
| | **Total** | **sekitar 20 menit** |

### 5.3 Kondisi

| | Santai | War |
|---|---|---|
| Waktu mulai | Masing-masing peserta | **Serentak**, dipicu peneliti dari panel admin |
| Kuota | **Privat per peserta** (tidak terpengaruh peserta lain) | **Dibagi semua peserta**, dikurangi secara atomik di server |
| Kelas penuh dan bentrok | Ada (pola sama dengan war) | Ada, ditambah kursi yang habis karena peserta lain |
| Batas waktu | Tidak ada (hanya batas aman, misalnya 10 menit) | Ada, dapat diatur (bawaan 5 menit), tidak ditampilkan |

Kedua blok memakai paket matkul berbeda dengan tingkat kesulitan yang disetarakan lewat seed katalog. Beda kondisi hanya pada **persaingan**.

### 5.4 Estimasi data
15 peserta × 2 blok × 6 matkul × 2 widget = **sekitar 360 interaksi** (proposal: 240+).

## 6. Alur per mata kuliah (meniru SIAKAD)

```
Paket KRS blok ini (6 matkul), ditampilkan di kotak info
        │
        ▼
[W1 course_picker] Tombol "Pilih mata kuliah" → modal: kolom cari + grid kartu (39 matkul)
        │  matkul di luar paket → pesan, dihitung wrong_pick
        ▼
   SEQ #1  "Seberapa mudah menyelesaikan langkah ini?"
        │
        ▼
[W2 class_picker] Kartu radio jadwal kelas A1/A2/B1/B2
        │  tiap kartu: hari + sesi, "Terisi x dari y kursi", bar kuota
        │  kelas bentrok/penuh dinonaktifkan + pesan merah
        │  "Tambahkan ke KRS" → modal "Konfirmasi mata kuliah" (Tutup / Simpan)
        │  "Simpan" → server: berhasil / penuh (kursi direbut orang lain)
        ▼
   SEQ #2
        │
        ▼
Panel "KRS Anda" diperbarui → matkul berikutnya (urutan bebas)
```

- Target: ambil semua matkul paket dan **usahakan kelas A (A1/A2)**.
- Peserta boleh menghapus kelas dari KRS untuk menyelesaikan bentrok.
- Blok selesai bila semua matkul paket sudah diambil atau dilewati, atau batas waktu habis.

## 7. Kebutuhan fungsional

Status: **Ada** = sudah diimplementasikan · **Ubah** = ada tapi perlu diubah · **Baru** = belum ada.
Prioritas: **P0** wajib sebelum pengambilan data · **P1** sangat disarankan · **P2** opsional.

### 7.1 Tampilan dan onboarding

| ID | Kebutuhan | Status | Prioritas |
|---|---|---|---|
| F-01 | Halaman persetujuan + kode peserta | Ada | P0 |
| F-02 | Kerangka halaman meniru SIAKAD: sidebar, header "Input KRS", kartu mahasiswa fiktif, tab, panel KRS Anda | Ada | P0 |
| F-03 | Form demografi: angkatan, frekuensi memakai SIAKAD, **perangkat input (mouse/touchpad)** | Baru | P0 |
| F-04 | Latihan 1 matkul sebelum blok santai, ditandai `practice` | Baru | P1 |
| F-05 | Lanjutkan sesi setelah refresh tanpa kehilangan tahap | Ada | P0 |
| F-06 | Cegah satu kode dipakai di dua perangkat bersamaan | Baru | P1 |

### 7.2 Katalog

| ID | Kebutuhan | Status | Prioritas |
|---|---|---|---|
| F-10 | 39 mata kuliah fiktif di modal; paket 6 matkul per blok | Ada | P0 |
| F-11 | Kelas paralel A1/A2/B1/B2 per matkul, hari + sesi (jam ke-), kuota = kursi sebenarnya (kelas A 3, kelas B 12), semua kosong di awal kecuali kelas A yang penuh sejak awal | Ada | P0 |
| F-12 | Dua set katalog dengan kesulitan setara (dicari lewat `npm run seeds`) | Ada | P0 |
| F-13 | Sisa kursi dapat diatur dari admin sesuai jumlah peserta yang hadir | Baru (saat ini konstanta di kode) | P0 |

### 7.3 Widget

| ID | Kebutuhan | Status | Prioritas |
|---|---|---|---|
| F-20 | W1: modal "Pilih mata kuliah" dengan kolom cari dan grid kartu; Esc dan klik latar menutup modal | Ada | P0 |
| F-21 | W1: matkul di luar paket memunculkan pesan dan dicatat `wrong_pick` | Ada | P0 |
| F-22 | W2: kartu radio jadwal dengan kuota langsung (polling 3 detik) | Ada | P0 |
| F-23 | W2: kelas bentrok dinonaktifkan dengan pesan tumbukan jadwal bergaya SIAKAD; kelas penuh dinonaktifkan | Ada | P0 |
| F-24 | W2: "Tambahkan ke KRS" membuka modal "Konfirmasi mata kuliah" (mata kuliah, SKS, kelas, jadwal; Tutup / Simpan); "Simpan" divalidasi server (penuh / bentrok / sudah diambil) | Ada | P0 |
| F-25 | Navigasi keyboard di grid kartu W1 | Baru | P2 |

### 7.4 Kondisi santai dan war

| ID | Kebutuhan | Status | Prioritas |
|---|---|---|---|
| F-30 | Pengurangan kuota atomik di database | Ada | P0 |
| F-31 | Ronde 1 = santai (kuota privat per peserta), ronde 2 = war (kuota bersama) | Ada | P0 |
| F-32 | Ruang tunggu blok war: semua peserta mulai saat peneliti menekan "Mulai" di admin | Baru (saat ini peserta menekan sendiri setelah aba-aba) | P0 |
| F-33 | Batas waktu blok war, dapat diatur, tidak ditampilkan; sisa matkul dicatat `timeout` | Baru | P0 |
| F-34 | Tombol "Lewati matkul ini" + pencatatan | Baru | P0 |
| F-35 | Penghapusan kelas dari KRS dicatat sebagai event; interaksi terkait ditandai `cancelled` | Ubah (kursi sudah kembali, tapi belum tercatat) | P1 |

### 7.5 SEQ, SUS, pertanyaan akhir

| ID | Kebutuhan | Status | Prioritas |
|---|---|---|---|
| F-40 | SEQ 1–7 setelah W1 dan setelah W2, teks sesuai proposal | Ada | P0 |
| F-41 | Jawaban SEQ yang gagal terkirim tidak hilang (coba ulang + pemberitahuan) | Ada | P0 |
| F-42 | SUS 10 butir **versi Indonesia tervalidasi** (kandidat: adaptasi Sharfina & Santoso, 2016; cek dan sitasi), setelah tiap blok | Ubah (masih terjemahan sementara) | P0 |
| F-43 | Pertanyaan terbuka "bagian paling merepotkan" | Ada | P0 |

### 7.6 Pencatatan data

| ID | Kebutuhan | Status | Prioritas |
|---|---|---|---|
| F-50 | Ringkasan micro-measures per interaksi per widget (8.2) | Ada | P0 |
| F-51 | Kolom `condition` (santai/war) di data interaksi; kolom `practice` | `condition` Ada, `practice` Baru | P0 |
| F-52 | **Log event mentah** dengan timestamp klien dan server, ID widget, ID interaksi | Baru | P1 |
| F-53 | Deteksi tab ditinggal (`visibilitychange`), total waktu tersembunyi per interaksi | Baru | P0 |
| F-54 | Catat latensi jaringan (RTT) saat menambahkan kelas | Baru | P1 |

### 7.7 Panel peneliti (`/admin`)

| ID | Kebutuhan | Status | Prioritas |
|---|---|---|---|
| F-60 | Login token, reset kuota, hapus semua data, unduh CSV interaksi | Ada | P0 |
| F-61 | Pengaturan sesi: sisa kursi, batas waktu war | Baru | P0 |
| F-62 | Tombol "Mulai blok war" (memicu F-32) | Baru | P0 |
| F-63 | Monitor peserta: kode, tahap, jumlah matkul selesai | Baru | P1 |
| F-64 | Ekspor tambahan: SUS per butir, demografi, jawaban terbuka, log event | Baru | P0 |

## 8. Kebutuhan data

### 8.1 Entitas

| Tabel | Isi | Status |
|---|---|---|
| `participants` | pid, tahap, demografi, waktu dibuat | Ada (demografi belum) |
| `class_slots` | kuota dan jumlah terisi per kelas (war) | Ada |
| `reservations` | kelas yang diambil, status aktif/dibatalkan | Ada |
| `interactions` | satu baris per interaksi widget (8.2) | Ada |
| `sus_responses` | jawaban per butir + skor, per blok | Ada |
| `feedback` | jawaban terbuka | Ada |
| `events` | log event mentah | Baru |
| `session_config` | sisa kursi, batas waktu, status mulai war | Baru |

### 8.2 Kolom `interactions` (CSV utama)

| Kelompok | Kolom | Definisi |
|---|---|---|
| Identitas | `pid`, `round`, `course_code`, `class_code` | `class_code` kosong untuk `course_picker` |
| Widget | `widget_type` | `course_picker` atau `class_picker` |
| Kondisi | `condition`, `practice` | `condition` diisi server dari ronde; `practice` belum ada |
| **Target** | `seq` | 1–7 |
| Fitur | `dwell_hover_ms` | Total waktu kursor di area widget (termasuk modal yang terbuka) |
| | `mouse_trace_len` | Panjang lintasan kursor di area widget (px) |
| | `selections` | Jumlah kartu matkul / kartu jadwal yang dipilih |
| | `options_display_ms` | Lama modal matkul terbuka; `-1` untuk `class_picker` (opsi selalu terlihat) |
| | `first_key_latency_ms` | Fokus kolom cari → ketikan pertama; `-1` bila tidak mengetik |
| | `keystrokes` | Jumlah tombol yang ditekan di kolom cari |
| | `misclicks` | Klik di area widget yang tidak memicu aksi |
| | `total_ms` | Sentuhan pertama dengan widget → matkul terpilih / kelas berhasil ditambahkan |
| | `attempts` | Jumlah klik "Simpan" di modal konfirmasi |
| | `fail_full` | Ditolak karena penuh + klik pada kelas penuh yang nonaktif |
| | `fail_conflict` | Ditolak karena bentrok + klik pada kelas bentrok yang nonaktif |
| | `wrong_pick` | Memilih matkul di luar paket (`course_picker`) |
| Kovariat | `order_pos`, `reserved_before`, `a_full_at_pick`, `got_a` | |
| Kualitas data | `hidden_ms`, `rtt_ms`, `cancelled`, `excluded`, `exclusion_reason` | Baru (8.3) |
| Validasi | `sus_score` | Skor SUS blok yang sama |

Definisi ini wajib disalin ke bagian metode laporan.

### 8.3 Aturan kualitas data
Data **tidak dihapus**, melainkan **ditandai** (`excluded` + `exclusion_reason`), sehingga alasan tiap eksklusi bisa dilaporkan:

| Alasan | Aturan (dikalibrasi setelah pilot) |
|---|---|
| `practice` | Interaksi pada sesi latihan |
| `tab_hidden` | `hidden_ms` > 3.000 ms |
| `idle` | Jeda tanpa event > 30.000 ms |
| `network` | `rtt_ms` > 2.000 ms |
| `cancelled` | Kelas dihapus dari KRS setelah diambil |
| `incomplete` | Interaksi terputus (refresh atau timeout) sebelum SEQ |

## 9. Kebutuhan non-fungsional

| ID | Kebutuhan |
|---|---|
| NF-01 | Menangani 20 klien serentak dengan respons tambah kelas < 300 ms |
| NF-02 | Tanpa instalasi di sisi peserta; browser desktop modern |
| NF-03 | Anonim: tidak ada nama, NIM, atau email; hanya kode peserta |
| NF-04 | Identitas visual netral (tanpa logo dan nama kampus); data mahasiswa di layar fiktif |
| NF-05 | Server dapat dijangkau semua peserta: laptop peneliti di jaringan lokal **atau** deploy online. Jaringan kampus wajib diuji dulu (client isolation, firewall) |
| NF-06 | Layar desktop minimal 1280 px; peserta wajib memakai mouse (dicatat) |
| NF-07 | Semua route API memvalidasi input dan menangani error |

## 10. Di luar cakupan
- Perbandingan beberapa versi desain widget.
- Integrasi dengan SIAKAD asli atau data mahasiswa asli.
- Versi mobile dan pelaksanaan remote.
- Pemodelan di dalam aplikasi (dilakukan terpisah, bagian 11).

## 11. Deliverable analisis (di luar aplikasi)
Folder `analysis/` (notebook Python):
1. Pembersihan data berdasarkan `excluded`, plus laporan jumlah dan alasan eksklusi.
2. Normalisasi fitur (z-score) dan encoding `widget_type` serta `condition`.
3. Model: Decision Tree Regressor (`max_depth=5`, `min_samples_leaf=10`) dengan pembanding Linear Regression, Random Forest, dan SVR.
4. Validasi: `GroupKFold` per `pid` dengan pengulangan; metrik MAE dan R² (H1, H6).
5. Gini importance per jenis widget (H2).
6. Wilcoxon signed-rank dengan effect size: antar widget (H3) dan santai vs war (H4).
7. Korelasi Spearman SEQ–SUS (H5).
8. Analisis tematik jawaban terbuka.

## 12. Kriteria siap ambil data
- [x] Simulasi 12 klien serentak (`npm run e2e`): kuota tidak terjual melebihi kapasitas, bentrok ditolak.
- [x] Setiap widget yang selesai menghasilkan satu baris `interactions` dengan `seq`.
- [x] Ronde santai (kuota privat) dan ronde war (kuota bersama) berjalan; diuji `npm run e2e`.
- [ ] Ronde war dimulai serentak dari admin.
- [ ] Satu sesi penuh selesai dalam ≤ 20–25 menit pada uji pilot.
- [ ] Refresh di tengah blok tidak menghilangkan data yang sudah dikonfirmasi.
- [ ] Semua jenis ekspor tersedia dan cocok dengan kamus data (8.2).
- [ ] Butir SUS sudah diganti versi tervalidasi beserta sitasinya.
- [ ] Jaringan lokasi sesi sudah diuji, atau aplikasi sudah dideploy online.
- [ ] Pilot dengan 3–5 orang selesai dan aturan eksklusi sudah dikalibrasi.

## 13. Progres dan rencana kerja

| Fase | Isi | Status |
|---|---|---|
| 0. Prototipe awal | Alur peserta, kuota atomik, tracker, SEQ, SUS, admin, ekspor CSV, test e2e | ✅ Selesai |
| 1. UI tiru SIAKAD | Kerangka halaman, W1 modal cari + grid, W2 kartu radio jadwal + modal konfirmasi, SEQ per widget, katalog baru | ✅ Selesai |
| 2. Kondisi | Ronde 1 santai / ronde 2 war ✅; mulai war serentak dari admin, batas waktu, lewati matkul, latihan | Sebagian |
| 3. Data | Kolom `condition`/`practice`, deteksi tab, RTT, log event, pencatatan pembatalan, ekspor lengkap | |
| 4. Pelengkap | Demografi, SUS tervalidasi, monitor admin, pengaturan kuota dari admin | |
| 5. Uji | Uji jaringan lokasi, pilot 3–5 orang, kalibrasi aturan eksklusi | |
| 6. Pengambilan data dan analisis | Sesi utama 15–20 peserta, notebook analisis | |

## 14. Risiko

| Risiko | Dampak | Mitigasi |
|---|---|---|
| SEQ timpang (kebanyakan skor tinggi) karena widget SIAKAD relatif mudah | Model sulit belajar (mengancam H1) | Kursi dibuat langka, ada kelas penuh sejak awal dan bentrok; pantau distribusi SEQ saat pilot |
| Perbedaan mouse dan touchpad | Fitur mouse tidak sebanding | Wajib mouse; catat perangkat input |
| Data antar peserta saling bergantung (perebutan kuota) | Asumsi independensi dilanggar | `GroupKFold` per pid; dilaporkan sebagai keterbatasan |
| Urutan kondisi tetap (santai → war) | Efek belajar bercampur dengan efek kondisi | Ada latihan sebelum blok santai; dilaporkan sebagai keterbatasan |
| Peserta buntu di blok war | Sesi macet | Tombol lewati + batas waktu |
| Jaringan kampus memblokir koneksi antar perangkat | Peserta tidak bisa mengakses server | Uji sebelum hari H; cadangan: deploy online atau router sendiri |
| Jumlah peserta yang hadir berbeda dari rencana | Kelangkaan terlalu ringan atau berat | Sisa kursi diatur dari admin pada hari H |

## 15. Pertanyaan terbuka
1. ~~Blok santai tetap dipakai?~~ **Diputuskan: ronde 1 santai, ronde 2 war.**
2. Batas waktu blok war: 5 menit cukup? Tentukan setelah pilot.
3. Sumber dan sitasi SUS versi Indonesia yang dipakai.
4. Lokasi sesi dan jaringannya: WiFi kampus, router sendiri, atau deploy online?
