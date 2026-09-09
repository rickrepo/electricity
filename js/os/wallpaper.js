// Procedurally drawn circuit-board wallpapers for the RickyOS desktop.
import { seededRandom } from '../util/dom.js';

const cache = new Map();

export const WALLPAPERS = {
  navy: { label: 'Navy board', base: '#0d1b2a', copper: '#b8773f', pad: '#e6c27a', silk: '#c9d4dc', seed: 3 },
  green: { label: 'Green board', base: '#0f3b2e', copper: '#c9a04a', pad: '#f1d78a', silk: '#dfe7e2', seed: 7 },
  black: { label: 'Black board', base: '#121316', copper: '#8f98a3', pad: '#d9dee5', silk: '#9aa3ad', seed: 11 },
  plain: { label: 'Plain', base: '#0d1b2a', copper: null },
};

export function pcbWallpaper(key = 'navy', size = 768) {
  const spec = WALLPAPERS[key] || WALLPAPERS.navy;
  const cacheKey = `${key}:${size}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = spec.base;
  ctx.fillRect(0, 0, size, size);
  if (spec.copper) {
    const rnd = seededRandom(spec.seed);
    const step = 48;
    const cells = size / step;
    // faint grid dots
    ctx.fillStyle = 'rgba(255,255,255,0.045)';
    for (let y = 0; y < cells; y++) for (let x = 0; x < cells; x++) ctx.fillRect(x * step + step / 2 - 1, y * step + step / 2 - 1, 2, 2);
    const dirs = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
    const pads = [];
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (let t = 0; t < 34; t++) {
      let x = Math.floor(rnd() * cells);
      let y = Math.floor(rnd() * cells);
      let d = Math.floor(rnd() * 8);
      const len = 3 + Math.floor(rnd() * 6);
      ctx.strokeStyle = spec.copper;
      ctx.beginPath();
      ctx.moveTo(x * step + step / 2, y * step + step / 2);
      pads.push([x, y]);
      for (let i = 0; i < len; i++) {
        if (rnd() < 0.35) d = (d + (rnd() < 0.5 ? 1 : 7)) % 8;
        const nx = x + dirs[d][0];
        const ny = y + dirs[d][1];
        if (nx < 0 || ny < 0 || nx >= cells || ny >= cells) break;
        x = nx;
        y = ny;
        ctx.lineTo(x * step + step / 2, y * step + step / 2);
      }
      ctx.stroke();
      pads.push([x, y]);
    }
    for (const [x, y] of pads) {
      const cx = x * step + step / 2;
      const cy = y * step + step / 2;
      ctx.fillStyle = spec.pad;
      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = spec.base;
      ctx.beginPath();
      ctx.arc(cx, cy, 2.4, 0, Math.PI * 2);
      ctx.fill();
    }
    // a couple of chip outlines with pins
    ctx.strokeStyle = spec.silk;
    ctx.lineWidth = 1.5;
    ctx.font = "11px 'IBM Plex Mono', monospace";
    ctx.fillStyle = spec.silk;
    for (let i = 0; i < 3; i++) {
      const cx = 60 + rnd() * (size - 200);
      const cy = 60 + rnd() * (size - 160);
      const w = 70 + rnd() * 50;
      const h = 34;
      ctx.globalAlpha = 0.55;
      ctx.strokeRect(cx, cy, w, h);
      for (let p = 6; p < w - 4; p += 10) {
        ctx.fillRect(cx + p, cy - 6, 3, 6);
        ctx.fillRect(cx + p, cy + h, 3, 6);
      }
      ctx.fillText(['U1', 'U3', 'U7'][i], cx + 6, cy + 22);
      ctx.globalAlpha = 1;
    }
    ctx.globalAlpha = 0.5;
    ctx.fillText('RK-1 MAIN  REV C', size - 130, size - 14);
    ctx.globalAlpha = 1;
  }
  const url = canvas.toDataURL('image/png');
  cache.set(cacheKey, url);
  return url;
}
