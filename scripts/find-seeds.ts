// Cari seed katalog yang tingkat kesulitannya sama untuk set 1 dan set 2.
// Jalankan: npm run seeds
// Kriteria: tepat satu kelas A "dikorbankan" karena bentrok (selain matkul yang kelas A-nya penuh),
// dan masih cukup banyak kombinasi jadwal yang valid agar peserta tidak buntu.
import { generate, difficulty, TARGETS, PREFULL } from "../src/lib/catalog";

const found: Record<number, number> = {};
for (const no of [1, 2] as const) {
  const target = { maxA: TARGETS[no].length - PREFULL - 1, minSolutions: 150 };
  for (let seed = no * 100000; seed < no * 100000 + 20000; seed++) {
    const d = difficulty(generate(seed, no));
    if (d.maxA === target.maxA && d.solutions >= target.minSolutions) {
      found[no] = seed;
      console.log(`set ${no}: seed ${seed}`, d);
      break;
    }
  }
}
console.log(JSON.stringify(found));
