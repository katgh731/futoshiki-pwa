import { solvePuzzle } from './solver.mjs';

const GIVEN_FRACTIONS = new Map([
  ['easy', 0.65],
  ['medium', 0.45],
  ['hard', 0.35],
]);

function shuffle(values, random) {
  for (let i = values.length - 1; i > 0; i--) {
    const sample = random();
    if (!Number.isFinite(sample) || sample < 0 || sample >= 1) {
      throw new TypeError('random 必須回傳 [0, 1) 內的數字');
    }
    const j = Math.floor(sample * (i + 1));
    [values[i], values[j]] = [values[j], values[i]];
  }
  return values;
}

function createCandidate(size, random) {
  const indices = Array.from({ length: size }, (_, index) => index);
  const rows = shuffle(indices.slice(), random);
  const cols = shuffle(indices.slice(), random);
  const symbols = shuffle(indices.map(index => index + 1), random);
  const givens = rows.map(row => cols.map(col => symbols[(row + col) % size]));
  const inequalities = [];

  function edge(row, col, nextRow, nextCol) {
    const first = [row, col];
    const second = [nextRow, nextCol];
    if (givens[row][col] < givens[nextRow][nextCol]) {
      return { less: first, greater: second };
    }
    return { less: second, greater: first };
  }

  for (const row of indices) {
    for (const col of indices) {
      if (col + 1 < size) inequalities.push(edge(row, col, row, col + 1));
      if (row + 1 < size) inequalities.push(edge(row, col, row + 1, col));
    }
  }

  return { size, givens, inequalities };
}

/** Generate a uniquely solvable puzzle or return exhausted when the budget is insufficient. */
export function generatePuzzle(size, options = {}) {
  if (!Number.isInteger(size) || size < 4 || size > 9) {
    throw new TypeError('size 必須是 4 至 9 的整數');
  }
  if (options === null || typeof options !== 'object' || Array.isArray(options)) {
    throw new TypeError('options 必須是物件');
  }
  const { difficulty = 'medium', random = Math.random, maxAttempts = 8, maxNodes = 1_000 } = options;
  const fraction = GIVEN_FRACTIONS.get(difficulty);
  if (fraction === undefined) throw new TypeError('difficulty 必須是 easy、medium 或 hard');
  if (typeof random !== 'function') throw new TypeError('random 必須是函式');
  if (!Number.isSafeInteger(maxAttempts) || maxAttempts < 1) {
    throw new TypeError('maxAttempts 必須是正安全整數');
  }
  if (!Number.isSafeInteger(maxNodes) || maxNodes < 0) {
    throw new TypeError('maxNodes 必須是非負安全整數');
  }
  if (maxNodes === 0) return { status: 'exhausted', attempts: 0 };

  const cellCount = size * size;
  const targetGivens = Math.ceil(cellCount * fraction);
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const puzzle = createCandidate(size, random);
    const cells = shuffle(Array.from({ length: cellCount }, (_, index) => index), random);
    let givensCount = cellCount;
    for (const cell of cells) {
      const row = Math.floor(cell / size);
      const col = cell % size;
      const previous = puzzle.givens[row][col];
      puzzle.givens[row][col] = 0;
      const result = solvePuzzle(puzzle, { maxNodes });
      if (result.status !== 'unique') {
        puzzle.givens[row][col] = previous;
        continue;
      }
      givensCount--;
      if (givensCount === targetGivens) {
        return {
          status: 'generated', puzzle, solution: result.solutions[0], difficulty,
          givensCount, nodesVisited: result.nodesVisited, attempts: attempt + 1,
        };
      }
    }
  }

  return { status: 'exhausted', attempts: maxAttempts };
}
