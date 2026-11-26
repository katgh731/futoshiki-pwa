import assert from 'node:assert/strict';
import { test } from 'node:test';
import { solvePuzzle, validateSolution } from '../src/solver.mjs';

const board = (size, valueAt) => Array.from({ length: size }, (_, row) =>
  Array.from({ length: size }, (_, col) => valueAt(row, col)));
const empty = (size = 4) => ({ size, givens: board(size, () => 0) });
const cyclic = size => board(size, (row, col) => (row + col) % size + 1);
const edge = (less, greater) => ({ less, greater });

const unique = {
  ...empty(),
  inequalities: [
    edge([0, 0], [0, 1]), edge([0, 1], [0, 2]), edge([0, 2], [0, 3]),
    edge([0, 0], [1, 0]), edge([1, 0], [2, 0]), edge([2, 0], [3, 0]),
    edge([1, 1], [1, 2]), edge([1, 1], [2, 1]),
    edge([1, 3], [2, 3]),
  ],
};

test('僅用水平及垂直線索找出唯一解', () => {
  const result = solvePuzzle(unique);
  assert.equal(result.status, 'unique');
  assert.deepEqual(result.solutions, [cyclic(4)]);
  assert.equal(validateSolution(unique, result.solutions[0]), true);
  assert.equal(crossCheck(unique), 'unique');
});

test('區分橫行及直行重複造成的矛盾', () => {
  for (const [row, col] of [[0, 1], [1, 0]]) {
    const puzzle = empty();
    puzzle.givens[0][0] = puzzle.givens[row][col] = 1;
    assert.deepEqual(solvePuzzle(puzzle), { status: 'none', solutions: [], nodesVisited: 1 });
  }
});

test('相反不等式及線索衝突為無解', () => {
  const puzzle = {
    ...empty(),
    inequalities: [edge([0, 0], [1, 0]), edge([1, 0], [0, 0])],
  };
  assert.equal(solvePuzzle(puzzle).status, 'none');
  puzzle.inequalities.pop();
  puzzle.givens[0][0] = 4;
  assert.equal(solvePuzzle(puzzle).status, 'none');
});

test('空棋盤回傳兩個不同的有效解', () => {
  const puzzle = empty();
  const result = solvePuzzle(puzzle);
  assert.equal(result.status, 'multiple');
  assert.equal(result.solutions.length, 2);
  assert.notDeepEqual(...result.solutions);
  for (const solution of result.solutions) assert.ok(validateSolution(puzzle, solution));
});

test('驗證器檢查給定數字、重複值及兩種方向的不等式', () => {
  const solution = cyclic(4);
  const puzzle = empty();
  puzzle.givens[0][0] = 2;
  assert.equal(validateSolution(puzzle, solution), false);
  for (const less of [[0, 1], [1, 0]]) {
    const constrained = { ...empty(), inequalities: [edge(less, [0, 0])] };
    assert.equal(validateSolution(constrained, solution), false);
  }
  const rowsRepeat = board(4, (_, col) => col + 1);
  const columnsRepeat = board(4, row => row + 1);
  assert.equal(validateSolution(empty(), rowsRepeat), false);
  assert.equal(validateSolution(empty(), columnsRepeat), false);
  assert.throws(() => validateSolution(empty(), empty().givens), TypeError);
});

const malformedPuzzles = [
  ['空題目', null],
  ['棋盤尺寸 3', empty(3)],
  ['棋盤尺寸 10', empty(10)],
  ['非整數尺寸', { ...empty(), size: 4.5 }],
  ['缺少給定棋盤', { size: 4 }],
  ['缺少一行', { size: 4, givens: empty().givens.slice(1) }],
  ['不規則列長', { size: 4, givens: [[0], ...empty().givens.slice(1)] }],
  ['稀疏格值', { size: 4, givens: [Array(4), ...empty().givens.slice(1)] }],
  ['超出範圍的格值', { size: 4, givens: board(4, () => 5) }],
  ['非數字格值', { size: 4, givens: board(4, () => '1') }],
  ['非陣列不等式', { ...empty(), inequalities: null }],
  ['缺少端點', { ...empty(), inequalities: [{ less: [0, 0] }] }],
  ['非相鄰端點', { ...empty(), inequalities: [edge([0, 0], [1, 1])] }],
  ['同一格端點', { ...empty(), inequalities: [edge([0, 0], [0, 0])] }],
  ['越界端點', { ...empty(), inequalities: [edge([0, 0], [-1, 0])] }],
];

for (const [name, puzzle] of malformedPuzzles) {
  test(`拒絕非法題目：${name}`, () => {
    assert.throws(() => solvePuzzle(puzzle), TypeError);
  });
}

test('拒絕非法運算上限', () => {
  for (const maxNodes of [-1, 0.5, Infinity, NaN, '1', Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => solvePuzzle(empty(), { maxNodes }), TypeError);
  }
  assert.throws(() => solvePuzzle(empty(), null), TypeError);
});

test('達到上限且尚未找到解時回傳未能確認', () => {
  assert.deepEqual(solvePuzzle(unique, { maxNodes: 0 }),
    { status: 'unknown', solutions: [], nodesVisited: 0 });
  assert.deepEqual(solvePuzzle(empty(), { maxNodes: 1 }),
    { status: 'unknown', solutions: [], nodesVisited: 1 });
});

test('已有一個解但上限阻止搜尋第二個解時仍未能確認', () => {
  const puzzle = empty();
  const complete = solvePuzzle(puzzle);
  const maxNodes = complete.nodesVisited - 1;
  const limited = solvePuzzle(puzzle, { maxNodes });
  assert.deepEqual(limited, {
    status: 'unknown', solutions: complete.solutions.slice(0, 1), nodesVisited: maxNodes,
  });
  assert.deepEqual(solvePuzzle(puzzle, { maxNodes: complete.nodesVisited }), complete);
});

test('恰好用完上限且已證明結果時回傳唯一解或無解', () => {
  const givens = cyclic(4);
  assert.equal(solvePuzzle({ size: 4, givens }, { maxNodes: 1 }).status, 'unique');
  givens[0][0] = givens[0][1];
  assert.equal(solvePuzzle({ size: 4, givens }, { maxNodes: 1 }).status, 'none');
});

// Enumerate row permutations in order and compare only assigned rows.
// This reference uses neither candidate domains, propagation, nor MRV.
function referenceSolutions({ size, givens, inequalities = [] }) {
  const solutions = [];
  const rows = [];

  function addRow(row) {
    if (row === size) {
      solutions.push(rows.map(values => values.slice()));
      return;
    }

    const values = [];
    function permute(col) {
      if (col === size) {
        rows.push(values);
        const valid = inequalities.every(({ less: [r1, c1], greater: [r2, c2] }) =>
          r1 > row || r2 > row || rows[r1][c1] < rows[r2][c2]);
        if (valid) addRow(row + 1);
        rows.pop();
        return;
      }
      for (let value = 1; value <= size; value++) {
        if (givens[row][col] && givens[row][col] !== value) continue;
        if (values.includes(value) || rows.some(previous => previous[col] === value)) continue;
        values.push(value);
        permute(col + 1);
        values.pop();
        if (solutions.length === 2) return;
      }
    }
    permute(0);
  }

  addRow(0);
  return solutions;
}

function crossCheck(puzzle) {
  const expected = referenceSolutions(puzzle);
  const actual = solvePuzzle(puzzle);
  assert.equal(actual.status, ['none', 'unique', 'multiple'][expected.length],
    JSON.stringify(puzzle));
  assert.equal(actual.solutions.length, expected.length);
  if (expected.length === 1) assert.deepEqual(actual.solutions, expected);
  for (const solution of actual.solutions) assert.ok(validateSolution(puzzle, solution));
  if (expected.length === 2) assert.notDeepEqual(...actual.solutions);
  return actual.status;
}

for (let size = 4; size <= 9; size++) {
  test(`${size}×${size} 與列排列參考解法交叉驗證，求解不改動輸入`, () => {
    const solution = cyclic(size);
    const puzzle = {
      size,
      givens: board(size, (row, col) => row === col ? 0 : solution[row][col]),
      inequalities: [edge([0, 0], [0, 1]), edge([0, 0], [1, 0])],
    };
    const original = structuredClone(puzzle);
    assert.equal(crossCheck(puzzle), 'unique');
    assert.deepEqual(puzzle, original);
  });
}

test('固定種子產生 120 道 4×4 題目，交叉驗證三種解數分類', () => {
  let state = 0x20261126;
  const random = () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
  const statuses = new Set();
  const sample = cyclic(4);
  for (let index = 0; index < 120; index++) {
    const chance = (index % 8) / 8;
    const givens = board(4, (row, col) => random() < chance ? sample[row][col] : 0);
    const inequalities = [];
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        for (const [nextRow, nextCol] of [[row + 1, col], [row, col + 1]]) {
          if (nextRow >= 4 || nextCol >= 4 || random() >= 0.25) continue;
          const ascending = sample[row][col] < sample[nextRow][nextCol];
          const reverse = index % 3 === 0 && random() < 0.4;
          const first = [row, col];
          const second = [nextRow, nextCol];
          inequalities.push(ascending !== reverse ? edge(first, second) : edge(second, first));
        }
      }
    }
    statuses.add(crossCheck({ size: 4, givens, inequalities }));
  }
  assert.deepEqual(statuses, new Set(['none', 'unique', 'multiple']));
});
