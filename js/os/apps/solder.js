// Solder: pads appear on a board, a ring shrinks around each one, and you
// click when the ring meets the pad. Perfect joints score more.
import { el, clamp } from '../../util/dom.js';
import { store } from '../../util/storage.js';
import { sound } from '../../sound.js';

const W = 520;
const H = 340;
const ROUND = 40;

export default {
  id: 'solder',
  name: 'Solder',
  icon: 'solder',
  desktop: true,
  startMenu: true,
  launch(os) {
    const { width: Wd, height: Hd } = os.wm.bounds;
    return os.wm.open({
      id: 'solder', title: 'Solder', icon: 'solder',
      width: Math.min(580, Wd - 100), height: Math.min(470, Hd - 80), minWidth: 340, minHeight: 320,
      bodyClass: 'no-scroll dark',
      render: (body, win) => mountSolder(os, body, win),
    });
  },
};

function mountSolder(os, body, win) {
  const canvas = el('canvas', { width: W, height: H, 'aria-label': 'Solder game board' });
  const ctx = canvas.getContext('2d');
  const scoreEl = el('span');
  const comboEl = el('span');
  const timeEl = el('span');
  const overlay = el('div', { class: 'sd-overlay' });
  body.append(el('div', { class: 'sd' }, el('div', { class: 'sd-head' }, scoreEl, comboEl, timeEl), el('div', { class: 'sd-wrap' }, canvas, overlay)));

  // static board art
  const board = document.createElement('canvas');
  board.width = W;
  board.height = H;
  const bctx = board.getContext('2d');
  bctx.fillStyle = '#1f5a3a';
  bctx.fillRect(0, 0, W, H);
  bctx.strokeStyle = 'rgba(230,194,122,0.35)';
  bctx.lineWidth = 3;
  bctx.lineCap = 'round';
  for (let i = 0; i < 26; i++) {
    bctx.beginPath();
    let x = Math.random() * W, y = Math.random() * H;
    bctx.moveTo(x, y);
    for (let s = 0; s < 4; s++) {
      const a = Math.floor(Math.random() * 4) * Math.PI / 2 + (Math.random() < 0.5 ? 0 : Math.PI / 4);
      x += Math.cos(a) * 50; y += Math.sin(a) * 50;
      bctx.lineTo(x, y);
    }
    bctx.stroke();
  }
  bctx.fillStyle = 'rgba(255,255,255,0.6)';
  bctx.font = "12px 'IBM Plex Mono', monospace";
  bctx.fillText('RK-1  SOLDER TRAINER  REV C', 12, H - 12);

  let running = false;
  let pads = [];
  let score = 0;
  let combo = 0;
  let timeLeft = ROUND;
  let spawnAcc = 0;
  let spawnEvery = 1.0;
  let last = 0;
  let raf = null;
  let flashes = [];
  const best = store.get('solder.best', 0) || 0;

  const head = () => {
    scoreEl.innerHTML = `Score <b>${score}</b>`;
    comboEl.innerHTML = `Combo <b>x${1 + Math.floor(combo / 4)}</b>`;
    timeEl.innerHTML = `Time <b>${Math.ceil(timeLeft)}s</b>`;
  };

  const showStart = (title, text, big) => {
    overlay.replaceChildren(el('h3', {}, title), big ? el('div', { class: 'big' }, big) : null, el('p', { html: text }));
    const btn = el('button', { class: 'os-btn primary', type: 'button' }, running ? 'Resume' : 'Start');
    btn.addEventListener('click', start);
    overlay.append(btn);
    overlay.hidden = false;
  };

  const spawn = () => {
    for (let tries = 0; tries < 10; tries++) {
      const x = 40 + Math.random() * (W - 80);
      const y = 36 + Math.random() * (H - 84);
      if (pads.every((p) => Math.hypot(p.x - x, p.y - y) > 60)) {
        pads.push({ x, y, r: 44, done: false });
        return;
      }
    }
  };

  const start = () => {
    running = true;
    pads = [];
    flashes = [];
    score = 0;
    combo = 0;
    timeLeft = ROUND;
    spawnAcc = 0;
    spawnEvery = 1.0;
    overlay.hidden = true;
    last = performance.now();
    sound.open();
    if (!raf) raf = requestAnimationFrame(loop);
  };

  const finish = () => {
    running = false;
    const prev = store.get('solder.best', 0) || 0;
    if (score > prev) store.set('solder.best', score);
    sound.success();
    showStart(score > prev ? 'New best!' : 'Round over', `${score} points.${prev ? ` Best: ${Math.max(prev, score)}.` : ''}<br>Perfect joints score 100, good ones 50, blobs 10.`, String(score));
  };

  const loop = (now) => {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (running) {
      timeLeft -= dt;
      spawnAcc += dt;
      spawnEvery = Math.max(0.45, 1.0 - (ROUND - timeLeft) * 0.012);
      if (spawnAcc >= spawnEvery) { spawnAcc = 0; spawn(); }
      for (const p of pads) {
        if (p.done) continue;
        p.r -= dt * 26;
        if (p.r <= 8) { p.done = true; p.result = 'cold'; combo = 0; flashes.push({ x: p.x, y: p.y, t: 0, text: 'cold joint', color: '#8ad0ff' }); }
      }
      pads = pads.filter((p) => !p.done || (p.result && p.result !== 'cold'));
      if (timeLeft <= 0) finish();
      head();
    }
    // draw
    ctx.drawImage(board, 0, 0);
    for (const p of pads) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 13, 0, Math.PI * 2);
      ctx.fillStyle = p.done ? '#c8ced6' : '#e6c27a';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = p.done ? '#9aa3ad' : '#1f5a3a';
      ctx.fill();
      if (!p.done) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.strokeStyle = p.r < 20 ? '#4fe3c1' : p.r < 28 ? '#ffb02e' : 'rgba(243,238,228,0.7)';
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    }
    for (const f of flashes) {
      f.t += dt;
      ctx.globalAlpha = Math.max(0, 1 - f.t);
      ctx.fillStyle = f.color;
      ctx.font = "bold 14px 'IBM Plex Mono', monospace";
      ctx.textAlign = 'center';
      ctx.fillText(f.text, f.x, f.y - 20 - f.t * 24);
      ctx.globalAlpha = 1;
      ctx.textAlign = 'left';
    }
    flashes = flashes.filter((f) => f.t < 1);
    if (!running) { ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(0, 0, W, H); }
  };

  canvas.addEventListener('pointerdown', (e) => {
    if (!running) return;
    e.preventDefault();
    const r = canvas.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * W;
    const y = ((e.clientY - r.top) / r.height) * H;
    const target = pads.find((p) => !p.done && Math.hypot(p.x - x, p.y - y) < 22);
    if (!target) { combo = 0; sound.beep(); flashes.push({ x, y, t: 0, text: 'miss', color: '#ff7b7b' }); return; }
    target.done = true;
    let pts = 10, text = 'blob', color = '#ffb02e';
    if (target.r < 20) { pts = 100; text = 'perfect'; color = '#4fe3c1'; }
    else if (target.r < 28) { pts = 50; text = 'good'; color = '#ffe27a'; }
    combo++;
    score += pts * (1 + Math.floor(combo / 4));
    target.result = text;
    flashes.push({ x: target.x, y: target.y, t: 0, text: `${text} +${pts}`, color });
    sound.sizzle();
    os.bus.emit('activity');
    head();
  });

  win.onCleanup(() => cancelAnimationFrame(raf));
  head();
  showStart('Solder', `Click each pad when the ring closes on it.<br>Teal ring = perfect. ${best ? `Best so far: ${best}.` : ''}`);
  raf = requestAnimationFrame(loop);
}
