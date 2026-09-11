// The apps. Each one draws itself on the 320 x 480 canvas and answers taps.
//
//   fixed apps own the whole screen below the status bar;
//   scrolling apps draw content from y = 0 under a nav bar, and the core
//   scrolls, clips, and routes taps into content coordinates.
import { W, H, CONTENT_Y, NAV_H, FONT, clamp, roundRect, wrapLines, group, separator, chevron, sectionLabel, toggle, slider, bubble, avatar, inRect, barButton, clockText, pad2 } from './ui.js';
import { n64Controller } from './art.js';

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
// Safari's first page: a plain portfolio, the way a personal site usually
// reads. A name, a line, the work, a footer. The autismwaitlist.com entry
// opens the real site.
const ABOUT = [
  ['header', 'Ricky', 'Work · About'],
  ['intro', "Hi, I'm Ricky.", "I've been working with websites for over twenty years. This one is just me enjoying the world of AI."],
  ['label', 'Work'],
  ['project', 'autismwaitlist.com', 'Advocacy for better care for children with autism in Ontario. The site generates letters and sends them to MPPs, then follows up automatically with provincial leaders, showing what constituents are asking for.', 'Visit the site'],
  ['project', 'This phone', 'A first-generation iPhone in a den, built with AI from three.js primitives and canvas-drawn software. You are holding it.'],
  ['label', 'About'],
  ['p', 'Over twenty years of building websites, and lately a lot of time enjoying what AI can build alongside me.'],
  ['footer', '© Ricky'],
];

// Safari's pages. The first is drawn here. Every other one is a real web
// page, shown in a frame laid over the screen while the phone is in hand.
// Only pages listed here can be reached: the address field takes no typing.
// A live page is laid out at a desktop's width and scaled down to fit the
// screen, so it looks like a small copy of the site rather than a page
// squeezed narrow, the way the first iPhone showed a page at a wider
// virtual width and shrank it. The toolbar's right-hand button steps
// through the widths.
const LAYOUTS = [[1280, 'desktop'], [820, 'tablet'], [430, 'phone']];
const PAGES = [
  { title: 'Ricky', url: 'ricky.example', live: false },
  { title: 'Autism Waitlist', url: 'https://autismwaitlist.com', live: true, layout: 0 },
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
    y = 0;
    for (const [type, value, sub, link] of ABOUT) {
      const b = { type, value, sub, link, y };
      if (type === 'header') b.h = 46;
      else if (type === 'intro') { b.y += 16; m.font = `15px ${FONT}`; b.lines = wrapLines(m, sub, WIDTH); b.h = 32 + b.lines.length * 20 + 10; }
      else if (type === 'label') { b.y += 6; b.h = 28; }
      else if (type === 'project') { m.font = `14px ${FONT}`; b.lines = wrapLines(m, sub, WIDTH - 24); b.h = 34 + b.lines.length * 19 + (link ? 28 : 8); b.gap = 10; }
      else if (type === 'p') { m.font = `14px ${FONT}`; b.lines = wrapLines(m, value, WIDTH); b.h = b.lines.length * 19 + 8; }
      else if (type === 'footer') { b.y += 10; b.h = 40; }
      blocks.push(b);
      y = b.y + b.h + (b.gap || 0);
    }
    safariSeen = true;
    return { blocks, height: y + 8, X, WIDTH, page: 0, note: 0, noteText: '', layout: -1 };
  },
  badge() { return safariSeen ? 0 : 1; },
  animating(s, now) { return s.note > 0 && now - s.note < 3200; },
  bar() { return { title: '' }; },
  height(s) { return PAGES[s.page].live ? CONTENT_H - 44 : s.height; },
  site(s) { const p = PAGES[s.page]; return p.live ? { url: p.url, viewport: LAYOUTS[s.layout < 0 ? p.layout || 0 : s.layout][0], rect: { x: 0, y: CONTENT_Y, w: W, h: H - CONTENT_Y - 44 } } : null; },
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
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, W, s.height + 400);
    for (const b of s.blocks) {
      const { type, value, y } = b;
      if (type === 'header') {
        text(ctx, value, s.X, y + 29, { font: `bold 19px ${FONT}`, color: '#1c1f24' });
        text(ctx, b.sub, W - s.X, y + 29, { font: `13px ${FONT}`, color: '#6b7280', align: 'right' });
        ctx.fillStyle = '#e3e6ea'; ctx.fillRect(0, y + b.h - 1, W, 1);
      } else if (type === 'intro') {
        text(ctx, value, s.X, y + 24, { font: `bold 24px ${FONT}`, color: '#1c1f24' });
        b.lines.forEach((l, i) => text(ctx, l, s.X, y + 50 + i * 20, { font: `15px ${FONT}`, color: '#4b5563' }));
      } else if (type === 'label') text(ctx, value.toUpperCase(), s.X, y + 18, { font: `bold 11px ${FONT}`, color: '#8a919c' });
      else if (type === 'project') {
        roundRect(ctx, s.X + 0.5, y + 0.5, s.WIDTH - 1, b.h - 1, 8);
        ctx.fillStyle = '#fbfbfc'; ctx.fill();
        ctx.strokeStyle = '#e3e6ea'; ctx.lineWidth = 1; ctx.stroke();
        text(ctx, value, s.X + 12, y + 24, { font: `bold 16px ${FONT}`, color: '#1c1f24' });
        b.lines.forEach((l, i) => text(ctx, l, s.X + 12, y + 46 + i * 19, { font: `14px ${FONT}`, color: '#4b5563' }));
        if (b.link) {
          text(ctx, `${b.link} →`, s.X + 12, y + 46 + b.lines.length * 19 + 8, { font: `14px ${FONT}`, color: '#2a66c4' });
          b.hit = { x: s.X, y, w: s.WIDTH, h: b.h };
        }
      } else if (type === 'p') b.lines.forEach((l, i) => text(ctx, l, s.X, y + 15 + i * 19, { font: `14px ${FONT}`, color: '#4b5563' }));
      else if (type === 'footer') {
        ctx.fillStyle = '#e3e6ea'; ctx.fillRect(s.X, y, s.WIDTH, 1);
        text(ctx, value, s.X, y + 26, { font: `12px ${FONT}`, color: '#8a919c' });
      }
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
    if (page.live) {
      // a magnifier: step the page through phone, tablet and desktop widths
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(274, y + 19, 7, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(279, y + 24); ctx.lineTo(286, y + 31); ctx.stroke();
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(270, y + 19); ctx.lineTo(278, y + 19); ctx.moveTo(274, y + 15); ctx.lineTo(274, y + 23); ctx.stroke();
    } else {
      ctx.strokeStyle = '#fff';
      ctx.strokeRect(266, y + 16, 15, 15);
      ctx.strokeRect(271, y + 11, 15, 15);
      ctx.fillStyle = '#fff';
      ctx.font = `bold 8px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText(String(PAGES.length), 278.5, y + 22.5);
    }
  },
  tap(x, y, s) {
    // the whole entry is the link, as on most portfolio pages
    const card = s.blocks.find((b) => b.hit && inRect(b.hit, x, y));
    if (!PAGES[s.page].live && card) { s.page = 1; s.scroll = 0; }
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
    } else if (x >= 240) {
      if (!PAGES[s.page].live) { s.page = (s.page + 1) % PAGES.length; s.scroll = 0; return; }
      const cur = s.layout < 0 ? PAGES[s.page].layout || 0 : s.layout;
      s.layout = (cur + 1) % LAYOUTS.length;
      s.noteOk = true;
      s.noteText = `Laid out for a ${LAYOUTS[s.layout][1]}`;
      s.note = now || performance.now();
    }
  },
};

/* ================================================================== */
/* Messages                                                            */
/* ================================================================== */
// the site's own notifications, the way it texts its owner
const THREADS = [
  { who: 'autismwaitlist.com', initials: 'AW', color: '#2f7fd6', time: 'Yesterday', unread: 0, msgs: [[0, 'Follow-up emails sent to provincial leaders.'], [0, 'Domain renewed for another year.']] },
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
// mail about the site: what it sent, what keeps it running
const MAILS = [
  { from: 'autismwaitlist.com', subject: 'Letter sent to an MPP', time: '3:12 PM', unread: true, body: 'A letter was generated and sent to an MPP on behalf of a constituent. The follow-up to provincial leaders is scheduled.' },
  { from: 'autismwaitlist.com', subject: 'Follow-up emails sent', time: '9:48 AM', unread: true, body: 'The automated follow-up went out to provincial leaders, showing what constituents are asking for.' },
  { from: 'Domain registrar', subject: 'autismwaitlist.com renewed', time: 'Yesterday', body: 'Your domain has been renewed for another year. Nothing to do.' },
  { from: 'Hosting', subject: 'Deploy succeeded', time: 'Monday', body: 'autismwaitlist.com was deployed. All checks passed.' },
  { from: 'Ricky', subject: 'Note to self', time: 'Sunday', body: 'Add the new letter template, then update the follow-up list.' },
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
const EVENTS = [[0, 'Deploy the site update'], [3, 'Review the letter template'], [6, 'Follow-up emails go out'], [12, 'Domain renewal']];

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
const NOTE = ['To do', '1. build the phone  ✓', '2. write the software  ✓', '3. new letter template', '4. update the follow-up list', '5. renew the domain  ✓'];

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
      const rows = [['Model', 'R1'], ['Software', '1.0 (2026)'], ['Storage', '8 GB'], ['Serial', 'RCKY-2007-0001'], ['Wallpaper', st.wallpaper === 'ripples' ? 'Ripples' : 'The planet']];
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

// Calls that rang while the phone sat on the desk and were not answered.
export const calls = { missed: 0 };

const phone = {
  id: 'phone', name: 'Phone', top: '#8ce87a', bottom: '#1f8f31',
  fixed: true,
  init() { return { number: '', view: 'keypad', callStart: 0, callee: '' }; },
  badge() { return calls.missed; },
  animating(s) { return s.view === 'calling'; },
  draw(ctx, s, os, now) {
    calls.missed = 0;
    if (s.view === 'calling') {
      const g = ctx.createLinearGradient(0, 20, 0, H);
      g.addColorStop(0, '#3b4a5e'); g.addColorStop(1, '#121821');
      ctx.fillStyle = g;
      ctx.fillRect(0, 20, W, H - 20);
      const t = (now - s.callStart) / 1000;
      text(ctx, s.callee, W / 2, 120, { font: `bold 30px ${FONT}`, color: '#fff', align: 'center' });
      text(ctx, t < 2.5 ? 'calling…' : `${pad2(Math.floor((t - 2.5) / 60))}:${pad2(Math.floor(t - 2.5) % 60)}`, W / 2, 150, { font: `18px ${FONT}`, color: 'rgba(255,255,255,0.8)', align: 'center' });
      avatar(ctx, W / 2, 250, 56, '#', '#5b6f8f');
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
    if (inRect(s.hits?.call, x, y)) { s.view = 'calling'; s.callStart = now; s.callee = s.number || 'No number'; return; }
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

// the home screen: pages of icons you swipe between, four to a row, over a dock that stays put
export const HOME_PAGES = [[messages, calendar, notes, weather], [clock, stocks, calculator, settings]];
export const APPS = HOME_PAGES.flat();
export const DOCK = [phone, mail, safari];
export const ALL = [...APPS, ...DOCK];
