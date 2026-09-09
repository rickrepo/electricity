// The lock screen, drawn on a 320 x 480 canvas at 2x. A clock, a planet, and
// the slider. Sliding all the way finds nothing behind it yet.
const W = 320, H = 480, S = 2;
const TRACK = { x: 22, y: 419, w: 276, h: 46, r: 9 };
const KNOB = { w: 64, h: 38, r: 8, pad: 4 };
const TRAVEL = TRACK.w - KNOB.w - KNOB.pad * 2;
const FONT = 'Helvetica Neue, Helvetica, Arial, sans-serif';
const easeOut = (t) => 1 - (1 - t) ** 3;
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

// A planet seen from orbit, in the spirit of the wallpaper the first phones shipped with.
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
  // atmosphere
  const glow = ctx.createRadialGradient(cx, cy, R - 6, cx, cy, R + 34);
  glow.addColorStop(0, 'rgba(110,170,255,0.55)');
  glow.addColorStop(0.45, 'rgba(90,150,255,0.18)');
  glow.addColorStop(1, 'rgba(60,120,255,0)');
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(cx, cy, R + 34, 0, Math.PI * 2); ctx.fill();
  // ocean
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.clip();
  const ocean = ctx.createRadialGradient(cx + 50, cy - 60, 10, cx, cy, R);
  ocean.addColorStop(0, '#3f8fd8');
  ocean.addColorStop(0.55, '#1c5aa6');
  ocean.addColorStop(1, '#0a2a5c');
  ctx.fillStyle = ocean;
  ctx.fillRect(0, 0, W, H);
  // continents: each one a random walk of overlapping blobs
  const tones = ['#3f7a34', '#4d8a3b', '#6a8f3f', '#9c8d52', '#3a6b33'];
  for (let c = 0; c < 8; c++) {
    const a = (c / 8) * Math.PI * 2 + rnd() * 0.6, d = R * (0.25 + rnd() * 0.6);
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
  // polar cap
  const cap = ctx.createRadialGradient(cx - 10, cy - R + 8, 4, cx - 10, cy - R + 8, 46);
  cap.addColorStop(0, 'rgba(255,255,255,0.9)');
  cap.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = cap;
  ctx.fillRect(0, 0, W, H);
  // clouds: thin streaks
  for (let i = 0; i < 46; i++) {
    const a = rnd() * Math.PI * 2, d = rnd() * R * 0.95;
    const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d;
    ctx.fillStyle = `rgba(255,255,255,${0.18 + rnd() * 0.3})`;
    ctx.beginPath();
    ctx.ellipse(x, y, 6 + rnd() * 16, 1.2 + rnd() * 2, (rnd() - 0.5) * 0.9, 0, Math.PI * 2);
    ctx.fill();
  }
  // night side
  const night = ctx.createRadialGradient(cx + 70, cy - 80, R * 0.2, cx + 30, cy - 30, R * 1.35);
  night.addColorStop(0, 'rgba(0,0,0,0)');
  night.addColorStop(0.62, 'rgba(0,0,0,0.05)');
  night.addColorStop(1, 'rgba(0,0,10,0.92)');
  ctx.fillStyle = night;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
  // limb highlight
  ctx.strokeStyle = 'rgba(170,210,255,0.55)';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(cx, cy, R - 0.5, -Math.PI * 0.95, Math.PI * 0.05); ctx.stroke();
  return c;
}

export function createLockScreen({ carrier = 'Ricky' } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = W * S;
  canvas.height = H * S;
  const ctx = canvas.getContext('2d');
  const wall = drawWallpaper();
  const st = { knob: 0, dragging: false, grab: 0, releaseAt: 0, releaseFrom: 0, unlockedAt: 0, lastDraw: -1e9 };

  const two = (n) => String(n).padStart(2, '0');
  const parts = (now) => {
    const d = new Date(now);
    const h = d.getHours(), m = d.getMinutes();
    return { time: `${h % 12 || 12}:${two(m)}`, ampm: h < 12 ? 'AM' : 'PM', date: d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }) };
  };

  function statusBar(now) {
    const p = parts(Date.now());
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

  function clockPanel() {
    const p = parts(Date.now());
    ctx.fillStyle = 'rgba(0,0,0,0.42)';
    ctx.fillRect(0, 20, W, 96);
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    ctx.fillRect(0, 20, W, 1);
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 115, W, 1);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.shadowColor = 'rgba(0,0,0,0.7)';
    ctx.shadowBlur = 3;
    ctx.shadowOffsetY = 1;
    ctx.font = `200 60px ${FONT}`;
    ctx.fillText(p.time, W / 2, 86);
    ctx.font = `400 17px ${FONT}`;
    ctx.fillText(p.date, W / 2, 108);
    ctx.shadowColor = 'transparent';
  }

  function slider(now) {
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
    ctx.moveTo(kx + 21, ky + 15);
    ctx.lineTo(kx + 34, ky + 15);
    ctx.lineTo(kx + 34, ky + 9);
    ctx.lineTo(kx + 47, ky + 19);
    ctx.lineTo(kx + 34, ky + 29);
    ctx.lineTo(kx + 34, ky + 23);
    ctx.lineTo(kx + 21, ky + 23);
    ctx.closePath();
    ctx.fill();
  }

  function message(alpha) {
    ctx.globalAlpha = alpha;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 4;
    ctx.font = `300 22px ${FONT}`;
    ctx.fillText('Nothing to unlock yet.', W / 2, 236);
    ctx.font = `400 14px ${FONT}`;
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillText('The phone came first. The software is next.', W / 2, 262);
    ctx.shadowColor = 'transparent';
    ctx.globalAlpha = 1;
  }

  function draw(now = performance.now()) {
    ctx.setTransform(S, 0, 0, S, 0, 0);
    ctx.drawImage(wall, 0, 0, W, H);
    if (!st.dragging && st.releaseAt) {
      const t = Math.min(1, (now - st.releaseAt) / 320);
      st.knob = st.releaseFrom * (1 - easeOut(t));
      if (t >= 1) st.releaseAt = 0;
    }
    let panelAlpha = 1, msgAlpha = 0;
    if (st.unlockedAt) {
      const dt = now - st.unlockedAt;
      if (dt < 250) panelAlpha = 1 - dt / 250;
      else if (dt < 2400) { panelAlpha = 0; msgAlpha = Math.min(1, (dt - 250) / 300); }
      else if (dt < 2750) { panelAlpha = (dt - 2400) / 350; msgAlpha = 1 - panelAlpha; st.knob = 1 - panelAlpha; }
      else { st.unlockedAt = 0; st.knob = 0; }
    }
    statusBar(now);
    if (panelAlpha > 0) {
      ctx.globalAlpha = panelAlpha;
      clockPanel();
      slider(now);
      ctx.globalAlpha = 1;
    }
    if (msgAlpha > 0) message(msgAlpha);
    st.lastDraw = now;
  }

  const animating = () => st.dragging || st.releaseAt > 0 || st.unlockedAt > 0;

  return {
    canvas,
    width: W,
    height: H,
    draw,
    // true when the picture has to change: an animation is running or the
    // caller's refresh interval has passed (the shimmer wants ~30 fps up close)
    needsRedraw(now, interval) { return animating() || now - st.lastDraw >= interval; },
    pointer: {
      down(x, y) {
        if (st.unlockedAt) return false;
        const kx = TRACK.x + KNOB.pad + st.knob * TRAVEL, ky = TRACK.y + KNOB.pad;
        if (x < kx - 8 || x > kx + KNOB.w + 8 || y < ky - 10 || y > ky + KNOB.h + 10) return false;
        st.dragging = true;
        st.releaseAt = 0;
        st.grab = x - kx;
        return true;
      },
      move(x) {
        if (!st.dragging) return;
        st.knob = clamp((x - st.grab - TRACK.x - KNOB.pad) / TRAVEL, 0, 1);
      },
      up(now = performance.now()) {
        if (!st.dragging) return;
        st.dragging = false;
        if (st.knob > 0.96) { st.knob = 1; st.unlockedAt = now; }
        else { st.releaseAt = now; st.releaseFrom = st.knob; }
      },
    },
  };
}
