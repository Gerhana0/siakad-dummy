# PRD: Simulasi War KRS (SIAKAD Dummy) untuk Penelitian Interaction Effort

| | |
|---|---|
| **Proyek** | Proyek IMK, Kelompok 7 |
| **Judul penelitian** | Prediksi Otomatis Interaction Effort pada Widget Pemilihan Kelas SIAKAD Menggunakan Micro-measures dan Single Ease Question (SEQ) |
| **Dokumen acuan** | `docs/Proyek IMK.pdf` (proposal) |
| **Status** | Draf v1, 22 November 2026 |
| **Repo** | `siakad-dummy` (Next.js 16 + PostgreSQL) |

---

## 1. Ringkasan

Aplikasi web yang meniru alur pengisian KRS SIAKAD dan dipakai sebagai **instrumen eksperimen**. Peserta berada di **satu ruangan dan mulai pada waktu yang sama**, lalu memperebutkan kuota kelas yang terbatas (**siapa cepat dia dapat**), persis seperti war KRS sungguhan. Selama peserta mengisi, aplikasi merekam *micro-measures* dari event DOM pada tiap widget. Setiap widget yang selesai diisi diikuti pertanyaan **SEQ** (1–7) sebagai *ground truth* interaction effort. **SUS** diberikan per pasangan versi widget sebagai bukti validitas kriteria.

Data yang dihasilkan dipakai untuk:
1. melatih model (Decision Tree dan pembanding) yang memprediksi SEQ dari micro-measures, dan
2. membandingkan effort antar desain widget serta antara kondisi santai dan war.

## 2. Latar belakang dan revisi terhadap proposal

Proposal awal merancang eksperimen **remote** dengan tekanan waktu buatan (countdown dan kuota yang habis terjadwal). Desain itu direvisi:

| Aspek | Proposal awal | Revisi (PRD ini) | Alasan |
|---|---|---|---|
| Pelaksanaan | Remote lewat tautan | **Sesi lab serentak**: satu ruangan, satu waktu, satu WiFi | Memungkinkan perebutan kuota nyata |
| Sumber tekanan | Countdown dan kuota habis terjadwal | **Perebutan kuota nyata antar peserta** | Lebih mirip war KRS asli; tekanan muncul alami |
| Faktor kondisi | Santai vs time-pressure | **Santai vs war** | H4 tetap bisa diuji |
| Urutan kondisi | Latin square penuh | Urutan kondisi tetap (santai → war); urutan widget di-counterbalance (4 urutan) | Blok war harus serentak untuk semua orang |
| Widget pilih jadwal | Radio panjang vs ringkas | **Tetap ada**, menjadi langkah ke-2 di setiap matkul | Sesuai alur SIAKAD: cari matkul → pilih kelas paralel |

Perubahan ini harus ikut tercatat di revisi proposal (bagian metode dan validitas).

## 3. Tujuan, RQ, dan hipotesis → kebutuhan data

| ID | Pertanyaan penelitian | Hipotesis | Data yang dibutuhkan dari aplikasi |
|---|---|---|---|
| H1 | Seberapa akurat Decision Tree memprediksi SEQ dari micro-measures? | MAE ≤ 0,5 dan R² ≥ 0,5 | Baris interaksi: fitur micro-measures + `seq` + `pid` |
| H2 | Metrik apa yang punya Gini importance tertinggi di tiap jenis widget? | Dwell+Hover dan Selections dominan; Misclicks paling rendah | Sama seperti H1, ditambah `widget_type` dan `widget_version` |
| H3 | Apakah effort berbeda antara dropdown dan searchable input (serta radio panjang vs ringkas)? | Dropdown panjang punya effort lebih tinggi | `widget_version`, `seq`, metrik, desain within-subject |
| H4 | Apakah kondisi war mengubah micro-measures dan SEQ? | War menaikkan Dwell+Hover dan Selections serta menurunkan SEQ | `condition` (santai/war); analisis tambahan: `a_full_at_pick`, `fail_full` |
| H5 | Apakah SEQ berkorelasi dengan SUS? | Spearman ρ ≥ 0,5 | Rata-rata SEQ per blok dan skor SUS pasangan widget |
| H6 | Apakah Decision Tree kompetitif dibanding model lain? | DT ≥ LR dan sebanding dengan RF | Sama seperti H1 |

## 4. Pengguna

| Peran | Kebutuhan utama |
|---|---|
| **Peserta** (15–20 mahasiswa aktif yang pernah mengisi KRS) | Alur jelas, tidak perlu instalasi, tugas yang terasa seperti KRS asli, durasi sekitar 20–25 menit |
| **Peneliti** (operator sesi) | Menyiapkan sesi, mengatur kuota sesuai jumlah peserta, memberi aba-aba mulai secara serentak, memantau progres, mengunduh data lengkap |
| **Analis data** (tim) | CSV yang bersih, terdokumentasi, dan lengkap (termasuk log mentah dan alasan eksklusi) |

## 5. Desain eksperimen

### 5.1 Faktor
- **Widget pilih mata kuliah (W1):** `dropdown` (30–50 opsi) vs `search` (searchable input dengan autocomplete)
- **Widget pilih kelas paralel (W2):** `radio_long` vs `radio_short`
- **Kondisi:** `santai` vs `war`

Semua faktor diuji **within-subject**. Unit analisis adalah **satu interaksi pada satu widget**.

### 5.2 Struktur sesi

| Langkah | Isi | Perkiraan waktu |
|---|---|---|
| 0 | Persetujuan (informed consent) + kode peserta | 1 menit |
| 1 | Demografi singkat | 1 menit |
| 2 | **Blok 1 (Santai)**, pasangan widget P1, 4 matkul | 3–4 menit |
| 3 | **Blok 2 (War, serentak)**, pasangan widget P1, 4 matkul | 3–4 menit |
| 4 | SUS untuk pasangan P1 | 2 menit |
| 5 | **Blok 3 (Santai)**, pasangan widget P2, 4 matkul | 3–4 menit |
| 6 | **Blok 4 (War, serentak)**, pasangan widget P2, 4 matkul | 3–4 menit |
| 7 | SUS untuk pasangan P2 | 2 menit |
| 8 | Pertanyaan akhir (preferensi + terbuka) | 2 menit |
| | **Total** | **sekitar 20–25 menit** |

Blok 1 sekaligus berfungsi sebagai latihan alur dan SEQ.

### 5.3 Counterbalancing (4 urutan)

Grup ditentukan dari angka di kode peserta: `grup = ((n − 1) mod 4) + 1`. Contoh: P01 → 1, P02 → 2, P05 → 1.

| Grup | Pasangan P1 (blok 1–2) | Pasangan P2 (blok 3–4) |
|---|---|---|
| 1 | dropdown + radio_long | search + radio_short |
| 2 | search + radio_short | dropdown + radio_long |
| 3 | dropdown + radio_short | search + radio_long |
| 4 | search + radio_long | dropdown + radio_short |

Dengan pola ini, setiap peserta mencoba keempat versi widget, dan W1 tidak selalu berpasangan dengan versi W2 yang sama.

### 5.4 Kondisi

| | Santai | War |
|---|---|---|
| Waktu mulai | Masing-masing peserta | **Serentak**, dipicu peneliti dari panel admin |
| Kuota | **Privat per peserta** (tidak terpengaruh peserta lain) | **Dibagi semua peserta**, dikurangi secara atomik di server |
| Kelas penuh dan bentrok | Ada (pola sama dengan war) | Ada, ditambah kursi yang habis karena peserta lain |
| Batas waktu | Tidak ada (hanya batas aman, misalnya 10 menit) | Ada, dapat diatur (bawaan 5 menit), **tidak ditampilkan** ke peserta |
| Tujuan | Baseline effort tanpa persaingan | Replikasi war KRS |

Beda santai dan war hanya pada **persaingan**. Struktur katalog dan tingkat kesulitannya dibuat setara.

### 5.5 Estimasi data
15 peserta × 4 blok × 4 matkul × 2 widget = **sekitar 480 interaksi** (proposal: 240+).

## 6. Alur peserta per matkul

```
Daftar matkul target blok ini (4 matkul)
        │
        ▼
[W1] Pilih mata kuliah  ── dropdown (30–50 opsi) / search
        │  konfirmasi "Lanjut" (matkul bukan target → pesan, dihitung wrong_pick)
        ▼
   SEQ #1  "Seberapa mudah menyelesaikan langkah ini?" (1–7)
        │
        ▼
[W2] Pilih kelas paralel ── radio_long / radio_short (kelas A–F)
        │  "Ambil kelas" → server: berhasil / penuh / bentrok
        │  gagal → tetap di W2, pilih kelas lain (dihitung attempts, fail_*)
        ▼
   SEQ #2
        │
        ▼
KRS diperbarui → matkul berikutnya (urutan bebas)
```

- Target: **usahakan kelas A** untuk semua matkul.
- Peserta boleh **membatalkan** kelas yang sudah diambil untuk menyelesaikan bentrok. Pembatalan dicatat.
- Jika suatu matkul tidak mungkin diselesaikan, tersedia tombol **"Lewati matkul ini"**. Kejadian ini dicatat.
- Blok selesai jika semua matkul target sudah diambil atau dilewati, atau batas waktu habis.

## 7. Kebutuhan fungsional

Status: **Ada** = sudah diimplementasikan · **Ubah** = ada tapi perlu diubah · **Baru** = belum ada.
Prioritas: **P0** wajib sebelum pengambilan data · **P1** sangat disarankan · **P2** opsional.

### 7.1 Onboarding

| ID | Kebutuhan | Status | Prioritas |
|---|---|---|---|
| F-01 | Halaman persetujuan: tujuan, data yang direkam, sukarela, anonim | Ada | P0 |
| F-02 | Input kode peserta (P01, P02, …), menentukan grup counterbalancing (5.3) | Ubah (saat ini 2 grup) | P0 |
| F-03 | Form demografi: angkatan, prodi, frekuensi memakai SIAKAD, **perangkat input (mouse/touchpad)** | Baru | P0 |
| F-04 | Cegah satu kode dipakai di dua perangkat bersamaan (token sesi) | Baru | P1 |
| F-05 | Lanjutkan sesi setelah refresh tanpa kehilangan tahap (stage disimpan di server) | Ada | P0 |

### 7.2 Katalog

| ID | Kebutuhan | Status | Prioritas |
|---|---|---|---|
| F-10 | Katalog 30–50 mata kuliah fiktif (opsi W1), masing-masing dengan kelas paralel A–F | Ubah (saat ini 7 matkul) | P0 |
| F-11 | Data kelas: kode kelas, dosen, hari/jam, ruang, kuota | Ubah (belum ada dosen dan ruang) | P0 |
| F-12 | **4 set katalog/target** (satu per blok), dibangkitkan dari seed, dengan tingkat kesulitan setara (jumlah kelas A penuh sejak awal, pasangan bentrok, maksimal kelas A yang bisa diperoleh) | Ubah (saat ini 2 set) | P0 |
| F-13 | Script pencari seed dengan kriteria kesulitan setara | Ubah (`scripts/find-seeds.ts`) | P1 |

### 7.3 Widget W1: pilih mata kuliah

| ID | Kebutuhan | Status | Prioritas |
|---|---|---|---|
| F-20 | `dropdown`: daftar panjang 30–50 opsi, dibuka dengan klik | Ubah | P0 |
| F-21 | `search`: input teks dengan autocomplete (daftar muncul setelah mulai mengetik) | Ubah (saat ini daftar muncul saat fokus) | P0 |
| F-22 | Dukungan keyboard: panah atas/bawah, Enter, Esc; daftar tertutup bila klik di luar | Baru | P1 |
| F-23 | Memilih matkul yang bukan target menampilkan pesan dan dicatat (`wrong_pick`) | Baru | P1 |

### 7.4 Widget W2: pilih kelas paralel

| ID | Kebutuhan | Status | Prioritas |
|---|---|---|---|
| F-30 | `radio_long`: tiap opsi memuat kelas, dosen, hari/jam, ruang, sisa kuota, dan teks peringatan bentrok yang panjang | Baru | P0 |
| F-31 | `radio_short`: tiap opsi memuat kelas, jadwal ringkas, sisa kuota, penanda bentrok singkat | Baru | P0 |
| F-32 | Sisa kuota diperbarui berkala (polling ≤ 3 detik) | Ada (di widget lama) | P0 |
| F-33 | Tombol "Ambil kelas" → server memvalidasi: penuh / bentrok / sudah diambil | Ada | P0 |

### 7.5 Mekanisme war dan santai

| ID | Kebutuhan | Status | Prioritas |
|---|---|---|---|
| F-40 | Pengurangan kuota atomik di database (aman terhadap request serentak) | Ada | P0 |
| F-41 | Mode santai: kuota privat per peserta, tidak terpengaruh peserta lain | Baru | P0 |
| F-42 | **Ruang tunggu blok war**: peserta menunggu sampai peneliti menekan "Mulai" di admin, lalu semua klien mulai bersamaan | Baru (saat ini peserta menekan sendiri) | P0 |
| F-43 | Batas waktu blok war (dapat diatur, tidak ditampilkan); saat habis, blok berakhir dan sisa matkul dicatat `timeout` | Baru | P0 |
| F-44 | Tombol "Lewati matkul ini" + pencatatan | Baru | P0 |
| F-45 | Pembatalan kelas dicatat sebagai event; interaksi terkait diberi tanda `cancelled` | Ubah (saat ini tidak tercatat) | P0 |
| F-46 | Kuota kelas dapat diatur dari admin sesuai jumlah peserta yang hadir (misalnya kelas A untuk sekitar 30% peserta; total kursi per matkul ≥ jumlah peserta + cadangan) | Baru (saat ini tetap 5) | P0 |

### 7.6 SEQ, SUS, dan pertanyaan akhir

| ID | Kebutuhan | Status | Prioritas |
|---|---|---|---|
| F-50 | Pop-up SEQ 1–7 muncul otomatis setelah W1 dikonfirmasi dan setelah W2 berhasil. Teks: "Seberapa mudah menyelesaikan langkah ini?" | Ubah (saat ini hanya setelah kelas diambil, teks berbeda) | P0 |
| F-51 | SUS 10 butir **versi Indonesia tervalidasi** (kandidat: adaptasi Sharfina & Santoso, 2016; cek dan sitasi), satu kali per pasangan widget | Ubah (masih terjemahan sementara) | P0 |
| F-52 | Pertanyaan akhir: preferensi widget W1, preferensi W2, bagian yang paling merepotkan (terbuka) | Ubah (saat ini hanya W1) | P1 |

### 7.7 Pencatatan data (tracker)

| ID | Kebutuhan | Status | Prioritas |
|---|---|---|---|
| F-60 | Ringkasan micro-measures per interaksi (lihat 8.2) | Ada (W1 lama) | P0 |
| F-61 | **Log event mentah**: setiap event DOM penting dengan timestamp klien, timestamp server, ID widget, dan ID interaksi | Baru | P0 |
| F-62 | Deteksi tab ditinggal (`visibilitychange`) dan total waktu tersembunyi per interaksi | Baru | P0 |
| F-63 | Catat latensi jaringan (RTT request ambil kelas) | Baru | P1 |
| F-64 | Semua pengiriman data dicek berhasil; bila gagal → coba ulang otomatis, lalu tampilkan pesan. Data tidak boleh hilang diam-diam | Ubah (saat ini error diabaikan) | P0 |
| F-65 | Antrean lokal: data yang belum terkirim disimpan sementara di browser dan dikirim ulang | Baru | P1 |

### 7.8 Panel peneliti (`/admin`)

| ID | Kebutuhan | Status | Prioritas |
|---|---|---|---|
| F-70 | Login dengan token admin | Ada | P0 |
| F-71 | Reset kuota / hapus semua data | Ada | P0 |
| F-72 | Pengaturan sesi: jumlah peserta, rasio kuota kelas A, batas waktu war | Baru | P0 |
| F-73 | Tombol "Mulai blok war 1" / "Mulai blok war 2" (memicu F-42) | Baru | P0 |
| F-74 | Monitor peserta: kode, grup, tahap saat ini, jumlah matkul selesai, status online | Baru | P1 |
| F-75 | Ekspor CSV: `interactions`, `events`, `sus` (per butir), `participants` (+ demografi), `feedback` | Ubah (saat ini hanya interactions) | P0 |

## 8. Kebutuhan data

### 8.1 Entitas

| Tabel | Isi |
|---|---|
| `participants` | pid, grup, tahap, demografi, perangkat input, waktu dibuat |
| `class_slots` | kuota dan jumlah terisi per kelas per katalog (war); santai disimpan per peserta |
| `reservations` | kelas yang diambil, status aktif/dibatalkan |
| `interactions` | satu baris per interaksi widget (lihat 8.2) |
| `events` | log event mentah (F-61) |
| `sus_responses` | jawaban per butir + skor, per pasangan widget |
| `feedback` | preferensi + jawaban terbuka |
| `session_config` | kuota, batas waktu, status mulai blok war |

### 8.2 Kolom `interactions` (CSV utama)

| Kelompok | Kolom | Definisi |
|---|---|---|
| Identitas | `pid`, `group`, `block` (1–4), `condition` (santai/war), `course_code`, `class_code` | |
| Widget | `widget_type` (course_picker/class_picker), `widget_version` (dropdown/search/radio_long/radio_short) | |
| **Target** | `seq` | 1–7 |
| Fitur | `dwell_hover_ms` | Total waktu kursor di atas area widget |
| | `mouse_trace_len` | Panjang lintasan kursor di area widget (px) |
| | `selections` | Jumlah pilihan dibuat atau diganti |
| | `options_display_ms` | Lama daftar opsi terbuka (W1 saja; radio = selalu terlihat → kosong) |
| | `first_key_latency_ms` | Fokus input → ketikan pertama (search saja) |
| | `keystrokes` | Jumlah ketikan karakter dan hapus (search saja) |
| | `misclicks` | Klik di area widget yang tidak memicu aksi |
| | `total_ms` | Fokus/interaksi pertama dengan widget → pilihan dikonfirmasi atau berhasil |
| | `attempts`, `fail_full`, `fail_conflict`, `wrong_pick` | Percobaan dan kegagalan dalam interaksi ini |
| Kovariat | `order_pos`, `a_full_at_pick`, `got_a`, `input_device` | |
| Kualitas data | `hidden_ms`, `max_idle_ms`, `rtt_ms`, `cancelled`, `excluded`, `exclusion_reason` | Lihat 8.3 |
| Validasi | `sus_score` | Skor SUS pasangan widget pada blok tersebut |

Definisi metrik di atas wajib disalin ke README dan ke bagian metode laporan.

### 8.3 Aturan kualitas data
Data **tidak dihapus**, melainkan **ditandai** (`excluded` + `exclusion_reason`), sehingga alasan tiap eksklusi bisa dilaporkan:

| Alasan | Aturan (bisa disesuaikan setelah pilot) |
|---|---|
| `tab_hidden` | `hidden_ms` > 3.000 ms |
| `idle` | Jeda tanpa event > 30.000 ms |
| `network` | `rtt_ms` > 2.000 ms pada request ambil kelas |
| `cancelled` | Kelas dibatalkan setelah diambil |
| `incomplete` | Interaksi terputus (refresh atau timeout) sebelum SEQ |

## 9. Kebutuhan non-fungsional

| ID | Kebutuhan |
|---|---|
| NF-01 | Menangani 20 klien serentak di jaringan lokal dengan respons ambil kelas < 300 ms |
| NF-02 | Tidak ada instalasi di sisi peserta; cukup browser desktop modern |
| NF-03 | Anonim: tidak ada nama, NIM, atau email; hanya kode peserta |
| NF-04 | Server dijalankan di laptop peneliti (`npm start -- -H 0.0.0.0`) dengan PostgreSQL via Docker |
| NF-05 | Tampilan desktop minimal 1280 px; peserta wajib memakai mouse (dicatat di demografi) |
| NF-06 | Aksesibilitas dasar: label terhubung ke input, navigasi keyboard di widget, kontras cukup |
| NF-07 | Semua route API memvalidasi input dan menangani error (tanpa error 500 yang tidak tertangkap) |

## 10. Di luar cakupan
- Integrasi dengan SIAKAD UNS asli atau data mahasiswa asli.
- Versi mobile.
- Pelaksanaan remote.
- Wawancara (bila dilakukan, dijalankan di luar aplikasi).
- Pemodelan di dalam aplikasi; analisis dilakukan terpisah (lihat 11).

## 11. Deliverable analisis (di luar aplikasi)
Folder `analysis/` (notebook Python):
1. Pembersihan data berdasarkan `excluded`, plus laporan jumlah dan alasan eksklusi.
2. Normalisasi fitur (z-score) dan encoding fitur kategori.
3. Model: Decision Tree Regressor (`max_depth=5`, `min_samples_leaf=10`) dengan pembanding Linear Regression, Random Forest, dan SVR.
4. Validasi: `GroupKFold` per `pid` dengan pengulangan; metrik MAE dan R² (H1, H6).
5. Gini importance per jenis widget (H2).
6. Wilcoxon signed-rank atau ANOVA repeated-measures dengan effect size (H3, H4).
7. Korelasi Spearman SEQ–SUS (H5).
8. Analisis tematik jawaban terbuka.

## 12. Kriteria penerimaan (siap ambil data)
- [ ] Simulasi 20 klien serentak (script e2e): tidak ada kuota terjual melebihi kapasitas, dan tidak ada error 500.
- [ ] Satu sesi penuh dapat diselesaikan dalam ≤ 25 menit pada uji pilot.
- [ ] Setiap interaksi yang selesai menghasilkan satu baris `interactions` dengan `seq` dan event mentahnya.
- [ ] Refresh di tengah blok tidak menghilangkan data yang sudah dikonfirmasi.
- [ ] Kelima jenis CSV dapat diunduh dan cocok dengan kamus data (8.2).
- [ ] Butir SUS sudah diganti versi tervalidasi beserta sitasinya.
- [ ] Pilot dengan 3–5 orang selesai dan aturan eksklusi sudah dikalibrasi.

## 13. Rencana kerja

| Fase | Isi | Kebutuhan |
|---|---|---|
| 1. Fondasi | Struktur blok, kondisi santai/war, 4 grup counterbalancing, perluasan katalog, pengaturan sesi di admin | F-02, F-10–F-12, F-41, F-46, F-72 |
| 2. Widget | W1 dropdown/search baru, W2 radio panjang/ringkas, SEQ per widget | F-20–F-23, F-30–F-33, F-50 |
| 3. War | Ruang tunggu dan mulai serentak, batas waktu, lewati, pembatalan tercatat | F-42–F-45, F-73 |
| 4. Data | Log event mentah, deteksi tab, RTT, pengiriman andal, ekspor lengkap | F-61–F-65, F-75 |
| 5. Pelengkap | Demografi, SUS tervalidasi, pertanyaan akhir, monitor admin, polesan UI dan aksesibilitas | F-03, F-04, F-51, F-52, F-74, NF-06 |
| 6. Uji | Test e2e serentak, pilot 3–5 orang, kalibrasi aturan eksklusi | Bagian 12 |
| 7. Pengambilan data dan analisis | Sesi utama 15–20 peserta, notebook analisis | Bagian 11 |

## 14. Risiko

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Perbedaan mouse dan touchpad | Fitur mouse tidak sebanding | Wajib mouse; catat `input_device` |
| Data antar peserta saling bergantung (perebutan kuota) | Asumsi independensi dilanggar | `GroupKFold` per pid; dilaporkan sebagai keterbatasan |
| Urutan kondisi tetap (santai → war) | Efek belajar bercampur dengan efek kondisi | Blok santai sebagai latihan; dilaporkan sebagai keterbatasan |
| SEQ 32 kali per sesi | Kelelahan, jawaban asal | SEQ satu klik; pantau distribusi; uji pilot |
| Peserta buntu di blok war | Sesi macet | Tombol lewati + batas waktu |
| WiFi tidak stabil | Ketidakadilan dalam perebutan | Satu jaringan lokal, catat RTT, flag `network` |
| Jumlah peserta yang hadir berbeda dari rencana | Kelangkaan terlalu ringan atau terlalu berat | Kuota diatur dari admin pada hari H |
| Waktu pengerjaan tidak cukup | Fitur tidak selesai | Fallback: radio satu versi saja (perbandingan W2 menjadi keterbatasan) |

## 15. Pertanyaan terbuka
1. Batas waktu blok war: 5 menit cukup? Tentukan setelah pilot.
2. SUS cukup 2 kali (per pasangan widget) atau 4 kali (per versi widget)? 4 kali menambah sekitar 3 menit.
3. Apakah pemilihan W1 juga ikut dihitung sebagai bagian dari "siapa cepat" (kursi baru dipesan di W2)? Saat ini: ya, kursi hanya dipesan di W2.
4. Sumber dan sitasi SUS versi Indonesia yang dipakai.
