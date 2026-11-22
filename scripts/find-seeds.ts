// Cari seed katalog yang tingkat kesulitannya sama untuk set 1 dan set 2.
// Jalankan: npm run seeds
// Kriteria: tepat satu kelas A "dikorbankan" karena bentrok (selain matkul yang kelas A-nya penuh),
// dan jumlah kombinasi jadwal valid berada di rentang yang sama (cukup longgar agar tidak buntu,
// tetapi tidak terlalu longgar agar kedua set setara).
import { generate, difficulty, TARGETS, PREFULL } from "../src/lib/catalog";

const found: Record<number, number> = {};
for (const no of [1, 2] as const) {
  const target = { maxA: TARGETS[no].length - PREFULL - 1, minSolutions: 150, maxSolutions: 220 };
  for (let seed = no * 100000; seed < no * 100000 + 20000; seed++) {
    const d = difficulty(generate(seed, no));
    if (d.maxA === target.maxA && d.solutions >= target.minSolutions && d.solutions <= target.maxSolutions) {
      found[no] = seed;
      console.log(`set ${no}: seed ${seed}`, d);
      break;
    }
  }
}
console.log(JSON.stringify(found));
