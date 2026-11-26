import assert from 'node:assert/strict';
import { test } from 'node:test';
import { generatePuzzle } from '../src/generator.mjs';
import { solvePuzzle, validateSolution } from '../src/solver.mjs';

function seededRandom(seed) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };
}

const levels = [['easy', 0.65], ['medium', 0.45], ['hard', 0.35]];
for (let size = 4; size <= 9; size++) {
  for (const [difficulty, fraction] of levels) {
    test(`${size}×${size} ${difficulty} 出題符合難度及唯一解`, () => {
      for (const seed of [1, 23, 47]) {
        const result = generatePuzzle(size, { difficulty, random: seededRandom(seed) });
        assert.equal(result.status, 'generated');
        const { puzzle, solution } = result;
        assert.equal(puzzle.size, size);
        assert.equal(result.difficulty, difficulty);
        assert.equal(result.givensCount, Math.ceil(size ** 2 * fraction));
        assert.equal(puzzle.givens.flat().filter(Boolean).length, result.givensCount);
        assert.equal(puzzle.inequalities.filter(({ less, greater }) => less[0] === greater[0]).length, size);
        assert.equal(puzzle.inequalities.filter(({ less, greater }) => less[1] === greater[1]).length, size);
        assert.ok(validateSolution(puzzle, solution));
        const checked = solvePuzzle(puzzle, { maxNodes: 10_000 });
        assert.equal(checked.status, 'unique');
        assert.deepEqual(checked.solutions, [solution]);
      }
    });
  }
}

test('相同種子可重現，不同種子可產生不同題目', () => {
  const generate = seed => generatePuzzle(6, { random: seededRandom(seed) });
  const first = generate(1);
  assert.equal(first.status, 'generated');
  assert.deepEqual(generate(1), first);
  assert.notDeepEqual(generate(2).puzzle, first.puzzle);
});

test('搜尋上限為零時不產出未經證明的題目', () => {
  assert.deepEqual(generatePuzzle(8, { maxNodes: 0 }), { status: 'exhausted', attempts: 0 });
});

test('移除線索未能證明唯一解時，耗盡嘗試仍不交付題目', () => {
  const options = { difficulty: 'hard', maxAttempts: 1 };
  assert.deepEqual(generatePuzzle(9, { ...options, maxNodes: 1, random: seededRandom(7) }),
    { status: 'exhausted', attempts: 1 });
  assert.equal(generatePuzzle(9, { ...options, random: seededRandom(7) }).status, 'generated');
});

test('拒絕非法尺寸、設定及亂數結果', () => {
  assert.throws(() => generatePuzzle(10), TypeError);
  for (const options of [null, [], { difficulty: 'expert' }, { maxAttempts: 0 },
    { maxNodes: -1 }, { random: 1 }, { random: () => 1 }, { random: () => NaN }]) {
    assert.throws(() => generatePuzzle(4, options), TypeError);
  }
});
