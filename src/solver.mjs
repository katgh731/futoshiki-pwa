const DEFAULT_MAX_NODES = 10_000;

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isIntegerInRange(value, min, max) {
  return Number.isInteger(value) && value >= min && value <= max;
}

function readGrid(grid, size, min, label) {
  if (!Array.isArray(grid) || grid.length !== size) {
    throw new TypeError(`${label} 必須有 ${size} 行`);
  }

  const values = [];
  for (const row of grid) {
    if (!Array.isArray(row) || row.length !== size) {
      throw new TypeError(`${label} 每行必須有 ${size} 格`);
    }
    for (const value of row) {
      if (!isIntegerInRange(value, min, size)) {
        throw new TypeError(`${label} 的格值必須是 ${min} 至 ${size} 的整數`);
      }
      values.push(value);
    }
  }
  return values;
}

function readCell(cell, size) {
  if (!Array.isArray(cell) || cell.length !== 2 ||
      !isIntegerInRange(cell[0], 0, size - 1) ||
      !isIntegerInRange(cell[1], 0, size - 1)) {
    throw new TypeError('不等式座標必須是棋盤內的 [行, 列]');
  }
  return cell;
}

function readPuzzle(puzzle) {
  if (!isRecord(puzzle) || !isIntegerInRange(puzzle.size, 4, 9)) {
    throw new TypeError('size 必須是 4 至 9 的整數');
  }

  const { size, givens, inequalities = [] } = puzzle;
  const values = readGrid(givens, size, 0, 'givens');
  if (!Array.isArray(inequalities)) {
    throw new TypeError('inequalities 必須是陣列');
  }

  const edges = [];
  const seen = new Set();
  for (const edge of inequalities) {
    if (!isRecord(edge)) {
      throw new TypeError('不等式必須包含 less 和 greater 座標');
    }
    const [lessRow, lessCol] = readCell(edge.less, size);
    const [greaterRow, greaterCol] = readCell(edge.greater, size);
    if (Math.abs(lessRow - greaterRow) + Math.abs(lessCol - greaterCol) !== 1) {
      throw new TypeError('不等式必須連接水平或垂直相鄰的格子');
    }
    const less = lessRow * size + lessCol;
    const greater = greaterRow * size + greaterCol;
    const key = less * size * size + greater;
    if (!seen.has(key)) {
      seen.add(key);
      edges.push([less, greater]);
    }
  }

  const units = [];
  for (let index = 0; index < size; index++) {
    units.push(Array.from({ length: size }, (_, col) => index * size + col));
    units.push(Array.from({ length: size }, (_, row) => row * size + index));
  }
  return { size, values, edges, units };
}

/** Check a complete board against the puzzle. Malformed input throws TypeError. */
export function validateSolution(puzzle, solution) {
  const { size, values, edges, units } = readPuzzle(puzzle);
  const filled = readGrid(solution, size, 1, 'solution');
  return values.every((value, cell) => value === 0 || value === filled[cell]) &&
    units.every(unit => new Set(unit.map(cell => filled[cell])).size === size) &&
    edges.every(([less, greater]) => filled[less] < filled[greater]);
}

function isSingleton(mask) {
  return mask !== 0 && (mask & (mask - 1)) === 0;
}

function propagate(domains, units, edges, fullMask) {
  let changed;
  do {
    changed = false;
    for (const unit of units) {
      let assigned = 0;
      for (const cell of unit) {
        const mask = domains[cell];
        if (!isSingleton(mask)) continue;
        if (assigned & mask) return false;
        assigned |= mask;
      }
      for (const cell of unit) {
        const mask = domains[cell];
        if (isSingleton(mask)) continue;
        const remaining = mask & ~assigned;
        if (!remaining) return false;
        if (remaining !== mask) {
          domains[cell] = remaining;
          changed = true;
        }
      }

      // Every value must occur in each unit. A value with one possible cell is forced.
      for (let bit = 1; bit <= fullMask; bit <<= 1) {
        let onlyCell = -1;
        for (const cell of unit) {
          if (!(domains[cell] & bit)) continue;
          if (onlyCell !== -1) {
            onlyCell = -2;
            break;
          }
          onlyCell = cell;
        }
        if (onlyCell === -1) return false;
        if (onlyCell >= 0 && domains[onlyCell] !== bit) {
          domains[onlyCell] = bit;
          changed = true;
        }
      }
    }

    for (const [less, greater] of edges) {
      const lessMask = domains[less];
      const greaterMask = domains[greater];
      // A value on either side needs support from at least one value on the other.
      const largestGreater = 1 << (31 - Math.clz32(greaterMask));
      const smallestLess = lessMask & -lessMask;
      const nextLess = lessMask & (largestGreater - 1);
      const nextGreater = greaterMask & ~((smallestLess << 1) - 1);
      if (!nextLess || !nextGreater) return false;
      if (nextLess !== lessMask || nextGreater !== greaterMask) {
        domains[less] = nextLess;
        domains[greater] = nextGreater;
        changed = true;
      }
    }
  } while (changed);
  return true;
}

function selectCell(domains) {
  let selected = -1;
  let minimum = Infinity;
  for (let cell = 0; cell < domains.length; cell++) {
    if (isSingleton(domains[cell])) continue;
    let count = 0;
    for (let mask = domains[cell]; mask; mask &= mask - 1) count++;
    if (count < minimum) {
      minimum = count;
      selected = cell;
    }
    if (minimum === 2) break;
  }
  return selected;
}

/** Classify the puzzle by searching for up to two solutions within maxNodes. */
export function solvePuzzle(puzzle, options = {}) {
  if (!isRecord(options)) throw new TypeError('options 必須是物件');
  const { maxNodes = DEFAULT_MAX_NODES } = options;
  if (!Number.isSafeInteger(maxNodes) || maxNodes < 0) {
    throw new TypeError('maxNodes 必須是非負安全整數');
  }

  const { size, values, edges, units } = readPuzzle(puzzle);
  const fullMask = (1 << size) - 1;
  const initialDomains = values.map(value => value === 0 ? fullMask : 1 << (value - 1));
  const solutions = [];
  let nodesVisited = 0;
  let limitReached = false;

  function search(domains) {
    if (nodesVisited >= maxNodes) {
      limitReached = true;
      return;
    }
    nodesVisited++;
    if (!propagate(domains, units, edges, fullMask)) return;

    const cell = selectCell(domains);
    if (cell === -1) {
      const flat = domains.map(mask => 32 - Math.clz32(mask));
      solutions.push(Array.from({ length: size }, (_, row) =>
        flat.slice(row * size, (row + 1) * size)));
      return;
    }

    for (let mask = domains[cell]; mask; mask &= mask - 1) {
      const branch = domains.slice();
      branch[cell] = mask & -mask;
      search(branch);
      if (limitReached || solutions.length === 2) return;
    }
  }

  search(initialDomains);
  let status = 'none';
  if (limitReached) status = 'unknown';
  else if (solutions.length === 2) status = 'multiple';
  else if (solutions.length === 1) status = 'unique';

  return { status, solutions, nodesVisited };
}
