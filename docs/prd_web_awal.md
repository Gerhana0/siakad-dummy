# KRS-Study: Web Simulasi War KRS & Akuisisi Micro-measures

**Product Requirements Document (PRD) & Spesifikasi Sistem**  
**Konteks Penelitian:** Prediksi Otomatis *Interaction Effort* pada Widget Pemilihan Kelas SIAKAD saat War KRS Menggunakan *Micro-measures* dan *Single Ease Question* (SEQ)  
**Versi:** 1.0  

---

## 1. Latar Belakang & Tujuan Produk

Pemilihan komponen antarmuka (*widget*) yang kurang sesuai konteks dapat menimbulkan beban kognitif dan fisik ekstra bagi pengguna yang disebut *interaction effort*. Pada skenario **War KRS** di SIAKAD, tekanan waktu dan perebutan kuota kelas membuat efektivitas desain *widget* pemilihan kelas menjadi faktor krusial terhadap pengalaman pengguna (*User Experience*).

Mengadaptasi pendekatan evaluasi berbasis *widget* oleh **Gardey et al. (2022)** yang memanfaatkan aplikasi replika (*dummy*) untuk menjamin keamanan data selama pengujian, aplikasi web **`krs-study`** dibangun dengan tujuan:

* Menyediakan lingkungan simulasi War KRS yang realistis dan terkontrol lengkap dengan mekanisme ketersediaan kuota kelas secara dinamis.
* Merekam log interaksi pengguna pada tingkat *widget* (*micro-measures*) secara otomatis dan non-intrusif di sisi klien.
* Mengumpulkan skor persepsi kemudahan tingkat tugas secara langsung melalui **Single Ease Question (SEQ)**, dilengkapi **System Usability Scale (SUS)** dan *feedback* kualitatif sebagai evaluasi tingkat sesi.
* Menyediakan panel administrasi bagi peneliti untuk mengekspor dataset mentah hasil eksperimen agar siap diolah secara terpisah.

---

## 2. Ruang Lingkup (*Scope*)

| Kategori | Cakupan |
| :--- | :--- |
| **In-Scope (Termasuk)** | • Halaman registrasi partisipan dan manajemen tahapan eksperimen.<br>• Simulasi War KRS per ronde dengan katalog mata kuliah dan manajemen slot/kuota kelas (*reserve* & *release*).<br>• Pelacakan *micro-measures* otomatis (*built-in tracker*) pada widget pemilihan kelas.<br>• Modal penilaian SEQ pasca-interaksi, formulir SUS, dan formulir *feedback* akhir.<br>• Halaman Admin (`/admin`) untuk ekspor dataset dan reset basis data pengujian. |
| **Out-of-Scope (Di Luar Cakupan)** | • Pembersihan data (*data cleaning*), penanganan *outlier*, dan *under-sampling* dataset.<br>• Pelatihan, validasi silang (*cross-validation*), dan evaluasi model regresi *machine learning*.<br>• Visualisasi grafik hasil analisis statistik dan *Gini importance* (dilakukan secara *offline* menggunakan Python). |

---

## 3. Pengguna Target (*User Personas*)

* **Partisipan (Mahasiswa / Penguji):** Pengguna yang menjalankan skenario simulasi pemilihan kelas (War KRS), memberikan skor kemudahan (SEQ) setelah menyelesaikan ronde/interaksi, serta mengisi kuesioner SUS dan masukan di akhir sesi.
* **Peneliti (Admin):** Pengelola eksperimen yang memantau kesiapan sistem, mengekspor seluruh rekaman data interaksi dan kuesioner untuk diolah di luar website, serta melakukan reset data pengujian bila diperlukan.

---

## 4. Alur Pengguna (*User Flow*)

### A. Alur Partisipan (`/`)
1. **Onboarding & Registrasi:** Partisipan membuka halaman utama (`page.tsx`) dan mendaftarkan sesi partisipannya melalui sistem (`/api/participant`).
2. **Transisi Tahap (*Stage Management*):** Sistem mengatur dan menyimpan progres tahapan eksperimen partisipan secara berurutan (`/api/stage`).
3. **Eksekusi Ronde War KRS:** Partisipan masuk ke halaman simulasi (`Round.tsx`) dan memilih kelas menggunakan widget pemilihan kelas (`ClassPicker.tsx`) berdasarkan katalog mata kuliah (`catalog.ts`). Selama proses ini:
   * Sistem memperbarui status ketersediaan kursi secara dinamis (`/api/slots`, `/api/reserve`, `/api/release`).
   * Pelacak interaksi (`useTracker.ts`) berjalan otomatis di latar belakang untuk menghitung *micro-measures* dan mengirimkannya ke server (`/api/interaction`).
4. **Penilaian SEQ:** Segera setelah interaksi/ronde selesai, modal SEQ (`SeqModal.tsx`) tampil untuk meminta penilaian subjektif tingkat kemudahan.
5. **Kuesioner Akhir:** Setelah seluruh ronde selesai, partisipan mengisi kuesioner SUS (`SusForm.tsx`, `/api/sus`) sebagai evaluasi *usability* keseluruhan sesi dan memberikan masukan tertulis (`/api/feedback`).
6. **Selesai:** Sesi partisipan ditandai selesai dan seluruh data tersimpan di basis data.

### B. Alur Peneliti / Admin (`/admin`)
1. Peneliti mengakses halaman `/admin` (`admin/page.tsx`).
2. Peneliti mengunduh seluruh dataset eksperimen melalui fitur ekspor (`/api/admin/export`).
3. Jika diperlukan untuk persiapan sesi uji baru, peneliti dapat menghapus data uji coba melalui fitur reset (`/api/admin/reset`).

---

## 5. Kebutuhan Fungsional (*Functional Requirements*)

### `FR-01` Manajemen Partisipan & Progres Tahapan
* Sistem harus mampu membuat dan menyimpan identitas sesi partisipan baru secara unik (`/api/participant`).
* Sistem harus melacak dan memperbarui tahapan (*stage*) eksperimen yang sedang dijalani partisipan agar alur pengujian berjalan seragam tanpa memerlukan moderator (`/api/stage`).

### `FR-02` Simulasi War KRS & Widget Pemilihan Kelas
* Sistem harus menyediakan katalog mata kuliah dan daftar kelas yang terstruktur (`catalog.ts`) untuk ditampilkan pada setiap ronde simulasi (`Round.tsx`).
* Sistem harus merender widget pemilihan kelas (`ClassPicker.tsx`) sebagai objek utama pengukuran *interaction effort*.
* Sistem harus menyediakan mekanisme manajemen kursi (*slots*), mencakup pembacaan status kuota (`/api/slots`), pengambilan kelas (`/api/reserve`), dan pelepasan kelas (`/api/release`) untuk mereplikasi dinamika perebutan kuota saat War KRS.

### `FR-03` Perekaman *Micro-measures* Otomatis
* Sistem harus menanamkan mekanisme perekaman *event* DOM secara langsung (`useTracker.ts`) pada area *widget* dan sekitarnya (*bounding box* + *padding*) tanpa mengharuskan partisipan memasang ekstensi *browser* terpisah.
* Sistem harus menangkap *micro-measures* yang relevan dengan karakteristik widget pemilihan (mengacu pada Gardey et al., 2022):
  * **Metrik Umum (*Shared*):** *Dwell+Hover Time* (waktu diam + pergerakan kursor di area widget), *Mouse Trace Length* (panjang lintasan kursor di sekitar widget), serta *Interactions* (jumlah kunjungan/fokus valid pada widget).
  * **Metrik Spesifik Widget Pemilihan:** *Options Display Time* (durasi daftar pilihan terbuka) dan *Options Selected* (jumlah perubahan pilihan) untuk elemen *select*, atau *Hover to First Selection*, *Selections*, dan *Misclicks* untuk elemen berbasis *radio/button/link*.
* Setiap log interaksi widget yang selesai direkam harus dikirim dan disimpan otomatis ke basis data melalui `/api/interaction`.

### `FR-04` Pengumpulan Penilaian SEQ, SUS, dan *Feedback*
* **SEQ:** Menampilkan `SeqModal.tsx` segera setelah interaksi/ronde berakhir sebagai label *ground truth* tingkat kemudahan per tugas.
* **SUS:** Menampilkan `SusForm.tsx` di akhir sesi dan menyediakan utilitas kalkulasi skor SUS (`sus.ts`) serta menyimpannya via `/api/sus` sebagai evaluasi *usability* tingkat makro.
* **Feedback:** Menyediakan formulir masukan bebas untuk menangkap kendala atau persepsi kualitatif partisipan dan menyimpannya melalui `/api/feedback`.

### `FR-05` Panel Administrasi & Ekspor Data
* Menyediakan halaman `/admin` (`admin/page.tsx`) yang terpisah dari antarmuka partisipan.
* Menyediakan endpoint ekspor (`/api/admin/export`) yang menghasilkan file data terstruktur (siap dibuka di Excel maupun Python) berisi relasi data partisipan, *micro-measures* interaksi, skor SEQ, SUS, dan *feedback*.
* Menyediakan endpoint reset (`/api/admin/reset`) untuk membersihkan data simulasi/pengujian dengan aman.

---

## 6. Arsitektur Teknis & Daftar Endpoint API

Aplikasi dikembangkan dengan arsitektur *full-stack* **Next.js (App Router)** dan **TypeScript**, didukung konfigurasi **Docker** (`docker-compose.yml`), manajemen skema basis data (`schema.ts`, `db.ts`), serta skrip pengujian otomatis *end-to-end* (`scripts/e2e.ts`).

| Endpoint API | Komponen / Peran Utama | Fungsi |
| :--- | :--- | :--- |
| `/api/participant` | Registrasi Partisipan | Membuat atau mengambil data sesi partisipan. |
| `/api/stage` | Kontrol Alur | Membaca dan memperbarui tahapan eksperimen saat ini. |
| `/api/slots` | Simulasi Kuota | Mengambil status ketersediaan kursi kelas. |
| `/api/reserve` | Simulasi Kuota | Memproses pengambilan/reservasi kelas oleh partisipan. |
| `/api/release` | Simulasi Kuota | Melepaskan kursi kelas yang dibatalkan atau diganti. |
| `/api/interaction` | `useTracker.ts` | Menyimpan log *micro-measures* dan data interaksi per widget. |
| `/api/sus` | `SusForm.tsx` | Menyimpan jawaban dan skor kuesioner SUS. |
| `/api/feedback` | Formulir Akhir | Menyimpan komentar/masukan kualitatif partisipan. |
| `/api/admin/export` | `admin/page.tsx` | Mengekspor seluruh dataset hasil eksperimen. |
| `/api/admin/reset` | `admin/page.tsx` | Mereset data eksperimen dan kuota simulasi. |

---

## 7. Kebutuhan Non-Fungsional (*Non-Functional Requirements*)

* **Performa & Non-Intrusif:** Perekaman *event* mouse/keyboard pada `useTracker.ts` berjalan ringan di latar belakang tanpa menyebabkan *lag* selama simulasi berlangsung.
* **Validitas Internal & Konsistensi:** Protokol pengujian di dalam aplikasi berjalan seragam bagi seluruh partisipan tanpa intervensi moderator.
* **Privasi & Keamanan Simulasi:** Aplikasi bersifat *dummy*/simulasi sehingga tidak terhubung ke sistem SIAKAD produksi dan tidak memproses data sensitif mahasiswa.
* **Integritas Data & Konkurensi:** Endpoint `/api/reserve` dan `/api/release` menjaga konsistensi kuota agar tidak terjadi *race condition* atau jumlah kursi negatif saat simulasi berjalan.
* **Kemudahan Pengujian:** Mendukung verifikasi otomatis alur sistem melalui skrip pengujian *end-to-end* (`scripts/e2e.ts`) sebelum eksperimen dibuka ke partisipan.

---

## 8. Kriteria Keberhasilan (*Acceptance Criteria*)

1. Partisipan dapat menyelesaikan seluruh rangkaian alur dari registrasi, simulasi ronde War KRS, pengisian SEQ, hingga kuesioner SUS & *feedback* tanpa galat (*error*).
2. Seluruh interaksi pada `ClassPicker.tsx` terekam otomatis oleh `useTracker.ts` dan tersimpan di basis data dengan relasi yang akurat terhadap ID partisipan, ronde, dan skor SEQ.
3. Endpoint `/api/admin/export` berhasil mengunduh dataset lengkap dalam format terstruktur yang siap diolah pada tahap analisis data berikutnya.
4. Pengujian otomatis melalui `scripts/e2e.ts` lulus sepenuhnya untuk memastikan stabilitas seluruh endpoint API dan alur antarmuka.