// Katalog mata kuliah fiktif untuk simulasi KRS (meniru alur SIAKAD).
// Dibangkitkan secara deterministik dari seed, jadi server dan browser selalu sama.

export type Course = { code: string; name: string; sks: number };
export type Cls = {
  key: string;
  course: string;
  code: string; // A1, A2, B1, B2
  day: number; // indeks DAYS
  slot: number; // indeks SESSIONS
  quota: number;
  initialTaken: number;
};

/** Semua mata kuliah yang tampil di modal "Pilih mata kuliah". */
export const POOL: Course[] = [
  { code: "23013110201", name: "Pendidikan Agama", sks: 2 },
  { code: "23013110202", name: "Pendidikan Pancasila", sks: 2 },
  { code: "23013110204", name: "Bahasa Indonesia", sks: 2 },
  { code: "23013110205", name: "Bahasa Inggris", sks: 2 },
  { code: "23013110211", name: "Kalkulus I", sks: 3 },
  { code: "23013110212", name: "Fisika Dasar", sks: 3 },
  { code: "23013110213", name: "Logika Informatika", sks: 3 },
  { code: "23013110214", name: "Algoritma & Pemrograman", sks: 3 },
  { code: "23013120150", name: "Olahraga", sks: 1 },
  { code: "23013120203", name: "Kewirausahaan", sks: 2 },
  { code: "23013120206", name: "Pendidikan Kewarganegaraan", sks: 2 },
  { code: "23013120218", name: "Matematika Diskrit", sks: 3 },
  { code: "23013120221", name: "Kalkulus II", sks: 3 },
  { code: "23013120222", name: "Struktur Data", sks: 3 },
  { code: "23013120231", name: "Interaksi Manusia & Komputer", sks: 2 },
  { code: "23013120236", name: "Etika Profesi", sks: 2 },
  { code: "23013120307", name: "Sistem Digital", sks: 3 },
  { code: "23013120311", name: "Statistika & Probabilitas", sks: 3 },
  { code: "23013120312", name: "Aljabar Linear", sks: 3 },
  { code: "23013120313", name: "Basis Data", sks: 3 },
  { code: "23013120314", name: "Pemrograman Berorientasi Objek", sks: 3 },
  { code: "23013120315", name: "Organisasi & Arsitektur Komputer", sks: 3 },
  { code: "23013120321", name: "Sistem Operasi", sks: 3 },
  { code: "23013120322", name: "Jaringan Komputer", sks: 3 },
  { code: "23013120323", name: "Rekayasa Perangkat Lunak", sks: 3 },
  { code: "23013120324", name: "Pemrograman Web", sks: 3 },
  { code: "23013120325", name: "Analisis & Desain Algoritma", sks: 3 },
  { code: "23013120326", name: "Teori Bahasa & Otomata", sks: 3 },
  { code: "23013130222", name: "Riset Operasi", sks: 2 },
  { code: "23013130324", name: "Kriptografi", sks: 3 },
  { code: "23013130327", name: "Teori Game", sks: 3 },
  { code: "23013130331", name: "Kecerdasan Buatan", sks: 3 },
  { code: "23013130332", name: "Pengolahan Citra Digital", sks: 3 },
  { code: "23013130333", name: "Sistem Terdistribusi", sks: 3 },
  { code: "23013130334", name: "Grafika Komputer", sks: 3 },
  { code: "23013130335", name: "Keamanan Jaringan", sks: 3 },
  { code: "23013140301", name: "Machine Learning", sks: 3 },
  { code: "23013140302", name: "Komputasi Awan", sks: 3 },
  { code: "23013220330", name: "Data Mining", sks: 3 },
];

/**
 * Kondisi tiap ronde. Santai: kuota privat per peserta (tidak diperebutkan).
 * War: kuota dibagi semua peserta dan diperebutkan secara langsung.
 */
export type Condition = "santai" | "war";
export const CONDITION: Record<1 | 2, Condition> = { 1: "santai", 2: "war" };

/** Paket KRS (mata kuliah yang wajib diambil) per ronde. */
export const TARGETS: Record<1 | 2, string[]> = {
  1: ["23013120313", "23013120314", "23013120321", "23013120322", "23013120231", "23013120203"],
  2: ["23013130331", "23013120324", "23013120323", "23013130324", "23013120236", "23013120311"],
};

export const DAYS = ["SENIN", "SELASA", "RABU", "KAMIS", "JUMAT"];
/** Sesi kuliah (jam ke-). Tidak saling tumpang tindih. */
export const SESSIONS = [
  [1, 2],
  [4, 5],
  [7, 8],
];
export const sessionLabel = (slot: number) => `Sesi ${SESSIONS[slot].join(",")}`;

export const CLASS_CODES = ["A1", "A2", "B1", "B2"];
export const isA = (classCode: string) => classCode.startsWith("A");

/**
 * Kuota kelas = jumlah kursi sebenarnya, semua kosong di awal ronde. Kelas A sengaja langka
 * (A1 + A2 = 6 kursi) supaya diperebutkan. Kelas B (B1 + B2 = 24 kursi) menjamin setiap peserta
 * kebagian kelas, jadi aman untuk sampai sekitar 24 peserta.
 */
export const QUOTA = { A: 3, B: 12 } as const;
export const PREFULL = 2; // jumlah matkul yang semua kelas A-nya sudah penuh sejak awal

// Seed hasil scripts/find-seeds.ts (tingkat kesulitan kedua set dibuat setara).
export const SEEDS: Record<1 | 2, number> = { 1: 100045, 2: 200293 };

export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(arr: T[], r: () => number): T[] {
  const x = [...arr];
  for (let i = x.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [x[i], x[j]] = [x[j], x[i]];
  }
  return x;
}

export function generate(seed: number, no: 1 | 2): Cls[] {
  const r = rng(seed);
  const full = new Set(shuffle(TARGETS[no], r).slice(0, PREFULL));
  return TARGETS[no].flatMap((course) =>
    CLASS_CODES.map((code) => {
      const a = isA(code);
      const quota = a ? QUOTA.A : QUOTA.B;
      return {
        key: `${no}-${course}-${code}`,
        course,
        code,
        day: Math.floor(r() * DAYS.length),
        slot: Math.floor(r() * SESSIONS.length),
        quota,
        initialTaken: a && full.has(course) ? quota : 0,
      };
    })
  );
}

/** Dua kelas bentrok bila beda matkul tetapi hari dan sesi sama. */
export const clash = (a: Cls, b: Cls) =>
  a.course !== b.course && a.day === b.day && a.slot === b.slot;

/** Ukuran kesulitan satu katalog (dipakai untuk menyetarakan set 1 dan 2). */
export function difficulty(cls: Cls[]) {
  const courses = [...new Set(cls.map((c) => c.course))];
  const byCourse = courses.map((code) => cls.filter((x) => x.course === code));
  let maxA = 0;
  let solutions = 0;
  const chosen: Cls[] = [];
  const dfs = (i: number, a: number) => {
    if (i === byCourse.length) {
      solutions++;
      if (a > maxA) maxA = a;
      return;
    }
    for (const c of byCourse[i]) {
      if (c.initialTaken >= c.quota) continue;
      if (chosen.some((x) => clash(x, c))) continue;
      chosen.push(c);
      dfs(i + 1, a + (isA(c.code) ? 1 : 0));
      chosen.pop();
    }
  };
  dfs(0, 0);
  return { maxA, solutions };
}

const cache: Partial<Record<1 | 2, Cls[]>> = {};
export function getCatalog(no: 1 | 2): Cls[] {
  return (cache[no] ??= generate(SEEDS[no], no));
}
export const findCourse = (code: string) => POOL.find((c) => c.code === code)!;
export const courseName = (code: string) => findCourse(code).name;
export const courseSks = (code: string) => findCourse(code).sks;
