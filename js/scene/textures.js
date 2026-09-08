// Procedural textures drawn on 2D canvases: wood, sky, poster, sticky notes,
// a live wall clock, a calendar, and generic labels. No image files needed.
import * as THREE from '../../vendor/three.min.js';
import { seededRandom } from '../util/dom.js';
import { AVATAR, AVATAR_COLORS, drawPixels } from '../util/pixelart.js';

const canvas = (w, h) => {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
};

const hexToRgb = (hex) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const rgba = (hex, a) => `rgba(${hexToRgb(hex).join(',')},${a})`;
const mix = (a, b, t) => {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',')})`;
};

function makeTexture(c, { repeat = [1, 1], srgb = true } = {}) {
  const texture = new THREE.CanvasTexture(c);
  if (srgb) texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeat[0], repeat[1]);
  texture.anisotropy = 4;
  return texture;
}

export function woodTexture({ base = '#8a5a33', dark = '#5e3a1e', light = '#a8733f', size = 512, planks = 5, seed = 1, repeat = [1, 1] } = {}) {
  const c = canvas(size, size);
  const ctx = c.getContext('2d');
  const rnd = seededRandom(seed);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);
  const ph = size / planks;
  for (let p = 0; p < planks; p++) {
    const y0 = p * ph;
    ctx.fillStyle = mix(base, rnd() > 0.5 ? light : dark, rnd() * 0.4);
    ctx.fillRect(0, y0, size, ph);
    for (let i = 0; i < 34; i++) {
      ctx.strokeStyle = rgba(dark, 0.06 + rnd() * 0.14);
      ctx.lineWidth = 1 + rnd() * 2.5;
      ctx.beginPath();
      const y = y0 + rnd() * ph;
      const wob = rnd() * 6;
      const amp = rnd() * 3;
      ctx.moveTo(0, y);
      for (let x = 0; x <= size; x += 24) ctx.lineTo(x, y + Math.sin(x * 0.015 + wob) * amp);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(0, y0, size, 2);
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(0, y0 + 2, size, 1);
    const seam = rnd() * size;
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(seam, y0, 2, ph);
  }
  return makeTexture(c, { repeat });
}

export function skyTexture(night) {
  const w = 512;
  const h = 384;
  const c = canvas(w, h);
  const ctx = c.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  if (night) {
    grad.addColorStop(0, '#070d21');
    grad.addColorStop(0.7, '#17274d');
    grad.addColorStop(1, '#2a3f6a');
  } else {
    grad.addColorStop(0, '#5fb0ff');
    grad.addColorStop(0.65, '#a9dcff');
    grad.addColorStop(1, '#e8f6ff');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  const rnd = seededRandom(night ? 9 : 4);
  if (night) {
    for (let i = 0; i < 140; i++) {
      ctx.fillStyle = `rgba(255,255,255,${0.35 + rnd() * 0.65})`;
      const s = rnd() > 0.85 ? 3 : 2;
      ctx.fillRect(rnd() * w, rnd() * h * 0.7, s, s);
    }
    ctx.fillStyle = '#f4f0d8';
    ctx.beginPath();
    ctx.arc(390, 90, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1a2a52';
    ctx.beginPath();
    ctx.arc(404, 78, 30, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = '#fff4b3';
    ctx.beginPath();
    ctx.arc(110, 90, 40, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    for (let i = 0; i < 6; i++) {
      const x = rnd() * w;
      const y = 60 + rnd() * 140;
      for (let j = 0; j < 5; j++) {
        ctx.beginPath();
        ctx.ellipse(x + j * 22 - 40, y + (j % 2) * 6, 30, 16, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  // distant hills + rooftops
  ctx.fillStyle = night ? '#0d1730' : '#6fa86a';
  ctx.beginPath();
  ctx.moveTo(0, h);
  for (let x = 0; x <= w; x += 16) ctx.lineTo(x, h - 70 - Math.sin(x * 0.012) * 26 - Math.sin(x * 0.05) * 8);
  ctx.lineTo(w, h);
  ctx.fill();
  ctx.fillStyle = night ? '#080e1e' : '#4d7f4a';
  for (let i = 0; i < 9; i++) {
    const bw = 30 + rnd() * 40;
    const bh = 40 + rnd() * 70;
    const x = rnd() * w;
    ctx.fillRect(x, h - bh, bw, bh);
    if (night) {
      ctx.fillStyle = '#ffd98a';
      for (let wy = h - bh + 8; wy < h - 8; wy += 14) for (let wx = x + 6; wx < x + bw - 6; wx += 12) if (rnd() > 0.55) ctx.fillRect(wx, wy, 5, 7);
      ctx.fillStyle = '#080e1e';
    }
  }
  return makeTexture(c);
}

export function posterTexture(accent = '#ff6b4a') {
  const w = 256;
  const h = 360;
  const c = canvas(w, h);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#1e1b18';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = accent;
  ctx.fillRect(18, 18, w - 36, 6);
  ctx.fillRect(18, h - 24, w - 36, 6);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fbf8f0';
  ctx.font = "bold 62px 'Silkscreen', monospace";
  ctx.fillText('RICKY', w / 2, 118);
  ctx.fillStyle = accent;
  ctx.font = "bold 26px 'Silkscreen', monospace";
  ctx.fillText('SYSTEMS', w / 2, 158);
  ctx.fillStyle = '#9fb7b3';
  ctx.font = "26px 'VT323', monospace";
  ctx.fillText('beige computers', w / 2, 210);
  ctx.fillText('since 1998', w / 2, 236);
  // pixel computer glyph
  ctx.fillStyle = '#fbf8f0';
  ctx.fillRect(88, 262, 80, 56);
  ctx.fillStyle = '#3aa0a8';
  ctx.fillRect(96, 270, 64, 40);
  ctx.fillStyle = '#fbf8f0';
  ctx.fillRect(112, 318, 32, 8);
  ctx.fillRect(96, 326, 64, 6);
  ctx.fillStyle = accent;
  ctx.fillRect(104, 278, 20, 6);
  ctx.fillRect(104, 290, 36, 4);
  ctx.fillRect(104, 298, 28, 4);
  return makeTexture(c);
}

export function stickyTexture(lines, color = '#ffe27a') {
  const s = 128;
  const c = canvas(s, s);
  const ctx = c.getContext('2d');
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, s, s);
  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  ctx.fillRect(0, 0, s, 14);
  ctx.fillStyle = '#1e1b18';
  ctx.font = "22px 'VT323', monospace";
  lines.forEach((line, i) => ctx.fillText(line, 10, 40 + i * 24));
  return makeTexture(c);
}

export function labelTexture(text, { w = 256, h = 64, bg = '#d6cfbc', fg = '#1e1b18', font = "bold 22px 'Silkscreen', monospace" } = {}) {
  const c = canvas(w, h);
  const ctx = c.getContext('2d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = fg;
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, w / 2, h / 2 + 1);
  return makeTexture(c);
}

export function clockTexture() {
  const s = 256;
  const c = canvas(s, s);
  const ctx = c.getContext('2d');
  const texture = makeTexture(c);
  let lastSecond = -1;
  const draw = () => {
    const now = new Date();
    if (now.getSeconds() === lastSecond) return;
    lastSecond = now.getSeconds();
    ctx.clearRect(0, 0, s, s);
    ctx.fillStyle = '#fbf8f0';
    ctx.beginPath();
    ctx.arc(s / 2, s / 2, s / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1e1b18';
    ctx.lineWidth = 3;
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * Math.PI * 2;
      const big = i % 5 === 0;
      ctx.beginPath();
      ctx.moveTo(s / 2 + Math.cos(a) * (big ? 96 : 108), s / 2 + Math.sin(a) * (big ? 96 : 108));
      ctx.lineTo(s / 2 + Math.cos(a) * 116, s / 2 + Math.sin(a) * 116);
      ctx.stroke();
    }
    ctx.fillStyle = '#1e1b18';
    ctx.font = "bold 22px 'Silkscreen', monospace";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('12', s / 2, 46);
    ctx.fillText('3', s - 44, s / 2);
    ctx.fillText('6', s / 2, s - 44);
    ctx.fillText('9', 44, s / 2);
    const hand = (angle, len, width, color) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(s / 2, s / 2);
      ctx.lineTo(s / 2 + Math.cos(angle) * len, s / 2 + Math.sin(angle) * len);
      ctx.stroke();
    };
    const sec = now.getSeconds();
    const min = now.getMinutes() + sec / 60;
    const hr = (now.getHours() % 12) + min / 60;
    hand((hr / 12) * Math.PI * 2 - Math.PI / 2, 58, 8, '#1e1b18');
    hand((min / 60) * Math.PI * 2 - Math.PI / 2, 86, 6, '#1e1b18');
    hand((sec / 60) * Math.PI * 2 - Math.PI / 2, 96, 2.5, '#ff6b4a');
    ctx.fillStyle = '#ff6b4a';
    ctx.beginPath();
    ctx.arc(s / 2, s / 2, 6, 0, Math.PI * 2);
    ctx.fill();
    texture.needsUpdate = true;
  };
  draw();
  return { texture, update: draw };
}

export function calendarTexture(accent = '#ff6b4a') {
  const w = 256;
  const h = 320;
  const c = canvas(w, h);
  const ctx = c.getContext('2d');
  const now = new Date();
  ctx.fillStyle = '#fbf8f0';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, w, 70);
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.font = "bold 24px 'Silkscreen', monospace";
  ctx.fillText(now.toLocaleString('en-US', { month: 'long' }).toUpperCase(), w / 2, 34);
  ctx.font = "bold 16px 'Silkscreen', monospace";
  ctx.fillText(String(now.getFullYear()), w / 2, 58);
  ctx.fillStyle = '#6f6659';
  ctx.font = "16px 'VT323', monospace";
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const cellW = w / 7;
  days.forEach((d, i) => ctx.fillText(d, cellW * i + cellW / 2, 96));
  const first = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
  const count = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  ctx.font = "22px 'VT323', monospace";
  for (let d = 1; d <= count; d++) {
    const idx = first + d - 1;
    const col = idx % 7;
    const row = Math.floor(idx / 7);
    const x = cellW * col + cellW / 2;
    const y = 130 + row * 34;
    if (d === now.getDate()) {
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(x, y - 7, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
    } else ctx.fillStyle = '#1e1b18';
    ctx.fillText(String(d), x, y);
  }
  return makeTexture(c);
}

export function photoTexture() {
  const s = 128;
  const c = canvas(s, s);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#e9f0f4';
  ctx.fillRect(0, 0, s, s);
  ctx.fillStyle = '#9ed3e6';
  ctx.fillRect(0, 0, s, 70);
  ctx.fillStyle = '#7fb069';
  ctx.fillRect(0, 70, s, 58);
  drawPixels(ctx, AVATAR, AVATAR_COLORS, 6, 16, 22);
  return makeTexture(c);
}

export function glareTexture() {
  const s = 256;
  const c = canvas(s, s);
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(s * 0.3, s * 0.25, 10, s * 0.3, s * 0.25, s * 0.7);
  g.addColorStop(0, 'rgba(255,255,255,0.55)');
  g.addColorStop(0.4, 'rgba(255,255,255,0.12)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  const t = makeTexture(c, { srgb: false });
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}

export function vignetteTexture() {
  const s = 256;
  const c = canvas(s, s);
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(s / 2, s / 2, s * 0.4, s / 2, s / 2, s * 0.78);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(0.6, 'rgba(0,0,0,0.22)');
  g.addColorStop(1, 'rgba(0,0,0,0.6)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  const t = makeTexture(c, { srgb: false });
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}
