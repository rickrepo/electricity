// Snake on a canvas. Arrow keys / WASD, swipe, or the on-screen pad.
import { el, isCoarsePointer } from '../../util/dom.js';
import { store } from '../../util/storage.js';
import { sound } from '../../sound.js';

const GRID = 20;
const CELL = 18;
const SIZE = GRID * CELL;

export default {
  id: 'snake',
  name: 'Snake',
  icon: 'snake',
  desktop: true,
  startMenu: true,
  launch(os) {
    const { height: H } = os.wm.bounds;
    const touch = isCoarsePointer();
    return os.wm.open({
      id: 'snake',
      title: 'Snake',
      icon: 'snake',
      width: 430,
      height: Math.min(touch ? 660 : 520, H - 40),
      minWidth: 320,
      minHeight: 360,
      bodyClass: 'flush no-scroll',
      render: (body, win) => mountSnake(os, body, win, touch),
    });
  },
};

function mountSnake(os, body, win, touch) {
  const canvas = el('canvas', { width: SIZE, height: SIZE, 'aria-label': 'Snake game board' });
  const ctx = canvas.getContext('2d');
  const scoreEl = el('span', {}, 'Score 0');
  const bestEl = el('span', {}, `Best ${store.get('snake.best', 0)}`);
  const overlay = el('div', { class: 'snake-overlay' });
  const wrap = el('div', { class: 'snake-wrap' }, canvas, overlay);
  const root = el('div', { class: 'snake' }, el('div', { class: 'snake-head' }, scoreEl, bestEl), wrap);

  let snake;
  let dir;
  let nextDir;
  let food;
  let score;
  let alive = false;
  let paused = false;
  let stepMs;
  let acc = 0;
  let last = 0;
  let raf = null;

  const rnd = (n) => Math.floor(Math.random() * n);
  const placeFood = () => {
    do food = { x: rnd(GRID), y: rnd(GRID) };
    while (snake.some((s) => s.x === food.x && s.y === food.y));
  };

  const showOverlay = (title, text, btnLabel) => {
    overlay.replaceChildren(el('h3', {}, title), el('p', { html: text }));
    if (btnLabel) {
      const btn = el('button', { class: 'os-btn primary', type: 'button' }, btnLabel);
      btn.addEventListener('click', () => start());
      overlay.append(btn);
    }
    overlay.hidden = false;
  };

  const start = () => {
    snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
    dir = { x: 1, y: 0 };
    nextDir = dir;
    score = 0;
    stepMs = 130;
    alive = true;
    paused = false;
    placeFood();
    scoreEl.textContent = 'Score 0';
    overlay.hidden = true;
    body.focus({ preventScroll: true });
    sound.open();
    last = performance.now();
    acc = 0;
    if (!raf) raf = requestAnimationFrame(loop);
  };

  const gameOver = () => {
    alive = false;
    sound.boom();
    const best = store.get('snake.best', 0);
    if (score > best) {
      store.set('snake.best', score);
      bestEl.textContent = `Best ${score}`;
      showOverlay('New high score!', `${score} points. The fern is impressed.`, 'Play again');
    } else showOverlay('Game over', `${score} points.`, 'Play again');
  };

  const step = () => {
    dir = nextDir;
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
    if (head.x < 0 || head.y < 0 || head.x >= GRID || head.y >= GRID || snake.some((s) => s.x === head.x && s.y === head.y)) {
      return gameOver();
    }
    snake.unshift(head);
    if (head.x === food.x && head.y === food.y) {
      score++;
      scoreEl.textContent = `Score ${score}`;
      stepMs = Math.max(60, 130 - score * 3);
      sound.tick();
      placeFood();
    } else snake.pop();
  };

  const draw = () => {
    ctx.fillStyle = '#0a1f16';
    ctx.fillRect(0, 0, SIZE, SIZE);
    ctx.fillStyle = 'rgba(157,255,157,0.06)';
    for (let i = 0; i <= GRID; i++) {
      ctx.fillRect(i * CELL, 0, 1, SIZE);
      ctx.fillRect(0, i * CELL, SIZE, 1);
    }
    if (!snake) return;
    ctx.fillStyle = '#ff6b4a';
    ctx.fillRect(food.x * CELL + 3, food.y * CELL + 3, CELL - 6, CELL - 6);
    snake.forEach((s, i) => {
      ctx.fillStyle = i === 0 ? '#e9ffe9' : '#9dff9d';
      ctx.fillRect(s.x * CELL + 1, s.y * CELL + 1, CELL - 2, CELL - 2);
    });
  };

  const loop = (now) => {
    raf = requestAnimationFrame(loop);
    if (alive && !paused) {
      acc += now - last;
      while (acc >= stepMs && alive) {
        acc -= stepMs;
        step();
      }
    }
    last = now;
    draw();
  };

  const turn = (x, y) => {
    if (!alive) return;
    if (x === -dir.x && y === -dir.y) return;
    nextDir = { x, y };
  };

  body.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    const map = { arrowup: [0, -1], w: [0, -1], arrowdown: [0, 1], s: [0, 1], arrowleft: [-1, 0], a: [-1, 0], arrowright: [1, 0], d: [1, 0] };
    if (map[k]) {
      e.preventDefault();
      if (!alive && !overlay.hidden && score === undefined) start();
      turn(...map[k]);
    } else if (k === ' ' || k === 'p') {
      e.preventDefault();
      if (!alive) start();
      else {
        paused = !paused;
        if (paused) showOverlay('Paused', 'Press space to continue');
        else overlay.hidden = true;
      }
    } else if (k === 'enter' && !alive) start();
  });

  // swipe
  let touchStart = null;
  canvas.addEventListener('pointerdown', (e) => { touchStart = { x: e.clientX, y: e.clientY }; });
  canvas.addEventListener('pointerup', (e) => {
    if (!touchStart) return;
    const dx = e.clientX - touchStart.x;
    const dy = e.clientY - touchStart.y;
    touchStart = null;
    if (Math.abs(dx) < 12 && Math.abs(dy) < 12) {
      if (!alive) start();
      return;
    }
    if (Math.abs(dx) > Math.abs(dy)) turn(Math.sign(dx), 0);
    else turn(0, Math.sign(dy));
  });

  if (touch) {
    const pad = el('div', { class: 'snake-dpad' });
    const b = (label, x, y, style) => {
      const btn = el('button', { type: 'button', 'aria-label': label, style }, label);
      btn.addEventListener('click', () => { if (!alive) start(); turn(x, y); });
      return btn;
    };
    pad.append(el('span'), b('▲', 0, -1), el('span'), b('◀', -1, 0), b('●', 0, 0, { visibility: 'hidden' }), b('▶', 1, 0), el('span'), b('▼', 0, 1), el('span'));
    root.append(pad);
  }

  body.append(root);
  win.onCleanup(() => cancelAnimationFrame(raf));
  showOverlay('Snake', 'Arrow keys or WASD to move.<br>Space to pause. Eat the coral squares.', 'Start');
  draw();
}
