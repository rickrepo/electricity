// The phone's software, drawn on a 320 x 480 canvas at 2x, in the manner of
// the first iPhone OS: a boot logo, a lock screen with "slide to unlock", a
// black home screen of glossy icons over a reflective dock, and app screens
// with the blue-grey bar and pinstripes. The physical buttons drive it:
// home goes home or wakes it, sleep puts it to sleep.
const W = 320, H = 480, S = 2;
const FONT = 'Helvetica Neue, Helvetica, Arial, sans-serif';
const TRACK = { x: 22, y: 419, w: 276, h: 46, r: 9 };
const KNOB = { w: 64, h: 38, r: 8, pad: 4 };
const TRAVEL = TRACK.w - KNOB.w - KNOB.pad * 2;
const ICON = 57;
const COLS = [16, 93, 170, 247];
const ROWS = [30, 117, 204, 291];
const DOCK_Y = 389;
const DOCK_ICON_Y = 404;
const easeOut = (t) => 1 - (1 - t) ** 3;
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

let seed = 42;
const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/* ------------------------------------------------------------------ */
/* wallpaper: a planet seen from orbit, in the spirit of the original  */
/* ------------------------------------------------------------------ */
function drawWallpaper() {
  const c = document.createElement('canvas');
  c.width = W * S; c.height = H * S;
  const ctx = c.getContext('2d');
  ctx.scale(S, S);
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#02040a');
  sky.addColorStop(0.55, '#061029');
  sky.addColorStop(1, '#0b1a3c');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 260; i++) {
    const x = rnd() * W, y = rnd() * H * 0.8, r = rnd() * 0.9 + 0.2;
    ctx.fillStyle = `rgba(255,255,255,${0.25 + rnd() * 0.7})`;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
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
      const r = 3 + rnd() * 8;
      ctx.fillStyle = tones[Math.floor(rnd() * tones.length)];
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
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
    const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d;
    ctx.fillStyle = `rgba(255,255,255,${0.18 + rnd() * 0.3})`;
    ctx.beginPath();
    ctx.ellipse(x, y, 6 + rnd() * 16, 1.2 + rnd() * 2, (rnd() - 0.5) * 0.9, 0, Math.PI * 2);
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

/* ------------------------------------------------------------------ */
/* icons: glossy rounded squares, each glyph drawn by hand             */
/* ------------------------------------------------------------------ */
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
  videos(ctx) {
    ctx.strokeStyle = '#3b2a18'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(24, 14); ctx.lineTo(18, 5); ctx.moveTo(30, 14); ctx.lineTo(36, 5); ctx.stroke();
    ctx.fillStyle = '#8a5a2b';
    roundRect(ctx, 8, 13, 41, 32, 6);
    ctx.fill();
    const scr = ctx.createLinearGradient(0, 17, 0, 41);
    scr.addColorStop(0, '#dfe4ea'); scr.addColorStop(1, '#8b9096');
    ctx.fillStyle = scr;
    roundRect(ctx, 12, 17, 26, 24, 3);
    ctx.fill();
    ctx.fillStyle = '#3a2a18';
    ctx.beginPath(); ctx.arc(44, 24, 2.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(44, 33, 2.2, 0, Math.PI * 2); ctx.fill();
  },
  stocks(ctx) {
    ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 1;
    for (let y = 14; y < 50; y += 9) { ctx.beginPath(); ctx.moveTo(6, y); ctx.lineTo(51, y); ctx.stroke(); }
    ctx.strokeStyle = white; ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(8, 44); ctx.lineTo(16, 35); ctx.lineTo(24, 39); ctx.lineTo(32, 25); ctx.lineTo(40, 29); ctx.lineTo(50, 13);
    ctx.stroke();
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
      const a = (i / 12) * Math.PI * 2;
      const len = i % 3 === 0 ? 4 : 2;
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
  web(ctx) {
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
  music(ctx) {
    ctx.fillStyle = white; ctx.strokeStyle = white; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.ellipse(21, 40, 5, 4, -0.3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(37, 36, 5, 4, -0.3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(25, 39); ctx.lineTo(25, 16); ctx.lineTo(41, 12); ctx.lineTo(41, 35); ctx.stroke();
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(25, 17); ctx.lineTo(41, 13); ctx.stroke();
  },
};

export const APPS = [
  { id: 'messages', name: 'Messages', top: '#8ce87a', bottom: '#2c9b3c' },
  { id: 'calendar', name: 'Calendar', top: '#ffffff', bottom: '#e6e6e6' },
  { id: 'photos', name: 'Photos', top: '#7cc0ff', bottom: '#2b6fd0' },
  { id: 'camera', name: 'Camera', top: '#aab1bb', bottom: '#4d545f' },
  { id: 'videos', name: 'Videos', top: '#e4e4e4', bottom: '#9a9a9a' },
  { id: 'stocks', name: 'Stocks', top: '#3d4d5e', bottom: '#0c151f' },
  { id: 'maps', name: 'Maps', top: '#f6f0dc', bottom: '#dcd2b3' },
  { id: 'weather', name: 'Weather', top: '#93d4ff', bottom: '#2d8de0' },
  { id: 'clock', name: 'Clock', top: '#333', bottom: '#050505' },
  { id: 'calculator', name: 'Calculator', top: '#8f959c', bottom: '#3d4249' },
  { id: 'notes', name: 'Notes', top: '#fff0a0', bottom: '#f3c53c' },
  { id: 'settings', name: 'Settings', top: '#b4b9c0', bottom: '#565b63' },
];
export const DOCK = [
  { id: 'phone', name: 'Phone', top: '#8ce87a', bottom: '#1f8f31' },
  { id: 'mail', name: 'Mail', top: '#8bbaff', bottom: '#2c68d4' },
  { id: 'web', name: 'Web', top: '#78bcff', bottom: '#1c63c9' },
  { id: 'music', name: 'Music', top: '#ffbf5c', bottom: '#e35f16' },
];
const ALL = [...APPS, ...DOCK];

function drawIcon(ctx, app, now) {
  ctx.save();
  roundRect(ctx, 0, 0, ICON, ICON, 10);
  ctx.clip();
  const g = ctx.createLinearGradient(0, 0, 0, ICON);
  g.addColorStop(0, app.top);
  g.addColorStop(1, app.bottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, ICON, ICON);
  GLYPHS[app.id]?.(ctx, now);
  // the gloss
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

// All sixteen icons plus their dock reflections, redrawn once a minute
// (the calendar and the clock keep time).
function renderAtlas(now) {
  const c = document.createElement('canvas');
  const cell = ICON * S, pad = 4 * S;
  c.width = ALL.length * (cell + pad);
  c.height = cell * 2 + pad;
  const ctx = c.getContext('2d');
  ALL.forEach((app, i) => {
    const x = i * (cell + pad);
    ctx.setTransform(S, 0, 0, S, x, 0);
    drawIcon(ctx, app, now);
    // reflection below
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

/* ------------------------------------------------------------------ */
export function createPhoneOS({ carrier = 'Ricky', logo = 'R' } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = W * S;
  canvas.height = H * S;
  const ctx = canvas.getContext('2d');
  const wall = drawWallpaper();
  let atlas = null, atlasMinute = -1;

  const st = {
    mode: 'off', since: 0, last: -1e9,
    knob: 0, dragging: false, grab: 0, releaseAt: 0, releaseFrom: 0,
    app: null, appRect: null, pressed: null,
    listeners: new Set(),
  };
  const setMode = (mode, now) => { st.mode = mode; st.since = now; for (const fn of st.listeners) fn(mode); };

  const two = (n) => String(n).padStart(2, '0');
  const clockParts = () => {
    const d = new Date();
    const h = d.getHours(), m = d.getMinutes();
    return { time: `${h % 12 || 12}:${two(m)}`, ampm: h < 12 ? 'AM' : 'PM', date: d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }) };
  };

  /* ---------- shared pieces ---------- */
  function statusBar() {
    const p = clockParts();
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, 20);
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 5; i++) ctx.fillRect(6 + i * 5, 16 - (3 + i * 2), 3, 3 + i * 2);
    ctx.font = `bold 12px ${FONT}`;
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
    ctx.fillText(carrier, 34, 15);
    ctx.textAlign = 'center';
    ctx.fillText(`${p.time} ${p.ampm}`, W / 2, 15);
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 1;
    roundRect(ctx, W - 30.5, 5.5, 22, 10, 2);
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.fillRect(W - 7.5, 8, 2, 5);
    ctx.fillStyle = '#5fd44c';
    ctx.fillRect(W - 29, 7, 19 * 0.87, 7);
  }

  /* ---------- boot ---------- */
  function drawBoot(now) {
    const t = now - st.since;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = clamp(t / 500, 0, 1);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `600 96px ${FONT}`;
    ctx.fillText(logo, W / 2, H / 2 - 8);
    ctx.globalAlpha = 1;
  }

  /* ---------- lock screen ---------- */
  function drawLock(now) {
    ctx.drawImage(wall, 0, 0, W, H);
    statusBar();
    const p = clockParts();
    ctx.fillStyle = 'rgba(0,0,0,0.42)';
    ctx.fillRect(0, 20, W, 96);
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    ctx.fillRect(0, 20, W, 1);
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 115, W, 1);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#fff';
    ctx.shadowColor = 'rgba(0,0,0,0.7)';
    ctx.shadowBlur = 3;
    ctx.shadowOffsetY = 1;
    ctx.font = `200 60px ${FONT}`;
    ctx.fillText(p.time, W / 2, 86);
    ctx.font = `400 17px ${FONT}`;
    ctx.fillText(p.date, W / 2, 108);
    ctx.shadowColor = 'transparent';

    // slider
    if (!st.dragging && st.releaseAt) {
      const t = Math.min(1, (now - st.releaseAt) / 320);
      st.knob = st.releaseFrom * (1 - easeOut(t));
      if (t >= 1) st.releaseAt = 0;
    }
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(0, 400, W, 80);
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    ctx.fillRect(0, 400, W, 1);
    const g = ctx.createLinearGradient(0, TRACK.y, 0, TRACK.y + TRACK.h);
    g.addColorStop(0, 'rgba(0,0,0,0.78)');
    g.addColorStop(1, 'rgba(34,34,36,0.78)');
    roundRect(ctx, TRACK.x, TRACK.y, TRACK.w, TRACK.h, TRACK.r);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.7)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(TRACK.x + 8, TRACK.y + TRACK.h - 1, TRACK.w - 16, 1);
    const textAlpha = clamp(1 - st.knob * 2.5, 0, 1);
    if (textAlpha > 0) {
      const tx = TRACK.x + KNOB.w + KNOB.pad + (TRACK.w - KNOB.w - KNOB.pad) / 2;
      ctx.font = `300 22px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillStyle = `rgba(255,255,255,${0.35 * textAlpha})`;
      ctx.fillText('slide to unlock', tx, 449);
      const phase = (now / 2600) % 1;
      const bx = tx - 100 + phase * 230;
      const sg = ctx.createLinearGradient(bx - 40, 0, bx + 40, 0);
      sg.addColorStop(0, 'rgba(255,255,255,0)');
      sg.addColorStop(0.5, `rgba(255,255,255,${0.9 * textAlpha})`);
      sg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = sg;
      ctx.fillText('slide to unlock', tx, 449);
    }
    const kx = TRACK.x + KNOB.pad + st.knob * TRAVEL;
    const ky = TRACK.y + KNOB.pad;
    const kg = ctx.createLinearGradient(0, ky, 0, ky + KNOB.h);
    kg.addColorStop(0, '#f8f8f9');
    kg.addColorStop(0.5, '#dcdcdf');
    kg.addColorStop(0.5001, '#c8c8cc');
    kg.addColorStop(1, '#a0a0a5');
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = 3;
    ctx.shadowOffsetY = 1;
    roundRect(ctx, kx, ky, KNOB.w, KNOB.h, KNOB.r);
    ctx.fillStyle = kg;
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = 'rgba(0,0,0,0.45)';
    ctx.stroke();
    ctx.fillStyle = '#5c5c61';
    ctx.beginPath();
    ctx.moveTo(kx + 21, ky + 15); ctx.lineTo(kx + 34, ky + 15); ctx.lineTo(kx + 34, ky + 9); ctx.lineTo(kx + 47, ky + 19);
    ctx.lineTo(kx + 34, ky + 29); ctx.lineTo(kx + 34, ky + 23); ctx.lineTo(kx + 21, ky + 23);
    ctx.closePath();
    ctx.fill();
  }

  /* ---------- home screen ---------- */
  const iconRect = (i) => (i < 12 ? { x: COLS[i % 4], y: ROWS[Math.floor(i / 4)] } : { x: COLS[i - 12], y: DOCK_ICON_Y });
  function ensureAtlas(now) {
    const minute = Math.floor(Date.now() / 60000);
    if (!atlas || minute !== atlasMinute) { atlas = renderAtlas(Date.now()); atlasMinute = minute; }
  }
  function drawHome(now) {
    ensureAtlas(now);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    statusBar();
    ctx.font = `bold 11px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    // dock shelf
    const dg = ctx.createLinearGradient(0, DOCK_Y, 0, H);
    dg.addColorStop(0, '#6a6a6c');
    dg.addColorStop(0.08, '#4a4a4c');
    dg.addColorStop(1, '#151516');
    ctx.fillStyle = dg;
    ctx.fillRect(0, DOCK_Y, W, H - DOCK_Y);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(0, DOCK_Y, W, 1);
    ALL.forEach((app, i) => {
      const r = iconRect(i);
      const sx = i * (atlas.cell + atlas.pad);
      const pressed = st.pressed === i;
      if (pressed) ctx.globalAlpha = 0.6;
      ctx.drawImage(atlas.canvas, sx, 0, atlas.cell, atlas.cell, r.x, r.y, ICON, ICON);
      ctx.globalAlpha = 1;
      if (i < 12) {
        ctx.fillStyle = '#fff';
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 2;
        ctx.shadowOffsetY = 1;
        ctx.fillText(app.name, r.x + ICON / 2, r.y + ICON + 13);
        ctx.shadowColor = 'transparent';
      } else {
        ctx.drawImage(atlas.canvas, sx, atlas.cell + atlas.pad, atlas.cell, atlas.cell, r.x, r.y + ICON + 1, ICON, ICON);
      }
    });
    // page dot
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath(); ctx.arc(W / 2, 378, 2.5, 0, Math.PI * 2); ctx.fill();
  }

  /* ---------- app screens ---------- */
  function drawApp(now, app) {
    ctx.fillStyle = '#c5ccd4';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(0,0,0,0.055)';
    for (let x = 3; x < W; x += 7) ctx.fillRect(x, 64, 1, H - 64);
    statusBar();
    const bar = ctx.createLinearGradient(0, 20, 0, 64);
    bar.addColorStop(0, '#b9c8de');
    bar.addColorStop(0.5, '#8ea4c2');
    bar.addColorStop(0.5001, '#7c93b3');
    bar.addColorStop(1, '#6a83a6');
    ctx.fillStyle = bar;
    ctx.fillRect(0, 20, W, 44);
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.fillRect(0, 20, W, 1);
    ctx.fillStyle = '#2d3e58';
    ctx.fillRect(0, 63, W, 1);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = -1;
    ctx.font = `bold 20px ${FONT}`;
    ctx.fillText(app.name, W / 2, 42);
    ctx.shadowColor = 'transparent';

    if (app.id === 'notes') {
      ctx.fillStyle = '#fbf0a5';
      ctx.fillRect(0, 64, W, H - 64);
      ctx.strokeStyle = 'rgba(120,100,60,0.35)';
      ctx.lineWidth = 1;
      for (let y = 64 + 28; y < H; y += 28) { ctx.beginPath(); ctx.moveTo(0, y + 0.5); ctx.lineTo(W, y + 0.5); ctx.stroke(); }
      ctx.strokeStyle = 'rgba(220,60,60,0.5)';
      ctx.beginPath(); ctx.moveTo(30.5, 64); ctx.lineTo(30.5, H); ctx.stroke();
      ctx.fillStyle = '#3a3226';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.font = `18px "Marker Felt", "Comic Sans MS", "Segoe Print", cursive`;
      const lines = ['To do', '1. build the phone  ✓', '2. write the software', '3. put something behind', '    every icon', '4. call Mom back'];
      lines.forEach((l, i) => ctx.fillText(l, 40, 64 + 28 * (i + 1) - 7));
      return;
    }
    if (app.id === 'clock') {
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(W / 2, 250, 110, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#222';
      for (let i = 0; i < 60; i++) {
        const a = (i / 60) * Math.PI * 2, big = i % 5 === 0;
        ctx.lineWidth = big ? 3 : 1;
        ctx.beginPath(); ctx.moveTo(W / 2 + Math.cos(a) * 100, 250 + Math.sin(a) * 100); ctx.lineTo(W / 2 + Math.cos(a) * (100 - (big ? 12 : 6)), 250 + Math.sin(a) * (100 - (big ? 12 : 6))); ctx.stroke();
      }
      const d = new Date();
      const h = ((d.getHours() % 12) + d.getMinutes() / 60) / 12 * Math.PI * 2 - Math.PI / 2;
      const m = ((d.getMinutes() + d.getSeconds() / 60) / 60) * Math.PI * 2 - Math.PI / 2;
      const s = (d.getSeconds() / 60) * Math.PI * 2 - Math.PI / 2;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#111';
      ctx.lineWidth = 7;
      ctx.beginPath(); ctx.moveTo(W / 2, 250); ctx.lineTo(W / 2 + Math.cos(h) * 58, 250 + Math.sin(h) * 58); ctx.stroke();
      ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(W / 2, 250); ctx.lineTo(W / 2 + Math.cos(m) * 84, 250 + Math.sin(m) * 84); ctx.stroke();
      ctx.strokeStyle = '#e03a2f';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(W / 2 - Math.cos(s) * 18, 250 - Math.sin(s) * 18); ctx.lineTo(W / 2 + Math.cos(s) * 90, 250 + Math.sin(s) * 90); ctx.stroke();
      ctx.fillStyle = '#e03a2f';
      ctx.beginPath(); ctx.arc(W / 2, 250, 4, 0, Math.PI * 2); ctx.fill();
      return;
    }
    // a grouped table with one honest row
    ctx.fillStyle = '#fff';
    roundRect(ctx, 10, 90, W - 20, 96, 10);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.28)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#000';
    ctx.font = `bold 17px ${FONT}`;
    ctx.fillText('Nothing here yet.', W / 2, 124);
    ctx.fillStyle = '#4c566c';
    ctx.font = `14px ${FONT}`;
    ctx.fillText(`${app.name} is on the list.`, W / 2, 150);
    ctx.font = `13px ${FONT}`;
    ctx.fillStyle = '#4c566c';
    ctx.fillText('Press the home button to go back.', W / 2, 214);
  }

  // draws an app screen scaled about the icon it came from
  function drawAppScaled(now, app, rect, k, alpha) {
    const cx = rect.x + ICON / 2, cy = rect.y + ICON / 2;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(cx, cy);
    ctx.scale(k, k);
    ctx.translate(-cx, -cy);
    ctx.translate((cx - W / 2) * (1 - 1 / k) * 0, 0);
    drawApp(now, app);
    ctx.restore();
  }

  /* ---------- the frame ---------- */
  function draw(now = performance.now()) {
    ctx.setTransform(S, 0, 0, S, 0, 0);
    ctx.globalAlpha = 1;
    const t = now - st.since;
    switch (st.mode) {
      case 'off':
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, W, H);
        break;
      case 'boot':
        drawBoot(now);
        if (t > 3400) setMode('waking', now);
        break;
      case 'waking':
        drawLock(now);
        ctx.fillStyle = `rgba(0,0,0,${1 - clamp(t / 500, 0, 1)})`;
        ctx.fillRect(0, 0, W, H);
        if (t >= 500) setMode('lock', now);
        break;
      case 'lock':
        drawLock(now);
        break;
      case 'unlocking': {
        drawHome(now);
        const k = clamp(t / 350, 0, 1);
        ctx.globalAlpha = 1 - k;
        drawLock(now);
        ctx.globalAlpha = 1;
        if (k >= 1) { st.knob = 0; setMode('home', now); }
        break;
      }
      case 'home':
        drawHome(now);
        break;
      case 'opening': {
        drawHome(now);
        const k = easeInOut(clamp(t / 320, 0, 1));
        drawAppScaled(now, st.app, st.appRect, 0.2 + 0.8 * k, k);
        if (k >= 1) setMode('app', now);
        break;
      }
      case 'app':
        drawApp(now, st.app);
        break;
      case 'closing': {
        drawHome(now);
        const k = 1 - easeInOut(clamp(t / 260, 0, 1));
        drawAppScaled(now, st.app, st.appRect, 0.2 + 0.8 * k, k);
        if (k <= 0) { st.app = null; setMode('home', now); }
        break;
      }
      case 'sleeping': {
        if (st.app) drawApp(now, st.app); else if (st.wasHome) drawHome(now); else drawLock(now);
        ctx.fillStyle = `rgba(0,0,0,${clamp(t / 180, 0, 1)})`;
        ctx.fillRect(0, 0, W, H);
        if (t >= 180) { st.app = null; st.wasHome = false; st.knob = 0; setMode('off', now); }
        break;
      }
    }
    st.last = now;
  }

  const animating = () => !['off', 'lock', 'home', 'app'].includes(st.mode) || st.dragging || st.releaseAt > 0;

  const iconAt = (x, y) => {
    for (let i = 0; i < ALL.length; i++) {
      const r = iconRect(i);
      if (x >= r.x - 4 && x <= r.x + ICON + 4 && y >= r.y - 4 && y <= r.y + ICON + 4) return i;
    }
    return -1;
  };

  return {
    canvas, width: W, height: H, draw,
    get mode() { return st.mode; },
    onMode(fn) { st.listeners.add(fn); },
    needsRedraw(now, interval) { return animating() || now - st.last >= interval; },
    boot(now = performance.now()) { if (st.mode === 'off') setMode('boot', now); },
    wake(now = performance.now()) { if (st.mode === 'off') setMode('waking', now); },
    sleep(now = performance.now()) {
      if (st.mode === 'off' || st.mode === 'boot' || st.mode === 'sleeping') return;
      st.wasHome = ['home', 'opening', 'closing', 'unlocking'].includes(st.mode);
      if (st.mode === 'opening' || st.mode === 'closing') st.app = null;
      st.dragging = false;
      setMode('sleeping', now);
    },
    pressHome(now = performance.now()) {
      if (st.mode === 'off') return setMode('waking', now);
      if (st.mode === 'app' || st.mode === 'opening') return setMode('closing', now);
    },
    pressSleep(now = performance.now()) {
      if (st.mode === 'off') setMode('waking', now);
      else this.sleep(now);
    },
    pointer: {
      down(x, y) {
        if (st.mode === 'lock') {
          const kx = TRACK.x + KNOB.pad + st.knob * TRAVEL, ky = TRACK.y + KNOB.pad;
          if (x < kx - 8 || x > kx + KNOB.w + 8 || y < ky - 10 || y > ky + KNOB.h + 10) return false;
          st.dragging = true;
          st.releaseAt = 0;
          st.grab = x - kx;
          return true;
        }
        if (st.mode === 'home') {
          const i = iconAt(x, y);
          st.pressed = i >= 0 ? i : null;
          return i >= 0;
        }
        return false;
      },
      move(x) {
        if (st.dragging) st.knob = clamp((x - st.grab - TRACK.x - KNOB.pad) / TRAVEL, 0, 1);
      },
      up(x, y, now = performance.now()) {
        if (st.dragging) {
          st.dragging = false;
          if (st.knob > 0.96) { st.knob = 1; setMode('unlocking', now); }
          else { st.releaseAt = now; st.releaseFrom = st.knob; }
          return;
        }
        if (st.mode === 'home' && st.pressed !== null) {
          const i = st.pressed;
          st.pressed = null;
          if (iconAt(x, y) === i) { st.app = ALL[i]; st.appRect = iconRect(i); setMode('opening', now); }
        }
      },
    },
  };
}
