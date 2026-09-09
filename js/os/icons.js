// Home screen icons: glossy rounded squares with hand-drawn glyphs.
import { roundRect, FONT } from './ui.js';
import { dunkSilhouette, turntable, n64Controller, rcCar } from './art.js';

export const ICON = 57;
const white = '#fff';

const GLYPHS = {
  messages(ctx) {
    ctx.fillStyle = white;
    roundRect(ctx, 9, 13, 39, 26, 9);
    ctx.fill();
    ctx.beginPath(); ctx.moveTo(15, 37); ctx.lineTo(11, 47); ctx.lineTo(24, 38); ctx.closePath(); ctx.fill();
  },
  calendar(ctx, now) {
    const d = new Date(now);
    const head = ctx.createLinearGradient(0, 0, 0, 15);
    head.addColorStop(0, '#e2483b'); head.addColorStop(1, '#b7291f');
    ctx.fillStyle = head;
    ctx.fillRect(0, 0, ICON, 15);
    ctx.fillStyle = white;
    ctx.font = `bold 8.5px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(d.toLocaleDateString(undefined, { weekday: 'long' }), ICON / 2, 8);
    ctx.fillStyle = '#111';
    ctx.font = `600 27px ${FONT}`;
    ctx.fillText(String(d.getDate()), ICON / 2, 37);
  },
  photos(ctx) {
    ctx.fillStyle = '#ffd23c';
    for (let i = 0; i < 8; i++) {
      ctx.save();
      ctx.translate(28.5, 31);
      ctx.rotate((i / 8) * Math.PI * 2);
      ctx.beginPath(); ctx.ellipse(0, -11, 5.5, 10, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = '#7a4a1e';
    ctx.beginPath(); ctx.arc(28.5, 31, 7, 0, Math.PI * 2); ctx.fill();
  },
  camera(ctx) {
    ctx.fillStyle = '#1e2126';
    ctx.beginPath(); ctx.arc(28.5, 30, 16, 0, Math.PI * 2); ctx.fill();
    const lens = ctx.createRadialGradient(24, 25, 2, 28.5, 30, 12);
    lens.addColorStop(0, '#6f86b5'); lens.addColorStop(1, '#0d1626');
    ctx.fillStyle = lens;
    ctx.beginPath(); ctx.arc(28.5, 30, 12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath(); ctx.arc(24, 25, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e9ecf1';
    ctx.fillRect(41, 9, 8, 5);
  },
  n64(ctx) {
    n64Controller(ctx, 28.5, 30, 52, '#c9ccd1');
  },
  rc(ctx) {
    rcCar(ctx, 28.5, 32, 52);
  },
  maps(ctx) {
    ctx.fillStyle = '#9ecbe6';
    ctx.beginPath(); ctx.ellipse(50, 50, 22, 16, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#c9c2a6'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(0, 20); ctx.lineTo(57, 30); ctx.moveTo(18, 0); ctx.lineTo(30, 57); ctx.stroke();
    ctx.strokeStyle = '#f2d25b'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(0, 40); ctx.quadraticCurveTo(30, 34, 57, 12); ctx.stroke();
    ctx.fillStyle = '#e03a2f';
    ctx.beginPath(); ctx.moveTo(38, 34); ctx.lineTo(33, 22); ctx.arc(38, 20, 5.5, Math.PI * 0.85, Math.PI * 2.15); ctx.closePath(); ctx.fill();
    ctx.fillStyle = white;
    ctx.beginPath(); ctx.arc(38, 20, 2, 0, Math.PI * 2); ctx.fill();
  },
  weather(ctx) {
    ctx.strokeStyle = '#ffd23c'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      ctx.beginPath(); ctx.moveTo(22 + Math.cos(a) * 13, 22 + Math.sin(a) * 13); ctx.lineTo(22 + Math.cos(a) * 17, 22 + Math.sin(a) * 17); ctx.stroke();
    }
    ctx.fillStyle = '#ffd23c';
    ctx.beginPath(); ctx.arc(22, 22, 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = white;
    ctx.beginPath(); ctx.arc(30, 40, 7, 0, Math.PI * 2); ctx.arc(38, 36, 8, 0, Math.PI * 2); ctx.arc(46, 41, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(30, 40, 16, 7);
  },
  clock(ctx, now) {
    const d = new Date(now);
    ctx.fillStyle = white;
    ctx.beginPath(); ctx.arc(28.5, 28.5, 21, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#333'; ctx.lineWidth = 1.5;
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2, len = i % 3 === 0 ? 4 : 2;
      ctx.beginPath(); ctx.moveTo(28.5 + Math.cos(a) * 18, 28.5 + Math.sin(a) * 18); ctx.lineTo(28.5 + Math.cos(a) * (18 - len), 28.5 + Math.sin(a) * (18 - len)); ctx.stroke();
    }
    const h = ((d.getHours() % 12) + d.getMinutes() / 60) / 12 * Math.PI * 2 - Math.PI / 2;
    const m = (d.getMinutes() / 60) * Math.PI * 2 - Math.PI / 2;
    ctx.strokeStyle = '#111'; ctx.lineCap = 'round';
    ctx.lineWidth = 3.5;
    ctx.beginPath(); ctx.moveTo(28.5, 28.5); ctx.lineTo(28.5 + Math.cos(h) * 10, 28.5 + Math.sin(h) * 10); ctx.stroke();
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(28.5, 28.5); ctx.lineTo(28.5 + Math.cos(m) * 15, 28.5 + Math.sin(m) * 15); ctx.stroke();
    ctx.fillStyle = '#e03a2f';
    ctx.beginPath(); ctx.arc(28.5, 28.5, 1.8, 0, Math.PI * 2); ctx.fill();
  },
  calculator(ctx) {
    ctx.fillStyle = '#d5dccb';
    roundRect(ctx, 8, 7, 41, 11, 2);
    ctx.fill();
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 4; c++) {
        ctx.fillStyle = c === 3 ? '#f0873a' : r === 0 ? '#e6e8ec' : '#a9afb8';
        roundRect(ctx, 8 + c * 10.5, 22 + r * 9.5, 9, 8, 1.5);
        ctx.fill();
      }
    }
  },
  notes(ctx) {
    ctx.strokeStyle = 'rgba(120,100,60,0.45)'; ctx.lineWidth = 1;
    for (let y = 22; y < 57; y += 7) { ctx.beginPath(); ctx.moveTo(0, y + 0.5); ctx.lineTo(57, y + 0.5); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(220,60,60,0.55)';
    ctx.beginPath(); ctx.moveTo(11.5, 14); ctx.lineTo(11.5, 57); ctx.stroke();
    const top = ctx.createLinearGradient(0, 0, 0, 14);
    top.addColorStop(0, '#9a7442'); top.addColorStop(1, '#6e4f2a');
    ctx.fillStyle = top;
    ctx.fillRect(0, 0, 57, 14);
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    for (let x = 6; x < 57; x += 9) { ctx.beginPath(); ctx.arc(x, 7, 1.6, 0, Math.PI * 2); ctx.fill(); }
  },
  settings(ctx) {
    const gear = (x, y, r, teeth, hole) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.fillStyle = '#eef0f3';
      for (let i = 0; i < teeth; i++) {
        ctx.save(); ctx.rotate((i / teeth) * Math.PI * 2);
        ctx.fillRect(-r * 0.22, -r - r * 0.32, r * 0.44, r * 0.45);
        ctx.restore();
      }
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#4a4f57';
      ctx.beginPath(); ctx.arc(0, 0, hole, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    };
    gear(23, 33, 11.5, 10, 4.5);
    gear(41, 18, 7, 8, 2.8);
  },
  phone(ctx) {
    ctx.strokeStyle = white; ctx.lineWidth = 8; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(16, 40); ctx.quadraticCurveTo(22, 32, 40, 16); ctx.stroke();
    ctx.fillStyle = white;
    ctx.beginPath(); ctx.ellipse(15, 40, 7, 5, -Math.PI / 4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(41, 15, 7, 5, -Math.PI / 4, 0, Math.PI * 2); ctx.fill();
  },
  mail(ctx) {
    ctx.fillStyle = white;
    roundRect(ctx, 9, 16, 39, 27, 3);
    ctx.fill();
    ctx.strokeStyle = '#6f8fc0'; ctx.lineWidth = 2; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(10, 17); ctx.lineTo(28.5, 32); ctx.lineTo(47, 17); ctx.stroke();
  },
  safari(ctx) {
    ctx.strokeStyle = white; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(28.5, 28.5, 18, 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = 1;
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2, len = i % 6 === 0 ? 4 : 2;
      ctx.beginPath(); ctx.moveTo(28.5 + Math.cos(a) * 16, 28.5 + Math.sin(a) * 16); ctx.lineTo(28.5 + Math.cos(a) * (16 - len), 28.5 + Math.sin(a) * (16 - len)); ctx.stroke();
    }
    ctx.fillStyle = '#e8402f';
    ctx.beginPath(); ctx.moveTo(38, 19); ctx.lineTo(31, 26); ctx.lineTo(26, 31); ctx.closePath(); ctx.fill();
    ctx.fillStyle = white;
    ctx.beginPath(); ctx.moveTo(19, 38); ctx.lineTo(26, 31); ctx.lineTo(31, 26); ctx.closePath(); ctx.fill();
  },
  decks(ctx) {
    ctx.fillStyle = '#111';
    ctx.beginPath(); ctx.arc(26, 30, 20, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 1;
    for (let r = 9; r < 19; r += 3) { ctx.beginPath(); ctx.arc(26, 30, r, 0, Math.PI * 2); ctx.stroke(); }
    ctx.fillStyle = '#d94a2b';
    ctx.beginPath(); ctx.arc(26, 30, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f5e6c8';
    ctx.beginPath(); ctx.arc(26, 30, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#eceef0'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(49, 12); ctx.quadraticCurveTo(50, 28, 36, 38); ctx.stroke();
    ctx.fillStyle = '#b8babd';
    ctx.beginPath(); ctx.arc(49, 12, 4.5, 0, Math.PI * 2); ctx.fill();
  },
};

export function drawIcon(ctx, app, now) {
  ctx.save();
  roundRect(ctx, 0, 0, ICON, ICON, 10);
  ctx.clip();
  const g = ctx.createLinearGradient(0, 0, 0, ICON);
  g.addColorStop(0, app.top);
  g.addColorStop(1, app.bottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, ICON, ICON);
  GLYPHS[app.glyph || app.id]?.(ctx, now);
  const gloss = ctx.createLinearGradient(0, 0, 0, ICON * 0.5);
  gloss.addColorStop(0, 'rgba(255,255,255,0.5)');
  gloss.addColorStop(1, 'rgba(255,255,255,0.08)');
  ctx.fillStyle = gloss;
  ctx.beginPath();
  ctx.ellipse(ICON / 2, -ICON * 0.32, ICON * 0.78, ICON * 0.78, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 1;
  roundRect(ctx, 0.5, 0.5, ICON - 1, ICON - 1, 10);
  ctx.stroke();
}

// All icons plus their dock reflections in one sheet, at 2x.
export function renderAtlas(apps, now, S = 2) {
  const c = document.createElement('canvas');
  const cell = ICON * S, pad = 4 * S;
  c.width = apps.length * (cell + pad);
  c.height = cell * 2 + pad;
  const ctx = c.getContext('2d');
  apps.forEach((app, i) => {
    const x = i * (cell + pad);
    ctx.setTransform(S, 0, 0, S, x, 0);
    drawIcon(ctx, app, now);
    ctx.setTransform(S, 0, 0, -S, x, cell * 2 + pad);
    ctx.globalAlpha = 0.28;
    drawIcon(ctx, app, now);
    ctx.globalAlpha = 1;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const fade = ctx.createLinearGradient(0, cell + pad, 0, cell * 2 + pad);
    fade.addColorStop(0, 'rgba(0,0,0,0)');
    fade.addColorStop(0.55, 'rgba(0,0,0,1)');
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = fade;
    ctx.fillRect(x, cell + pad, cell, cell);
    ctx.globalCompositeOperation = 'source-over';
  });
  return { canvas: c, cell, pad };
}
