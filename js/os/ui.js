// Shared drawing helpers for the phone's software (320 x 480 coordinates).
export const W = 320, H = 480;
export const STATUS_H = 20, NAV_H = 44, CONTENT_Y = 64;
export const FONT = 'Helvetica Neue, Helvetica, Arial, sans-serif';
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

export function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Word-wraps text with the context's current font.
export function wrapLines(ctx, text, maxWidth) {
  const lines = [];
  for (const para of String(text).split('\n')) {
    const words = para.split(' ');
    let line = '';
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = word; }
      else line = test;
    }
    lines.push(line);
  }
  return lines;
}

export function pinstripes(ctx, y0, y1) {
  ctx.fillStyle = '#c5ccd4';
  ctx.fillRect(0, y0, W, y1 - y0);
  ctx.fillStyle = 'rgba(0,0,0,0.055)';
  for (let x = 3; x < W; x += 7) ctx.fillRect(x, y0, 1, y1 - y0);
}

// The blue-grey bar. Returns hit rectangles for its buttons.
export function navBar(ctx, title, { back = null, right = null, y = STATUS_H } = {}) {
  const bar = ctx.createLinearGradient(0, y, 0, y + NAV_H);
  bar.addColorStop(0, '#b9c8de');
  bar.addColorStop(0.5, '#8ea4c2');
  bar.addColorStop(0.5001, '#7c93b3');
  bar.addColorStop(1, '#6a83a6');
  ctx.fillStyle = bar;
  ctx.fillRect(0, y, W, NAV_H);
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.fillRect(0, y, W, 1);
  ctx.fillStyle = '#2d3e58';
  ctx.fillRect(0, y + NAV_H - 1, W, 1);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fff';
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = -1;
  ctx.font = `bold 20px ${FONT}`;
  ctx.fillText(title, W / 2, y + 22);
  ctx.shadowColor = 'transparent';
  const hits = {};
  if (back) hits.back = barButton(ctx, 6, y + 7, back, { pointed: true });
  if (right) hits.right = barButton(ctx, W - 6 - buttonWidth(ctx, right), y + 7, right);
  return hits;
}

function buttonWidth(ctx, label) {
  ctx.font = `bold 12px ${FONT}`;
  return Math.ceil(ctx.measureText(label).width) + 22;
}

export function barButton(ctx, x, y, label, { pointed = false } = {}) {
  const w = buttonWidth(ctx, label) + (pointed ? 8 : 0), h = 30;
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, '#8ca1c0');
  g.addColorStop(0.5, '#6d87ab');
  g.addColorStop(0.5001, '#5f7aa0');
  g.addColorStop(1, '#4f6a90');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#3d5273';
  ctx.lineWidth = 1;
  ctx.beginPath();
  if (pointed) {
    ctx.moveTo(x + 12, y + 0.5);
    ctx.lineTo(x + w - 5, y + 0.5);
    ctx.arcTo(x + w - 0.5, y + 0.5, x + w - 0.5, y + 5, 5);
    ctx.lineTo(x + w - 0.5, y + h - 5);
    ctx.arcTo(x + w - 0.5, y + h - 0.5, x + w - 5, y + h - 0.5, 5);
    ctx.lineTo(x + 12, y + h - 0.5);
    ctx.lineTo(x + 0.5, y + h / 2);
    ctx.closePath();
  } else {
    roundRect(ctx, x + 0.5, y + 0.5, w - 1, h - 1, 5);
  }
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = `bold 12px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowOffsetY = -1;
  ctx.fillText(label, x + w / 2 + (pointed ? 5 : 0), y + h / 2);
  ctx.shadowColor = 'transparent';
  return { x, y, w, h };
}

export const inRect = (r, x, y) => !!r && x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;

// A white grouped-table box.
export function group(ctx, x, y, w, h) {
  ctx.fillStyle = '#fff';
  roundRect(ctx, x, y, w, h, 10);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();
}

export function separator(ctx, x, y, w) {
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fillRect(x, y, w, 1);
}

export function chevron(ctx, x, y) {
  ctx.strokeStyle = '#8f96a2';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - 4, y - 6);
  ctx.lineTo(x + 1, y);
  ctx.lineTo(x - 4, y + 6);
  ctx.stroke();
}

export function sectionLabel(ctx, text, x, y) {
  ctx.font = `bold 17px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#4c566c';
  ctx.shadowColor = 'rgba(255,255,255,0.8)';
  ctx.shadowOffsetY = 1;
  ctx.fillText(text, x, y);
  ctx.shadowColor = 'transparent';
}

// The 2007 toggle: a wide pill that says ON in blue or OFF in grey.
export function toggle(ctx, x, y, on) {
  const w = 94, h = 27;
  ctx.save();
  roundRect(ctx, x, y, w, h, h / 2);
  ctx.clip();
  ctx.fillStyle = on ? '#3a7fdb' : '#e6e6e6';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#fff';
  ctx.font = `bold 15px ${FONT}`;
  ctx.textBaseline = 'middle';
  if (on) { ctx.textAlign = 'left'; ctx.fillText('ON', x + 14, y + h / 2 + 1); }
  else { ctx.fillStyle = '#7d7d7d'; ctx.textAlign = 'right'; ctx.fillText('OFF', x + w - 12, y + h / 2 + 1); }
  const kx = on ? x + w - h + 1 : x + 1;
  const kg = ctx.createLinearGradient(0, y, 0, y + h);
  kg.addColorStop(0, '#fdfdfd');
  kg.addColorStop(1, '#c9c9cc');
  ctx.fillStyle = kg;
  roundRect(ctx, kx, y + 1, h - 2, h - 2, h / 2);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 1;
  roundRect(ctx, x + 0.5, y + 0.5, w - 1, h - 1, h / 2);
  ctx.stroke();
  return { x, y, w, h };
}

export function slider(ctx, x, y, w, t) {
  ctx.fillStyle = '#9da3ab';
  roundRect(ctx, x, y - 3, w, 6, 3);
  ctx.fill();
  ctx.fillStyle = '#3a7fdb';
  roundRect(ctx, x, y - 3, w * t, 6, 3);
  ctx.fill();
  const kx = x + w * t;
  const kg = ctx.createRadialGradient(kx - 3, y - 4, 2, kx, y, 12);
  kg.addColorStop(0, '#fff');
  kg.addColorStop(1, '#bfc2c7');
  ctx.fillStyle = kg;
  ctx.beginPath(); ctx.arc(kx, y, 11, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.stroke();
  return { x: x - 12, y: y - 14, w: w + 24, h: 28 };
}

// A speech bubble: green for sent, grey for received.
export function bubble(ctx, x, y, w, h, sent) {
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  if (sent) { g.addColorStop(0, '#9be36f'); g.addColorStop(1, '#4fb536'); }
  else { g.addColorStop(0, '#f2f2f2'); g.addColorStop(1, '#d6d6d6'); }
  ctx.fillStyle = g;
  roundRect(ctx, x, y, w, h, 12);
  ctx.fill();
  ctx.strokeStyle = sent ? '#3c8f2a' : '#a9a9a9';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.beginPath();
  if (sent) { ctx.moveTo(x + w - 4, y + h - 10); ctx.lineTo(x + w + 6, y + h); ctx.lineTo(x + w - 12, y + h - 2); }
  else { ctx.moveTo(x + 4, y + h - 10); ctx.lineTo(x - 6, y + h); ctx.lineTo(x + 12, y + h - 2); }
  ctx.closePath();
  ctx.fill();
}

export function avatar(ctx, x, y, r, initials, color) {
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = `bold ${Math.round(r * 0.9)}px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(initials, x, y + 1);
}

export function pad2(n) { return String(n).padStart(2, '0'); }
export function clockText(d = new Date()) {
  const h = d.getHours(), m = d.getMinutes();
  return { time: `${h % 12 || 12}:${pad2(m)}`, ampm: h < 12 ? 'AM' : 'PM' };
}
