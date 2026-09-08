// Pixel-flat SVG icon set for RickyOS. All icons are 32x32 with crisp edges.
const wrap = (body, extra = '') =>
  `<svg viewBox="0 0 32 32" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" ${extra}>${body}</svg>`;

const INK = '#1e1b18';
const PAPER = '#fbf8f0';
const ACCENT = 'var(--os-accent, #ff6b4a)';
const TEAL = '#3aa0a8';
const GREEN = '#4caf7d';
const YELLOW = '#e4b33c';
const GRAY = '#8a8578';

const r = (x, y, w, h, fill) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"/>`;

export const ICONS = {
  logo: () =>
    wrap(
      r(2, 2, 28, 28, INK) + r(4, 4, 24, 24, ACCENT) +
      r(9, 8, 10, 4, INK) + r(9, 8, 3, 16, INK) + r(17, 10, 3, 5, INK) + r(9, 14, 10, 3, INK) + r(15, 17, 3, 3, INK) + r(18, 20, 3, 4, INK)
    ),
  showcase: () =>
    wrap(
      r(3, 4, 26, 19, INK) + r(5, 6, 22, 15, TEAL) + r(7, 8, 18, 11, PAPER) +
      r(9, 10, 6, 2, INK) + r(9, 13, 12, 1, GRAY) + r(9, 15, 10, 1, GRAY) + r(9, 17, 8, 1, ACCENT) +
      r(12, 23, 8, 3, INK) + r(8, 26, 16, 3, INK) + r(10, 27, 12, 1, GRAY)
    ),
  terminal: () =>
    wrap(
      r(2, 4, 28, 24, INK) + r(4, 6, 24, 20, '#0a0f0c') +
      r(7, 10, 2, 2, '#9dff9d') + r(9, 12, 2, 2, '#9dff9d') + r(11, 14, 2, 2, '#9dff9d') + r(9, 16, 2, 2, '#9dff9d') + r(7, 18, 2, 2, '#9dff9d') +
      r(15, 18, 8, 2, '#9dff9d')
    ),
  mines: () =>
    wrap(
      r(3, 3, 26, 26, PAPER) + r(3, 3, 26, 2, INK) + r(3, 3, 2, 26, INK) + r(27, 3, 2, 26, INK) + r(3, 27, 26, 2, INK) +
      r(11, 9, 10, 14, INK) + r(9, 11, 14, 10, INK) + r(13, 7, 6, 2, INK) + r(13, 23, 6, 2, INK) + r(7, 13, 2, 6, INK) + r(23, 13, 2, 6, INK) +
      r(13, 12, 3, 3, PAPER) + r(19, 5, 2, 2, YELLOW) + r(21, 3, 2, 2, ACCENT)
    ),
  rickle: () =>
    wrap(
      r(3, 3, 8, 8, GREEN) + r(12, 3, 8, 8, YELLOW) + r(21, 3, 8, 8, GRAY) +
      r(3, 12, 8, 8, GRAY) + r(12, 12, 8, 8, GREEN) + r(21, 12, 8, 8, GREEN) +
      r(3, 21, 8, 8, YELLOW) + r(12, 21, 8, 8, GRAY) + r(21, 21, 8, 8, GREEN) +
      r(6, 5, 2, 4, PAPER) + r(15, 5, 2, 4, PAPER) + r(24, 5, 2, 4, PAPER) + r(6, 14, 2, 4, PAPER) + r(15, 14, 2, 4, PAPER) + r(24, 14, 2, 4, PAPER)
    ),
  snake: () =>
    wrap(
      r(2, 2, 28, 28, '#0a1f16') +
      r(5, 8, 12, 3, '#9dff9d') + r(14, 8, 3, 8, '#9dff9d') + r(8, 13, 9, 3, '#9dff9d') + r(8, 13, 3, 9, '#9dff9d') + r(8, 19, 13, 3, '#9dff9d') + r(18, 19, 3, 6, '#9dff9d') +
      r(22, 8, 4, 4, ACCENT)
    ),
  paint: () =>
    wrap(
      r(4, 5, 24, 18, INK) + r(6, 7, 20, 14, PAPER) +
      r(8, 9, 4, 4, ACCENT) + r(13, 9, 4, 4, YELLOW) + r(18, 9, 4, 4, GREEN) + r(8, 14, 4, 4, TEAL) + r(13, 14, 4, 4, '#7a4bd6') + r(18, 14, 4, 4, INK) +
      r(20, 20, 3, 9, INK) + r(21, 17, 5, 5, '#c8873a') + r(24, 15, 4, 3, INK)
    ),
  music: () =>
    wrap(
      r(2, 7, 28, 18, INK) + r(4, 9, 24, 14, '#3b3b46') + r(6, 11, 20, 8, PAPER) +
      r(8, 13, 5, 5, INK) + r(9, 14, 3, 3, PAPER) + r(19, 13, 5, 5, INK) + r(20, 14, 3, 3, PAPER) + r(13, 15, 6, 2, GRAY) +
      r(9, 21, 14, 2, ACCENT)
    ),
  notepad: () =>
    wrap(
      r(6, 2, 18, 28, INK) + r(8, 4, 14, 24, PAPER) + r(17, 4, 5, 5, GRAY) +
      r(10, 11, 10, 1, INK) + r(10, 14, 8, 1, INK) + r(10, 17, 10, 1, INK) + r(10, 20, 6, 1, INK) + r(10, 23, 9, 1, INK)
    ),
  trash: () =>
    wrap(
      r(8, 6, 16, 3, INK) + r(13, 3, 6, 3, INK) + r(6, 9, 20, 2, INK) + r(8, 11, 16, 18, INK) + r(10, 13, 12, 14, GRAY) +
      r(12, 14, 2, 11, PAPER) + r(15, 14, 2, 11, PAPER) + r(18, 14, 2, 11, PAPER)
    ),
  trashFull: () =>
    wrap(
      r(6, 9, 20, 2, INK) + r(8, 11, 16, 18, INK) + r(10, 13, 12, 14, GRAY) +
      r(12, 14, 2, 11, PAPER) + r(15, 14, 2, 11, PAPER) + r(18, 14, 2, 11, PAPER) +
      r(10, 3, 9, 8, PAPER) + r(9, 2, 11, 1, INK) + r(9, 2, 1, 8, INK) + r(19, 2, 1, 8, INK) + r(12, 4, 5, 1, INK) + r(12, 6, 4, 1, INK)
    ),
  settings: () =>
    wrap(
      r(3, 4, 26, 24, INK) + r(5, 6, 22, 20, PAPER) +
      r(8, 10, 16, 2, GRAY) + r(12, 8, 4, 6, ACCENT) +
      r(8, 16, 16, 2, GRAY) + r(18, 14, 4, 6, TEAL) +
      r(8, 22, 16, 2, GRAY) + r(9, 20, 4, 6, GREEN)
    ),
  credits: () =>
    wrap(
      r(15, 3, 2, 5, YELLOW) + r(13, 8, 6, 4, YELLOW) + r(5, 12, 22, 3, YELLOW) + r(8, 15, 16, 3, YELLOW) + r(10, 18, 12, 3, YELLOW) +
      r(8, 21, 6, 3, YELLOW) + r(18, 21, 6, 3, YELLOW) + r(6, 24, 5, 3, YELLOW) + r(21, 24, 5, 3, YELLOW) +
      r(15, 3, 2, 2, INK) + r(5, 12, 22, 1, INK) + r(14, 14, 4, 3, ACCENT)
    ),
  folder: () =>
    wrap(r(3, 7, 11, 4, INK) + r(3, 10, 26, 18, INK) + r(5, 12, 22, 14, YELLOW) + r(5, 9, 7, 3, YELLOW) + r(5, 15, 22, 2, '#c99a2a')),
  file: () => wrap(r(7, 3, 16, 26, INK) + r(9, 5, 12, 22, PAPER) + r(11, 10, 8, 1, GRAY) + r(11, 13, 8, 1, GRAY) + r(11, 16, 6, 1, GRAY)),
  image: () => wrap(r(4, 5, 24, 22, INK) + r(6, 7, 20, 18, '#8ad0ff') + r(8, 17, 16, 6, GREEN) + r(12, 13, 6, 4, GREEN) + r(19, 9, 4, 4, YELLOW)),
  zip: () => wrap(r(7, 3, 18, 26, INK) + r(9, 5, 14, 22, YELLOW) + r(14, 5, 2, 2, INK) + r(16, 7, 2, 2, INK) + r(14, 9, 2, 2, INK) + r(16, 11, 2, 2, INK) + r(14, 13, 2, 2, INK) + r(13, 17, 6, 5, INK) + r(15, 19, 2, 2, YELLOW)),
  code: () => wrap(r(2, 4, 28, 24, INK) + r(4, 6, 24, 20, '#0a0f0c') + r(9, 11, 2, 2, TEAL) + r(7, 13, 2, 2, TEAL) + r(5, 15, 2, 2, TEAL) + r(7, 17, 2, 2, TEAL) + r(9, 19, 2, 2, TEAL) + r(21, 11, 2, 2, TEAL) + r(23, 13, 2, 2, TEAL) + r(25, 15, 2, 2, TEAL) + r(23, 17, 2, 2, TEAL) + r(21, 19, 2, 2, TEAL) + r(14, 11, 4, 2, ACCENT) + r(13, 14, 4, 2, ACCENT) + r(12, 17, 4, 2, ACCENT)),
  chip: () => wrap(r(8, 8, 16, 16, INK) + r(10, 10, 12, 12, GREEN) + r(13, 13, 6, 6, INK) + r(4, 10, 4, 2, INK) + r(4, 15, 4, 2, INK) + r(4, 20, 4, 2, INK) + r(24, 10, 4, 2, INK) + r(24, 15, 4, 2, INK) + r(24, 20, 4, 2, INK) + r(10, 4, 2, 4, INK) + r(15, 4, 2, 4, INK) + r(20, 4, 2, 4, INK) + r(10, 24, 2, 4, INK) + r(15, 24, 2, 4, INK) + r(20, 24, 2, 4, INK)),
  note: () => wrap(r(18, 3, 3, 18, INK) + r(21, 3, 7, 3, INK) + r(21, 6, 4, 4, INK) + r(10, 19, 11, 8, INK) + r(12, 21, 7, 4, ACCENT)),
  info: () => wrap(r(3, 3, 26, 26, INK) + r(5, 5, 22, 22, TEAL) + r(14, 8, 4, 4, PAPER) + r(14, 14, 4, 10, PAPER)),
  warning: () => wrap(r(14, 3, 4, 3, INK) + r(12, 6, 8, 5, INK) + r(10, 11, 12, 5, INK) + r(8, 16, 16, 5, INK) + r(6, 21, 20, 5, INK) + r(4, 26, 24, 3, INK) + r(14, 8, 4, 10, YELLOW) + r(14, 20, 4, 4, YELLOW)),
  computer: () => wrap(r(3, 3, 26, 20, INK) + r(5, 5, 22, 16, '#c9c2b2') + r(7, 7, 18, 12, TEAL) + r(9, 9, 6, 2, PAPER) + r(11, 23, 10, 3, INK) + r(7, 26, 18, 3, INK)),
  play: () => wrap(r(9, 5, 4, 22, INK) + r(13, 8, 4, 16, INK) + r(17, 11, 4, 10, INK) + r(21, 14, 3, 4, INK)),
  pause: () => wrap(r(8, 6, 6, 20, INK) + r(18, 6, 6, 20, INK)),
  next: () => wrap(r(6, 7, 4, 18, INK) + r(10, 10, 4, 12, INK) + r(14, 13, 4, 6, INK) + r(21, 7, 4, 18, INK)),
  prev: () => wrap(r(22, 7, 4, 18, INK) + r(18, 10, 4, 12, INK) + r(14, 13, 4, 6, INK) + r(7, 7, 4, 18, INK)),
  flag: () => wrap(r(13, 5, 3, 20, INK) + r(16, 5, 10, 8, ACCENT) + r(8, 24, 14, 3, INK)),
  mine: () => wrap(r(11, 9, 10, 14, INK) + r(9, 11, 14, 10, INK) + r(13, 7, 6, 2, INK) + r(13, 23, 6, 2, INK) + r(7, 13, 2, 6, INK) + r(23, 13, 2, 6, INK) + r(13, 12, 3, 3, PAPER)),
  faceSmile: () => wrap(r(4, 4, 24, 24, YELLOW) + r(4, 4, 24, 2, INK) + r(4, 26, 24, 2, INK) + r(4, 4, 2, 24, INK) + r(26, 4, 2, 24, INK) + r(10, 11, 3, 4, INK) + r(19, 11, 3, 4, INK) + r(9, 18, 3, 2, INK) + r(12, 20, 8, 2, INK) + r(20, 18, 3, 2, INK)),
  faceDead: () => wrap(r(4, 4, 24, 24, YELLOW) + r(4, 4, 24, 2, INK) + r(4, 26, 24, 2, INK) + r(4, 4, 2, 24, INK) + r(26, 4, 2, 24, INK) + r(9, 10, 2, 2, INK) + r(11, 12, 2, 2, INK) + r(13, 10, 2, 2, INK) + r(9, 14, 2, 2, INK) + r(13, 14, 2, 2, INK) + r(18, 10, 2, 2, INK) + r(20, 12, 2, 2, INK) + r(22, 10, 2, 2, INK) + r(18, 14, 2, 2, INK) + r(22, 14, 2, 2, INK) + r(11, 20, 10, 2, INK) + r(9, 22, 3, 2, INK) + r(20, 22, 3, 2, INK)),
  faceCool: () => wrap(r(4, 4, 24, 24, YELLOW) + r(4, 4, 24, 2, INK) + r(4, 26, 24, 2, INK) + r(4, 4, 2, 24, INK) + r(26, 4, 2, 24, INK) + r(7, 10, 8, 5, INK) + r(17, 10, 8, 5, INK) + r(15, 11, 2, 2, INK) + r(10, 20, 12, 2, INK) + r(9, 18, 2, 2, INK) + r(21, 18, 2, 2, INK)),
  faceOh: () => wrap(r(4, 4, 24, 24, YELLOW) + r(4, 4, 24, 2, INK) + r(4, 26, 24, 2, INK) + r(4, 4, 2, 24, INK) + r(26, 4, 2, 24, INK) + r(10, 10, 3, 4, INK) + r(19, 10, 3, 4, INK) + r(13, 18, 6, 6, INK) + r(15, 20, 2, 2, YELLOW)),
  volumeOn: () => wrap(r(5, 12, 5, 8, INK) + r(10, 9, 3, 14, INK) + r(13, 6, 3, 20, INK) + r(19, 12, 2, 8, INK) + r(23, 9, 2, 14, INK) + r(21, 8, 2, 2, INK) + r(21, 22, 2, 2, INK)),
  volumeOff: () => wrap(r(5, 12, 5, 8, INK) + r(10, 9, 3, 14, INK) + r(13, 6, 3, 20, INK) + r(19, 11, 2, 2, INK) + r(21, 13, 2, 2, INK) + r(23, 15, 2, 2, INK) + r(21, 17, 2, 2, INK) + r(19, 19, 2, 2, INK) + r(23, 11, 2, 2, INK) + r(25, 9, 2, 2, INK) + r(25, 21, 2, 2, INK) + r(23, 19, 2, 2, INK)),
  close: () => wrap(r(4, 4, 6, 6, INK) + r(10, 10, 4, 4, INK) + r(14, 14, 4, 4, INK) + r(18, 18, 4, 4, INK) + r(22, 22, 6, 6, INK) + r(22, 4, 6, 6, INK) + r(18, 10, 4, 4, INK) + r(10, 18, 4, 4, INK) + r(4, 22, 6, 6, INK)),
  minimize: () => wrap(r(4, 22, 24, 6, INK)),
  maximize: () => wrap(r(3, 3, 26, 26, INK) + r(7, 9, 18, 16, PAPER)),
  restore: () => wrap(r(9, 3, 20, 20, INK) + r(13, 7, 12, 12, PAPER) + r(3, 9, 20, 20, INK) + r(7, 15, 12, 10, PAPER)),
  back: () => wrap(r(4, 14, 4, 4, INK) + r(8, 10, 4, 4, INK) + r(8, 18, 4, 4, INK) + r(12, 6, 4, 4, INK) + r(12, 22, 4, 4, INK) + r(8, 14, 20, 4, INK)),
  power: () => wrap(r(14, 3, 4, 12, INK) + r(8, 7, 3, 3, INK) + r(21, 7, 3, 3, INK) + r(6, 10, 3, 10, INK) + r(23, 10, 3, 10, INK) + r(8, 20, 3, 4, INK) + r(21, 20, 3, 4, INK) + r(11, 24, 10, 3, INK)),
  eject: () => wrap(r(14, 6, 4, 4, INK) + r(10, 10, 12, 4, INK) + r(6, 14, 20, 4, INK) + r(6, 21, 20, 4, INK)),
  cube: () => wrap(r(15, 3, 2, 2, INK) + r(9, 6, 14, 2, INK) + r(5, 9, 22, 14, INK) + r(7, 11, 8, 10, TEAL) + r(17, 11, 8, 10, '#2b7c82') + r(11, 23, 10, 3, INK)),
};

export function icon(name, className = '') {
  const fn = ICONS[name] || ICONS.file;
  const markup = fn();
  return className ? markup.replace('<svg ', `<svg class="${className}" `) : markup;
}

/** Returns an actual SVG element (cloneable) for the given icon name. */
export function iconEl(name, className = '') {
  const tpl = document.createElement('template');
  tpl.innerHTML = icon(name, className);
  return tpl.content.firstElementChild;
}
