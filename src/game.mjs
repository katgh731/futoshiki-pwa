import { generatePuzzle } from './generator.mjs';
import { handwrittenDigit } from './handwriting.mjs';

const settings = document.querySelector('#settings');
const board = document.querySelector('#board');
const keypad = document.querySelector('#keypad');
const completion = document.querySelector('#completion');
const newButton = document.querySelector('#new-puzzle');
const status = document.querySelector('#status');

let puzzle;
let solution;
let finished = false;
let entries;
let cells;
let selected;

function selectCell(row, col, focus = false) {
  if (selected) {
    const previous = cells[selected[0]][selected[1]];
    previous.setAttribute('aria-pressed', 'false');
    previous.tabIndex = -1;
  }
  selected = [row, col];
  const cell = cells[row][col];
  cell.setAttribute('aria-pressed', 'true');
  cell.tabIndex = 0;
  if (focus) cell.focus();
}

function updateCell(row, col, cell, animate = false) {
  const value = entries[row][col];
  const incorrect = value !== 0 && value !== solution[row][col];
  const previousDigit = cell.firstElementChild;
  if (!value && animate && previousDigit) {
    if (cell.classList.contains('incorrect')) previousDigit.classList.add('erasing-error');
    previousDigit.classList.remove('writing');
    previousDigit.classList.add('erasing');
    const animations = previousDigit.getAnimations();
    if (animations.length) {
      Promise.allSettled(animations.map(animation => animation.finished))
        .then(() => previousDigit.remove());
    } else {
      previousDigit.remove();
    }
  } else {
    cell.replaceChildren();
    if (value) cell.append(handwrittenDigit(value, animate));
  }
  cell.classList.toggle('incorrect', incorrect);
  const kind = puzzle.givens[row][col] ? '題目線索' : '可填寫';
  cell.setAttribute('aria-label', `第 ${row + 1} 行第 ${col + 1} 列，${kind}，${value || '空格'}${incorrect ? '，答案錯誤' : ''}`);
}

function enterValue(value) {
  if (finished) return;
  const [row, col] = selected;
  if (puzzle.givens[row][col]) {
    status.textContent = '請選擇可填寫的格子。';
    return;
  }
  if (!value && !entries[row][col]) return;
  entries[row][col] = value;
  const cell = cells[row][col];
  updateCell(row, col, cell, true);
  status.textContent = '';
  if (entries.every((row, r) => row.every((entry, c) => entry === solution[r][c]))) {
    finished = true;
    for (const cell of cells.flat()) cell.disabled = true;
    for (const button of keypad.children) button.disabled = true;
    status.textContent = '你解開了這道題！';
    const completedPuzzle = puzzle;
    const strokes = [...cell.querySelectorAll('path')];
    const animations = strokes.flatMap(stroke => stroke.getAnimations());
    const showCompletion = () => {
      if (puzzle !== completedPuzzle) return;
      completion.returnValue = 'stay';
      completion.showModal();
    };
    if (animations.length) {
      Promise.allSettled(animations.map(animation => animation.finished)).then(showCompletion);
    } else {
      showCompletion();
    }
  }
}

function drawPuzzle() {
  const { size, givens, inequalities } = puzzle;
  finished = false;
  entries = givens.map(row => row.slice());
  board.replaceChildren();
  keypad.replaceChildren();
  board.style.setProperty('--gaps', size - 1);
  selected = null;
  cells = givens.map((row, rowIndex) => row.map((value, colIndex) => {
    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = value ? 'cell given' : 'cell';
    cell.tabIndex = -1;
    cell.setAttribute('aria-pressed', 'false');
    cell.style.gridArea = `${2 * rowIndex + 1} / ${2 * colIndex + 1}`;
    updateCell(rowIndex, colIndex, cell);
    cell.addEventListener('click', () => selectCell(rowIndex, colIndex, true));
    board.append(cell);
    return cell;
  }));

  for (const { less: [r1, c1], greater: [r2, c2] } of inequalities) {
    const sign = document.createElement('span');
    const horizontal = r1 === r2;
    sign.className = horizontal ? 'sign' : 'sign vertical';
    sign.textContent = horizontal ? (c1 < c2 ? '<' : '>') : (r1 < r2 ? '<' : '>');
    sign.style.gridArea = `${r1 + r2 + 1} / ${c1 + c2 + 1}`;
    sign.setAttribute('role', 'img');
    sign.setAttribute('aria-label', `第 ${r1 + 1} 行第 ${c1 + 1} 列小於第 ${r2 + 1} 行第 ${c2 + 1} 列`);
    board.append(sign);
  }

  for (const value of [...Array.from({ length: size }, (_, index) => index + 1), 0]) {
    const button = document.createElement('button');
    button.type = 'button';
    if (value) {
      button.setAttribute('aria-label', String(value));
      button.append(handwrittenDigit(value));
    } else {
      button.textContent = '擦除';
    }
    button.addEventListener('click', () => enterValue(value));
    keypad.append(button);
  }
  const firstRow = givens.findIndex(row => row.includes(0));
  selectCell(firstRow, givens[firstRow].indexOf(0));
}

function newPuzzle() {
  const size = Number(document.querySelector('#size').value);
  const difficulty = document.querySelector('#difficulty').value;
  const result = generatePuzzle(size, { difficulty });
  if (result.status !== 'generated') {
    status.textContent = '這次未能產生題目，請再按一次「新題目」。';
    return;
  }
  puzzle = result.puzzle;
  solution = result.solution;
  drawPuzzle();
  status.textContent = '新題目已準備好。';
}

settings.addEventListener('submit', event => {
  event.preventDefault();
  newPuzzle();
});

board.addEventListener('keydown', event => {
  if (finished || !selected || event.altKey || event.ctrlKey || event.metaKey) return;
  const directions = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
  const direction = directions[event.key];
  if (direction) {
    event.preventDefault();
    const [row, col] = selected.map((value, index) =>
      Math.max(0, Math.min(puzzle.size - 1, value + direction[index])));
    selectCell(row, col, true);
  } else if (/^[1-9]$/.test(event.key) && Number(event.key) <= puzzle.size) {
    event.preventDefault();
    enterValue(Number(event.key));
  } else if (['Backspace', 'Delete', '0'].includes(event.key)) {
    event.preventDefault();
    enterValue(0);
  }
});

completion.addEventListener('close', () => {
  if (completion.returnValue === 'new') newPuzzle();
  newButton.focus();
});

newPuzzle();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(error => {
    console.warn('離線快取未能啟用', error);
  });
}
