// Wire Up: rotate the copper traces until the battery lights the bulb.
import { el, clear } from '../../util/dom.js';
import { store } from '../../util/storage.js';
import { sound } from '../../sound.js';

const N = 1, E = 2, S = 4, W = 8;
const LEVELS = [4, 5, 5, 6, 6, 7, 7, 8];
const rot = (mask) => ((mask << 1) | (mask >> 3)) & 15;
const rotN = (mask, n) => { for (let i = 0; i < n; i++) mask = rot(mask); return mask; };

function generate(n) {
  // randomized DFS spanning tree over the grid
  const cells = Array.from({ length: n * n }, () => 0);
  const visited = new Uint8Array(n * n);
  const stack = [];
  const src = Math.floor(n / 2) * n; // left edge, middle row
  visited[src] = 1;
  stack.push(src);
  const dirs = [[0, -1, N, S], [1, 0, E, W], [0, 1, S, N], [-1, 0, W, E]];
  while (stack.length) {
    const cur = stack[stack.length - 1];
    const x = cur % n;
    const y = Math.floor(cur / n);
    const options = dirs.filter(([dx, dy]) => {
      const nx = x + dx, ny = y + dy;
      return nx >= 0 && ny >= 0 && nx < n && ny < n && !visited[ny * n + nx];
    });
    if (!options.length) { stack.pop(); continue; }
    const [dx, dy, bit, back] = options[Math.floor(Math.random() * options.length)];
    const next = (y + dy) * n + (x + dx);
    cells[cur] |= bit;
    cells[next] |= back;
    visited[next] = 1;
    stack.push(next);
  }
  return cells;
}

const SHAPES = {
  1: 'end', 5: 'straight', 3: 'corner', 7: 'tee', 15: 'cross',
};
function baseOf(mask) {
  for (const base of [1, 5, 3, 7, 15]) for (let r = 0; r < 4; r++) if (rotN(base, r) === mask) return { base, r };
  return { base: 1, r: 0 };
}

function tileSvg(base, kind) {
  const half = 50;
  const parts = [];
  const seg = (dir) => {
    const [x, y] = dir === N ? [half, 0] : dir === E ? [100, half] : dir === S ? [half, 100] : [0, half];
    return `<line class="wire" x1="${half}" y1="${half}" x2="${x}" y2="${y}"/>`;
  };
  for (const d of [N, E, S, W]) if (base & d) parts.push(seg(d));
  if (kind === 'source') parts.push(`<rect class="batt" x="30" y="34" width="40" height="32" rx="3"/><rect class="batt" x="44" y="28" width="12" height="6"/><text x="50" y="57" text-anchor="middle" font-size="18" font-family="IBM Plex Mono, monospace" font-weight="600" fill="#1c1a17">+</text>`);
  else if (kind === 'bulb') parts.push(`<circle class="bulb" cx="50" cy="50" r="19"/>`);
  else if (base === 1) parts.push(`<circle class="pad" cx="50" cy="50" r="12"/><circle cx="50" cy="50" r="5" fill="#0d1512"/>`);
  else parts.push(`<circle class="pad" cx="50" cy="50" r="8"/>`);
  return `<svg viewBox="0 0 100 100" aria-hidden="true">${parts.join('')}</svg>`;
}

export default {
  id: 'wireup',
  name: 'Wire Up',
  icon: 'wireup',
  desktop: true,
  startMenu: true,
  launch(os) {
    const { width: W, height: H } = os.wm.bounds;
    return os.wm.open({
      id: 'wireup', title: 'Wire Up', icon: 'wireup',
      width: Math.min(560, W - 100), height: Math.min(640, H - 60), minWidth: 340, minHeight: 400,
      bodyClass: 'no-scroll dark',
      render: (body, win) => mountWireUp(os, body, win),
    });
  },
};

function mountWireUp(os, body, win) {
  let level = 0;
  let n = LEVELS[0];
  let tiles = [];
  let moves = 0;
  let seconds = 0;
  let timer = null;
  let solved = false;
  const best = store.get('wireup.best', {}) || {};

  const levelEl = el('span');
  const movesEl = el('span');
  const timeEl = el('span');
  const grid = el('div', { class: 'wu-grid', role: 'grid' });
  const msg = el('div', { class: 'wu-msg' });
  const nextBtn = el('button', { class: 'os-btn primary', type: 'button' }, 'Next level');
  const resetBtn = el('button', { class: 'os-btn', type: 'button' }, 'Shuffle');
  body.append(el('div', { class: 'wu' }, el('div', { class: 'wu-head' }, levelEl, movesEl, timeEl), grid, msg, el('div', { class: 'wu-bar' }, resetBtn, nextBtn)));

  const stopTimer = () => { clearInterval(timer); timer = null; };
  win.onCleanup(stopTimer);
  const updateHead = () => {
    levelEl.innerHTML = `Level <b>${level + 1}</b> / ${LEVELS.length} - ${n}x${n}`;
    movesEl.innerHTML = `Moves <b>${moves}</b>`;
    const b = best[level];
    timeEl.innerHTML = `Time <b>${seconds}s</b>${b ? ` (best ${b}s)` : ''}`;
  };

  const powered = () => {
    const src = Math.floor(n / 2) * n;
    const seen = new Uint8Array(n * n);
    const stack = [src];
    seen[src] = 1;
    while (stack.length) {
      const cur = stack.pop();
      const x = cur % n, y = Math.floor(cur / n);
      const mask = rotN(tiles[cur].base, tiles[cur].r);
      const tryDir = (bit, nx, ny, back) => {
        if (!(mask & bit) || nx < 0 || ny < 0 || nx >= n || ny >= n) return;
        const idx = ny * n + nx;
        const other = rotN(tiles[idx].base, tiles[idx].r);
        if (other & back && !seen[idx]) { seen[idx] = 1; stack.push(idx); }
      };
      tryDir(N, x, y - 1, S);
      tryDir(E, x + 1, y, W);
      tryDir(S, x, y + 1, N);
      tryDir(W, x - 1, y, E);
    }
    return seen;
  };

  const render = () => {
    const seen = powered();
    tiles.forEach((t, i) => {
      t.el.classList.toggle('live', !!seen[i]);
      t.el.firstElementChild.style.transform = `rotate(${t.r * 90}deg)`;
    });
    const bulbIdx = Math.floor(n / 2) * n + (n - 1);
    if (!solved && seen[bulbIdx]) {
      solved = true;
      stopTimer();
      sound.success();
      if (!best[level] || seconds < best[level]) {
        best[level] = seconds;
        store.set('wireup.best', best);
        msg.textContent = `Lit! ${moves} moves in ${seconds}s - new best.`;
      } else msg.textContent = `Lit! ${moves} moves in ${seconds}s.`;
      nextBtn.disabled = level >= LEVELS.length - 1;
      if (level >= LEVELS.length - 1) msg.textContent += ' That was the last board. Nicely done.';
      os.bus.emit('activity');
    }
    updateHead();
  };

  const newBoard = () => {
    n = LEVELS[level];
    const cells = generate(n);
    const src = Math.floor(n / 2) * n;
    const bulb = Math.floor(n / 2) * n + (n - 1);
    clear(grid);
    grid.style.gridTemplateColumns = `repeat(${n}, auto)`;
    const avail = (body.clientWidth || os.wm.bounds.width) - 36;
    const cell = Math.max(30, Math.min(52, Math.floor(avail / n)));
    tiles = cells.map((mask, i) => {
      const { base, r } = baseOf(mask);
      const kind = i === src ? 'source' : i === bulb ? 'bulb' : 'wire';
      const fixed = kind !== 'wire';
      const tile = { base, r: fixed ? r : (r + 1 + Math.floor(Math.random() * 3)) % 4, fixed };
      const btn = el('button', { class: `wu-cell${fixed ? ' fixed' : ''}`, type: 'button', role: 'gridcell', html: tileSvg(base, kind), 'aria-label': fixed ? kind : 'Rotate wire', style: { width: `${cell}px`, height: `${cell}px` } });
      btn.addEventListener('click', () => {
        if (fixed || solved) return;
        tile.r = (tile.r + 1) % 4;
        moves++;
        if (!timer) timer = setInterval(() => { seconds++; updateHead(); }, 1000);
        sound.click();
        render();
      });
      tile.el = btn;
      grid.append(btn);
      return tile;
    });
    moves = 0;
    seconds = 0;
    solved = false;
    stopTimer();
    msg.textContent = 'Rotate the traces to light the bulb.';
    nextBtn.disabled = true;
    render();
  };

  nextBtn.addEventListener('click', () => { level = Math.min(LEVELS.length - 1, level + 1); newBoard(); sound.open(); });
  resetBtn.addEventListener('click', () => { newBoard(); sound.tick(); });
  newBoard();
}
