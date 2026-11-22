// Cari seed katalog yang tingkat kesulitannya sama untuk set 1 dan set 2.
// Jalankan: npx tsx scripts/find-seeds.ts
import { generate, difficulty } from "../src/lib/catalog";

const found: Record<number, number> = {};
const target = { aPairs: 2, maxA: 3 };
for (const no of [1, 2] as const) {
  for (let seed = no * 100000; seed < no * 100000 + 20000; seed++) {
    const d = difficulty(generate(seed, no));
    if (d.aPairs === target.aPairs && d.maxA === target.maxA && d.solutions >= 2000) {
      found[no] = seed;
      console.log(`set ${no}: seed ${seed}`, d);
      break;
    }
  }
}
console.log(JSON.stringify(found));
