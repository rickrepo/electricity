// Illustrations for the phone: the dunk poster, the planet, two 1200s, an
// N64 controller, a nitro buggy, and a few "photos". All drawn from shapes.
import { roundRect, W, H, FONT } from './ui.js';

let seed = 1989;
export const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
export const reseed = (n) => { seed = n; };

export function makeCanvas(w, h, scale = 2) {
  const c = document.createElement('canvas');
  c.width = w * scale;
  c.height = h * scale;
  const ctx = c.getContext('2d');
  ctx.scale(scale, scale);
  return [c, ctx];
}

/* ---------------- the dunk ---------------- */
export function dunkSilhouette(ctx, cx, cy, s, { color = '#000', ball = '#000' } = {}) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s, s);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const seg = (pts, w) => { ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) ctx.lineTo(p[0], p[1]); ctx.stroke(); };
  seg([[0, 0], [-34, 26], [-58, 70]], 17);          // trailing leg
  seg([[0, 0], [46, 14], [98, 8]], 17);             // leading leg
  ctx.beginPath(); ctx.ellipse(106, 6, 13, 6, -0.15, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(-62, 78, 10, 6, 0.6, 0, Math.PI * 2); ctx.fill();
  seg([[0, 0], [14, -58]], 26);                     // torso
  seg([[12, -52], [-14, -34], [-32, -8]], 12);      // trailing arm
  seg([[16, -58], [42, -84], [70, -112]], 12);      // ball arm
  ctx.beginPath(); ctx.arc(22, -80, 12.5, 0, Math.PI * 2); ctx.fill();   // head
  ctx.fillStyle = ball;
  ctx.beginPath(); ctx.arc(83, -123, 15, 0, Math.PI * 2); ctx.fill();    // ball
  if (ball !== color) {
    ctx.strokeStyle = color; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(83, -123, 15, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(68, -123); ctx.quadraticCurveTo(83, -130, 98, -123); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(83, -138); ctx.quadraticCurveTo(76, -123, 83, -108); ctx.stroke();
  }
  ctx.restore();
}

export function skyline(ctx, x, y, w, h, color = '#120608') {
  reseed(23);
  ctx.fillStyle = color;
  let bx = x;
  while (bx < x + w) {
    const bw = 10 + rnd() * 22;
    const bh = h * (0.25 + rnd() * 0.6);
    ctx.fillRect(bx, y + h - bh, bw, bh);
    if (rnd() > 0.7) { ctx.fillRect(bx + bw / 2 - 1, y + h - bh - 10 - rnd() * 14, 2, 24); }
    bx += bw + 2;
  }
  // one very tall one
  ctx.fillRect(x + w * 0.22, y + h * 0.02, 26, h);
  ctx.fillRect(x + w * 0.22 + 6, y - h * 0.22, 2, h * 0.3);
  ctx.fillRect(x + w * 0.22 + 18, y - h * 0.22, 2, h * 0.3);
  ctx.fillRect(x, y + h - 2, w, 2);
}

// The poster: a sunset, a skyline, a man in the air.
export function dunkWallpaper() {
  const [c, ctx] = makeCanvas(W, H);
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#1b0710');
  sky.addColorStop(0.32, '#7a1220');
  sky.addColorStop(0.62, '#e0511d');
  sky.addColorStop(0.82, '#f6a03a');
  sky.addColorStop(1, '#ffd37a');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(214, 318, 10, 214, 318, 150);
  glow.addColorStop(0, 'rgba(255,238,170,0.95)');
  glow.addColorStop(0.35, 'rgba(255,200,90,0.5)');
  glow.addColorStop(1, 'rgba(255,160,60,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#ffe9a8';
  ctx.beginPath(); ctx.arc(214, 318, 54, 0, Math.PI * 2); ctx.fill();
  skyline(ctx, 0, 330, W, 150, '#150609');
  dunkSilhouette(ctx, 132, 262, 1.08, { color: '#0b0507', ball: '#0b0507' });
  return c;
}

/* ---------------- the planet ---------------- */
export function earthWallpaper() {
  reseed(42);
  const [c, ctx] = makeCanvas(W, H);
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#02040a');
  sky.addColorStop(0.55, '#061029');
  sky.addColorStop(1, '#0b1a3c');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 260; i++) {
    ctx.fillStyle = `rgba(255,255,255,${0.25 + rnd() * 0.7})`;
    ctx.beginPath(); ctx.arc(rnd() * W, rnd() * H * 0.8, rnd() * 0.9 + 0.2, 0, Math.PI * 2); ctx.fill();
  }
  const cx = 96, cy = 372, R = 132;
  const glow = ctx.createRadialGradient(cx, cy, R - 6, cx, cy, R + 34);
  glow.addColorStop(0, 'rgba(110,170,255,0.55)');
  glow.addColorStop(0.45, 'rgba(90,150,255,0.18)');
  glow.addColorStop(1, 'rgba(60,120,255,0)');
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(cx, cy, R + 34, 0, Math.PI * 2); ctx.fill();
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.clip();
  const ocean = ctx.createRadialGradient(cx + 50, cy - 60, 10, cx, cy, R);
  ocean.addColorStop(0, '#3f8fd8');
  ocean.addColorStop(0.55, '#1c5aa6');
  ocean.addColorStop(1, '#0a2a5c');
  ctx.fillStyle = ocean;
  ctx.fillRect(0, 0, W, H);
  const tones = ['#3f7a34', '#4d8a3b', '#6a8f3f', '#9c8d52', '#3a6b33'];
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2 + rnd() * 0.6, d = R * (0.25 + rnd() * 0.6);
    let x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d;
    const steps = 8 + Math.floor(rnd() * 10);
    for (let i = 0; i < steps; i++) {
      ctx.fillStyle = tones[Math.floor(rnd() * tones.length)];
      ctx.beginPath(); ctx.arc(x, y, 3 + rnd() * 8, 0, Math.PI * 2); ctx.fill();
      x += (rnd() - 0.5) * 16;
      y += (rnd() - 0.5) * 16;
    }
  }
  const cap = ctx.createRadialGradient(cx - 10, cy - R + 8, 4, cx - 10, cy - R + 8, 46);
  cap.addColorStop(0, 'rgba(255,255,255,0.9)');
  cap.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = cap;
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 46; i++) {
    const a = rnd() * Math.PI * 2, d = rnd() * R * 0.95;
    ctx.fillStyle = `rgba(255,255,255,${0.18 + rnd() * 0.3})`;
    ctx.beginPath();
    ctx.ellipse(cx + Math.cos(a) * d, cy + Math.sin(a) * d, 6 + rnd() * 16, 1.2 + rnd() * 2, (rnd() - 0.5) * 0.9, 0, Math.PI * 2);
    ctx.fill();
  }
  const night = ctx.createRadialGradient(cx + 70, cy - 80, R * 0.2, cx + 30, cy - 30, R * 1.35);
  night.addColorStop(0, 'rgba(0,0,0,0)');
  night.addColorStop(0.62, 'rgba(0,0,0,0.05)');
  night.addColorStop(1, 'rgba(0,0,10,0.92)');
  ctx.fillStyle = night;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
  ctx.strokeStyle = 'rgba(170,210,255,0.55)';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(cx, cy, R - 0.5, -Math.PI * 0.95, Math.PI * 0.05); ctx.stroke();
  return c;
}

/* ---------------- a direct-drive turntable ---------------- */
// Drawn in a 300 x 246 box scaled to `w` wide.
export function turntable(ctx, x, y, w, { angle = 0, playing = false, pitch = 0.5 } = {}) {
  const k = w / 300;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(k, k);
  const body = ctx.createLinearGradient(0, 0, 0, 246);
  body.addColorStop(0, '#dcdde0');
  body.addColorStop(1, '#a6a8ac');
  ctx.fillStyle = body;
  roundRect(ctx, 0, 0, 300, 246, 10);
  ctx.fill();
  ctx.strokeStyle = '#66686c';
  ctx.lineWidth = 2;
  ctx.stroke();
  const px = 118, py = 123, pr = 96;
  ctx.fillStyle = '#1c1c1e';
  ctx.beginPath(); ctx.arc(px, py, pr + 7, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#c8c9cb';
  for (let i = 0; i < 64; i++) {
    const a = (i / 64) * Math.PI * 2 + angle;
    ctx.beginPath(); ctx.arc(px + Math.cos(a) * (pr + 2), py + Math.sin(a) * (pr + 2), 1.5, 0, Math.PI * 2); ctx.fill();
  }
  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(angle);
  ctx.fillStyle = '#0f0f11';
  ctx.beginPath(); ctx.arc(0, 0, pr - 4, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.07)';
  ctx.lineWidth = 1;
  for (let r = 38; r < pr - 8; r += 5) { ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.beginPath(); ctx.arc(0, 0, pr - 20, -2.2, -1.4); ctx.stroke();
  ctx.fillStyle = '#d94a2b';
  ctx.beginPath(); ctx.arc(0, 0, 33, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(-27, -2, 18, 4);
  ctx.fillStyle = '#f5e6c8';
  ctx.beginPath(); ctx.arc(0, 0, 3.5, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#e6e7e9';
  ctx.beginPath(); ctx.arc(px, py, 4, 0, Math.PI * 2); ctx.fill();
  // tonearm
  const ax = 258, ay = 58;
  ctx.fillStyle = '#b8babd';
  ctx.beginPath(); ctx.arc(ax, ay, 17, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#5c5e62';
  ctx.lineWidth = 1;
  ctx.stroke();
  const tx = playing ? px + 56 : ax - 8, ty = playing ? py + 26 : ay + 128;
  ctx.strokeStyle = '#eceef0';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(ax, ay); ctx.quadraticCurveTo(ax + 16, (ay + ty) / 2, tx, ty); ctx.stroke();
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.save();
  ctx.translate(tx, ty);
  ctx.rotate(playing ? 0.8 : 1.25);
  ctx.fillStyle = '#2b2c2f';
  ctx.fillRect(-6, -4, 24, 9);
  ctx.restore();
  ctx.fillStyle = '#4a4c50';
  ctx.beginPath(); ctx.arc(ax + 16, ay - 14, 9, 0, Math.PI * 2); ctx.fill();
  // pitch fader
  ctx.fillStyle = '#222';
  roundRect(ctx, 272, 128, 12, 104, 3);
  ctx.fill();
  ctx.fillStyle = '#d0d1d3';
  roundRect(ctx, 264, 128 + pitch * 88, 28, 14, 3);
  ctx.fill();
  ctx.strokeStyle = '#555';
  ctx.stroke();
  ctx.fillStyle = '#333';
  ctx.fillRect(265, 135 + pitch * 88, 26, 1);
  // start / stop, speed buttons, strobe lamp, target light
  ctx.fillStyle = playing ? '#3a3c40' : '#4a4c50';
  roundRect(ctx, 16, 198, 42, 32, 4);
  ctx.fill();
  ctx.strokeStyle = '#222';
  ctx.stroke();
  ctx.fillStyle = '#e8e9eb';
  ctx.font = `bold 7px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('START · STOP', 37, 214);
  ctx.fillStyle = '#2d2f33';
  roundRect(ctx, 16, 170, 18, 14, 2); ctx.fill();
  roundRect(ctx, 40, 170, 18, 14, 2); ctx.fill();
  ctx.fillStyle = playing ? '#ff4d3a' : '#6e2a22';
  ctx.fillRect(20, 175, 10, 2);
  ctx.fillStyle = playing ? '#ff5a3c' : '#5a2b23';
  ctx.beginPath(); ctx.arc(30, 40, 5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#cfd0d2';
  roundRect(ctx, 22, 62, 8, 40, 3);
  ctx.fill();
  ctx.fillStyle = '#5a5c60';
  ctx.font = `bold 8px ${FONT}`;
  ctx.textAlign = 'right';
  ctx.fillText('QUARTZ · DIRECT DRIVE', 292, 237);
  ctx.restore();
}

/* ---------------- the three-pronged controller ---------------- */
export function n64Controller(ctx, cx, cy, w, color = '#9a9da2') {
  const k = w / 200;
  ctx.save();
  ctx.translate(cx - 100 * k, cy - 66 * k);
  ctx.scale(k, k);
  ctx.strokeStyle = '#45484d';
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.fillStyle = color;
  const handle = (x, rot) => { ctx.save(); ctx.translate(x, 48); ctx.rotate(rot); roundRect(ctx, -15, 0, 30, 82, 15); ctx.fill(); ctx.stroke(); ctx.restore(); };
  handle(36, 0.38);
  handle(164, -0.38);
  roundRect(ctx, 84, 40, 32, 88, 15); ctx.fill(); ctx.stroke();
  roundRect(ctx, 18, 18, 164, 48, 24); ctx.fill(); ctx.stroke();
  ctx.fillStyle = color;
  roundRect(ctx, 20, 20, 160, 44, 22); ctx.fill();
  roundRect(ctx, 86, 42, 28, 40, 14); ctx.fill();
  // d-pad
  ctx.fillStyle = '#3a3c40';
  ctx.fillRect(38, 30, 9, 26);
  ctx.fillRect(29.5, 38.5, 26, 9);
  // start
  ctx.fillStyle = '#d63a2f';
  ctx.beginPath(); ctx.arc(100, 32, 5.5, 0, Math.PI * 2); ctx.fill();
  // A and B
  ctx.fillStyle = '#2f6fd0';
  ctx.beginPath(); ctx.arc(140, 52, 8.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#35a24a';
  ctx.beginPath(); ctx.arc(126, 39, 7, 0, Math.PI * 2); ctx.fill();
  // C buttons
  ctx.fillStyle = '#f2c230';
  for (const [x, y] of [[165, 30], [156, 41], [174, 41], [165, 52]]) { ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill(); }
  // the stick
  ctx.fillStyle = '#5b5e63';
  ctx.beginPath(); ctx.arc(100, 78, 13, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#b3b6ba';
  ctx.beginPath(); ctx.arc(100, 78, 7.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#d8dadd';
  ctx.beginPath(); ctx.arc(98, 76, 2.5, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

export function cartridge(ctx, x, y, w, color = '#8a8d92') {
  const k = w / 60;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(k, k);
  ctx.fillStyle = color;
  roundRect(ctx, 0, 0, 60, 44, 4);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fillRect(6, 8, 48, 24);
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillRect(10, 12, 40, 6);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(4, 38, 52, 3);
  ctx.restore();
}

/* ---------------- a nitro buggy, side view ---------------- */
export function rcCar(ctx, cx, cy, w, { bounce = 0, color = '#e8452e' } = {}) {
  const k = w / 200;
  ctx.save();
  ctx.translate(cx - 100 * k, cy - 40 * k - bounce);
  ctx.scale(k, k);
  const wheel = (x, y, r) => {
    ctx.fillStyle = '#151618';
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2b2d31';
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      ctx.beginPath(); ctx.arc(x + Math.cos(a) * (r - 3), y + Math.sin(a) * (r - 3), 2.6, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#d3d6da';
    ctx.beginPath(); ctx.arc(x, y, r * 0.45, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#6b6f75';
    ctx.beginPath(); ctx.arc(x, y, r * 0.16, 0, Math.PI * 2); ctx.fill();
  };
  // rear wing
  ctx.fillStyle = '#1e1f22';
  ctx.beginPath(); ctx.moveTo(150, 14); ctx.lineTo(196, 6); ctx.lineTo(198, 12); ctx.lineTo(152, 21); ctx.closePath(); ctx.fill();
  ctx.fillRect(160, 16, 3, 20);
  ctx.fillRect(184, 12, 3, 24);
  // chassis and pipe
  ctx.fillStyle = '#2e3136';
  roundRect(ctx, 26, 54, 140, 12, 4);
  ctx.fill();
  ctx.fillStyle = '#b9bcc0';
  ctx.beginPath(); ctx.ellipse(132, 66, 26, 6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#8e9195';
  ctx.beginPath(); ctx.ellipse(158, 66, 6, 4, 0, 0, Math.PI * 2); ctx.fill();
  // body shell
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(14, 54); ctx.lineTo(28, 30); ctx.lineTo(70, 22); ctx.lineTo(118, 18); ctx.lineTo(168, 30); ctx.lineTo(178, 54);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.beginPath(); ctx.moveTo(40, 44); ctx.lineTo(160, 38); ctx.lineTo(162, 43); ctx.lineTo(41, 49); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#1b2733';
  ctx.beginPath(); ctx.moveTo(32, 32); ctx.lineTo(72, 25); ctx.lineTo(76, 36); ctx.lineTo(38, 40); ctx.closePath(); ctx.fill();
  // engine head fins
  ctx.fillStyle = '#7d8187';
  for (let i = 0; i < 4; i++) ctx.fillRect(104 + i * 5, 8 + i, 3, 12 - i);
  // antenna
  ctx.strokeStyle = '#111';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(60, 26); ctx.lineTo(54, -22); ctx.stroke();
  ctx.fillStyle = '#e03a2f';
  ctx.beginPath(); ctx.arc(54, -23, 3, 0, Math.PI * 2); ctx.fill();
  // number plate
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(96, 38, 9, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#111';
  ctx.font = `bold 11px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('89', 96, 39);
  wheel(42, 62, 22);
  wheel(152, 62, 24);
  ctx.restore();
}

export function cassette(ctx, cx, cy, w, color = '#2b2d31') {
  const k = w / 120;
  ctx.save();
  ctx.translate(cx - 60 * k, cy - 38 * k);
  ctx.scale(k, k);
  ctx.fillStyle = color;
  roundRect(ctx, 0, 0, 120, 76, 6);
  ctx.fill();
  ctx.fillStyle = '#f2e6c9';
  roundRect(ctx, 8, 8, 104, 40, 3);
  ctx.fill();
  ctx.fillStyle = '#d94a2b';
  ctx.fillRect(8, 8, 104, 6);
  ctx.fillStyle = '#111';
  roundRect(ctx, 30, 22, 60, 22, 11);
  ctx.fill();
  for (const x of [45, 75]) {
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(x, 33, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#111';
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; ctx.fillRect(x + Math.cos(a) * 5 - 1, 33 + Math.sin(a) * 5 - 1, 2, 2); }
  }
  ctx.fillStyle = '#4a4c50';
  ctx.font = `bold 8px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('SUMMER 99 · SIDE A', 12, 60);
  ctx.fillStyle = '#6a6c70';
  for (const x of [14, 30, 90, 106]) { ctx.beginPath(); ctx.arc(x, 68, 2, 0, Math.PI * 2); ctx.fill(); }
  ctx.restore();
}

export function cake(ctx, cx, cy, w) {
  const k = w / 120;
  ctx.save();
  ctx.translate(cx - 60 * k, cy - 50 * k);
  ctx.scale(k, k);
  ctx.fillStyle = '#e9c9a6';
  roundRect(ctx, 10, 40, 100, 50, 8);
  ctx.fill();
  ctx.fillStyle = '#f7f2ea';
  roundRect(ctx, 10, 40, 100, 14, 7);
  ctx.fill();
  ctx.fillStyle = '#d94a2b';
  for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(22 + i * 15, 52, 4, 0, Math.PI * 2); ctx.fill(); }
  ctx.fillStyle = '#fff';
  ctx.fillRect(38, 14, 6, 28);
  ctx.fillRect(76, 14, 6, 28);
  ctx.fillStyle = '#f7a53a';
  ctx.beginPath(); ctx.ellipse(41, 9, 4, 7, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(79, 9, 4, 7, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#7a3b1e';
  ctx.font = `bold 20px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('1989', 60, 74);
  ctx.restore();
}

/* ---------------- "photos" ---------------- */
// Each one is a 320 x 427 canvas (3:4), drawn like a snapshot.
export function makePhoto(kind) {
  const PW = 320, PH = 427;
  const [c, ctx] = makeCanvas(PW, PH);
  const ground = (top, bottom, y) => {
    ctx.fillStyle = top; ctx.fillRect(0, 0, PW, y);
    ctx.fillStyle = bottom; ctx.fillRect(0, y, PW, PH - y);
  };
  switch (kind) {
    case 'dunk': {
      const wall = dunkWallpaper();
      ctx.drawImage(wall, 0, 26, 640, 854, 0, 0, PW, PH);
      break;
    }
    case 'earth':
      ctx.drawImage(earthWallpaper(), 0, 26, 640, 854, 0, 0, PW, PH);
      break;
    case 'decks':
      ground('#2a2622', '#4b3a2b', 250);
      turntable(ctx, 12, 120, 140, { angle: 0.4, playing: true, pitch: 0.4 });
      turntable(ctx, 168, 120, 140, { angle: 2.1, playing: false, pitch: 0.55 });
      ctx.fillStyle = '#1e1f22';
      roundRect(ctx, 100, 250, 120, 60, 4); ctx.fill();
      ctx.fillStyle = '#d0d1d3';
      for (let i = 0; i < 3; i++) ctx.fillRect(112 + i * 36, 262, 24, 4);
      ctx.fillRect(118, 286, 84, 4);
      ctx.fillStyle = '#e8e9eb';
      roundRect(ctx, 150, 280, 16, 16, 2); ctx.fill();
      break;
    case 'n64':
      ground('#5a4a3c', '#7b6247', 190);
      ctx.fillStyle = '#3f3a36';
      roundRect(ctx, 60, 150, 200, 70, 14); ctx.fill();
      ctx.fillStyle = '#2a2724';
      ctx.fillRect(110, 150, 100, 12);
      ctx.fillStyle = '#d63a2f';
      ctx.beginPath(); ctx.arc(90, 190, 5, 0, Math.PI * 2); ctx.fill();
      n64Controller(ctx, 160, 300, 220);
      break;
    case 'rc':
      ground('#8ec8ef', '#9a7b53', 250);
      ctx.fillStyle = '#c9a874';
      ctx.beginPath(); ctx.ellipse(160, 300, 190, 40, 0, 0, Math.PI * 2); ctx.fill();
      rcCar(ctx, 160, 250, 260, { bounce: 0 });
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.beginPath(); ctx.ellipse(160, 296, 120, 12, 0, 0, Math.PI * 2); ctx.fill();
      break;
    case 'cassette':
      ground('#d9cdb8', '#a88a62', 300);
      cassette(ctx, 160, 220, 220);
      break;
    case 'cake':
      ground('#4d2b3a', '#6b3f52', 330);
      cake(ctx, 160, 220, 240);
      break;
    case 'skyline': {
      const sky = ctx.createLinearGradient(0, 0, 0, PH);
      sky.addColorStop(0, '#1b0710'); sky.addColorStop(0.6, '#c74a1e'); sky.addColorStop(1, '#f6c26a');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, PW, PH);
      skyline(ctx, 0, 300, PW, 127, '#160709');
      break;
    }
  }
  // a little vignette, like a cheap lens
  const v = ctx.createRadialGradient(PW / 2, PH / 2, PH * 0.35, PW / 2, PH / 2, PH * 0.8);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(0,0,0,0.35)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, PW, PH);
  return c;
}
