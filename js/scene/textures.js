// Procedural textures drawn on 2D canvases. No image files anywhere.
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
const MONO = "'IBM Plex Mono', monospace";
const DISPLAY = "'Pixelify Sans', monospace";
const CRT = "'VT323', monospace";

function makeTexture(c, { repeat = [1, 1], srgb = true, clamp = false } = {}) {
  const texture = new THREE.CanvasTexture(c);
  if (srgb) texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = clamp ? THREE.ClampToEdgeWrapping : THREE.RepeatWrapping;
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
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(rnd() * size, y0, 2, ph);
  }
  return makeTexture(c, { repeat });
}

export function concreteTexture({ size = 512, seed = 5, repeat = [1, 1] } = {}) {
  const c = canvas(size, size);
  const ctx = c.getContext('2d');
  const rnd = seededRandom(seed);
  ctx.fillStyle = '#6a6b68';
  ctx.fillRect(0, 0, size, size);
  const img = ctx.getImageData(0, 0, size, size);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (rnd() - 0.5) * 26;
    img.data[i] += n;
    img.data[i + 1] += n;
    img.data[i + 2] += n - 2;
  }
  ctx.putImageData(img, 0, 0);
  for (let i = 0; i < 900; i++) {
    ctx.fillStyle = `rgba(${rnd() > 0.5 ? '255,255,255' : '0,0,0'},${0.04 + rnd() * 0.08})`;
    ctx.fillRect(rnd() * size, rnd() * size, 1 + rnd() * 3, 1 + rnd() * 3);
  }
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 3;
  ctx.strokeRect(1.5, 1.5, size / 2 - 3, size / 2 - 3);
  ctx.strokeRect(size / 2 + 1.5, 1.5, size / 2 - 3, size / 2 - 3);
  ctx.strokeRect(1.5, size / 2 + 1.5, size / 2 - 3, size / 2 - 3);
  ctx.strokeRect(size / 2 + 1.5, size / 2 + 1.5, size / 2 - 3, size / 2 - 3);
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(size * 0.2, size * 0.6);
  ctx.lineTo(size * 0.32, size * 0.72);
  ctx.lineTo(size * 0.36, size * 0.9);
  ctx.stroke();
  return makeTexture(c, { repeat });
}

export function pegboardTexture({ size = 512 } = {}) {
  const c = canvas(size, size);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#e8dcc4';
  ctx.fillRect(0, 0, size, size);
  const step = 32;
  for (let y = step / 2; y < size; y += step) {
    for (let x = step / 2; x < size; x += step) {
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.beginPath();
      ctx.arc(x + 1, y + 1.5, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#4a4239';
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  return makeTexture(c);
}

export function timeOfDay(date = new Date()) {
  const h = date.getHours();
  if (h >= 9 && h < 17) return 'day';
  if ((h >= 6 && h < 9) || (h >= 17 && h < 20)) return 'dusk';
  return 'night';
}

export function skyTexture(variant = 'night') {
  const w = 512;
  const h = 384;
  const c = canvas(w, h);
  const ctx = c.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  if (variant === 'day') { grad.addColorStop(0, '#6f8299'); grad.addColorStop(0.6, '#98a8b8'); grad.addColorStop(1, '#b9c3cc'); }
  else if (variant === 'dusk') { grad.addColorStop(0, '#2b2a4a'); grad.addColorStop(0.55, '#6b4a5a'); grad.addColorStop(1, '#b06a4a'); }
  else { grad.addColorStop(0, '#060a17'); grad.addColorStop(0.6, '#131f3d'); grad.addColorStop(1, '#233559'); }
  const night = variant === 'night';
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  const rnd = seededRandom(19);
  if (night) for (let i = 0; i < 60; i++) {
    ctx.fillStyle = `rgba(255,255,255,${0.2 + rnd() * 0.5})`;
    ctx.fillRect(rnd() * w, rnd() * h * 0.45, 2, 2);
  }
  // heavy clouds
  for (let i = 0; i < 9; i++) {
    ctx.fillStyle = night ? `rgba(20,28,48,${0.5 + rnd() * 0.4})` : variant === 'day' ? `rgba(110,120,135,${0.5 + rnd() * 0.4})` : `rgba(60,50,80,${0.5 + rnd() * 0.4})`;
    const x = rnd() * w;
    const y = 20 + rnd() * 120;
    for (let j = 0; j < 6; j++) {
      ctx.beginPath();
      ctx.ellipse(x + j * 30 - 70, y + (j % 2) * 8, 46, 22, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // skyline
  ctx.fillStyle = night ? '#0a1020' : variant === 'day' ? '#3f4a58' : '#1f1c2e';
  for (let i = 0; i < 11; i++) {
    const bw = 28 + rnd() * 44;
    const bh = 50 + rnd() * 90;
    const x = rnd() * w;
    ctx.fillRect(x, h - bh, bw, bh);
    ctx.fillStyle = night ? '#ffd98a' : variant === 'day' ? '#8a97a6' : '#ffc27a';
    for (let wy = h - bh + 8; wy < h - 8; wy += 14) for (let wx = x + 6; wx < x + bw - 6; wx += 12) if (rnd() > 0.6) ctx.fillRect(wx, wy, 5, 7);
    ctx.fillStyle = night ? '#0a1020' : variant === 'day' ? '#3f4a58' : '#1f1c2e';
  }
  ctx.fillStyle = night ? '#05080f' : variant === 'day' ? '#2e3641' : '#15121f';
  ctx.fillRect(0, h - 30, w, 30);
  return makeTexture(c, { clamp: true });
}

export function blueprintTexture() {
  const w = 512;
  const h = 660;
  const c = canvas(w, h);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#1f4e8c';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= w; x += 24) { ctx.beginPath(); ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, h); ctx.stroke(); }
  for (let y = 0; y <= h; y += 24) { ctx.beginPath(); ctx.moveTo(0, y + 0.5); ctx.lineTo(w, y + 0.5); ctx.stroke(); }
  ctx.strokeStyle = '#eaf2ff';
  ctx.fillStyle = '#eaf2ff';
  ctx.lineWidth = 2;
  ctx.font = `bold 34px ${DISPLAY}`;
  ctx.fillText('RK-1 MAIN BOARD', 40, 70);
  ctx.font = `14px ${MONO}`;
  ctx.fillText('REV C  -  SHEET 1 OF 3  -  DO NOT SCALE', 40, 96);
  ctx.strokeRect(40, 130, 432, 380);
  ctx.setLineDash([6, 6]);
  ctx.strokeRect(60, 150, 392, 340);
  ctx.setLineDash([]);
  const chip = (x, y, cw, ch, label) => {
    ctx.strokeRect(x, y, cw, ch);
    for (let p = 8; p < cw - 4; p += 12) { ctx.fillRect(x + p, y - 8, 3, 8); ctx.fillRect(x + p, y + ch, 3, 8); }
    ctx.font = `13px ${MONO}`;
    ctx.fillText(label, x + 8, y + ch / 2 + 5);
  };
  chip(90, 200, 130, 60, 'U1  CPU 8MHz');
  chip(260, 200, 110, 60, 'U2  RAM 64K');
  chip(90, 320, 90, 50, 'U3  ROM');
  chip(220, 320, 150, 50, 'U4  VIDEO');
  ctx.beginPath();
  ctx.moveTo(220, 230); ctx.lineTo(260, 230);
  ctx.moveTo(150, 260); ctx.lineTo(150, 320);
  ctx.moveTo(320, 260); ctx.lineTo(320, 320);
  ctx.moveTo(370, 345); ctx.lineTo(420, 345); ctx.lineTo(420, 420);
  ctx.stroke();
  for (let i = 0; i < 8; i++) { ctx.beginPath(); ctx.arc(110 + i * 24, 440, 6, 0, Math.PI * 2); ctx.stroke(); }
  ctx.font = `12px ${MONO}`;
  ctx.fillText('LED0..7  STATUS', 110, 470);
  ctx.beginPath(); ctx.arc(420, 440, 14, 0, Math.PI * 2); ctx.stroke();
  ctx.fillText('SW1 PWR', 395, 470);
  ctx.font = `12px ${MONO}`;
  ctx.fillText('NOTES: 1. KEEP THE CAT OFF THE BOARD.  2. SEE NOTE 1.', 40, 560);
  ctx.fillText('DRAWN BY: R.   CHECKED BY: NOBODY   DATE: LATE', 40, 586);
  ctx.strokeRect(40, 610, 432, 34);
  ctx.fillText('RICKY\'S BENCH  -  PROPERTY OF WHOEVER FINDS IT', 52, 632);
  return makeTexture(c, { clamp: true });
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
  ctx.font = `22px ${CRT}`;
  lines.forEach((line, i) => ctx.fillText(line, 10, 40 + i * 24));
  return makeTexture(c, { clamp: true });
}

export function labelTexture(text, { w = 256, h = 64, bg = '#d6cfbc', fg = '#1e1b18', font = `bold 22px ${MONO}` } = {}) {
  const c = canvas(w, h);
  const ctx = c.getContext('2d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = fg;
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, w / 2, h / 2 + 1);
  return makeTexture(c, { clamp: true });
}

/** Label-maker tape: black tape, light embossed text. */
export function tapeTexture(text, { w = 512, h = 96, bg = '#141516', fg = '#f3eee4' } = {}) {
  const c = canvas(w, h);
  const ctx = c.getContext('2d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fillRect(0, 0, w, 4);
  ctx.fillStyle = fg;
  ctx.font = `bold ${Math.floor(h * 0.62)}px ${DISPLAY}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text.toUpperCase(), w / 2, h / 2 + 2);
  return makeTexture(c, { clamp: true });
}

export function clockTexture() {
  const s = 256;
  const c = canvas(s, s);
  const ctx = c.getContext('2d');
  const texture = makeTexture(c, { clamp: true });
  let lastSecond = -1;
  const draw = () => {
    const now = new Date();
    if (now.getSeconds() === lastSecond) return;
    lastSecond = now.getSeconds();
    ctx.clearRect(0, 0, s, s);
    ctx.fillStyle = '#f3eee4';
    ctx.beginPath();
    ctx.arc(s / 2, s / 2, s / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1c1a17';
    ctx.lineWidth = 3;
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * Math.PI * 2;
      const big = i % 5 === 0;
      ctx.beginPath();
      ctx.moveTo(s / 2 + Math.cos(a) * (big ? 96 : 108), s / 2 + Math.sin(a) * (big ? 96 : 108));
      ctx.lineTo(s / 2 + Math.cos(a) * 116, s / 2 + Math.sin(a) * 116);
      ctx.stroke();
    }
    ctx.fillStyle = '#1c1a17';
    ctx.font = `bold 26px ${DISPLAY}`;
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
    hand((hr / 12) * Math.PI * 2 - Math.PI / 2, 58, 8, '#1c1a17');
    hand((min / 60) * Math.PI * 2 - Math.PI / 2, 86, 6, '#1c1a17');
    hand((sec / 60) * Math.PI * 2 - Math.PI / 2, 96, 2.5, '#ff7a1a');
    ctx.fillStyle = '#ff7a1a';
    ctx.beginPath();
    ctx.arc(s / 2, s / 2, 6, 0, Math.PI * 2);
    ctx.fill();
    texture.needsUpdate = true;
  };
  draw();
  return { texture, update: draw };
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
  return makeTexture(c, { clamp: true });
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
  return makeTexture(c, { srgb: false, clamp: true });
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
  return makeTexture(c, { srgb: false, clamp: true });
}

export function breadboardTexture() {
  const w = 512;
  const h = 192;
  const c = canvas(w, h);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#f4f2ea';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#d1262b';
  ctx.fillRect(16, 14, w - 32, 2);
  ctx.fillRect(16, h - 16, w - 32, 2);
  ctx.fillStyle = '#1d4fd8';
  ctx.fillRect(16, 26, w - 32, 2);
  ctx.fillRect(16, h - 28, w - 32, 2);
  ctx.fillStyle = '#3a3a3a';
  for (let x = 24; x < w - 16; x += 16) {
    for (const y of [20, 34, h - 22, h - 36]) ctx.fillRect(x, y - 1.5, 3, 3);
    for (let r = 0; r < 5; r++) { ctx.fillRect(x, 56 + r * 12, 3, 3); ctx.fillRect(x, 112 + r * 12, 3, 3); }
  }
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.fillRect(16, 90, w - 32, 12);
  return makeTexture(c, { clamp: true });
}

export function resistorTexture(bands = ['#d1262b', '#7a4bd6', '#ff7a1a', '#c9a04a']) {
  const w = 64;
  const h = 256;
  const c = canvas(w, h);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#d9c9a5';
  ctx.fillRect(0, 0, w, h);
  bands.forEach((color, i) => {
    ctx.fillStyle = color;
    ctx.fillRect(0, 56 + i * 32 + (i === 3 ? 30 : 0), w, 18);
  });
  return makeTexture(c);
}

export function jarTexture(label, color) {
  const w = 256;
  const h = 96;
  const c = canvas(w, h);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#f3eee4';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 18, h);
  ctx.fillStyle = '#1c1a17';
  ctx.font = `bold 34px ${MONO}`;
  ctx.textBaseline = 'middle';
  ctx.fillText(label.toUpperCase(), 34, h / 2 + 2);
  return makeTexture(c, { clamp: true });
}

/** Oscilloscope screen. Call draw(samples|null, elapsed) up to ~30 times a second. */
export function scopeScreen() {
  const w = 256;
  const h = 192;
  const c = canvas(w, h);
  const ctx = c.getContext('2d');
  const texture = makeTexture(c, { clamp: true });
  let mode = 'wave';
  const draw = (samples, t) => {
    ctx.fillStyle = '#07130c';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(157,255,157,0.16)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= w; x += w / 8) { ctx.beginPath(); ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, h); ctx.stroke(); }
    for (let y = 0; y <= h; y += h / 6) { ctx.beginPath(); ctx.moveTo(0, y + 0.5); ctx.lineTo(w, y + 0.5); ctx.stroke(); }
    ctx.strokeStyle = '#9dff9d';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = 'rgba(157,255,157,0.9)';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    if (mode === 'xy') {
      const n = samples ? samples.length : 200;
      const lag = Math.floor(n / 8);
      for (let i = lag; i < n; i++) {
        const a = samples ? samples[i] * 2.4 : Math.sin(i * 0.05 + t) * 0.7;
        const b = samples ? samples[i - lag] * 2.4 : Math.sin(i * 0.05 * 1.5 + t * 1.3) * 0.7;
        const x = w / 2 + a * (w / 2.4);
        const y = h / 2 - b * (h / 2.4);
        if (i === lag) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
    } else {
      const n = samples ? samples.length : 128;
      for (let i = 0; i < n; i++) {
        const v = samples ? samples[i] * 2.4 : Math.sin(i * 0.12 + t * 2) * 0.35 * Math.sin(t * 0.7) + (Math.random() - 0.5) * 0.02;
        const x = (i / (n - 1)) * w;
        const y = h / 2 - v * (h / 2.4);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(157,255,157,0.75)';
    ctx.font = `16px ${CRT}`;
    ctx.fillText(mode === 'xy' ? 'X-Y  1V/div' : 'CH1  1V/div  2ms', 8, 18);
    texture.needsUpdate = true;
  };
  return { texture, draw, setMode: (m) => { mode = m; }, get mode() { return mode; } };
}

/** Multimeter LCD. */
export function lcdTexture() {
  const w = 256;
  const h = 96;
  const c = canvas(w, h);
  const ctx = c.getContext('2d');
  const texture = makeTexture(c, { clamp: true });
  const set = (text, small = '') => {
    ctx.fillStyle = '#9fae8a';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    for (let y = 0; y < h; y += 3) ctx.fillRect(0, y, w, 1);
    ctx.fillStyle = '#1c2419';
    ctx.font = `62px ${CRT}`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, w - 14, h / 2 + 4);
    ctx.font = `18px ${MONO}`;
    ctx.textAlign = 'left';
    ctx.fillText(small, 10, 16);
    texture.needsUpdate = true;
  };
  set('12.03 V', 'DC AUTO');
  return { texture, set };
}

/** Rain streaks on a transparent canvas. */
export function rainTexture() {
  const w = 256;
  const h = 512;
  const c = canvas(w, h);
  const ctx = c.getContext('2d');
  const texture = makeTexture(c, { srgb: false, clamp: true });
  const drops = Array.from({ length: 90 }, () => ({ x: Math.random() * w, y: Math.random() * h, len: 14 + Math.random() * 30, speed: 260 + Math.random() * 300, a: 0.25 + Math.random() * 0.45 }));
  const beads = Array.from({ length: 40 }, () => ({ x: Math.random() * w, y: Math.random() * h, r: 1 + Math.random() * 2 }));
  const update = (dt) => {
    ctx.clearRect(0, 0, w, h);
    ctx.lineCap = 'round';
    ctx.lineWidth = 1.6;
    for (const d of drops) {
      d.y += d.speed * dt;
      if (d.y > h + d.len) { d.y = -d.len; d.x = Math.random() * w; }
      ctx.strokeStyle = `rgba(210,230,255,${d.a})`;
      ctx.beginPath();
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x + 1.5, d.y + d.len);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(210,230,255,0.35)';
    for (const b of beads) {
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
    }
    texture.needsUpdate = true;
  };
  update(0);
  return { texture, update };
}

/** Lock screen for the phone on the bench (desktop visitors). */
export function lockScreen() {
  const w = 390;
  const h = 844;
  const c = canvas(w, h);
  const ctx = c.getContext('2d');
  const notes = [];
  const draw = (lit = false) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#0d1b2a');
    g.addColorStop(1, '#0a1220');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(184,119,63,0.35)';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    const rnd = seededRandom(3);
    for (let i = 0; i < 14; i++) {
      ctx.beginPath();
      let x = rnd() * w, y = 300 + rnd() * 500;
      ctx.moveTo(x, y);
      for (let s = 0; s < 4; s++) { const a = Math.floor(rnd() * 4) * Math.PI / 2 + (rnd() < 0.5 ? 0 : Math.PI / 4); x += Math.cos(a) * 50; y += Math.sin(a) * 50; ctx.lineTo(x, y); }
      ctx.stroke();
    }
    if (!lit) { ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(0, 0, w, h); }
    const now = new Date();
    ctx.fillStyle = '#f3eee4';
    ctx.textAlign = 'center';
    ctx.font = `14px ${MONO}`;
    ctx.fillText(now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase(), w / 2, 130);
    ctx.font = `bold 96px ${DISPLAY}`;
    let hrs = now.getHours() % 12 || 12;
    ctx.fillText(`${hrs}:${String(now.getMinutes()).padStart(2, '0')}`, w / 2, 230);
    ctx.textAlign = 'left';
    notes.slice(-3).forEach((n, i) => {
      const y = 300 + i * 96;
      ctx.fillStyle = 'rgba(243,238,228,0.14)';
      ctx.beginPath();
      ctx.roundRect(24, y, w - 48, 80, 14);
      ctx.fill();
      ctx.fillStyle = '#f3eee4';
      ctx.font = `600 15px ${MONO}`;
      ctx.fillText(n.from, 44, y + 30);
      ctx.font = `14px ${MONO}`;
      ctx.fillStyle = '#c9c2b2';
      ctx.fillText(n.text, 44, y + 56);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#8f8878';
      ctx.font = `12px ${MONO}`;
      ctx.fillText(n.when, w - 44, y + 30);
      ctx.textAlign = 'left';
    });
    ctx.fillStyle = '#8f8878';
    ctx.textAlign = 'center';
    ctx.font = `13px ${MONO}`;
    ctx.fillText('RK-1 REMOTE  -  locked', w / 2, h - 60);
    ctx.fillStyle = '#f3eee4';
    ctx.fillRect(w / 2 - 60, h - 30, 120, 5);
  };
  draw(false);
  return {
    canvas: c,
    draw,
    notify(from, text) {
      const now = new Date();
      notes.push({ from, text, when: `${now.getHours() % 12 || 12}:${String(now.getMinutes()).padStart(2, '0')}` });
    },
    get count() { return notes.length; },
  };
}
