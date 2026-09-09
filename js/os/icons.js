// Pixel icon set for RickyOS (32x32, crisp edges). Bench palette: copper,
// safety orange, phosphor teal, cream, charcoal.
const wrap = (body) =>
  `<svg viewBox="0 0 32 32" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${body}</svg>`;

const INK = '#1c1a17';
const CHARCOAL = '#2a2f36';
const STEEL = '#566171';
const PAPER = '#f3eee4';
const CREAM = '#d9d1bd';
const ORANGE = '#ff7a1a';
const TEAL = '#4fe3c1';
const COPPER = '#b8773f';
const GOLD = '#e6c27a';
const GREEN = '#52e07a';
const AMBER = '#ffb02e';
const RED = '#ff4b3e';
const PCB = '#1f5a3a';

const r = (x, y, w, h, fill) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"/>`;

export const ICONS = {
  logo: () =>
    wrap(
      r(5, 5, 22, 22, INK) + r(7, 7, 18, 18, PCB) +
      r(10, 10, 12, 12, CHARCOAL) + r(12, 12, 8, 8, TEAL) +
      r(2, 9, 3, 2, STEEL) + r(2, 15, 3, 2, STEEL) + r(2, 21, 3, 2, STEEL) + r(27, 9, 3, 2, STEEL) + r(27, 15, 3, 2, STEEL) + r(27, 21, 3, 2, STEEL) +
      r(9, 2, 2, 3, STEEL) + r(15, 2, 2, 3, STEEL) + r(21, 2, 2, 3, STEEL) + r(9, 27, 2, 3, STEEL) + r(15, 27, 2, 3, STEEL) + r(21, 27, 2, 3, STEEL) +
      r(13, 13, 2, 2, ORANGE)
    ),
  notebook: () =>
    wrap(
      r(6, 3, 21, 26, INK) + r(8, 5, 17, 22, PAPER) +
      r(4, 7, 4, 3, STEEL) + r(4, 13, 4, 3, STEEL) + r(4, 19, 4, 3, STEEL) +
      r(11, 9, 10, 2, ORANGE) + r(11, 13, 11, 1, INK) + r(11, 16, 9, 1, INK) + r(11, 19, 11, 1, INK) + r(11, 22, 6, 1, INK) +
      r(21, 24, 4, 3, TEAL)
    ),
  terminal: () =>
    wrap(
      r(2, 4, 28, 24, CHARCOAL) + r(4, 6, 24, 20, '#0a0f0c') +
      r(7, 10, 2, 2, GREEN) + r(9, 12, 2, 2, GREEN) + r(11, 14, 2, 2, GREEN) + r(9, 16, 2, 2, GREEN) + r(7, 18, 2, 2, GREEN) +
      r(15, 18, 8, 2, GREEN)
    ),
  notes: () =>
    wrap(
      r(7, 3, 18, 26, INK) + r(9, 5, 14, 22, '#fff2b0') +
      r(9, 5, 14, 3, AMBER) +
      r(11, 11, 10, 1, INK) + r(11, 14, 8, 1, INK) + r(11, 17, 10, 1, INK) + r(11, 20, 6, 1, INK) + r(11, 23, 9, 1, INK)
    ),
  sketch: () =>
    wrap(
      r(3, 3, 26, 26, INK) + r(5, 5, 22, 22, PAPER) +
      r(5, 10, 22, 1, '#b9c6d8') + r(5, 15, 22, 1, '#b9c6d8') + r(5, 20, 22, 1, '#b9c6d8') + r(10, 5, 1, 22, '#b9c6d8') + r(15, 5, 1, 22, '#b9c6d8') + r(20, 5, 1, 22, '#b9c6d8') +
      r(7, 13, 6, 2, INK) + r(12, 11, 6, 6, INK) + r(13, 12, 4, 4, ORANGE) + r(18, 13, 7, 2, INK) + r(24, 9, 2, 10, INK) + r(7, 18, 2, 6, INK) + r(7, 23, 18, 2, INK) + r(24, 19, 2, 6, INK)
    ),
  jukebox: () =>
    wrap(
      r(2, 6, 28, 20, CHARCOAL) + r(4, 8, 24, 16, CREAM) +
      r(6, 10, 20, 9, INK) + r(8, 12, 5, 5, STEEL) + r(9, 13, 3, 3, INK) + r(19, 12, 5, 5, STEEL) + r(20, 13, 3, 3, INK) + r(13, 14, 6, 2, PAPER) +
      r(9, 21, 14, 2, ORANGE)
    ),
  scope: () =>
    wrap(
      r(2, 4, 28, 24, CREAM) + r(2, 4, 28, 2, STEEL) + r(4, 8, 16, 14, INK) + r(5, 9, 14, 12, '#08150d') +
      r(6, 15, 2, 1, GREEN) + r(8, 12, 2, 3, GREEN) + r(10, 10, 2, 2, GREEN) + r(12, 12, 2, 3, GREEN) + r(14, 15, 2, 3, GREEN) + r(16, 18, 2, 1, GREEN) +
      r(23, 9, 4, 4, CHARCOAL) + r(23, 15, 4, 4, CHARCOAL) + r(23, 21, 4, 4, ORANGE) + r(5, 24, 14, 2, STEEL)
    ),
  wireup: () =>
    wrap(
      r(2, 2, 28, 28, PCB) +
      r(6, 5, 4, 12, COPPER) + r(6, 15, 12, 4, COPPER) + r(16, 15, 4, 12, COPPER) + r(18, 5, 10, 4, COPPER) +
      r(4, 3, 8, 8, INK) + r(6, 5, 4, 4, GOLD) + r(14, 13, 8, 8, INK) + r(16, 15, 4, 4, TEAL) + r(24, 21, 6, 6, INK) + r(26, 23, 2, 2, AMBER)
    ),
  solder: () =>
    wrap(
      r(20, 3, 9, 9, CHARCOAL) + r(22, 5, 5, 5, '#3f4750') + r(14, 11, 6, 2, STEEL) + r(12, 13, 4, 2, STEEL) + r(10, 15, 4, 2, STEEL) + r(8, 17, 4, 2, STEEL) +
      r(5, 19, 5, 3, STEEL) + r(3, 21, 4, 4, ORANGE) +
      r(23, 13, 2, 3, '#9aa3ad') + r(21, 15, 2, 2, '#9aa3ad') + r(24, 17, 2, 2, '#9aa3ad')
    ),
  quiz: () =>
    wrap(
      r(2, 13, 6, 4, STEEL) + r(24, 13, 6, 4, STEEL) + r(7, 9, 18, 12, CREAM) +
      r(9, 9, 3, 12, RED) + r(13, 9, 3, 12, '#7a4bd6') + r(17, 9, 3, 12, ORANGE) + r(21, 9, 3, 12, GOLD) +
      r(12, 23, 8, 2, INK) + r(18, 25, 2, 2, INK) + r(15, 28, 3, 2, INK)
    ),
  settings: () =>
    wrap(
      r(2, 4, 28, 24, CHARCOAL) + r(4, 6, 24, 20, CREAM) +
      r(7, 9, 7, 7, INK) + r(9, 11, 3, 3, STEEL) + r(9, 9, 3, 2, ORANGE) +
      r(18, 9, 7, 7, INK) + r(20, 11, 3, 3, STEEL) + r(23, 12, 2, 2, ORANGE) +
      r(7, 19, 18, 3, STEEL) + r(15, 18, 4, 5, ORANGE)
    ),
  bin: () =>
    wrap(
      r(4, 8, 24, 3, STEEL) + r(6, 11, 20, 17, CHARCOAL) + r(8, 13, 16, 13, '#3f4750') +
      r(10, 15, 3, 9, GOLD) + r(14, 15, 3, 9, RED) + r(18, 15, 3, 9, TEAL) +
      r(12, 5, 8, 3, STEEL)
    ),
  binFull: () =>
    wrap(
      r(6, 11, 20, 17, CHARCOAL) + r(8, 13, 16, 13, '#3f4750') +
      r(10, 15, 3, 9, GOLD) + r(14, 15, 3, 9, RED) + r(18, 15, 3, 9, TEAL) +
      r(9, 3, 9, 9, PAPER) + r(8, 2, 11, 1, INK) + r(8, 2, 1, 10, INK) + r(18, 2, 1, 10, INK) + r(11, 5, 5, 1, INK) + r(11, 8, 4, 1, INK) +
      r(20, 6, 6, 4, COPPER) + r(22, 4, 2, 2, COPPER)
    ),
  file: () => wrap(r(7, 3, 16, 26, INK) + r(9, 5, 12, 22, PAPER) + r(11, 10, 8, 1, STEEL) + r(11, 13, 8, 1, STEEL) + r(11, 16, 6, 1, STEEL)),
  image: () => wrap(r(4, 5, 24, 22, INK) + r(6, 7, 20, 18, '#8ad0ff') + r(8, 17, 16, 6, GREEN) + r(12, 13, 6, 4, GREEN) + r(19, 9, 4, 4, AMBER)),
  zip: () => wrap(r(7, 3, 18, 26, INK) + r(9, 5, 14, 22, AMBER) + r(14, 5, 2, 2, INK) + r(16, 7, 2, 2, INK) + r(14, 9, 2, 2, INK) + r(16, 11, 2, 2, INK) + r(14, 13, 2, 2, INK) + r(13, 17, 6, 5, INK) + r(15, 19, 2, 2, AMBER)),
  info: () => wrap(r(3, 3, 26, 26, INK) + r(5, 5, 22, 22, TEAL) + r(14, 8, 4, 4, INK) + r(14, 14, 4, 10, INK)),
  warning: () => wrap(r(14, 3, 4, 3, INK) + r(12, 6, 8, 5, INK) + r(10, 11, 12, 5, INK) + r(8, 16, 16, 5, INK) + r(6, 21, 20, 5, INK) + r(4, 26, 24, 3, INK) + r(14, 8, 4, 10, AMBER) + r(14, 20, 4, 4, AMBER)),
  play: () => wrap(r(9, 5, 4, 22, INK) + r(13, 8, 4, 16, INK) + r(17, 11, 4, 10, INK) + r(21, 14, 3, 4, INK)),
  pause: () => wrap(r(8, 6, 6, 20, INK) + r(18, 6, 6, 20, INK)),
  next: () => wrap(r(6, 7, 4, 18, INK) + r(10, 10, 4, 12, INK) + r(14, 13, 4, 6, INK) + r(21, 7, 4, 18, INK)),
  prev: () => wrap(r(22, 7, 4, 18, INK) + r(18, 10, 4, 12, INK) + r(14, 13, 4, 6, INK) + r(7, 7, 4, 18, INK)),
  volumeOn: () => wrap(r(5, 12, 5, 8, PAPER) + r(10, 9, 3, 14, PAPER) + r(13, 6, 3, 20, PAPER) + r(19, 12, 2, 8, PAPER) + r(23, 9, 2, 14, PAPER) + r(21, 8, 2, 2, PAPER) + r(21, 22, 2, 2, PAPER)),
  volumeOff: () => wrap(r(5, 12, 5, 8, PAPER) + r(10, 9, 3, 14, PAPER) + r(13, 6, 3, 20, PAPER) + r(19, 11, 2, 2, RED) + r(21, 13, 2, 2, RED) + r(23, 15, 2, 2, RED) + r(21, 17, 2, 2, RED) + r(19, 19, 2, 2, RED) + r(23, 11, 2, 2, RED) + r(25, 9, 2, 2, RED) + r(25, 21, 2, 2, RED) + r(23, 19, 2, 2, RED)),
  close: () => wrap(r(6, 6, 20, 20, INK)),
  minimize: () => wrap(r(6, 6, 20, 20, INK)),
  maximize: () => wrap(r(6, 6, 20, 20, INK)),
  restore: () => wrap(r(6, 6, 20, 20, INK)),
  back: () => wrap(r(4, 14, 4, 4, INK) + r(8, 10, 4, 4, INK) + r(8, 18, 4, 4, INK) + r(12, 6, 4, 4, INK) + r(12, 22, 4, 4, INK) + r(8, 14, 20, 4, INK)),
  power: () => wrap(r(14, 3, 4, 12, PAPER) + r(8, 7, 3, 3, PAPER) + r(21, 7, 3, 3, PAPER) + r(6, 10, 3, 10, PAPER) + r(23, 10, 3, 10, PAPER) + r(8, 20, 3, 4, PAPER) + r(21, 20, 3, 4, PAPER) + r(11, 24, 10, 3, PAPER)),
  cube: () => wrap(r(15, 3, 2, 2, PAPER) + r(9, 6, 14, 2, PAPER) + r(5, 9, 22, 14, PAPER) + r(7, 11, 8, 10, TEAL) + r(17, 11, 8, 10, '#2b9c85') + r(11, 23, 10, 3, PAPER)),
  flat: () => wrap(r(3, 5, 26, 18, PAPER) + r(5, 7, 22, 14, CHARCOAL) + r(9, 25, 14, 3, PAPER)),
  bench: () => wrap(r(3, 15, 26, 3, PAPER) + r(5, 18, 3, 10, PAPER) + r(24, 18, 3, 10, PAPER) + r(10, 5, 12, 10, PAPER) + r(12, 7, 8, 6, TEAL) + r(14, 21, 4, 2, PAPER)),
  menu: () => wrap(r(4, 6, 24, 4, PAPER) + r(4, 14, 24, 4, PAPER) + r(4, 22, 24, 4, PAPER)),
  cat: () => wrap(r(7, 6, 4, 6, INK) + r(21, 6, 4, 6, INK) + r(9, 10, 14, 12, INK) + r(11, 12, 10, 8, '#8d8378') + r(12, 14, 2, 2, GREEN) + r(18, 14, 2, 2, GREEN) + r(15, 17, 2, 1, RED) + r(6, 20, 20, 8, INK) + r(8, 22, 16, 4, '#8d8378')),
  led: () => wrap(r(13, 4, 6, 12, RED) + r(11, 8, 10, 10, RED) + r(11, 18, 10, 2, STEEL) + r(13, 20, 2, 8, STEEL) + r(17, 20, 2, 8, STEEL)),
};

export function icon(name, className = '') {
  const fn = ICONS[name] || ICONS.file;
  const markup = fn();
  return className ? markup.replace('<svg ', `<svg class="${className}" `) : markup;
}

export function iconEl(name, className = '') {
  const tpl = document.createElement('template');
  tpl.innerHTML = icon(name, className);
  return tpl.content.firstElementChild;
}
