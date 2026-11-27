// Original brush-style numerals, drawn in writing order.
const strokes = [
  null,
  ['M 9 11 Q 14 7 19 4 Q 18 17 14 29'],
  ['M 8 11 C 10 4 20 2 23 8 C 27 14 12 22 8 28 Q 16 25 24 29'],
  ['M 8 7 C 14 2 24 4 22 10 Q 21 14 16 15 C 26 15 27 26 18 29 Q 11 31 7 26'],
  ['M 19 4 Q 14 14 6 22 Q 15 22 25 20', 'M 20 14 L 16 30'],
  ['M 24 6 Q 18 8 12 6 L 9 16 C 17 11 26 16 23 23 Q 19 33 8 28'],
  ['M 22 5 C 14 5 7 15 7 23 C 7 32 22 32 23 23 C 25 16 15 14 8 21'],
  ['M 7 11 L 9 6 Q 17 8 25 6 Q 18 17 13 30', 'M 11 18 L 22 17'],
  ['M 17 15 C 7 13 9 4 17 4 C 28 4 26 12 17 15 C 8 19 4 25 11 29 C 19 34 26 28 24 22 Q 23 18 17 15'],
  ['M 23 16 C 24 11 23 4 16 4 C 7 3 5 12 10 16 Q 16 21 23 15 Q 20 25 15 30'],
];

export function handwrittenDigit(value, animate = false) {
  const namespace = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(namespace, 'svg');
  svg.setAttribute('viewBox', '0 0 32 34');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  svg.setAttribute('class', animate ? 'digit writing' : 'digit');

  for (const [index, command] of strokes[value].entries()) {
    const path = document.createElementNS(namespace, 'path');
    path.setAttribute('d', command);
    path.setAttribute('pathLength', '1');
    path.style.setProperty('--stroke-index', index);
    svg.append(path);
  }
  return svg;
}
