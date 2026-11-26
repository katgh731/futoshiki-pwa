import { performance } from 'node:perf_hooks';
import { generatePuzzle } from '../src/generator.mjs';

function generate(size, difficulty, seed) {
  return generatePuzzle(size, {
    difficulty,
    random() {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 2 ** 32;
    },
  });
}

const rows = [];
for (const size of [8, 9]) {
  for (const difficulty of ['easy', 'medium', 'hard']) {
    for (let i = 1; i <= 10; i++) generate(size, difficulty, 1000 + i);
    const times = [];
    let generated = 0;
    let maxAttempts = 0;
    for (let seed = 1; seed <= 100; seed++) {
      const start = performance.now();
      const result = generate(size, difficulty, seed);
      times.push(performance.now() - start);
      if (result.status === 'generated') generated++;
      maxAttempts = Math.max(maxAttempts, result.attempts);
    }
    times.sort((a, b) => a - b);
    rows.push({
      size, difficulty, generated, exhausted: times.length - generated, maxAttempts,
      'p50 (ms)': ((times[49] + times[50]) / 2).toFixed(2),
      'p95 (ms)': times[94].toFixed(2),
      'max (ms)': times.at(-1).toFixed(2),
    });
  }
}
console.log(process.version);
console.table(rows);
