// Sketch: doodle on grid paper, stamp schematic symbols, save a PNG.
import { el } from '../../util/dom.js';
import { sound } from '../../sound.js';

const COLORS = ['#1c1a17', '#b8773f', '#4fe3c1', '#ff7a1a', '#d1262b', '#1d4fd8'];
const SIZES = [2, 4, 8];
const STAMPS = {
  battery: { label: 'Battery', draw: (c, s) => { c.beginPath(); c.moveTo(-s, 0); c.lineTo(-s * 0.35, 0); c.moveTo(s * 0.35, 0); c.lineTo(s, 0); c.moveTo(-s * 0.35, -s * 0.5); c.lineTo(-s * 0.35, s * 0.5); c.moveTo(-s * 0.1, -s * 0.3); c.lineTo(-s * 0.1, s * 0.3); c.moveTo(s * 0.15, -s * 0.5); c.lineTo(s * 0.15, s * 0.5); c.moveTo(s * 0.35, -s * 0.3); c.lineTo(s * 0.35, s * 0.3); c.stroke(); } },
  resistor: { label: 'Resistor', draw: (c, s) => { c.beginPath(); c.moveTo(-s, 0); c.lineTo(-s * 0.6, 0); let x = -s * 0.6; const step = s * 0.15; let up = true; for (let i = 0; i < 8; i++) { x += step; c.lineTo(x, up ? -s * 0.3 : s * 0.3); up = !up; } c.lineTo(s * 0.6, 0); c.lineTo(s, 0); c.stroke(); } },
  led: { label: 'LED', draw: (c, s) => { c.beginPath(); c.moveTo(-s, 0); c.lineTo(-s * 0.35, 0); c.moveTo(s * 0.35, 0); c.lineTo(s, 0); c.moveTo(-s * 0.35, -s * 0.4); c.lineTo(s * 0.35, 0); c.lineTo(-s * 0.35, s * 0.4); c.closePath(); c.moveTo(s * 0.35, -s * 0.4); c.lineTo(s * 0.35, s * 0.4); c.moveTo(0, -s * 0.5); c.lineTo(s * 0.3, -s * 0.85); c.moveTo(s * 0.25, -s * 0.5); c.lineTo(s * 0.55, -s * 0.85); c.stroke(); } },
  switch: { label: 'Switch', draw: (c, s) => { c.beginPath(); c.moveTo(-s, 0); c.lineTo(-s * 0.4, 0); c.moveTo(-s * 0.4, 0); c.lineTo(s * 0.35, -s * 0.5); c.moveTo(s * 0.4, 0); c.lineTo(s, 0); c.stroke(); c.beginPath(); c.arc(-s * 0.4, 0, s * 0.08, 0, Math.PI * 2); c.arc(s * 0.4, 0, s * 0.08, 0, Math.PI * 2); c.fill(); } },
  cap: { label: 'Capacitor', draw: (c, s) => { c.beginPath(); c.moveTo(-s, 0); c.lineTo(-s * 0.15, 0); c.moveTo(s * 0.15, 0); c.lineTo(s, 0); c.moveTo(-s * 0.15, -s * 0.5); c.lineTo(-s * 0.15, s * 0.5); c.moveTo(s * 0.15, -s * 0.5); c.lineTo(s * 0.15, s * 0.5); c.stroke(); } },
  ground: { label: 'Ground', draw: (c, s) => { c.beginPath(); c.moveTo(0, -s); c.lineTo(0, 0); c.moveTo(-s * 0.6, 0); c.lineTo(s * 0.6, 0); c.moveTo(-s * 0.4, s * 0.25); c.lineTo(s * 0.4, s * 0.25); c.moveTo(-s * 0.2, s * 0.5); c.lineTo(s * 0.2, s * 0.5); c.stroke(); } },
  bulb: { label: 'Bulb', draw: (c, s) => { c.beginPath(); c.moveTo(-s, 0); c.lineTo(-s * 0.5, 0); c.moveTo(s * 0.5, 0); c.lineTo(s, 0); c.arc(0, 0, s * 0.5, 0, Math.PI * 2); c.moveTo(-s * 0.35, -s * 0.35); c.lineTo(s * 0.35, s * 0.35); c.moveTo(s * 0.35, -s * 0.35); c.lineTo(-s * 0.35, s * 0.35); c.stroke(); } },
};

export default {
  id: 'sketch',
  name: 'Sketch',
  icon: 'sketch',
  desktop: true,
  startMenu: true,
  launch(os) {
    const { width: W, height: H } = os.wm.bounds;
    return os.wm.open({
      id: 'sketch', title: 'Sketch - schematic.png', icon: 'sketch',
      width: Math.min(700, W - 100), height: Math.min(540, H - 80), minWidth: 380, minHeight: 320,
      bodyClass: 'no-scroll',
      render: (body, win) => mountSketch(os, body, win),
    });
  },
};

function mountSketch(os, body, win) {
  const W = 600;
  const H = 400;
  const canvas = el('canvas', { width: W, height: H, 'aria-label': 'Drawing canvas' });
  const ctx = canvas.getContext('2d');
  const paper = () => {
    ctx.fillStyle = '#fbf8f1';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(80,120,170,0.22)';
    ctx.lineWidth = 1;
    for (let x = 0.5; x < W; x += 20) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0.5; y < H; y += 20) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  };
  paper();

  let color = COLORS[0];
  let size = SIZES[1];
  let tool = 'pen';
  let stamp = null;
  let drawing = false;
  let last = null;

  const status = el('span', { class: 'sk-status' }, 'Pen');
  const colorBtns = COLORS.map((c) => {
    const b = el('button', { class: `sk-color${c === color ? ' selected' : ''}`, type: 'button', style: { background: c }, 'aria-label': `Colour ${c}` });
    b.addEventListener('click', () => { color = c; colorBtns.forEach((x) => x.classList.toggle('selected', x === b)); if (tool === 'eraser') setTool('pen'); sound.tick(); });
    return b;
  });
  const sizeBtns = SIZES.map((s) => {
    const b = el('button', { class: `sk-size${s === size ? ' selected' : ''}`, type: 'button', 'aria-label': `Size ${s}` }, el('i', { style: { width: `${s * 2 + 2}px`, height: `${s * 2 + 2}px` } }));
    b.addEventListener('click', () => { size = s; sizeBtns.forEach((x) => x.classList.toggle('selected', x === b)); sound.tick(); });
    return b;
  });
  const toolBtns = {};
  const stampBtns = {};
  const setTool = (t, st = null) => {
    tool = t;
    stamp = st;
    for (const [k, b] of Object.entries(toolBtns)) b.classList.toggle('pressed', k === t);
    for (const [k, b] of Object.entries(stampBtns)) b.classList.toggle('selected', t === 'stamp' && k === st);
    status.textContent = t === 'stamp' ? `Stamp: ${STAMPS[st].label}` : t === 'eraser' ? 'Eraser' : 'Pen';
    canvas.style.cursor = t === 'stamp' ? 'copy' : 'crosshair';
  };
  for (const [k, label] of [['pen', 'Pen'], ['eraser', 'Eraser']]) {
    toolBtns[k] = el('button', { class: 'os-btn sm dark', type: 'button' }, label);
    toolBtns[k].addEventListener('click', () => { setTool(k); sound.tick(); });
  }
  const stampIcon = (key) => {
    const c = el('canvas', { width: 52, height: 28 });
    const cc = c.getContext('2d');
    cc.translate(26, 14);
    cc.strokeStyle = '#1c1a17';
    cc.fillStyle = '#1c1a17';
    cc.lineWidth = 2;
    cc.lineCap = 'round';
    STAMPS[key].draw(cc, 22);
    c.style.width = '26px';
    c.style.height = '14px';
    return c;
  };
  for (const key of Object.keys(STAMPS)) {
    stampBtns[key] = el('button', { class: 'sk-stamp', type: 'button', title: STAMPS[key].label }, stampIcon(key), STAMPS[key].label);
    stampBtns[key].addEventListener('click', () => { setTool('stamp', key); sound.tick(); });
  }
  const clearBtn = el('button', { class: 'os-btn sm', type: 'button' }, 'Clear');
  clearBtn.addEventListener('click', async () => {
    const ok = await os.dialog({ title: 'Sketch', icon: 'warning', message: 'Clear the page? The schematic will be gone.', buttons: ['Clear', 'Keep'] });
    if (ok !== 'Clear') return;
    paper();
    sound.boom();
  });
  const saveBtn = el('button', { class: 'os-btn sm', type: 'button' }, 'Save PNG');
  saveBtn.addEventListener('click', () => {
    try {
      const a = el('a', { href: canvas.toDataURL('image/png'), download: 'ricky-schematic.png' });
      document.body.append(a);
      a.click();
      a.remove();
      sound.success();
      status.textContent = 'Saved ricky-schematic.png';
    } catch {
      status.textContent = 'Could not save';
    }
  });
  const tools = el('div', { class: 'sk-tools' },
    el('div', { class: 'sk-group' }, ...colorBtns),
    el('div', { class: 'sk-group' }, ...sizeBtns),
    el('div', { class: 'sk-group' }, toolBtns.pen, toolBtns.eraser, clearBtn, saveBtn),
    el('div', { class: 'sk-group' }, ...Object.values(stampBtns)),
    status
  );
  body.append(el('div', { class: 'sk' }, tools, el('div', { class: 'sk-canvas-wrap' }, canvas)));
  setTool('pen');

  const pos = (e) => {
    const r = canvas.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
  };
  const stroke = (a, b) => {
    ctx.strokeStyle = tool === 'eraser' ? '#fbf8f1' : color;
    ctx.lineWidth = tool === 'eraser' ? size * 4 : size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  };
  canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    const p = pos(e);
    if (tool === 'stamp') {
      const gx = Math.round(p.x / 20) * 20;
      const gy = Math.round(p.y / 20) * 20;
      ctx.save();
      ctx.translate(gx, gy);
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      STAMPS[stamp].draw(ctx, 30);
      ctx.restore();
      sound.click();
      return;
    }
    drawing = true;
    last = p;
    canvas.setPointerCapture?.(e.pointerId);
    stroke(p, p);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drawing) return;
    const p = pos(e);
    stroke(last, p);
    last = p;
  });
  const stop = () => { drawing = false; last = null; };
  canvas.addEventListener('pointerup', stop);
  canvas.addEventListener('pointercancel', stop);
  win.onCleanup(stop);
}
