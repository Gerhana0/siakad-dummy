// Katalog mata kuliah fiktif untuk simulasi KRS.
// Dibangkitkan secara deterministik dari seed, jadi server dan browser selalu sama.

export type Course = { code: string; name: string; sks: number };
export type Cls = {
  key: string;
  course: string;
  code: string; // A..F
  day: number; // indeks DAYS
  slot: number; // indeks SLOTS
  quota: number;
  initialTaken: number;
};

export const COURSES: Course[] = [
  { code: "IF2101", name: "Basis Data", sks: 3 },
  { code: "IF2102", name: "Pemrograman Web", sks: 3 },
  { code: "IF2103", name: "Struktur Data", sks: 3 },
  { code: "IF2104", name: "Jaringan Komputer", sks: 3 },
  { code: "IF2105", name: "Sistem Operasi", sks: 3 },
  { code: "IF2106", name: "Interaksi Manusia Komputer", sks: 3 },
  { code: "IF2107", name: "Kriptografi", sks: 2 },
];
export const TOTAL_SKS = COURSES.reduce((s, c) => s + c.sks, 0); // 20

export const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];
export const SLOTS = ["07:00–09:30", "09:30–12:00", "13:00–15:30"];
export const CLASS_CODES = ["A", "B", "C", "D", "E", "F"];
export const QUOTA = 5;
export const PREFULL = 3; // jumlah matkul yang kelas A-nya sudah penuh sejak awal

// Seed hasil scripts/find-seeds.ts (tingkat kesulitan kedua set dibuat setara).
export const SEEDS: Record<1 | 2, number> = { 1: 100004, 2: 200009 };

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
  const full = new Set(shuffle(COURSES.map((c) => c.code), r).slice(0, PREFULL));
  return COURSES.flatMap((c) =>
    CLASS_CODES.map((code) => ({
      key: `${no}-${c.code}-${code}`,
      course: c.code,
      code,
      day: Math.floor(r() * DAYS.length),
      slot: Math.floor(r() * SLOTS.length),
      quota: QUOTA,
      initialTaken: code === "A" && full.has(c.code) ? QUOTA : 0,
    }))
  );
}

/** Dua kelas bentrok bila beda matkul tetapi hari dan jam sama. */
export const clash = (a: Cls, b: Cls) =>
  a.course !== b.course && a.day === b.day && a.slot === b.slot;

/** Ukuran kesulitan satu katalog (dipakai untuk menyetarakan set 1 dan 2). */
export function difficulty(cls: Cls[]) {
  const byCourse = COURSES.map((c) => cls.filter((x) => x.course === c.code));
  const A = byCourse.map((l) => l.find((x) => x.code === "A")!);
  let aPairs = 0;
  for (let i = 0; i < A.length; i++)
    for (let j = i + 1; j < A.length; j++) if (clash(A[i], A[j])) aPairs++;
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
      dfs(i + 1, a + (c.code === "A" ? 1 : 0));
      chosen.pop();
    }
  };
  dfs(0, 0);
  return { aPairs, maxA, solutions };
}

const cache: Partial<Record<1 | 2, Cls[]>> = {};
export function getCatalog(no: 1 | 2): Cls[] {
  return (cache[no] ??= generate(SEEDS[no], no));
}
export const courseName = (code: string) => COURSES.find((c) => c.code === code)!.name;
export const courseSks = (code: string) => COURSES.find((c) => c.code === code)!.sks;
