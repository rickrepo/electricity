// The phone's software: boot, lock screen, home screen, and the app runtime.
// Everything is drawn on one 320 x 480 canvas at 2x or 3x, whichever lands
// a canvas pixel on about one device pixel when the phone is in hand. The
// physical buttons drive it: home goes home or wakes it, sleep puts it to
// sleep. The canvas is redrawn only when something on it changes.
import { W, H, STATUS_H, CONTENT_Y, FONT, clamp, roundRect, navBar, pinstripes, inRect, clockText, wrapLines } from './ui.js';
import { ICON, renderAtlas } from './icons.js';
import { APPS, DOCK, ALL, PHOTO_KINDS, inbox } from './apps.js';
import { earthWallpaper, rippleWallpaper, makePhoto } from './art.js';

let S = 2;
const TRACK = { x: 22, y: 419, w: 276, h: 46, r: 9 };
const KNOB = { w: 64, h: 38, r: 8, pad: 4 };
const TRAVEL = TRACK.w - KNOB.w - KNOB.pad * 2;
const COLS = [16, 93, 170, 247];
const ROWS = [30, 117, 204, 291];
const DOCK_Y = 389;
const DOCK_ICON_Y = 404;
const ALERT = { x: 30, y: 150, w: 260, h: 132, close: { x: 42, y: 238, w: 114, h: 32 }, reply: { x: 164, y: 238, w: 114, h: 32 } };
const easeOut = (t) => 1 - (1 - t) ** 3;
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

export function createPhoneOS({ carrier = 'Ricky', logo = 'R', scale = 2 } = {}) {
  S = scale;
  const canvas = document.createElement('canvas');
  canvas.width = W * S;
  canvas.height = H * S;
  let ctx = canvas.getContext('2d');
  let layer = null; // an app drawn on its own, for the zoom in and out of its icon
  const measure = document.createElement('canvas').getContext('2d');
  const wallpapers = { earth: earthWallpaper(), ripples: rippleWallpaper() };
  const settings = { wallpaper: 'earth', brightness: 1, airplane: false };
  const photos = PHOTO_KINDS.map(([kind, caption]) => ({ canvas: makePhoto(kind), caption }));
  let atlas = null, atlasMinute = -1, home = null;

  const st = {
    mode: 'off', since: 0, last: -1e9, wasHome: false, dirty: true, minute: -1,
    knob: 0, releaseAt: 0, releaseFrom: 0,
    app: null, appRect: null, pressed: null, states: {},
    alert: null, buzzAt: 0,
    listeners: new Set(),
  };
  const ptr = { active: false, mode: null, x0: 0, y0: 0, t0: 0, moved: false, lastY: 0, lastT: 0, vel: 0 };
  const setMode = (mode, now) => { st.mode = mode; st.since = now; st.dirty = true; for (const fn of st.listeners) fn(mode); };

  const os = {
    settings, photos, measure,
    addPhoto(c, caption) { photos.unshift({ canvas: c, caption }); st.dirty = true; },
    open(id, setup) {
      const app = ALL.find((a) => a.id === id);
      if (!app) return;
      st.app = app;
      st.appRect = iconRect(ALL.indexOf(app));
      const s = appState(app);
      s.scroll = 0;
      setup?.(app, s);
      setMode('app', performance.now());
    },
    home() { if (st.mode === 'app') setMode('closing', performance.now()); },
  };

  /* ---------- shared pieces ---------- */
  function statusBar() {
    const p = clockText();
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, STATUS_H);
    ctx.fillStyle = '#fff';
    if (settings.airplane) {
      ctx.beginPath(); ctx.moveTo(6, 11); ctx.lineTo(16, 5); ctx.lineTo(14, 10); ctx.lineTo(20, 12); ctx.lineTo(14, 13); ctx.lineTo(16, 17); ctx.closePath(); ctx.fill();
    } else {
      for (let i = 0; i < 5; i++) ctx.fillRect(6 + i * 5, 16 - (3 + i * 2), 3, 3 + i * 2);
    }
    ctx.font = `bold 12px ${FONT}`;
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
    ctx.fillText(settings.airplane ? '' : carrier, 34, 15);
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
  function drawLock(now, chrome = true) {
    ctx.drawImage(wallpapers[settings.wallpaper] || wallpapers.earth, 0, 0, W, H);
    if (!chrome) return;
    statusBar();
    const p = clockText();
    const date = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
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
    ctx.fillText(date, W / 2, 108);
    ctx.shadowColor = 'transparent';

    if (ptr.mode !== 'knob' && st.releaseAt) {
      const t = Math.min(1, (now - st.releaseAt) / 320);
      st.knob = st.releaseFrom * (1 - easeOut(t));
      if (t >= 1) st.releaseAt = 0;
    }
    if (st.alert) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      roundRect(ctx, 16, 128, W - 32, 78, 10);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.textAlign = 'left';
      ctx.shadowColor = 'transparent';
      ctx.fillStyle = '#fff';
      ctx.font = `bold 16px ${FONT}`;
      ctx.fillText(st.alert.who, 30, 152);
      ctx.font = `15px ${FONT}`;
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      wrapLines(ctx, st.alert.text, W - 60).slice(0, 2).forEach((l, i) => ctx.fillText(l, 30, 174 + i * 19));
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
      const label = st.alert ? 'slide to view' : 'slide to unlock';
      ctx.fillStyle = `rgba(255,255,255,${0.35 * textAlpha})`;
      ctx.fillText(label, tx, 449);
      const phase = (now / 2600) % 1;
      const bx = tx - 100 + phase * 230;
      const sg = ctx.createLinearGradient(bx - 40, 0, bx + 40, 0);
      sg.addColorStop(0, 'rgba(255,255,255,0)');
      sg.addColorStop(0.5, `rgba(255,255,255,${0.9 * textAlpha})`);
      sg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = sg;
      ctx.fillText(label, tx, 449);
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
  // the grid holds APPS, four to a row; the dock holds DOCK
  const iconRect = (i) => (i < APPS.length ? { x: COLS[i % 4], y: ROWS[Math.floor(i / 4)] } : { x: COLS[i - APPS.length], y: DOCK_ICON_Y });
  const iconAt = (x, y) => {
    for (let i = 0; i < ALL.length; i++) {
      const r = iconRect(i);
      if (x >= r.x - 4 && x <= r.x + ICON + 4 && y >= r.y - 4 && y <= r.y + ICON + 4) return i;
    }
    return -1;
  };
  // The home screen only changes by the minute (the clock icon), so it is
  // drawn once into a cache and blitted; the pressed icon and the status bar
  // are the only things drawn per frame.
  function renderHome() {
    if (!home) home = document.createElement('canvas');
    home.width = W * S;
    home.height = H * S;
    const c = home.getContext('2d');
    c.setTransform(S, 0, 0, S, 0, 0);
    c.fillStyle = '#000';
    c.fillRect(0, 0, W, H);
    c.font = `bold 11px ${FONT}`;
    c.textAlign = 'center';
    c.textBaseline = 'alphabetic';
    const dg = c.createLinearGradient(0, DOCK_Y, 0, H);
    dg.addColorStop(0, '#6a6a6c');
    dg.addColorStop(0.08, '#4a4a4c');
    dg.addColorStop(1, '#151516');
    c.fillStyle = dg;
    c.fillRect(0, DOCK_Y, W, H - DOCK_Y);
    c.fillStyle = 'rgba(255,255,255,0.35)';
    c.fillRect(0, DOCK_Y, W, 1);
    ALL.forEach((app, i) => {
      const r = iconRect(i);
      const sx = i * (atlas.cell + atlas.pad);
      c.drawImage(atlas.canvas, sx, 0, atlas.cell, atlas.cell, r.x, r.y, ICON, ICON);
      if (i < APPS.length) {
        c.fillStyle = '#fff';
        c.shadowColor = 'rgba(0,0,0,0.8)';
        c.shadowBlur = 2;
        c.shadowOffsetY = 1;
        c.fillText(app.name, r.x + ICON / 2, r.y + ICON + 13);
        c.shadowColor = 'transparent';
      } else {
        c.drawImage(atlas.canvas, sx, atlas.cell + atlas.pad, atlas.cell, atlas.cell, r.x, r.y + ICON + 1, ICON, ICON);
      }
    });
    c.fillStyle = 'rgba(255,255,255,0.9)';
    c.beginPath(); c.arc(W / 2, 378, 2.5, 0, Math.PI * 2); c.fill();
  }
  function drawHome() {
    const minute = Math.floor(Date.now() / 60000);
    if (!atlas || minute !== atlasMinute) { atlas = renderAtlas(ALL, Date.now(), S); atlasMinute = minute; renderHome(); }
    ctx.drawImage(home, 0, 0, W, H);
    if (st.pressed !== null && st.pressed >= 0) {
      const r = iconRect(st.pressed);
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      roundRect(ctx, r.x, r.y, ICON, ICON, 10);
      ctx.fill();
    }
    // red badges: unread texts and mail, and Safari until it has been opened
    ALL.forEach((app, i) => {
      const n = app.badge?.() || 0;
      if (!n) return;
      const r = iconRect(i);
      const bx = r.x + ICON - 4, by = r.y + 4;
      ctx.fillStyle = '#e0301e';
      ctx.beginPath(); ctx.arc(bx, by, 11, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.font = `bold 13px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(n), bx, by + 0.5);
      ctx.textBaseline = 'alphabetic';
    });
    statusBar();
  }
  // An arriving text over the home screen or an app, the way the first iPhone
  // showed one: a blue panel with the sender, the text, Close and Reply.
  function drawAlert() {
    const a = ALERT;
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(0, 0, W, H);
    const g = ctx.createLinearGradient(0, a.y, 0, a.y + a.h);
    g.addColorStop(0, 'rgba(48,72,130,0.96)');
    g.addColorStop(1, 'rgba(18,34,74,0.96)');
    roundRect(ctx, a.x, a.y, a.w, a.h, 12);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#fff';
    ctx.font = `bold 17px ${FONT}`;
    ctx.fillText(st.alert.who, W / 2, a.y + 30);
    ctx.font = `15px ${FONT}`;
    wrapLines(ctx, st.alert.text, a.w - 30).slice(0, 2).forEach((l, i) => ctx.fillText(l, W / 2, a.y + 54 + i * 19));
    for (const [b, label, strong] of [[a.close, 'Close', false], [a.reply, 'Reply', true]]) {
      const bg = ctx.createLinearGradient(0, b.y, 0, b.y + b.h);
      bg.addColorStop(0, strong ? '#8fb4e8' : '#6d84ad');
      bg.addColorStop(1, strong ? '#3a6dc0' : '#3b4f7a');
      roundRect(ctx, b.x, b.y, b.w, b.h, 8);
      ctx.fillStyle = bg;
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.font = `bold 15px ${FONT}`;
      ctx.fillText(label, b.x + b.w / 2, b.y + 21);
    }
  }
  const openThread = (i, now) => {
    st.alert = null;
    os.open('messages', (app, s) => app.show(s, i));
    st.since = now;
  };

  /* ---------- the app runtime ---------- */
  const appState = (app) => {
    let s = st.states[app.id];
    if (!s) { s = app.init ? app.init(os) : {}; s.scroll = s.scroll || 0; s.vel = 0; st.states[app.id] = s; }
    return s;
  };
  const scrollArea = (app) => H - CONTENT_Y - (app.inset || 0);
  const maxScroll = (app, s) => Math.max(0, (app.height ? app.height(s, os) : 0) - scrollArea(app));

  function drawApp(now, app, withStatus = true) {
    const s = appState(app);
    if (app.fixed) { app.draw(ctx, s, os, now); if (withStatus) statusBar(); return; }
    if (ptr.mode !== 'content' && Math.abs(s.vel) > 0.05) {
      const max = maxScroll(app, s);
      s.scroll = clamp(s.scroll + s.vel, 0, max);
      s.vel *= 0.93;
      if (s.scroll <= 0 || s.scroll >= max) s.vel = 0;
    }
    ctx.fillStyle = app.background || '#c5ccd4';
    ctx.fillRect(0, 0, W, H);
    if (!app.background) pinstripes(ctx, CONTENT_Y, H);
    const bottom = H - (app.inset || 0);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, CONTENT_Y, W, bottom - CONTENT_Y);
    ctx.clip();
    ctx.translate(0, CONTENT_Y - s.scroll);
    app.draw(ctx, s, os, now);
    ctx.restore();
    const bar = app.bar ? app.bar(s, os) : { title: app.name };
    s.barHits = navBar(ctx, bar.title, { back: bar.back, right: bar.right });
    app.overlay?.(ctx, s, os, now);
    if (withStatus) statusBar();
  }

  // The app is drawn on its own layer, then squeezed between the full screen
  // (k = 1) and its icon (k = 0) behind a clip whose corners round off as it
  // shrinks. The status bar stays put on top; the home screen behind zooms.
  function drawAppZoom(now, app, rect, k, alpha) {
    if (!layer) { layer = document.createElement('canvas'); }
    if (layer.width !== W * S) { layer.width = W * S; layer.height = H * S; }
    const main = ctx;
    ctx = layer.getContext('2d');
    ctx.setTransform(S, 0, 0, S, 0, 0);
    ctx.globalAlpha = 1;
    drawApp(now, app, false);
    ctx = main;
    const x = rect.x * (1 - k), y = rect.y * (1 - k);
    const w = ICON + (W - ICON) * k, h = ICON + (H - ICON) * k;
    ctx.save();
    ctx.globalAlpha = alpha;
    roundRect(ctx, x, y, w, h, 10 * (1 - k));
    ctx.clip();
    ctx.drawImage(layer, 0, 0, W * S, H * S, x, y, w, h);
    ctx.restore();
  }
  // the home screen zooming in or out around the icon that opened
  function drawHomeZoom(rect, k) {
    const cx = rect.x + ICON / 2, cy = rect.y + ICON / 2;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.globalAlpha = 1 - k;
    ctx.translate(cx, cy);
    ctx.scale(1 + 0.35 * k, 1 + 0.35 * k);
    ctx.translate(-cx, -cy);
    drawHome();
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
        // the clock and the slider are gone the moment the slide completes; only
        // the wallpaper fades, while the home screen settles in from a touch larger
        const k = easeOut(clamp(t / 320, 0, 1));
        const z = 1 + 0.06 * (1 - k);
        ctx.save();
        ctx.translate(W / 2, H / 2);
        ctx.scale(z, z);
        ctx.translate(-W / 2, -H / 2);
        drawHome();
        ctx.restore();
        ctx.globalAlpha = 1 - k;
        drawLock(now, false);
        ctx.globalAlpha = 1;
        statusBar();
        if (k >= 1) { st.knob = 0; if (st.alert) openThread(st.alert.thread, now); else setMode('home', now); }
        break;
      }
      case 'home':
        drawHome();
        break;
      case 'opening': {
        const k = easeOut(clamp(t / 340, 0, 1));
        drawHomeZoom(st.appRect, k);
        drawAppZoom(now, st.app, st.appRect, k, clamp(k / 0.25, 0, 1));
        statusBar();
        if (k >= 1) setMode('app', now);
        break;
      }
      case 'app':
        drawApp(now, st.app);
        break;
      case 'closing': {
        const k = 1 - easeInOut(clamp(t / 300, 0, 1));
        drawHomeZoom(st.appRect, k);
        drawAppZoom(now, st.app, st.appRect, k, clamp(k / 0.3, 0, 1));
        statusBar();
        if (k <= 0) { st.app = null; setMode('home', now); }
        break;
      }
      case 'sleeping': {
        if (st.app) drawApp(now, st.app); else if (st.wasHome) drawHome(); else drawLock(now);
        ctx.fillStyle = `rgba(0,0,0,${clamp(t / 180, 0, 1)})`;
        ctx.fillRect(0, 0, W, H);
        if (t >= 180) { st.app = null; st.wasHome = false; st.knob = 0; setMode('off', now); }
        break;
      }
    }
    if (st.alert && (st.mode === 'home' || st.mode === 'app')) drawAlert();
    if (st.mode !== 'off' && settings.brightness < 1) {
      ctx.fillStyle = `rgba(0,0,0,${(1 - settings.brightness) * 0.8})`;
      ctx.fillRect(0, 0, W, H);
    }
    st.last = now;
    st.dirty = false;
    st.minute = Math.floor(Date.now() / 60000);
  }

  const animating = (now) => {
    if (!['off', 'home', 'app'].includes(st.mode)) return true; // boot, lock (its shimmer), transitions
    if (ptr.active || st.releaseAt > 0) return true;
    if (st.mode === 'app' && st.app) {
      const s = appState(st.app);
      if (Math.abs(s.vel) > 0.05) return true;
      if (st.app.animating?.(s, now)) return true;
    }
    return false;
  };

  /* ---------- pointer routing (screen coordinates) ---------- */
  function down(x, y, now = performance.now()) {
    st.dirty = true;
    Object.assign(ptr, { active: true, mode: null, x0: x, y0: y, t0: now, moved: false, lastY: y, lastT: now, vel: 0 });
    if (st.alert && (st.mode === 'home' || st.mode === 'app')) { ptr.mode = 'alert'; return true; }
    if (st.mode === 'lock') {
      const kx = TRACK.x + KNOB.pad + st.knob * TRAVEL, ky = TRACK.y + KNOB.pad;
      if (x < kx - 8 || x > kx + KNOB.w + 8 || y < ky - 10 || y > ky + KNOB.h + 10) { ptr.active = false; return false; }
      ptr.mode = 'knob';
      st.releaseAt = 0;
      ptr.grab = x - kx;
      return true;
    }
    if (st.mode === 'home') {
      const i = iconAt(x, y);
      st.pressed = i >= 0 ? i : null;
      ptr.mode = 'icon';
      if (i < 0) ptr.active = false;
      return i >= 0;
    }
    if (st.mode === 'app' && st.app) {
      const app = st.app, s = appState(app);
      s.vel = 0;
      if (app.fixed) { ptr.mode = app.down?.(x, y, s, os) ? 'drag' : 'tap'; return true; }
      const bottom = H - (app.inset || 0);
      if (y >= CONTENT_Y && y < bottom) {
        const cy = y - CONTENT_Y + s.scroll;
        ptr.mode = app.drag?.(x, cy, s, os) ? 'drag' : 'content';
      } else ptr.mode = 'bar';
      return true;
    }
    ptr.active = false;
    return false;
  }

  function move(x, y, now = performance.now()) {
    if (!ptr.active) return;
    st.dirty = true;
    if (ptr.mode === 'knob') { st.knob = clamp((x - ptr.grab - TRACK.x - KNOB.pad) / TRAVEL, 0, 1); return; }
    if (!ptr.moved && Math.hypot(x - ptr.x0, y - ptr.y0) > 8) ptr.moved = true;
    if (st.mode !== 'app' || !st.app) return;
    const app = st.app, s = appState(app);
    if (ptr.mode === 'drag') {
      if (app.fixed) app.move?.(x, y, s, os);
      else app.dragMove?.(x, y - CONTENT_Y + s.scroll, s, os);
      return;
    }
    if (ptr.mode === 'content' && ptr.moved) {
      const dy = y - ptr.lastY;
      s.scroll = clamp(s.scroll - dy, 0, maxScroll(app, s));
      const dt = Math.max(1, now - ptr.lastT);
      ptr.vel = (-dy / dt) * 16;
    }
    ptr.lastY = y;
    ptr.lastT = now;
  }

  function up(x, y, now = performance.now()) {
    if (!ptr.active) return;
    ptr.active = false;
    st.dirty = true;
    const tap = !ptr.moved && now - ptr.t0 < 700;
    if (ptr.mode === 'alert') {
      if (inRect(ALERT.close, x, y)) st.alert = null;
      else if (inRect(ALERT.reply, x, y)) openThread(st.alert.thread, now);
      return;
    }
    if (ptr.mode === 'knob') {
      if (st.knob > 0.96) { st.knob = 1; setMode('unlocking', now); }
      else { st.releaseAt = now; st.releaseFrom = st.knob; }
      return;
    }
    if (ptr.mode === 'icon') {
      const i = st.pressed;
      st.pressed = null;
      if (tap && i !== null && iconAt(x, y) === i) { st.app = ALL[i]; st.appRect = iconRect(i); setMode('opening', now); }
      return;
    }
    if (st.mode !== 'app' || !st.app) return;
    const app = st.app, s = appState(app);
    if (ptr.mode === 'drag') { if (app.fixed) app.up?.(x, y, s, os); else app.dragEnd?.(s, os); return; }
    if (ptr.mode === 'content' && !tap) { s.vel = ptr.vel; return; }
    if (!tap) return;
    if (ptr.mode === 'bar') {
      if (inRect(s.barHits?.back, x, y)) app.back?.(s, os);
      else if (inRect(s.barHits?.right, x, y)) app.barTap?.('right', s, os);
      else app.tabTap?.(x, y, s, os);
      return;
    }
    if (app.fixed) app.tap?.(x, y, s, os, now);
    else app.tap?.(x, y - CONTENT_Y + s.scroll, s, os, now);
  }

  return {
    canvas, width: W, height: H, draw, settings, photos,
    get mode() { return st.mode; },
    get app() { return st.app?.id ?? null; },
    get scroll() { return st.app ? appState(st.app).scroll : 0; },
    // the live web page Safari is on, if any: { url, rect } in screen coordinates
    get site() { return st.mode === 'app' && st.app?.site ? st.app.site(appState(st.app)) : null; },
    onMode(fn) { st.listeners.add(fn); },
    // `interval` is the shortest gap between redraws: 0 in hand, longer far away.
    needsRedraw(now, interval = 0) {
      if (now - st.last < interval) return false;
      if (st.dirty || animating(now)) return true;
      if (Math.floor(Date.now() / 60000) !== st.minute) return true;
      return now - st.last >= Math.max(interval, 1000);
    },
    // 2x or 3x: whichever lands a canvas pixel on about one device pixel in hand
    setScale(n) {
      if (n === S) return false;
      S = n;
      canvas.width = W * S;
      canvas.height = H * S;
      atlas = null;
      layer = null;
      st.dirty = true;
      return true;
    },
    get scale() { return S; },
    // draws what the first screens need ahead of time, so nothing is built on first sight
    warm() {
      atlas = renderAtlas(ALL, Date.now(), S);
      atlasMinute = Math.floor(Date.now() / 60000);
      renderHome();
      if (!layer) { layer = document.createElement('canvas'); layer.width = W * S; layer.height = H * S; }
    },
    boot(now = performance.now()) { if (st.mode === 'off') setMode('boot', now); },
    // straight to the lock screen, no boot: the phone is already on
    on(now = performance.now()) { if (st.mode === 'off') setMode('lock', now); },
    wake(now = performance.now()) { if (st.mode === 'off') setMode('waking', now); },
    sleep(now = performance.now()) {
      if (st.mode === 'off' || st.mode === 'boot' || st.mode === 'sleeping') return;
      st.wasHome = ['home', 'opening', 'closing', 'unlocking'].includes(st.mode);
      if (st.mode === 'opening' || st.mode === 'closing') st.app = null;
      ptr.active = false;
      setMode('sleeping', now);
    },
    pressHome(now = performance.now()) {
      if (st.mode === 'off') return setMode('waking', now);
      if (st.mode === 'app' || st.mode === 'opening') { ptr.active = false; return setMode('closing', now); }
    },
    pressSleep(now = performance.now()) {
      if (st.mode === 'off') setMode('waking', now);
      else this.sleep(now);
    },
    open: os.open,
    // a text arrives: it lands in its thread, the phone buzzes, and an alert
    // shows unless that thread is already open
    receive(i, msg, now = performance.now()) {
      const t = inbox.receive(i, msg, clockText().time + ' ' + clockText().ampm);
      const reading = st.mode === 'app' && st.app?.id === 'messages' && appState(st.app).view === i;
      if (reading) inbox.read(i);
      else st.alert = { who: t.who, text: msg, thread: i };
      st.buzzAt = now;
      if (st.mode === 'off') setMode('waking', now);
      st.dirty = true;
    },
    get buzzAt() { return st.buzzAt; },
    dismiss() { st.alert = null; st.dirty = true; },
    get alert() { return st.alert; },
    pointer: { down, move, up },
  };
}
