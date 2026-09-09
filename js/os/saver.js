// Screensaver: copper traces grow across the screen, pads glow, and the
// board slowly fades so it never fills up. The drawing routine is shared
// with the CRT on the bench when the phone is the active device.
import { el } from '../util/dom.js';

export function createTraceAnimation(canvas, { onFrame } = {}) {
  const ctx = canvas.getContext('2d');
  let raf = null;
  let walkers = [];
  let pads = [];
  let last = 0;
  let acc = 0;
  const DIRS = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
  const STEP = Math.max(18, Math.round(canvas.width / 48));

  const spawn = () => {
    const cols = Math.floor(canvas.width / STEP);
    const rows = Math.floor(canvas.height / STEP);
    walkers.push({ x: Math.floor(Math.random() * cols), y: Math.floor(Math.random() * rows), d: Math.floor(Math.random() * 8), life: 6 + Math.floor(Math.random() * 14) });
  };

  const tick = (now) => {
    raf = requestAnimationFrame(tick);
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    acc += dt;
    if (acc < 0.045) return;
    acc = 0;
    ctx.fillStyle = 'rgba(5,8,12,0.08)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (walkers.length < 7 && Math.random() < 0.35) spawn();
    const cols = Math.floor(canvas.width / STEP);
    const rows = Math.floor(canvas.height / STEP);
    ctx.lineWidth = Math.max(3, STEP / 6);
    ctx.lineCap = 'round';
    for (const w of walkers) {
      if (Math.random() < 0.3) w.d = (w.d + (Math.random() < 0.5 ? 1 : 7)) % 8;
      const nx = w.x + DIRS[w.d][0];
      const ny = w.y + DIRS[w.d][1];
      const dead = nx < 0 || ny < 0 || nx >= cols || ny >= rows || --w.life <= 0;
      if (!dead) {
        ctx.strokeStyle = '#b8773f';
        ctx.beginPath();
        ctx.moveTo(w.x * STEP + STEP / 2, w.y * STEP + STEP / 2);
        ctx.lineTo(nx * STEP + STEP / 2, ny * STEP + STEP / 2);
        ctx.stroke();
        w.x = nx;
        w.y = ny;
      } else {
        pads.push({ x: w.x * STEP + STEP / 2, y: w.y * STEP + STEP / 2, glow: 1 });
        w.dead = true;
      }
    }
    walkers = walkers.filter((w) => !w.dead);
    for (const p of pads) {
      ctx.fillStyle = p.glow > 0 ? `rgba(79,227,193,${0.4 + p.glow * 0.6})` : '#e6c27a';
      ctx.beginPath();
      ctx.arc(p.x, p.y, STEP / 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#05080c';
      ctx.beginPath();
      ctx.arc(p.x, p.y, STEP / 11, 0, Math.PI * 2);
      ctx.fill();
      p.glow = Math.max(0, p.glow - 0.05);
    }
    if (pads.length > 90) pads.splice(0, pads.length - 90);
    if (Math.random() < 0.02) {
      ctx.fillStyle = 'rgba(243,238,228,0.35)';
      ctx.font = `${Math.max(12, STEP * 0.7)}px 'IBM Plex Mono', monospace`;
      ctx.fillText('RICKYOS  -  idle', 24 + Math.random() * (canvas.width - 200), 30 + Math.random() * (canvas.height - 60));
    }
    onFrame?.();
  };

  return {
    get running() { return raf !== null; },
    start() {
      if (raf !== null) return;
      ctx.fillStyle = '#05080c';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      walkers = [];
      pads = [];
      last = performance.now();
      raf = requestAnimationFrame(tick);
    },
    stop() {
      if (raf === null) return;
      cancelAnimationFrame(raf);
      raf = null;
    },
  };
}

export function createSaver(os) {
  let overlay = null;
  let anim = null;
  return {
    get running() { return !!overlay; },
    start() {
      if (overlay) return;
      const canvas = el('canvas');
      overlay = el('div', { class: 'os-saver', 'aria-hidden': 'true' }, canvas);
      os.root.append(overlay);
      canvas.width = os.root.clientWidth || 1280;
      canvas.height = os.root.clientHeight || 960;
      anim = createTraceAnimation(canvas);
      anim.start();
      os.bus.emit('saver', true);
    },
    stop() {
      if (!overlay) return;
      anim.stop();
      overlay.remove();
      overlay = null;
      anim = null;
      os.bus.emit('saver', false);
    },
  };
}
