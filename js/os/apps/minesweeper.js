// Minesweeper. Left click reveals, right click (or flag mode) flags, clicking
// a satisfied number reveals its neighbours. First click is always safe.
import { el, clear, isCoarsePointer } from '../../util/dom.js';
import { iconEl } from '../icons.js';
import { store } from '../../util/storage.js';
import { sound } from '../../sound.js';

const LEVELS = {
  beginner: { cols: 9, rows: 9, mines: 10, label: 'Beginner' },
  intermediate: { cols: 16, rows: 16, mines: 40, label: 'Intermediate' },
  expert: { cols: 30, rows: 16, mines: 99, label: 'Expert' },
};
const CELL = 26;

export default {
  id: 'minesweeper',
  name: 'Minesweeper',
  icon: 'mines',
  desktop: true,
  startMenu: true,
  launch(os) {
    return os.wm.open({
      id: 'minesweeper',
      title: 'Minesweeper',
      icon: 'mines',
      width: 320,
      height: 420,
      minWidth: 280,
      minHeight: 300,
      status: { left: 'Left: reveal - Right: flag', right: '' },
      render: (body, win) => mountMines(os, body, win),
    });
  },
};

function mountMines(os, body, win) {
  let level = store.get('mines.level', 'beginner');
  if (!LEVELS[level]) level = 'beginner';
  let grid = [];
  let cols = 0;
  let rows = 0;
  let mines = 0;
  let started = false;
  let over = false;
  let flags = 0;
  let revealedCount = 0;
  let seconds = 0;
  let timer = null;
  let flagMode = false;

  const counter = el('div', { class: 'mines-lcd', 'aria-label': 'Mines remaining' }, '010');
  const clock = el('div', { class: 'mines-lcd', 'aria-label': 'Seconds' }, '000');
  const face = el('button', { class: 'os-btn mines-face', type: 'button', title: 'New game', 'aria-label': 'New game' }, iconEl('faceSmile'));
  const gridEl = el('div', { class: 'mines-grid', role: 'grid' });
  const levelSel = el('select', { class: 'os-select', style: { width: 'auto', padding: '3px 6px', fontSize: '12px' }, 'aria-label': 'Difficulty' },
    Object.entries(LEVELS).map(([key, l]) => el('option', { value: key, selected: key === level }, l.label))
  );
  const flagBtn = el('button', { class: 'os-btn sm', type: 'button', 'aria-pressed': 'false' }, iconEl('flag'), 'Flag mode');
  const best = el('span');
  const bar = el('div', { class: 'mines-bar' }, levelSel, flagBtn, best);
  body.append(el('div', { class: 'mines' }, el('div', { class: 'mines-top' }, counter, face, clock), gridEl, bar));

  const setFace = (name) => face.replaceChildren(iconEl(name));
  const pad = (n) => String(Math.max(-99, Math.min(999, n))).padStart(3, '0');
  const updateBest = () => {
    const b = store.get(`mines.best.${level}`, null);
    best.textContent = b ? `Best: ${b}s` : 'Best: --';
  };

  const stopTimer = () => {
    clearInterval(timer);
    timer = null;
  };
  const startTimer = () => {
    stopTimer();
    timer = setInterval(() => {
      seconds = Math.min(999, seconds + 1);
      clock.textContent = pad(seconds);
    }, 1000);
  };
  win.onCleanup(stopTimer);

  const neighbors = (r, c) => {
    const out = [];
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (!dr && !dc) continue;
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) out.push(grid[nr][nc]);
      }
    }
    return out;
  };

  const newGame = () => {
    const L = LEVELS[level];
    cols = L.cols;
    rows = L.rows;
    mines = L.mines;
    started = false;
    over = false;
    flags = 0;
    revealedCount = 0;
    seconds = 0;
    stopTimer();
    clock.textContent = '000';
    counter.textContent = pad(mines);
    setFace('faceSmile');
    clear(gridEl);
    gridEl.style.gridTemplateColumns = `repeat(${cols}, ${CELL}px)`;
    grid = [];
    for (let r = 0; r < rows; r++) {
      const row = [];
      for (let c = 0; c < cols; c++) {
        const btn = el('button', { class: 'mine-cell', type: 'button', role: 'gridcell', 'aria-label': `Cell ${r + 1},${c + 1}` });
        const cell = { r, c, mine: false, revealed: false, flagged: false, count: 0, el: btn };
        btn.addEventListener('click', () => onClick(cell));
        btn.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          toggleFlag(cell);
        });
        let pressTimer = null;
        btn.addEventListener('pointerdown', (e) => {
          if (over) return;
          if (e.pointerType === 'touch') {
            pressTimer = setTimeout(() => {
              pressTimer = null;
              toggleFlag(cell);
            }, 450);
          }
          if (!cell.revealed && !cell.flagged) setFace('faceOh');
        });
        const cancelPress = () => {
          if (pressTimer) clearTimeout(pressTimer);
          pressTimer = null;
          if (!over) setFace('faceSmile');
        };
        btn.addEventListener('pointerup', cancelPress);
        btn.addEventListener('pointerleave', cancelPress);
        btn.addEventListener('pointercancel', cancelPress);
        row.push(cell);
        gridEl.append(btn);
      }
      grid.push(row);
    }
    updateBest();
    // size the window to the board
    const w = cols * CELL + 40;
    const h = rows * CELL + 200;
    win.resize(Math.max(340, w), Math.max(380, h));
  };

  const placeMines = (safe) => {
    const forbidden = new Set([safe, ...neighbors(safe.r, safe.c)]);
    let placed = 0;
    while (placed < mines) {
      const r = Math.floor(Math.random() * rows);
      const c = Math.floor(Math.random() * cols);
      const cell = grid[r][c];
      if (cell.mine || forbidden.has(cell)) continue;
      cell.mine = true;
      placed++;
    }
    for (const row of grid) for (const cell of row) cell.count = neighbors(cell.r, cell.c).filter((n) => n.mine).length;
  };

  const reveal = (cell) => {
    if (cell.revealed || cell.flagged || over) return;
    cell.revealed = true;
    revealedCount++;
    cell.el.classList.add('revealed');
    if (cell.mine) {
      cell.el.classList.add('boom');
      cell.el.replaceChildren(iconEl('mine'));
      lose();
      return;
    }
    if (cell.count) {
      cell.el.textContent = String(cell.count);
      cell.el.classList.add(`n${cell.count}`);
    } else {
      // flood fill
      const stack = [cell];
      while (stack.length) {
        const cur = stack.pop();
        for (const n of neighbors(cur.r, cur.c)) {
          if (n.revealed || n.flagged || n.mine) continue;
          n.revealed = true;
          revealedCount++;
          n.el.classList.add('revealed');
          if (n.count) {
            n.el.textContent = String(n.count);
            n.el.classList.add(`n${n.count}`);
          } else stack.push(n);
        }
      }
    }
    checkWin();
  };

  const chord = (cell) => {
    const ns = neighbors(cell.r, cell.c);
    const flagged = ns.filter((n) => n.flagged).length;
    if (flagged !== cell.count) return;
    for (const n of ns) if (!n.flagged && !n.revealed) reveal(n);
  };

  const onClick = (cell) => {
    if (over) return;
    if (flagMode && !cell.revealed) return toggleFlag(cell);
    if (cell.flagged) return;
    if (!started) {
      started = true;
      placeMines(cell);
      startTimer();
    }
    if (cell.revealed) chord(cell);
    else reveal(cell);
    sound.tick();
  };

  const toggleFlag = (cell) => {
    if (over || cell.revealed) return;
    cell.flagged = !cell.flagged;
    flags += cell.flagged ? 1 : -1;
    cell.el.replaceChildren(cell.flagged ? iconEl('flag') : '');
    cell.el.setAttribute('aria-pressed', String(cell.flagged));
    counter.textContent = pad(mines - flags);
    sound.click(!cell.flagged);
  };

  const lose = () => {
    over = true;
    stopTimer();
    setFace('faceDead');
    sound.boom();
    for (const row of grid) {
      for (const cell of row) {
        if (cell.mine && !cell.revealed && !cell.flagged) {
          cell.el.classList.add('revealed');
          cell.el.replaceChildren(iconEl('mine'));
        }
        if (cell.flagged && !cell.mine) cell.el.style.opacity = '0.45';
      }
    }
    win.setStatus('Boom. Click the face to try again.', '');
  };

  const checkWin = () => {
    if (over) return;
    if (revealedCount === rows * cols - mines) {
      over = true;
      stopTimer();
      setFace('faceCool');
      sound.success();
      for (const row of grid) for (const cell of row) if (cell.mine && !cell.flagged) { cell.flagged = true; cell.el.replaceChildren(iconEl('flag')); }
      counter.textContent = '000';
      const prev = store.get(`mines.best.${level}`, null);
      if (!prev || seconds < prev) {
        store.set(`mines.best.${level}`, seconds);
        win.setStatus(`New best time: ${seconds}s!`, '');
      } else win.setStatus(`Cleared in ${seconds}s.`, '');
      updateBest();
    }
  };

  face.addEventListener('click', () => {
    sound.tick();
    newGame();
    win.setStatus('Left: reveal - Right: flag', '');
  });
  levelSel.addEventListener('change', () => {
    level = levelSel.value;
    store.set('mines.level', level);
    newGame();
  });
  flagBtn.addEventListener('click', () => {
    flagMode = !flagMode;
    flagBtn.setAttribute('aria-pressed', String(flagMode));
    flagBtn.classList.toggle('pressed', flagMode);
    sound.tick();
  });
  if (isCoarsePointer()) win.setStatus('Tap: reveal - Hold: flag', '');
  newGame();
}
