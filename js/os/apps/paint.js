// Paint: brush, eraser, bucket fill, and a PNG download.
import { el } from '../../util/dom.js';
import { sound } from '../../sound.js';

const PALETTE = ['#1e1b18', '#8a8578', '#fbf8f0', '#ff6b4a', '#c9432a', '#ffb347', '#e4b33c', '#4caf7d', '#17803d', '#3aa0a8', '#1d4fd8', '#8ad0ff', '#7a4bd6', '#ff5fa2', '#8a5a33', '#f2c6a0'];
const SIZES = [2, 5, 10, 18];

export default {
  id: 'paint',
  name: 'Paint',
  icon: 'paint',
  desktop: true,
  startMenu: true,
  launch(os) {
    const { width: W, height: H } = os.wm.bounds;
    return os.wm.open({
      id: 'paint',
      title: 'Paint - untitled.bmp',
      icon: 'paint',
      width: Math.min(640, W - 100),
      height: Math.min(520, H - 80),
      minWidth: 360,
      minHeight: 300,
      bodyClass: 'flush no-scroll',
      render: (body, win) => mountPaint(os, body, win),
    });
  },
};

function mountPaint(os, body, win) {
  const W = 560;
  const H = 380;
  const canvas = el('canvas', { width: W, height: H, 'aria-label': 'Drawing canvas' });
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, W, H);

  let color = PALETTE[0];
  let size = SIZES[1];
  let tool = 'brush';
  let drawing = false;
  let last = null;

  const status = el('span', { class: 'paint-status' }, 'Ready');
  const palette = el('div', { class: 'paint-palette' });
  const colorBtns = PALETTE.map((c) => {
    const btn = el('button', { class: `paint-color${c === color ? ' selected' : ''}`, type: 'button', style: { background: c }, title: c, 'aria-label': `Colour ${c}` });
    btn.addEventListener('click', () => {
      color = c;
      colorBtns.forEach((b) => b.classList.toggle('selected', b === btn));
      if (tool === 'eraser') setTool('brush');
      sound.tick();
    });
    return btn;
  });
  palette.append(...colorBtns);

  const sizes = el('div', { class: 'paint-sizes' });
  const sizeBtns = SIZES.map((s) => {
    const btn = el('button', { class: `paint-size${s === size ? ' selected' : ''}`, type: 'button', title: `${s}px`, 'aria-label': `Brush size ${s}` }, el('i', { style: { width: `${Math.min(18, s + 2)}px`, height: `${Math.min(18, s + 2)}px` } }));
    btn.addEventListener('click', () => {
      size = s;
      sizeBtns.forEach((b) => b.classList.toggle('selected', b === btn));
      sound.tick();
    });
    return btn;
  });
  sizes.append(...sizeBtns);

  const toolBtns = {};
  const setTool = (t) => {
    tool = t;
    for (const [key, btn] of Object.entries(toolBtns)) btn.classList.toggle('pressed', key === t);
    canvas.style.cursor = t === 'fill' ? 'cell' : 'crosshair';
  };
  for (const [key, label] of [['brush', 'Brush'], ['eraser', 'Eraser'], ['fill', 'Fill']]) {
    toolBtns[key] = el('button', { class: 'os-btn sm', type: 'button' }, label);
    toolBtns[key].addEventListener('click', () => { setTool(key); sound.tick(); });
  }
  const clearBtn = el('button', { class: 'os-btn sm', type: 'button' }, 'Clear');
  clearBtn.addEventListener('click', async () => {
    const ok = await os.dialog({ title: 'Paint', icon: 'warning', message: 'Clear the canvas? Your masterpiece will be gone.', buttons: ['Clear', 'Keep'] });
    if (ok !== 'Clear') return;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, W, H);
    sound.boom();
  });
  const saveBtn = el('button', { class: 'os-btn sm', type: 'button' }, 'Save PNG');
  saveBtn.addEventListener('click', () => {
    try {
      const a = el('a', { href: canvas.toDataURL('image/png'), download: 'ricky-paint.png' });
      document.body.append(a);
      a.click();
      a.remove();
      sound.success();
      status.textContent = 'Saved ricky-paint.png';
    } catch {
      status.textContent = 'Could not save';
    }
  });

  const tools = el('div', { class: 'paint-tools' }, palette, sizes, toolBtns.brush, toolBtns.eraser, toolBtns.fill, clearBtn, saveBtn, status);
  const wrapEl = el('div', { class: 'paint-canvas-wrap' }, canvas);
  body.append(el('div', { class: 'paint' }, tools, wrapEl));
  setTool('brush');

  const pos = (e) => {
    const r = canvas.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
  };

  const stroke = (from, to) => {
    ctx.strokeStyle = tool === 'eraser' ? '#fff' : color;
    ctx.lineWidth = size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  };

  const fill = (x, y) => {
    const img = ctx.getImageData(0, 0, W, H);
    const data = img.data;
    const idx = (px, py) => (py * W + px) * 4;
    const sx = Math.floor(x);
    const sy = Math.floor(y);
    const start = idx(sx, sy);
    const target = [data[start], data[start + 1], data[start + 2]];
    const rgb = [parseInt(color.slice(1, 3), 16), parseInt(color.slice(3, 5), 16), parseInt(color.slice(5, 7), 16)];
    if (target[0] === rgb[0] && target[1] === rgb[1] && target[2] === rgb[2]) return;
    const match = (i) => Math.abs(data[i] - target[0]) < 24 && Math.abs(data[i + 1] - target[1]) < 24 && Math.abs(data[i + 2] - target[2]) < 24;
    const stack = [[sx, sy]];
    const seen = new Uint8Array(W * H);
    while (stack.length) {
      const [px, py] = stack.pop();
      if (px < 0 || py < 0 || px >= W || py >= H) continue;
      const p = py * W + px;
      if (seen[p]) continue;
      seen[p] = 1;
      const i = p * 4;
      if (!match(i)) continue;
      data[i] = rgb[0];
      data[i + 1] = rgb[1];
      data[i + 2] = rgb[2];
      data[i + 3] = 255;
      stack.push([px + 1, py], [px - 1, py], [px, py + 1], [px, py - 1]);
    }
    ctx.putImageData(img, 0, 0);
  };

  canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    const p = pos(e);
    if (tool === 'fill') {
      fill(p.x, p.y);
      sound.click();
      return;
    }
    drawing = true;
    last = p;
    canvas.setPointerCapture?.(e.pointerId);
    stroke(p, p);
  });
  canvas.addEventListener('pointermove', (e) => {
    const p = pos(e);
    status.textContent = `${Math.round(p.x)}, ${Math.round(p.y)}`;
    if (!drawing) return;
    stroke(last, p);
    last = p;
  });
  const stop = () => {
    drawing = false;
    last = null;
  };
  canvas.addEventListener('pointerup', stop);
  canvas.addEventListener('pointercancel', stop);
  canvas.addEventListener('pointerleave', () => { if (!drawing) status.textContent = 'Ready'; });
  win.onCleanup(stop);
}
