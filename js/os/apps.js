// The apps. Each one draws itself on the 320 x 480 canvas and answers taps.
//
//   fixed apps own the whole screen below the status bar;
//   scrolling apps draw content from y = 0 under a nav bar, and the core
//   scrolls, clips, and routes taps into content coordinates.
import { W, H, CONTENT_Y, NAV_H, FONT, clamp, roundRect, wrapLines, group, separator, chevron, sectionLabel, toggle, slider, bubble, avatar, inRect, barButton, clockText, pad2 } from './ui.js';
import { dunkSilhouette, n64Controller, rcCar, skyline } from './art.js';

const CONTENT_H = H - CONTENT_Y;
const text = (ctx, str, x, y, { font = `15px ${FONT}`, color = '#000', align = 'left', baseline = 'alphabetic' } = {}) => {
  ctx.font = font; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = baseline; ctx.fillText(str, x, y);
};
const paragraph = (ctx, str, x, y, width, lh, opts = {}) => {
  ctx.font = opts.font || `15px ${FONT}`;
  const lines = wrapLines(ctx, str, width);
  lines.forEach((l, i) => text(ctx, l, x, y + i * lh, opts));
  return y + lines.length * lh;
};
const dayName = (d, long = false) => d.toLocaleDateString(undefined, { weekday: long ? 'long' : 'short' });
const addDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d; };

/* ================================================================== */
/* Safari: the about page                                              */
/* ================================================================== */
const ABOUT = [
  ['h1', "I'm Ricky."],
  ['p', 'I designed this website. Toronto, born in 1989.'],
  ['h2', 'Also'],
  ['link', 'autismwaitlist.com'],
];

// Safari's pages. The first is drawn here. Every other one is a real web
// page, shown in a frame laid over the screen while the phone is in hand.
// Only pages listed here can be reached: the address field takes no typing.
const PAGES = [
  { title: "I'm Ricky", url: 'ricky.example', live: false },
  { title: 'Autism Waitlist', url: 'https://autismwaitlist.com', live: true },
];

// A live page can also go to a tab of its own (the icon in the middle of the
// toolbar), for browsers or hosts that will not show it in a frame.
// window.open reports a blocked tab by returning null; if it is blocked, a
// real anchor is clicked, which some hosts allow where they refuse the call.
const openTab = (url) => {
  let w = null;
  try { w = window.open(url, '_blank'); if (w) w.opener = null; } catch { w = null; }
  if (w) return true;
  try {
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.append(a);
    a.click();
    a.remove();
  } catch { /* nothing more to try */ }
  return false;
};
let safariSeen = false;

const safari = {
  id: 'safari', name: 'Safari', top: '#78bcff', bottom: '#1c63c9',
  background: '#fff', inset: 44,
  init(os) {
    const m = os.measure;
    const blocks = [];
    let y = 14;
    const X = 16, WIDTH = W - 32;
    for (const [type, value] of ABOUT) {
      const b = { type, value, y };
      if (type === 'h1') { b.h = 40; }
      else if (type === 'p') { m.font = `15px ${FONT}`; b.lines = wrapLines(m, value, WIDTH); b.h = b.lines.length * 21 + 14; }
      else if (type === 'h2') { b.y += 8; b.h = 40; }
      else if (type === 'link') { b.h = 34; }
      blocks.push(b);
      y = b.y + b.h;
    }
    safariSeen = true;
    return { blocks, height: y + 8, X, WIDTH, page: 0, note: 0, noteText: '' };
  },
  badge() { return safariSeen ? 0 : 1; },
  animating(s, now) { return s.note > 0 && now - s.note < 3200; },
  bar() { return { title: '' }; },
  height(s) { return PAGES[s.page].live ? CONTENT_H - 44 : s.height; },
  site(s) { return PAGES[s.page].live ? { url: PAGES[s.page].url, rect: { x: 0, y: CONTENT_Y, w: W, h: H - CONTENT_Y - 44 } } : null; },
  draw(ctx, s) {
    const page = PAGES[s.page];
    if (page.live) {
      // what shows until the frame is laid over it: a plain page with the site's name
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, W, CONTENT_H);
      ctx.fillStyle = '#eef0f3';
      ctx.fillRect(0, 0, W, 44);
      text(ctx, page.url.replace(/^https?:\/\//, ''), W / 2, 150, { font: `bold 16px ${FONT}`, color: '#9aa1ab', align: 'center' });
      text(ctx, 'Pick the phone up to browse', W / 2, 174, { font: `13px ${FONT}`, color: '#b4bac2', align: 'center' });
      return;
    }
    for (const b of s.blocks) {
      const { type, value, y } = b;
      if (type === 'h1') text(ctx, value, s.X, y + 30, { font: `bold 30px ${FONT}`, color: '#111' });
      else if (type === 'p') b.lines.forEach((l, i) => text(ctx, l, s.X, y + 16 + i * 21, { font: `15px ${FONT}`, color: '#222' }));
      else if (type === 'h2') { text(ctx, value, s.X, y + 26, { font: `bold 19px ${FONT}`, color: '#111' }); ctx.fillStyle = '#3a7fdb'; ctx.fillRect(s.X, y + 32, 28, 3); }
      else if (type === 'link') { text(ctx, value, s.X, y + 20, { font: `15px ${FONT}`, color: '#1a5cc8' }); ctx.fillStyle = '#1a5cc8'; ctx.fillRect(s.X, y + 23, ctx.measureText(value).width, 1); b.hit = { x: s.X, y: y + 4, w: 200, h: 26 }; }
    }
  },
  overlay(ctx, s, os, now) {
    const page = PAGES[s.page];
    const noting = s.note > 0 && now - s.note < 3200;
    if (!noting) s.note = 0;
    // top: page title and the address field
    text(ctx, page.title, W / 2, 32, { font: `bold 12px ${FONT}`, color: '#fff', align: 'center', baseline: 'middle' });
    ctx.fillStyle = '#fff';
    roundRect(ctx, 8, 38, W - 16, 22, 5);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 1;
    ctx.stroke();
    text(ctx, noting ? s.noteText : page.url.replace(/^https?:\/\//, ''), 16, 50, { font: `13px ${FONT}`, color: noting && !s.noteOk ? '#c0392b' : '#333', baseline: 'middle' });
    ctx.strokeStyle = '#6a7d99';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(W - 20, 49, 5, 0.4, Math.PI * 1.7); ctx.stroke();
    ctx.fillStyle = '#6a7d99';
    ctx.beginPath(); ctx.moveTo(W - 15, 42); ctx.lineTo(W - 13, 48); ctx.lineTo(W - 19, 47); ctx.closePath(); ctx.fill();
    // bottom toolbar: back, forward, open in a tab of its own, pages
    const y = H - 44;
    const g = ctx.createLinearGradient(0, y, 0, H);
    g.addColorStop(0, '#b9c8de'); g.addColorStop(0.5, '#8ea4c2'); g.addColorStop(0.5001, '#7c93b3'); g.addColorStop(1, '#6a83a6');
    ctx.fillStyle = g;
    ctx.fillRect(0, y, W, 44);
    ctx.fillStyle = '#2d3e58';
    ctx.fillRect(0, y, W, 1);
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = s.page > 0 ? '#fff' : 'rgba(255,255,255,0.4)';
    ctx.beginPath(); ctx.moveTo(44, y + 14); ctx.lineTo(34, y + 22); ctx.lineTo(44, y + 30); ctx.stroke();
    ctx.strokeStyle = s.page < PAGES.length - 1 ? '#fff' : 'rgba(255,255,255,0.4)';
    ctx.beginPath(); ctx.moveTo(110, y + 14); ctx.lineTo(120, y + 22); ctx.lineTo(110, y + 30); ctx.stroke();
    // the box with an arrow out of it: open in a tab of its own
    ctx.strokeStyle = page.live ? '#fff' : 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 2;
    ctx.strokeRect(188, y + 16, 16, 16);
    ctx.beginPath(); ctx.moveTo(197, y + 23); ctx.lineTo(210, y + 10); ctx.moveTo(203, y + 10); ctx.lineTo(210, y + 10); ctx.lineTo(210, y + 17); ctx.stroke();
    ctx.strokeStyle = '#fff';
    ctx.strokeRect(266, y + 16, 15, 15);
    ctx.strokeRect(271, y + 11, 15, 15);
    ctx.fillStyle = '#fff';
    ctx.font = `bold 8px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText(String(PAGES.length), 278.5, y + 22.5);
  },
  tap(x, y, s) {
    const link = s.blocks.find((b) => b.type === 'link');
    if (!PAGES[s.page].live && link?.hit && inRect(link.hit, x, y)) { s.page = 1; s.scroll = 0; }
  },
  tabTap(x, y, s, os, now) {
    if (y < H - 44) return;
    // back and forward step through the pages; the pages button cycles them
    if (x < 70 && s.page > 0) { s.page--; s.scroll = 0; }
    else if (x >= 80 && x < 150 && s.page < PAGES.length - 1) { s.page++; s.scroll = 0; }
    else if (x >= 170 && x < 230 && PAGES[s.page].live) {
      s.noteOk = openTab(PAGES[s.page].url);
      s.noteText = s.noteOk ? 'Opened in a new tab' : 'New tab blocked. Type the address.';
      s.note = now || performance.now();
    } else if (x >= 240) { s.page = (s.page + 1) % PAGES.length; s.scroll = 0; }
  },
};

/* ================================================================== */
/* Messages                                                            */
/* ================================================================== */
const THREADS = [
  { who: 'Mom', initials: 'M', color: '#c2578f', time: '2:41 PM', unread: 0, msgs: [[0, 'Did the phone come out ok?'], [1, 'It boots. It even unlocks.'], [0, 'Proud of you. Eat something.'], [1, 'Eating.'], [0, 'Call me back x4']] },
  { who: 'Deck crew', initials: 'DC', color: '#3a7fdb', time: '11:05 AM', msgs: [[0, 'Bringing the 1200s Saturday?'], [1, 'Both. And the crate.'], [0, 'Bring the good needle this time'], [1, 'It was the good needle.']] },
  { who: 'Race day', initials: 'RD', color: '#e8842e', time: 'Yesterday', msgs: [[0, 'Track opens at 9. Bring fuel.'], [1, 'Already mixed 20%.'], [0, 'Clutch bell?'], [1, 'Ordering one now.']] },
];

// Texts that arrive while the phone sits on the desk. The list and the thread
// are laid out again the next time they are drawn.
export const inbox = {
  receive(i, msg, time) {
    const t = THREADS[i];
    t.msgs.push([0, msg]);
    t.time = time;
    t.unread = (t.unread || 0) + 1;
    t.stale = true;
    return t;
  },
  read(i) { THREADS[i].unread = 0; },
  get unread() { return THREADS.reduce((n, t) => n + (t.unread || 0), 0); },
};

function layoutThread(m, thread) {
  const out = [];
  let y = 12;
  m.font = `15px ${FONT}`;
  for (const [sent, msg] of thread.msgs) {
    const lines = wrapLines(m, msg, 210);
    const w = Math.max(...lines.map((l) => m.measureText(l).width)) + 24;
    const h = lines.length * 19 + 16;
    out.push({ sent: !!sent, lines, w, h, x: sent ? W - 16 - w : 16, y });
    y += h + 10;
  }
  return { items: out, height: y + 8 };
}

const messages = {
  id: 'messages', name: 'Messages', top: '#8ce87a', bottom: '#2c9b3c',
  init() { return { view: -1, layouts: {} }; },
  badge() { return inbox.unread; },
  bar(s) { return s.view < 0 ? { title: 'Messages' } : { title: THREADS[s.view].who, back: 'Messages' }; },
  back(s) { if (s.view < 0) return false; s.view = -1; s.scroll = 0; return true; },
  height(s, os) {
    if (s.view < 0) return THREADS.length * 70;
    if (THREADS[s.view].stale) { delete s.layouts[s.view]; THREADS[s.view].stale = false; }
    s.layouts[s.view] ||= layoutThread(os.measure, THREADS[s.view]);
    return s.layouts[s.view].height;
  },
  show(s, i) { s.view = i; s.scroll = 0; inbox.read(i); },
  draw(ctx, s, os) {
    if (s.view < 0) {
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, W, CONTENT_H + 400);
      THREADS.forEach((t, i) => {
        const y = i * 70;
        avatar(ctx, 34, y + 35, 20, t.initials, t.color);
        text(ctx, t.who, 66, y + 28, { font: `bold 17px ${FONT}` });
        text(ctx, t.msgs[t.msgs.length - 1][1], 66, y + 50, { font: `14px ${FONT}`, color: '#6b6f78' });
        text(ctx, t.time, W - 30, y + 28, { font: `13px ${FONT}`, color: '#3a7fdb', align: 'right' });
        if (t.unread) { ctx.fillStyle = '#3a7fdb'; ctx.beginPath(); ctx.arc(12, y + 35, 5, 0, Math.PI * 2); ctx.fill(); }
        chevron(ctx, W - 14, y + 35);
        separator(ctx, 66, y + 69, W - 66);
      });
      return;
    }
    if (THREADS[s.view].stale) { delete s.layouts[s.view]; THREADS[s.view].stale = false; }
    const lay = (s.layouts[s.view] ||= layoutThread(os.measure, THREADS[s.view]));
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, W, lay.height + 400);
    for (const it of lay.items) {
      bubble(ctx, it.x, it.y, it.w, it.h, it.sent);
      it.lines.forEach((l, i) => text(ctx, l, it.x + 12, it.y + 19 + i * 19, { font: `15px ${FONT}`, color: it.sent ? '#0b2a10' : '#111' }));
    }
  },
  tap(x, y, s) {
    if (s.view >= 0) return;
    const i = Math.floor(y / 70);
    if (i >= 0 && i < THREADS.length) messages.show(s, i);
  },
};

/* ================================================================== */
/* Mail                                                                */
/* ================================================================== */
const MAILS = [
  { from: 'Nitro Depot', subject: 'Your fuel order shipped', time: '3:12 PM', unread: true, body: 'Two gallons of 20% nitro are on the way. Keep it away from the furnace this time.\n\nTracking: 1989-0623-RCKY' },
  { from: 'Record Fair', subject: 'Saturday, Hall B', time: '9:48 AM', unread: true, body: 'Doors at 8. Bring cash and a crate. Someone is selling a box of 12-inch singles from 1989 and we thought of you.' },
  { from: 'Mom', subject: 'Photos from 1989 (12 attachments)', time: 'Yesterday', body: 'Found the box in the attic. You had the same haircut for four years. Call me.' },
  { from: 'N64 Parts Co.', subject: 'Controller sticks back in stock', time: 'Monday', body: 'The replacement sticks you asked about are in. Limit four per customer, which we assume is exactly your number.' },
  { from: 'Ricky', subject: 'Note to self', time: 'Sunday', body: 'Fix the tonearm on the left deck. Then stop touching it.' },
];

const mail = {
  id: 'mail', name: 'Mail', top: '#8bbaff', bottom: '#2c68d4',
  init() { return { view: -1 }; },
  badge() { return MAILS.filter((m) => m.unread).length; },
  bar(s) { return s.view < 0 ? { title: 'Inbox' } : { title: `${s.view + 1} of ${MAILS.length}`, back: 'Inbox' }; },
  back(s) { if (s.view < 0) return false; s.view = -1; s.scroll = 0; return true; },
  height(s, os) {
    if (s.view < 0) return MAILS.length * 68;
    os.measure.font = `15px ${FONT}`;
    return 120 + wrapLines(os.measure, MAILS[s.view].body, W - 32).length * 21 + 30;
  },
  draw(ctx, s) {
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, W, 1200);
    if (s.view < 0) {
      MAILS.forEach((m, i) => {
        const y = i * 68;
        if (m.unread) { ctx.fillStyle = '#3a7fdb'; ctx.beginPath(); ctx.arc(12, y + 22, 5, 0, Math.PI * 2); ctx.fill(); }
        text(ctx, m.from, 26, y + 22, { font: `bold 16px ${FONT}` });
        text(ctx, m.time, W - 28, y + 22, { font: `13px ${FONT}`, color: '#3a7fdb', align: 'right' });
        text(ctx, m.subject, 26, y + 41, { font: `14px ${FONT}`, color: '#222' });
        text(ctx, m.body.split('\n')[0].slice(0, 44) + '…', 26, y + 58, { font: `13px ${FONT}`, color: '#7a7f88' });
        chevron(ctx, W - 12, y + 34);
        separator(ctx, 26, y + 67, W - 26);
      });
      return;
    }
    const m = MAILS[s.view];
    ctx.fillStyle = '#eef1f5';
    ctx.fillRect(0, 0, W, 96);
    separator(ctx, 0, 96, W);
    text(ctx, 'From:', 12, 26, { font: `14px ${FONT}`, color: '#6b6f78' });
    text(ctx, m.from, 62, 26, { font: `bold 15px ${FONT}` });
    text(ctx, 'Subject:', 12, 52, { font: `14px ${FONT}`, color: '#6b6f78' });
    text(ctx, m.subject, 72, 52, { font: `15px ${FONT}` });
    text(ctx, 'Date:', 12, 78, { font: `14px ${FONT}`, color: '#6b6f78' });
    text(ctx, m.time, 56, 78, { font: `15px ${FONT}` });
    paragraph(ctx, m.body, 16, 128, W - 32, 21, { font: `15px ${FONT}`, color: '#111' });
  },
  tap(x, y, s) {
    if (s.view >= 0) return;
    const i = Math.floor(y / 68);
    if (i >= 0 && i < MAILS.length) { MAILS[i].unread = false; s.view = i; s.scroll = 0; }
  },
};

/* ================================================================== */
/* Calendar                                                            */
/* ================================================================== */
const EVENTS = [[0, 'Phone boots. Finally.'], [3, 'Race day · the track, 9 AM'], [6, 'Record fair · Hall B'], [12, 'Clutch bell arrives (allegedly)']];

const calendar = {
  id: 'calendar', name: 'Calendar', top: '#ffffff', bottom: '#e6e6e6',
  init() { return { offset: 0 }; },
  bar(s) { return { title: 'Calendar' }; },
  height() { return CONTENT_H; },
  draw(ctx, s) {
    const today = new Date();
    const first = new Date(today.getFullYear(), today.getMonth() + s.offset, 1);
    const label = first.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, W, 320);
    text(ctx, label, W / 2, 26, { font: `bold 18px ${FONT}`, align: 'center' });
    text(ctx, '‹', 26, 28, { font: `bold 26px ${FONT}`, color: '#3a7fdb', align: 'center' });
    text(ctx, '›', W - 26, 28, { font: `bold 26px ${FONT}`, color: '#3a7fdb', align: 'center' });
    s.hits = { prev: { x: 0, y: 0, w: 60, h: 44 }, next: { x: W - 60, y: 0, w: 60, h: 44 } };
    ctx.fillStyle = '#eef1f5';
    ctx.fillRect(0, 40, W, 22);
    ['S', 'M', 'T', 'W', 'T', 'F', 'S'].forEach((d, i) => text(ctx, d, i * 45.7 + 22.8, 55, { font: `bold 12px ${FONT}`, color: '#4c566c', align: 'center' }));
    const days = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    const start = first.getDay();
    for (let d = 1; d <= days; d++) {
      const cell = start + d - 1, col = cell % 7, row = Math.floor(cell / 7);
      const x = col * 45.7, y = 62 + row * 38;
      const isToday = s.offset === 0 && d === today.getDate();
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.fillRect(x, y + 37, 45.7, 1);
      if (isToday) { ctx.fillStyle = '#3a7fdb'; roundRect(ctx, x + 4, y + 3, 37, 32, 5); ctx.fill(); }
      text(ctx, String(d), x + 22.8, y + 24, { font: `${isToday ? 'bold ' : ''}16px ${FONT}`, color: isToday ? '#fff' : '#111', align: 'center' });
      const ev = s.offset === 0 && EVENTS.find(([off]) => addDays(off).getDate() === d && addDays(off).getMonth() === today.getMonth());
      if (ev) { ctx.fillStyle = isToday ? '#fff' : '#e03a2f'; ctx.beginPath(); ctx.arc(x + 22.8, y + 32, 2, 0, Math.PI * 2); ctx.fill(); }
    }
    const listY = 62 + Math.ceil((start + days) / 7) * 38 + 8;
    ctx.fillStyle = '#eef1f5';
    ctx.fillRect(0, listY, W, CONTENT_H - listY + 40);
    if (s.offset !== 0) { text(ctx, 'Nothing planned. Suspicious.', W / 2, listY + 40, { font: `14px ${FONT}`, color: '#6b6f78', align: 'center' }); return; }
    EVENTS.forEach(([off, title], i) => {
      const d = addDays(off), y = listY + 8 + i * 46;
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, y, W, 44);
      separator(ctx, 0, y + 44, W);
      ctx.fillStyle = off === 0 ? '#3a7fdb' : '#e03a2f';
      ctx.fillRect(10, y + 8, 4, 28);
      text(ctx, `${dayName(d)} ${d.getDate()}`, 24, y + 19, { font: `bold 12px ${FONT}`, color: '#4c566c' });
      text(ctx, title, 24, y + 36, { font: `15px ${FONT}` });
    });
  },
  tap(x, y, s) {
    if (inRect(s.hits?.prev, x, y)) s.offset--;
    else if (inRect(s.hits?.next, x, y)) s.offset++;
  },
};

/* ================================================================== */
/* Photos and Camera                                                   */
/* ================================================================== */
const PHOTO_KINDS = [['skyline', 'Home, at the right hour'], ['beach', 'The one good day in August'], ['cake', 'Year one'], ['mountains', 'Higher than it looks'], ['cassette', 'Summer 99, side A'], ['earth', 'Stock wallpaper'], ['night', 'Parking lot, 2 AM'], ['snow', 'First snow, no school']];

const photos = {
  id: 'photos', name: 'Photos', top: '#7cc0ff', bottom: '#2b6fd0',
  init() { return { view: -1 }; },
  bar(s, os) { return s.view < 0 ? { title: 'Camera Roll' } : { title: `${s.view + 1} of ${os.photos.length}`, back: 'Roll' }; },
  back(s) { if (s.view < 0) return false; s.view = -1; s.scroll = 0; return true; },
  height(s, os) { return s.view < 0 ? Math.ceil(os.photos.length / 4) * 79 + 4 : CONTENT_H; },
  draw(ctx, s, os) {
    if (s.view < 0) {
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, W, 2000);
      os.photos.forEach((p, i) => {
        const x = 4 + (i % 4) * 79, y = 4 + Math.floor(i / 4) * 79;
        const c = p.canvas, side = Math.min(c.width, c.height);
        ctx.drawImage(c, (c.width - side) / 2, (c.height - side) / 2, side, side, x, y, 75, 75);
      });
      return;
    }
    const p = os.photos[s.view];
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, CONTENT_H);
    const ph = CONTENT_H, pw = ph * (p.canvas.width / p.canvas.height);
    ctx.drawImage(p.canvas, (W - pw) / 2, 0, pw, ph);
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, CONTENT_H - 34, W, 34);
    text(ctx, p.caption, W / 2, CONTENT_H - 13, { font: `14px ${FONT}`, color: '#fff', align: 'center' });
  },
  tap(x, y, s, os) {
    if (s.view >= 0) { s.view = -1; return; }
    const i = Math.floor((x - 4) / 79) + Math.floor((y - 4) / 79) * 4;
    if (i >= 0 && i < os.photos.length) { s.view = i; s.scroll = 0; }
  },
};

// The living room the camera looks at. Drawn into any context.
function cameraScene(ctx, now, x0 = 0, y0 = 0, w = W, h = H - 64) {
  ctx.save();
  ctx.translate(x0, y0);
  const wall = ctx.createLinearGradient(0, 0, 0, h * 0.7);
  wall.addColorStop(0, '#e6dfd0'); wall.addColorStop(1, '#cfc4ae');
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, w, h * 0.7);
  ctx.fillStyle = '#7a5a3c';
  ctx.fillRect(0, h * 0.7, w, h * 0.3);
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  for (let y = h * 0.7; y < h; y += 14) ctx.fillRect(0, y, w, 1);
  // the poster
  ctx.fillStyle = '#111';
  ctx.fillRect(28, 30, 96, 130);
  ctx.save();
  ctx.beginPath(); ctx.rect(32, 34, 88, 122); ctx.clip();
  const g = ctx.createLinearGradient(0, 34, 0, 156);
  g.addColorStop(0, '#5a0f1d'); g.addColorStop(0.65, '#e0511d'); g.addColorStop(1, '#f6b35a');
  ctx.fillStyle = g; ctx.fillRect(32, 34, 88, 122);
  skyline(ctx, 32, 126, 88, 30, '#150609');
  dunkSilhouette(ctx, 72, 118, 0.36, { color: '#0b0507', ball: '#0b0507' });
  ctx.restore();
  // the cabinet with the console on top
  ctx.fillStyle = '#5a4a3c';
  ctx.fillRect(170, 196, 120, 94);
  ctx.fillStyle = '#4a3c30';
  ctx.fillRect(170, 196, 120, 6);
  ctx.fillStyle = '#44403c';
  roundRect(ctx, 176, 174, 108, 22, 6); ctx.fill();
  ctx.fillStyle = '#2b2825';
  ctx.fillRect(206, 174, 48, 6);
  ctx.fillStyle = '#d63a2f';
  ctx.beginPath(); ctx.arc(186, 188, 2.5, 0, Math.PI * 2); ctx.fill();
  n64Controller(ctx, 232, 316, 70);
  // the buggy doing laps of the rug
  const cx = ((now / 28) % (w + 260)) - 130;
  const bounce = Math.abs(Math.sin(now / 90)) * 1.5;
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.ellipse(cx, h * 0.93, 70, 6, 0, 0, Math.PI * 2); ctx.fill();
  rcCar(ctx, cx, h * 0.9 - 6, 150, { bounce });
  ctx.restore();
}

const camera = {
  id: 'camera', name: 'Camera', top: '#aab1bb', bottom: '#4d545f',
  fixed: true,
  init() { return { flashAt: 0, last: null }; },
  animating() { return true; },
  draw(ctx, s, os, now) {
    cameraScene(ctx, now, 0, 20, W, H - 64);
    if (s.flashAt) {
      const a = 1 - Math.min(1, (now - s.flashAt) / 260);
      if (a > 0) { ctx.fillStyle = `rgba(255,255,255,${a})`; ctx.fillRect(0, 20, W, H - 64); }
      else s.flashAt = 0;
    }
    const y = H - 44;
    const g = ctx.createLinearGradient(0, y, 0, H);
    g.addColorStop(0, '#5a5a5c'); g.addColorStop(1, '#1c1c1e');
    ctx.fillStyle = g;
    ctx.fillRect(0, y, W, 44);
    if (s.last) { ctx.drawImage(s.last, 0, 0, s.last.width, s.last.height, 8, y + 6, 32, 32); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.strokeRect(8.5, y + 6.5, 32, 32); }
    const bg = ctx.createLinearGradient(0, y + 6, 0, y + 38);
    bg.addColorStop(0, '#f2f2f4'); bg.addColorStop(1, '#a9adb3');
    ctx.fillStyle = bg;
    roundRect(ctx, W / 2 - 40, y + 6, 80, 32, 7);
    ctx.fill();
    ctx.strokeStyle = '#111';
    ctx.stroke();
    ctx.fillStyle = '#222';
    roundRect(ctx, W / 2 - 12, y + 15, 24, 14, 3); ctx.fill();
    ctx.fillStyle = '#e9ebee';
    ctx.beginPath(); ctx.arc(W / 2, y + 22, 4.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#222';
    ctx.beginPath(); ctx.arc(W / 2, y + 22, 2.5, 0, Math.PI * 2); ctx.fill();
    s.hits = { shutter: { x: W / 2 - 48, y: y, w: 96, h: 44 } };
  },
  tap(x, y, s, os, now) {
    if (!inRect(s.hits?.shutter, x, y) || s.flashAt) return;
    s.flashAt = now;
    const c = document.createElement('canvas');
    c.width = 640; c.height = 832;
    const cctx = c.getContext('2d');
    cctx.scale(2, 2);
    cameraScene(cctx, now, 0, 0, W, H - 64);
    s.last = c;
    os.addPhoto(c, 'Living room, just now');
  },
};

/* ================================================================== */
/* Maps                                                                */
/* ================================================================== */
const maps = {
  id: 'maps', name: 'Maps', top: '#f6f0dc', bottom: '#dcd2b3',
  animating() { return true; },
  bar() { return { title: 'Maps' }; },
  height() { return CONTENT_H; },
  draw(ctx, s, os, now) {
    ctx.fillStyle = '#e9e2cf';
    ctx.fillRect(0, 0, W, CONTENT_H);
    ctx.fillStyle = '#b9d7a0';
    ctx.beginPath(); ctx.moveTo(190, 40); ctx.lineTo(320, 20); ctx.lineTo(320, 150); ctx.lineTo(220, 160); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#9ecbe6';
    ctx.beginPath(); ctx.moveTo(0, 300); ctx.quadraticCurveTo(120, 250, 200, 330); ctx.quadraticCurveTo(280, 400, 320, 380); ctx.lineTo(320, CONTENT_H); ctx.lineTo(0, CONTENT_H); ctx.closePath(); ctx.fill();
    const road = (pts, w, color = '#fff') => {
      ctx.strokeStyle = '#c9c2ad'; ctx.lineWidth = w + 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) ctx.lineTo(p[0], p[1]); ctx.stroke();
      ctx.strokeStyle = color; ctx.lineWidth = w; ctx.stroke();
    };
    road([[0, 120], [320, 100]], 10, '#f5d76e');
    road([[60, 0], [70, 260]], 9);
    road([[150, 0], [160, 250]], 9);
    road([[240, 0], [250, 200]], 8);
    road([[0, 210], [320, 190]], 8);
    road([[0, 60], [200, 50]], 6);
    const label = (t, x, y, a = 0) => { ctx.save(); ctx.translate(x, y); ctx.rotate(a); text(ctx, t, 0, 0, { font: `bold 9px ${FONT}`, color: '#6b6560', align: 'center', baseline: 'middle' }); ctx.restore(); };
    label('QUEEN ST W', 110, 112, -0.06);
    label('BATHURST ST', 65, 160, 1.53);
    label('KING ST W', 200, 200, -0.06);
    label('THE PARK', 262, 90);
    label('LAKE ONTARIO', 100, 330, -0.35);
    // the tower on the shore
    ctx.fillStyle = '#7d8590';
    ctx.fillRect(268, 262, 3, 40);
    ctx.beginPath(); ctx.ellipse(269.5, 276, 9, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(266, 282, 7, 3);
    ctx.fillRect(268.5, 250, 2, 12);
    const pin = (x, y, t) => {
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(x, y + 2, 7, 3, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#e03a2f'; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 8, y - 16); ctx.arc(x, y - 20, 9, Math.PI * 0.85, Math.PI * 2.15); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y - 20, 3.5, 0, Math.PI * 2); ctx.fill();
      ctx.font = `bold 12px ${FONT}`;
      const w = ctx.measureText(t).width + 16;
      ctx.fillStyle = '#fff'; roundRect(ctx, x - w / 2, y - 52, w, 22, 5); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.stroke();
      text(ctx, t, x, y - 41, { font: `bold 12px ${FONT}`, align: 'center', baseline: 'middle' });
    };
    pin(112, 190, "Ricky's place");
    pin(236, 236, 'Toronto');
    const pulse = (now / 1400) % 1;
    ctx.fillStyle = `rgba(58,127,219,${0.35 * (1 - pulse)})`;
    ctx.beginPath(); ctx.arc(150, 240, 8 + pulse * 22, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(150, 240, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3a7fdb'; ctx.beginPath(); ctx.arc(150, 240, 5.5, 0, Math.PI * 2); ctx.fill();
  },
};

/* ================================================================== */
/* Weather                                                             */
/* ================================================================== */
const FORECAST = [[24, 15, 'sun'], [26, 17, 'sun'], [21, 14, 'cloud'], [17, 11, 'rain'], [22, 13, 'cloud']];

function weatherGlyph(ctx, kind, x, y, s) {
  if (kind === 'sun') {
    ctx.strokeStyle = '#ffd23c'; ctx.lineWidth = s * 0.12; ctx.lineCap = 'round';
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * s * 0.62, y + Math.sin(a) * s * 0.62); ctx.lineTo(x + Math.cos(a) * s * 0.82, y + Math.sin(a) * s * 0.82); ctx.stroke(); }
    ctx.fillStyle = '#ffd23c'; ctx.beginPath(); ctx.arc(x, y, s * 0.45, 0, Math.PI * 2); ctx.fill();
    return;
  }
  ctx.fillStyle = kind === 'rain' ? '#b9c3cf' : '#f4f6f8';
  ctx.beginPath(); ctx.arc(x - s * 0.3, y + s * 0.1, s * 0.32, 0, Math.PI * 2); ctx.arc(x + s * 0.05, y - s * 0.12, s * 0.42, 0, Math.PI * 2); ctx.arc(x + s * 0.4, y + s * 0.12, s * 0.3, 0, Math.PI * 2); ctx.fill();
  ctx.fillRect(x - s * 0.3, y + s * 0.1, s * 0.7, s * 0.32);
  if (kind === 'rain') { ctx.strokeStyle = '#4f8fd6'; ctx.lineWidth = s * 0.08; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(x - s * 0.2 + i * s * 0.25, y + s * 0.5); ctx.lineTo(x - s * 0.28 + i * s * 0.25, y + s * 0.75); ctx.stroke(); } }
}

const weather = {
  id: 'weather', name: 'Weather', top: '#93d4ff', bottom: '#2d8de0',
  background: '#2f6fb5',
  bar() { return { title: 'Weather' }; },
  height() { return CONTENT_H; },
  draw(ctx) {
    const g = ctx.createLinearGradient(0, 0, 0, CONTENT_H);
    g.addColorStop(0, '#5aa0e6'); g.addColorStop(1, '#1e4f8f');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, CONTENT_H);
    text(ctx, 'Toronto', 16, 34, { font: `bold 22px ${FONT}`, color: '#fff' });
    text(ctx, `${FORECAST[0][0] - 3}°`, 16, 100, { font: `200 64px ${FONT}`, color: '#fff' });
    text(ctx, 'Sunny, a light wind off the lake', 16, 124, { font: `15px ${FONT}`, color: 'rgba(255,255,255,0.9)' });
    text(ctx, `H: ${FORECAST[0][0]}°   L: ${FORECAST[0][1]}°`, 16, 144, { font: `bold 14px ${FONT}`, color: 'rgba(255,255,255,0.85)' });
    weatherGlyph(ctx, 'sun', 262, 80, 60);
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    roundRect(ctx, 10, 166, W - 20, FORECAST.length * 44 + 8, 10);
    ctx.fill();
    FORECAST.forEach(([hi, lo, kind], i) => {
      const y = 170 + i * 44;
      text(ctx, i === 0 ? 'Today' : dayName(addDays(i), true), 24, y + 27, { font: `bold 15px ${FONT}`, color: '#1b2f4d' });
      weatherGlyph(ctx, kind, 190, y + 22, 26);
      text(ctx, `${hi}°`, W - 60, y + 27, { font: `bold 15px ${FONT}`, color: '#1b2f4d', align: 'right' });
      text(ctx, `${lo}°`, W - 24, y + 27, { font: `15px ${FONT}`, color: '#6b7a90', align: 'right' });
      if (i < FORECAST.length - 1) separator(ctx, 24, y + 43, W - 48);
    });
    text(ctx, 'Updated just now, from a window', W / 2, CONTENT_H - 14, { font: `11px ${FONT}`, color: 'rgba(255,255,255,0.7)', align: 'center' });
  },
};

/* ================================================================== */
/* Clock                                                               */
/* ================================================================== */
const CITIES = [['Home', null], ['New York', 'America/New_York'], ['London', 'Europe/London'], ['Tokyo', 'Asia/Tokyo']];
const tzTime = (tz) => {
  try { return new Date().toLocaleTimeString('en-US', { timeZone: tz || undefined, hour: 'numeric', minute: '2-digit' }); }
  catch { const c = clockText(); return `${c.time} ${c.ampm}`; }
};

const clock = {
  id: 'clock', name: 'Clock', top: '#333', bottom: '#050505',
  animating() { return true; },
  bar() { return { title: 'Clock' }; },
  height() { return 160 + CITIES.length * 44 + 40; },
  draw(ctx) {
    const cx = W / 2, cy = 82, r = 62;
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#222';
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * Math.PI * 2, big = i % 5 === 0;
      ctx.lineWidth = big ? 2.5 : 1;
      ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * (r - 4), cy + Math.sin(a) * (r - 4)); ctx.lineTo(cx + Math.cos(a) * (r - (big ? 12 : 7)), cy + Math.sin(a) * (r - (big ? 12 : 7))); ctx.stroke();
    }
    const d = new Date();
    const h = ((d.getHours() % 12) + d.getMinutes() / 60) / 12 * Math.PI * 2 - Math.PI / 2;
    const m = ((d.getMinutes() + d.getSeconds() / 60) / 60) * Math.PI * 2 - Math.PI / 2;
    const s = (d.getSeconds() / 60) * Math.PI * 2 - Math.PI / 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(h) * 32, cy + Math.sin(h) * 32); ctx.stroke();
    ctx.lineWidth = 3.5;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(m) * 48, cy + Math.sin(m) * 48); ctx.stroke();
    ctx.strokeStyle = '#e03a2f';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(cx - Math.cos(s) * 12, cy - Math.sin(s) * 12); ctx.lineTo(cx + Math.cos(s) * 52, cy + Math.sin(s) * 52); ctx.stroke();
    ctx.fillStyle = '#e03a2f';
    ctx.beginPath(); ctx.arc(cx, cy, 3, 0, Math.PI * 2); ctx.fill();
    sectionLabel(ctx, 'World Clock', 16, 172);
    group(ctx, 10, 182, W - 20, CITIES.length * 44);
    CITIES.forEach(([name, tz], i) => {
      const y = 182 + i * 44;
      text(ctx, name, 22, y + 28, { font: `bold 16px ${FONT}` });
      text(ctx, tzTime(tz), W - 22, y + 28, { font: `16px ${FONT}`, color: '#3a5f9a', align: 'right' });
      if (i < CITIES.length - 1) separator(ctx, 22, y + 43, W - 44);
    });
  },
};

/* ================================================================== */
/* Calculator                                                          */
/* ================================================================== */
const CALC_KEYS = [['C', '±', '%', '÷'], ['7', '8', '9', '×'], ['4', '5', '6', '−'], ['1', '2', '3', '+'], ['0', '0', '.', '=']];
const fmt = (n) => {
  if (!Number.isFinite(n)) return 'Error';
  let s = String(n);
  if (s.replace('-', '').replace('.', '').length > 9) s = n.toPrecision(9).replace(/\.?0+$/, '');
  if (s.length > 12) s = n.toExponential(4);
  return s;
};

const calculator = {
  id: 'calculator', name: 'Calculator', top: '#8f959c', bottom: '#3d4249',
  fixed: true,
  init() { return { disp: '0', acc: null, op: null, fresh: true }; },
  draw(ctx, s) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 20, W, 88);
    ctx.fillStyle = '#c9ceb8';
    ctx.fillRect(0, 26, W, 76);
    text(ctx, s.disp, W - 14, 84, { font: `300 44px ${FONT}`, color: '#111', align: 'right' });
    const y0 = 108, cw = W / 4, ch = (H - y0) / 5;
    CALC_KEYS.forEach((row, r) => row.forEach((k, c) => {
      if (r === 4 && c === 1) return;
      const x = c * cw, y = y0 + r * ch, w = r === 4 && c === 0 ? cw * 2 : cw;
      const g = ctx.createLinearGradient(0, y, 0, y + ch);
      if (c === 3) { g.addColorStop(0, '#f7a05a'); g.addColorStop(1, '#e0641b'); }
      else if (r === 0) { g.addColorStop(0, '#c4c9cf'); g.addColorStop(1, '#9aa0a7'); }
      else { g.addColorStop(0, '#eef0f2'); g.addColorStop(1, '#c8ccd1'); }
      ctx.fillStyle = g;
      ctx.fillRect(x, y, w, ch);
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, y + 0.5, w - 1, ch - 1);
      if (s.op === k && s.fresh && c === 3) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(x + 3, y + 3, w - 6, ch - 6); }
      text(ctx, k, x + w / 2, y + ch / 2 + 1, { font: `${c === 3 ? 'bold ' : ''}26px ${FONT}`, color: c === 3 ? '#fff' : '#111', align: 'center', baseline: 'middle' });
    }));
  },
  tap(x, y, s) {
    const y0 = 108, cw = W / 4, ch = (H - y0) / 5;
    if (y < y0) return;
    const r = Math.floor((y - y0) / ch), c = Math.floor(x / cw);
    const k = CALC_KEYS[r]?.[c];
    if (!k) return;
    const apply = () => {
      const a = s.acc, b = parseFloat(s.disp);
      if (a === null || !s.op) return b;
      return s.op === '+' ? a + b : s.op === '−' ? a - b : s.op === '×' ? a * b : b === 0 ? NaN : a / b;
    };
    if (/\d/.test(k)) { s.disp = s.fresh || s.disp === '0' ? k : s.disp.length < 9 ? s.disp + k : s.disp; s.fresh = false; }
    else if (k === '.') { if (s.fresh) { s.disp = '0.'; s.fresh = false; } else if (!s.disp.includes('.')) s.disp += '.'; }
    else if (k === 'C') { s.disp = '0'; s.acc = null; s.op = null; s.fresh = true; }
    else if (k === '±') s.disp = s.disp.startsWith('-') ? s.disp.slice(1) : s.disp === '0' ? '0' : '-' + s.disp;
    else if (k === '%') { s.disp = fmt(parseFloat(s.disp) / 100); s.fresh = true; }
    else if (k === '=') { s.disp = fmt(apply()); s.acc = null; s.op = null; s.fresh = true; }
    else { if (!s.fresh && s.acc !== null && s.op) s.disp = fmt(apply()); s.acc = parseFloat(s.disp); s.op = k; s.fresh = true; }
  },
};

/* ================================================================== */
/* Notes                                                               */
/* ================================================================== */
const NOTE = ['To do', '1. build the phone  ✓', '2. write the software  ✓', '3. fix the squeaky desk chair', '4. return the library book (1998)', '5. call Mom back (4 texts)', '', 'Nothing here is real except 1989.'];

const notes = {
  id: 'notes', name: 'Notes', top: '#fff0a0', bottom: '#f3c53c',
  background: '#fbf0a5',
  bar() { return { title: 'Notes' }; },
  height() { return Math.max(CONTENT_H, 28 * (NOTE.length + 2)); },
  draw(ctx) {
    const h = Math.max(CONTENT_H, 28 * (NOTE.length + 2)) + 200;
    ctx.fillStyle = '#fbf0a5';
    ctx.fillRect(0, 0, W, h);
    ctx.strokeStyle = 'rgba(120,100,60,0.35)';
    ctx.lineWidth = 1;
    for (let y = 28; y < h; y += 28) { ctx.beginPath(); ctx.moveTo(0, y + 0.5); ctx.lineTo(W, y + 0.5); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(220,60,60,0.5)';
    ctx.beginPath(); ctx.moveTo(30.5, 0); ctx.lineTo(30.5, h); ctx.stroke();
    NOTE.forEach((l, i) => text(ctx, l, 40, 28 * (i + 1) - 7, { font: `18px "Marker Felt", "Comic Sans MS", "Segoe Print", cursive`, color: '#3a3226' }));
  },
};

/* ================================================================== */
/* Settings                                                            */
/* ================================================================== */
const settings = {
  id: 'settings', name: 'Settings', top: '#b4b9c0', bottom: '#565b63',
  init() { return { view: 'main', hits: {} }; },
  bar(s) { return s.view === 'main' ? { title: 'Settings' } : { title: 'About', back: 'Settings' }; },
  back(s) { if (s.view === 'main') return false; s.view = 'main'; s.scroll = 0; return true; },
  height(s) { return s.view === 'main' ? 470 : 420; },
  draw(ctx, s, os) {
    const st = os.settings;
    s.hits = {};
    if (s.view === 'about') {
      const rows = [['Model', 'R1'], ['Born', '1989'], ['Software', '1.0 (2026)'], ['Storage', '8 GB, mostly cars'], ['Photos', String(os.photos.length)], ['Serial', 'RCKY-1989-0001'], ['Wallpaper', st.wallpaper === 'ripples' ? 'Ripples' : 'The planet']];
      group(ctx, 10, 12, W - 20, rows.length * 44);
      rows.forEach(([k, v], i) => {
        const y = 12 + i * 44;
        text(ctx, k, 22, y + 28, { font: `bold 16px ${FONT}` });
        text(ctx, v, W - 22, y + 28, { font: `16px ${FONT}`, color: '#3a5f9a', align: 'right' });
        if (i < rows.length - 1) separator(ctx, 22, y + 43, W - 44);
      });
      return;
    }
    let y = 12;
    const row = (label, value, opts = {}) => {
      group(ctx, 10, y, W - 20, opts.h || 44);
      text(ctx, label, 22, y + 28, { font: `bold 16px ${FONT}` });
      if (opts.toggle !== undefined) s.hits[opts.key] = toggle(ctx, W - 22 - 94, y + 8, opts.toggle);
      else if (value !== undefined) { text(ctx, value, W - 40, y + 28, { font: `16px ${FONT}`, color: '#3a5f9a', align: 'right' }); chevron(ctx, W - 24, y + 22); s.hits[opts.key] = { x: 10, y, w: W - 20, h: 44 }; }
      y += (opts.h || 44) + 12;
    };
    row('Airplane Mode', undefined, { toggle: st.airplane, key: 'airplane' });
    group(ctx, 10, y, W - 20, 88);
    text(ctx, 'Wi-Fi', 22, y + 28, { font: `bold 16px ${FONT}` });
    text(ctx, st.airplane ? 'Off' : 'ricky-net', W - 40, y + 28, { font: `16px ${FONT}`, color: '#3a5f9a', align: 'right' });
    chevron(ctx, W - 24, y + 22);
    separator(ctx, 22, y + 44, W - 44);
    text(ctx, 'Sounds', 22, y + 72, { font: `bold 16px ${FONT}` });
    text(ctx, 'On', W - 40, y + 72, { font: `16px ${FONT}`, color: '#3a5f9a', align: 'right' });
    chevron(ctx, W - 24, y + 66);
    y += 100;
    sectionLabel(ctx, 'Brightness', 22, y + 4);
    y += 12;
    group(ctx, 10, y, W - 20, 56);
    s.hits.brightness = slider(ctx, 34, y + 28, W - 68, (st.brightness - 0.15) / 0.85);
    s.sliderX = 34; s.sliderW = W - 68;
    y += 68;
    row('Wallpaper', st.wallpaper === 'ripples' ? 'Ripples' : 'The planet', { key: 'wallpaper' });
    row('About', '', { key: 'about' });
  },
  tap(x, y, s, os) {
    if (inRect(s.hits.airplane, x, y)) os.settings.airplane = !os.settings.airplane;
    else if (inRect(s.hits.wallpaper, x, y)) os.settings.wallpaper = os.settings.wallpaper === 'ripples' ? 'earth' : 'ripples';
    else if (inRect(s.hits.about, x, y)) { s.view = 'about'; s.scroll = 0; }
    else if (inRect(s.hits.brightness, x, y)) os.settings.brightness = clamp(0.15 + ((x - s.sliderX) / s.sliderW) * 0.85, 0.15, 1);
  },
  drag(x, y, s) { return inRect(s.hits.brightness, x, y); },
  dragMove(x, y, s, os) { os.settings.brightness = clamp(0.15 + ((x - s.sliderX) / s.sliderW) * 0.85, 0.15, 1); },
};

/* ================================================================== */
/* Phone                                                               */
/* ================================================================== */
const KEYS = [['1', ''], ['2', 'ABC'], ['3', 'DEF'], ['4', 'GHI'], ['5', 'JKL'], ['6', 'MNO'], ['7', 'PQRS'], ['8', 'TUV'], ['9', 'WXYZ'], ['*', ''], ['0', '+'], ['#', '']];

const phone = {
  id: 'phone', name: 'Phone', top: '#8ce87a', bottom: '#1f8f31',
  fixed: true,
  init() { return { number: '', view: 'keypad', callStart: 0, callee: '' }; },
  animating(s) { return s.view === 'calling'; },
  draw(ctx, s, os, now) {
    if (s.view === 'calling') {
      const g = ctx.createLinearGradient(0, 20, 0, H);
      g.addColorStop(0, '#3b4a5e'); g.addColorStop(1, '#121821');
      ctx.fillStyle = g;
      ctx.fillRect(0, 20, W, H - 20);
      const t = (now - s.callStart) / 1000;
      text(ctx, s.callee, W / 2, 120, { font: `bold 30px ${FONT}`, color: '#fff', align: 'center' });
      text(ctx, t < 2.5 ? 'calling…' : `${pad2(Math.floor((t - 2.5) / 60))}:${pad2(Math.floor(t - 2.5) % 60)}`, W / 2, 150, { font: `18px ${FONT}`, color: 'rgba(255,255,255,0.8)', align: 'center' });
      avatar(ctx, W / 2, 250, 56, s.callee === 'Mom' ? 'M' : '#', s.callee === 'Mom' ? '#c2578f' : '#5b6f8f');
      const eg = ctx.createLinearGradient(0, 400, 0, 444);
      eg.addColorStop(0, '#f0716a'); eg.addColorStop(1, '#c62c22');
      ctx.fillStyle = eg;
      roundRect(ctx, 60, 400, W - 120, 44, 9);
      ctx.fill();
      text(ctx, 'End Call', W / 2, 422, { font: `bold 18px ${FONT}`, color: '#fff', align: 'center', baseline: 'middle' });
      s.hits = { end: { x: 60, y: 400, w: W - 120, h: 44 } };
      return;
    }
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 20, W, H - 20);
    text(ctx, s.number || ' ', W / 2, 70, { font: `300 ${s.number.length > 11 ? 24 : 32}px ${FONT}`, color: '#111', align: 'center' });
    const y0 = 96, cw = W / 3, ch = 78;
    KEYS.forEach(([k, letters], i) => {
      const x = (i % 3) * cw, y = y0 + Math.floor(i / 3) * ch;
      const g = ctx.createLinearGradient(0, y, 0, y + ch);
      g.addColorStop(0, '#fbfbfc'); g.addColorStop(1, '#d9dce0');
      ctx.fillStyle = g;
      ctx.fillRect(x, y, cw, ch);
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, y + 0.5, cw - 1, ch - 1);
      text(ctx, k, x + cw / 2, y + 40, { font: `300 32px ${FONT}`, color: '#111', align: 'center' });
      if (letters) text(ctx, letters, x + cw / 2, y + 60, { font: `bold 10px ${FONT}`, color: '#555', align: 'center' });
    });
    const by = y0 + 4 * ch;
    ctx.fillStyle = '#2b2f36';
    ctx.fillRect(0, by, W, H - by);
    const cg = ctx.createLinearGradient(0, by + 10, 0, by + 50);
    cg.addColorStop(0, '#8ce87a'); cg.addColorStop(1, '#2c9b3c');
    ctx.fillStyle = cg;
    roundRect(ctx, 100, by + 10, 120, 40, 8);
    ctx.fill();
    text(ctx, 'Call', W / 2, by + 30, { font: `bold 20px ${FONT}`, color: '#fff', align: 'center', baseline: 'middle' });
    if (s.number) {
      ctx.fillStyle = '#c9ced6';
      ctx.beginPath(); ctx.moveTo(250, by + 30); ctx.lineTo(262, by + 18); ctx.lineTo(292, by + 18); ctx.lineTo(292, by + 42); ctx.lineTo(262, by + 42); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#2b2f36'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(271, by + 25); ctx.lineTo(283, by + 35); ctx.moveTo(283, by + 25); ctx.lineTo(271, by + 35); ctx.stroke();
    }
    s.hits = { call: { x: 100, y: by + 10, w: 120, h: 40 }, del: { x: 246, y: by + 10, w: 50, h: 40 }, y0, cw, ch };
  },
  tap(x, y, s, os, now) {
    if (!s.hits) return;
    if (s.view === 'calling') { if (inRect(s.hits?.end, x, y)) { s.view = 'keypad'; s.number = ''; } return; }
    if (inRect(s.hits?.call, x, y)) { s.view = 'calling'; s.callStart = now; s.callee = s.number || 'Mom'; return; }
    if (inRect(s.hits?.del, x, y)) { s.number = s.number.slice(0, -1); return; }
    const { y0, cw, ch } = s.hits;
    if (y < y0 || y >= y0 + 4 * ch) return;
    const i = Math.floor(x / cw) + Math.floor((y - y0) / ch) * 3;
    if (KEYS[i] && s.number.length < 14) s.number += KEYS[i][0];
  },
};


/* ================================================================== */
/* Stocks                                                              */
/* ================================================================== */
const TICKERS = [['ACME', 42.10, 1.24], ['OMNI', 118.55, -2.31], ['ZAP', 7.82, 0.41], ['PEAR', 96.20, 3.05], ['FIZZ', 23.47, -0.66]];
const RANGES = ['1d', '1w', '1m', '3m', '6m', '1y', '2y'];
function series(seedBase, n) {
  let x = 1000 + seedBase * 7919;
  const r = () => { x = (x * 16807) % 2147483647; return (x - 1) / 2147483646; };
  const out = [50];
  for (let i = 1; i < n; i++) out.push(clamp(out[i - 1] + (r() - 0.48) * 6, 10, 95));
  return out;
}
const stocks = {
  id: 'stocks', name: 'Stocks', top: '#3d4d5e', bottom: '#0c151f',
  background: '#0c0c0e',
  init() { return { sel: 0, range: 2 }; },
  bar() { return { title: 'Stocks' }; },
  height() { return CONTENT_H; },
  draw(ctx, s) {
    ctx.fillStyle = '#0c0c0e';
    ctx.fillRect(0, 0, W, CONTENT_H);
    TICKERS.forEach(([t, price, chg], i) => {
      const y = i * 44;
      if (s.sel === i) { ctx.fillStyle = '#1c2431'; ctx.fillRect(0, y, W, 44); }
      text(ctx, t, 14, y + 28, { font: `bold 18px ${FONT}`, color: '#fff' });
      text(ctx, price.toFixed(2), 200, y + 28, { font: `18px ${FONT}`, color: '#fff', align: 'right' });
      ctx.fillStyle = chg >= 0 ? '#3aa64a' : '#c8322b';
      roundRect(ctx, 224, y + 10, 82, 24, 5);
      ctx.fill();
      text(ctx, `${chg >= 0 ? '+' : ''}${chg.toFixed(2)}%`, 265, y + 27, { font: `bold 14px ${FONT}`, color: '#fff', align: 'center' });
      ctx.fillStyle = '#26262b';
      ctx.fillRect(0, y + 43, W, 1);
    });
    const top = TICKERS.length * 44 + 12;
    RANGES.forEach((r, i) => {
      const x = 10 + i * 43;
      if (s.range === i) { ctx.fillStyle = '#3a4a5e'; roundRect(ctx, x, top, 40, 22, 4); ctx.fill(); }
      text(ctx, r, x + 20, top + 15, { font: `bold 12px ${FONT}`, color: s.range === i ? '#fff' : '#9aa3ad', align: 'center' });
    });
    const gx = 14, gy = top + 34, gw = W - 28, gh = CONTENT_H - gy - 16;
    ctx.fillStyle = '#131317';
    ctx.fillRect(gx, gy, gw, gh);
    ctx.strokeStyle = '#2a2a30';
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(gx, gy + (gh * i) / 4); ctx.lineTo(gx + gw, gy + (gh * i) / 4); ctx.stroke(); }
    const pts = series(s.sel * 10 + s.range, 40);
    ctx.strokeStyle = TICKERS[s.sel][2] >= 0 ? '#5be08a' : '#ff6a5c';
    ctx.lineWidth = 2;
    ctx.beginPath();
    pts.forEach((v, i) => { const x = gx + (i / (pts.length - 1)) * gw, y = gy + gh - (v / 100) * gh; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
    ctx.stroke();
    text(ctx, `${TICKERS[s.sel][0]} · ${RANGES[s.range]}`, gx + 8, gy + 18, { font: `bold 12px ${FONT}`, color: '#9aa3ad' });
    s.hits = { rows: TICKERS.length * 44, top };
  },
  tap(x, y, s) {
    if (!s.hits) return;
    if (y < s.hits.rows) { s.sel = Math.floor(y / 44); return; }
    if (y >= s.hits.top && y < s.hits.top + 22) { const i = Math.floor((x - 10) / 43); if (i >= 0 && i < RANGES.length) s.range = i; }
  },
};

/* ================================================================== */
/* Music, the way the iPod app did it                                  */
/* ================================================================== */
const SONGS = [['Summer of 89', 'The Cassettes', 214, '#c8322b'], ['Dial Tone', 'Modem Kids', 187, '#3a7fdb'], ['Late Bus Home', 'Paper Route', 241, '#f2a33a'], ['Parking Lot Lights', 'The Cassettes', 198, '#3aa64a'], ['Static on Channel 3', 'Modem Kids', 176, '#7a4fb3'], ['Cul-de-sac', 'Paper Route', 223, '#5aa0e6']];
const MUSIC_TABS = ['Playlists', 'Artists', 'Songs', 'Videos', 'More'];
const music = {
  id: 'music', name: 'iPod', top: '#ffbf5c', bottom: '#e35f16', glyph: 'music',
  inset: 44,
  init() { return { tab: 2, playing: -1, startedAt: 0, paused: false, pausedAt: 0, view: 'list' }; },
  animating(s) { return s.view === 'now' && s.playing >= 0 && !s.paused; },
  bar(s) { return s.view === 'now' ? { title: 'Now Playing', back: 'Songs' } : { title: MUSIC_TABS[s.tab] }; },
  back(s) { if (s.view !== 'now') return false; s.view = 'list'; return true; },
  height(s) { return s.view === 'now' ? CONTENT_H - 44 : Math.max(CONTENT_H, SONGS.length * 44); },
  draw(ctx, s, os, now) {
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, W, 800);
    if (s.view === 'now' && s.playing >= 0) {
      const [title, artist, total, color] = SONGS[s.playing];
      const elapsed = Math.min(total, ((s.paused ? s.pausedAt : now) - s.startedAt) / 1000);
      ctx.fillStyle = '#111';
      ctx.fillRect(0, 0, W, CONTENT_H);
      const g = ctx.createLinearGradient(50, 20, 270, 240);
      g.addColorStop(0, color); g.addColorStop(1, '#222');
      ctx.fillStyle = g;
      ctx.fillRect(50, 16, 220, 220);
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.beginPath(); ctx.arc(160, 126, 70, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath(); ctx.arc(160, 126, 14, 0, Math.PI * 2); ctx.fill();
      text(ctx, title, W / 2, 268, { font: `bold 18px ${FONT}`, color: '#fff', align: 'center' });
      text(ctx, artist, W / 2, 290, { font: `14px ${FONT}`, color: '#aaa', align: 'center' });
      ctx.fillStyle = '#333';
      roundRect(ctx, 30, 310, W - 60, 6, 3); ctx.fill();
      ctx.fillStyle = '#e9ecf1';
      roundRect(ctx, 30, 310, (W - 60) * (elapsed / total), 6, 3); ctx.fill();
      const mm = (t) => `${Math.floor(t / 60)}:${pad2(Math.floor(t % 60))}`;
      text(ctx, mm(elapsed), 30, 334, { font: `12px ${FONT}`, color: '#bbb' });
      text(ctx, `-${mm(total - elapsed)}`, W - 30, 334, { font: `12px ${FONT}`, color: '#bbb', align: 'right' });
      ctx.fillStyle = '#e9ecf1';
      ctx.beginPath(); ctx.moveTo(96, 358); ctx.lineTo(96, 382); ctx.lineTo(82, 370); ctx.closePath(); ctx.fill(); ctx.fillRect(78, 358, 3, 24);
      ctx.beginPath(); ctx.moveTo(224, 358); ctx.lineTo(224, 382); ctx.lineTo(238, 370); ctx.closePath(); ctx.fill(); ctx.fillRect(239, 358, 3, 24);
      if (s.paused || elapsed >= total) { ctx.beginPath(); ctx.moveTo(150, 354); ctx.lineTo(176, 370); ctx.lineTo(150, 386); ctx.closePath(); ctx.fill(); }
      else { ctx.fillRect(148, 354, 9, 32); ctx.fillRect(163, 354, 9, 32); }
      s.hits = { play: { x: 120, y: 340, w: 80, h: 60 }, prev: { x: 60, y: 340, w: 56, h: 60 }, next: { x: 204, y: 340, w: 56, h: 60 } };
      return;
    }
    if (s.tab !== 2) {
      const names = s.tab === 0 ? ['On-The-Go', 'Late bus', 'Loud, on time'] : s.tab === 1 ? ['Modem Kids', 'Paper Route', 'The Cassettes'] : s.tab === 3 ? ['Nothing downloaded yet'] : ['Albums', 'Compilations', 'Genres', 'Composers'];
      names.forEach((n, i) => { const y = i * 44; text(ctx, n, 16, y + 28, { font: `bold 16px ${FONT}` }); chevron(ctx, W - 14, y + 22); separator(ctx, 16, y + 43, W - 16); });
      return;
    }
    SONGS.forEach(([title, artist], i) => {
      const y = i * 44;
      if (s.playing === i) { ctx.fillStyle = '#e8f0fb'; ctx.fillRect(0, y, W, 44); }
      text(ctx, title, 16, y + 20, { font: `bold 15px ${FONT}` });
      text(ctx, artist, 16, y + 37, { font: `12px ${FONT}`, color: '#6b6f78' });
      if (s.playing === i) { ctx.fillStyle = '#3a7fdb'; for (let k = 0; k < 3; k++) ctx.fillRect(W - 40 + k * 7, y + 26 - (4 + ((Math.floor(now / 160) + k) % 3) * 4), 4, 4 + ((Math.floor(now / 160) + k) % 3) * 4); }
      separator(ctx, 16, y + 43, W - 16);
    });
  },
  overlay(ctx, s) {
    const y = H - 44;
    const g = ctx.createLinearGradient(0, y, 0, H);
    g.addColorStop(0, '#3a3a3c'); g.addColorStop(1, '#151516');
    ctx.fillStyle = g;
    ctx.fillRect(0, y, W, 44);
    MUSIC_TABS.forEach((t, i) => {
      const x = (i + 0.5) * (W / 5);
      if (s.tab === i) { ctx.fillStyle = 'rgba(255,255,255,0.15)'; roundRect(ctx, x - 30, y + 3, 60, 38, 4); ctx.fill(); }
      ctx.fillStyle = s.tab === i ? '#3a7fdb' : '#9a9a9e';
      ctx.beginPath(); ctx.arc(x, y + 16, 7, 0, Math.PI * 2); ctx.fill();
      text(ctx, t, x, y + 37, { font: `bold 9px ${FONT}`, color: s.tab === i ? '#fff' : '#9a9a9e', align: 'center' });
    });
    s.tabHits = { y };
  },
  tap(x, y, s, os, now) {
    if (s.view === 'now') {
      if (inRect(s.hits?.play, x, y)) { if (s.paused) { s.startedAt += now - s.pausedAt; s.paused = false; } else { s.paused = true; s.pausedAt = now; } }
      else if (inRect(s.hits?.next, x, y)) { s.playing = (s.playing + 1) % SONGS.length; s.startedAt = now; s.paused = false; }
      else if (inRect(s.hits?.prev, x, y)) { s.playing = (s.playing + SONGS.length - 1) % SONGS.length; s.startedAt = now; s.paused = false; }
      return;
    }
    if (s.tab !== 2) return;
    const i = Math.floor(y / 44);
    if (i >= 0 && i < SONGS.length) { s.playing = i; s.startedAt = now; s.paused = false; s.view = 'now'; s.scroll = 0; }
  },
  barTap() {},
};
// the tab bar sits outside the scroll area, so taps on it arrive through the "bar" path of the core
music.tabTap = (x, y, s) => { if (y >= H - 44) { s.tab = Math.floor(x / (W / 5)); s.view = 'list'; s.scroll = 0; return true; } return false; };

export const APPS = [messages, calendar, photos, camera, stocks, maps, weather, clock, calculator, notes, settings];
export const DOCK = [phone, mail, safari, music];
export const ALL = [...APPS, ...DOCK];
export { PHOTO_KINDS };
