// RickyOS: the operating system of the RK-1. Assembles the desktop, the
// power strip, the window manager, POST/boot, screensaver, and power state.
// Runs inside the 3D monitor or as a stand-alone 2D site.
import { el, sleep, prefersReducedMotion } from '../util/dom.js';
import { Emitter } from '../util/events.js';
import { store } from '../util/storage.js';
import { WindowManager } from './windows.js';
import { createDesktop } from './desktop.js';
import { createStrip } from './taskbar.js';
import { createPhoneShell, PhoneWindowManager } from './phone.js';
import { createSaver } from './saver.js';
import { pcbWallpaper } from './wallpaper.js';
import { APPS } from './apps/index.js';
import { iconEl } from './icons.js';
import { CREDITS } from './content.js';
import { sound } from '../sound.js';

export const DEFAULT_SETTINGS = { wallpaper: 'navy', accent: '#ff7a1a', crt: true, sounds: true, saverMinutes: 2 };

function darken(hex, amount = 0.22) {
  const n = parseInt(hex.replace('#', ''), 16);
  if (Number.isNaN(n)) return hex;
  const f = (v) => Math.max(0, Math.round(v * (1 - amount)));
  return `#${((1 << 24) | (f((n >> 16) & 255) << 16) | (f((n >> 8) & 255) << 8) | f(n & 255)).toString(16).slice(1)}`;
}
function lighten(hex, amount = 0.7) {
  const n = parseInt(hex.replace('#', ''), 16);
  if (Number.isNaN(n)) return hex;
  const f = (v) => Math.min(255, Math.round(v + (255 - v) * amount));
  return `#${((1 << 24) | (f((n >> 16) & 255) << 16) | (f((n >> 8) & 255) << 8) | f(n & 255)).toString(16).slice(1)}`;
}

const POST_LINES = [
  ['RK-1 BIOS v1.0 - Ricky\'s Bench Computer Co.', ''],
  ['Remote link .............. phone on stand', 'dim'],
  ['Checking memory ........... 64K OK', ''],
  ['Checking cat .............. asleep', 'dim'],
  ['Detecting display ......... CRT 1280x960', ''],
  ['Detecting keyboard ........ clacky', ''],
  ['Detecting coffee .......... low', 'amber'],
  ['Loading RickyOS ...........', ''],
];

export function createOS(root, { layout = 'crt' } = {}) {
  const bus = new Emitter();
  const phone = layout === 'phone';
  root.classList.add('os');
  root.classList.toggle('os-phone', phone);
  root.innerHTML = '';

  const screen = el('div', { class: 'os-screen' });
  const shortcutsEl = el('div', { class: 'os-shortcuts' });
  const windowsEl = el('div', { class: 'os-windows' });
  const desktopEl = el('div', { class: 'os-desktop' }, shortcutsEl, windowsEl);
  const stripEl = el('div', { class: 'os-strip' });
  if (phone) screen.append(el('div', { class: 'os-crt' }), el('div', { class: 'os-glass' }));
  else screen.append(desktopEl, stripEl, el('div', { class: 'os-crt' }), el('div', { class: 'os-glass' }));
  root.append(screen);

  const os = {
    root, screen, desktopEl, windowsEl, shortcutsEl, stripEl, bus, layout, mode: 'scene', apps: APPS,
    settings: { ...DEFAULT_SETTINGS, ...(store.get('os.settings', {}) || {}) },
    state: { booted: false, powered: false, busy: false, shutdowns: store.get('shutdowns', 0) || 0 },
  };

  os.wm = phone ? new PhoneWindowManager(os) : new WindowManager(windowsEl, { os });
  os.wm.on('change', () => bus.emit('activity'));
  os.saver = createSaver(os);

  os.open = (id, params = {}) => {
    const app = APPS.find((a) => a.id === id);
    if (!app) {
      console.warn(`[os] unknown app "${id}"`);
      return null;
    }
    sound.unlock();
    return app.launch(os, params);
  };

  /* ---------- settings ---------- */
  os.applySettings = () => {
    const s = os.settings;
    screen.style.backgroundImage = `url(${pcbWallpaper(s.wallpaper)})`;
    root.style.setProperty('--os-accent', s.accent);
    root.style.setProperty('--os-accent-dark', darken(s.accent));
    root.style.setProperty('--os-accent-soft', lighten(s.accent));
    root.classList.toggle('no-crt', !s.crt);
    sound.setUiSounds(s.sounds);
    kickIdle();
    bus.emit('settings', s);
  };
  os.saveSettings = (patch) => {
    os.settings = { ...os.settings, ...patch };
    store.set('os.settings', os.settings);
    os.applySettings();
  };
  os.resetSettings = () => {
    os.settings = { ...DEFAULT_SETTINGS };
    store.remove('os.settings');
    os.applySettings();
  };

  /* ---------- hash routing (deep links like #notebook/builds) ---------- */
  os.setHash = (path) => {
    try {
      history.replaceState(null, '', path ? `#${path}` : location.pathname + location.search);
    } catch { /* ignore */ }
  };
  os.applyHash = () => {
    const hash = decodeURIComponent(location.hash.slice(1));
    if (!hash) return false;
    const [id, ...rest] = hash.split('/');
    const app = APPS.find((a) => a.id === id);
    if (!app) return false;
    os.open(id, { path: rest.join('/') });
    return true;
  };

  /* ---------- dialogs ---------- */
  os.dialog = ({ title = 'RickyOS', icon = 'info', message, buttons = ['OK'], id }) =>
    new Promise((resolve) => {
      const actions = el('div', { class: 'os-dialog-actions' });
      const win = os.wm.open({
        id: id || `dialog-${Date.now()}`, title, icon, width: 410, height: 190, resizable: false, maximizable: false, bodyClass: 'no-scroll',
        onClose: () => resolve(null),
        render: (body) => body.append(el('div', { class: 'os-dialog' }, iconEl(icon, 'os-dialog-icon'), el('p', { style: { margin: 0 } }, message)), actions),
      });
      buttons.forEach((label, i) => {
        const btn = el('button', { class: `os-btn${i === 0 ? ' primary' : ''}`, type: 'button' }, label);
        btn.addEventListener('click', () => {
          resolve(label);
          win.options.onClose = null;
          win.close();
        });
        actions.append(btn);
      });
      win.center();
      setTimeout(() => actions.querySelector('button')?.focus(), 50);
    });

  os.toast = (text) => bus.emit('toast', text);

  os.about = () => {
    const win = os.wm.open({
      id: 'about', title: 'About RickyOS', icon: 'logo', width: 460, height: 330, resizable: false, maximizable: false, bodyClass: 'no-scroll',
      render: (body) => {
        body.append(
          el('div', { class: 'about-os' },
            iconEl('logo'),
            el('div', {},
              el('h2', {}, 'RickyOS 1.0'),
              el('p', {}, 'The operating system of the RK-1, a computer that exists only on this website.'),
              el('dl', {},
                el('dt', {}, 'Machine'), el('dd', {}, 'RK-1 @ 8 MHz, 64K, one fan'),
                el('dt', {}, 'Licensed to'), el('dd', {}, 'Whoever is at the bench'),
                el('dt', {}, 'Shutdowns'), el('dd', {}, `${os.state.shutdowns}`),
                ...CREDITS.flatMap(([k, v]) => [el('dt', {}, k), el('dd', {}, v)])
              )
            )
          )
        );
      },
    });
    win.center();
    return win;
  };

  /* ---------- POST, boot, power ---------- */
  const fast = () => prefersReducedMotion();

  os.boot = async () => {
    if (os.state.busy) return;
    os.state.busy = true;
    os.state.powered = true;
    os.wm.closeAll();
    bus.emit('power', true);
    const post = el('div', { class: 'os-post', 'aria-live': 'polite' });
    root.append(post);
    sound.chime();
    for (const [text, cls] of POST_LINES) {
      post.append(el('div', { class: cls }, text));
      bus.emit('activity');
      await sleep(fast() ? 40 : 150 + Math.random() * 160);
    }
    await sleep(fast() ? 60 : 350);
    const bar = el('i');
    const status = el('div', { class: 'os-splash-status' }, 'Mounting the bench');
    const splash = el('div', { class: 'os-splash' },
      el('div', { class: 'os-splash-logo' }, iconEl('logo'), el('div', {}, el('h1', {}, 'Ricky', el('span', {}, 'OS')), el('small', {}, 'for the RK-1 - build ' + new Date().getFullYear()))),
      el('div', { class: 'os-splash-bar' }, bar),
      status
    );
    root.append(splash);
    post.classList.add('fade');
    setTimeout(() => post.remove(), 300);
    sound.success();
    const steps = ['Mounting the bench', 'Warming up the CRT', 'Counting jars', 'Loading desktop', 'Ready'];
    for (let i = 0; i < steps.length; i++) {
      status.textContent = steps[i] + (i < steps.length - 1 ? '...' : '');
      bar.style.width = `${Math.round(((i + 1) / steps.length) * 100)}%`;
      bus.emit('activity');
      await sleep(fast() ? 50 : 200 + Math.random() * 200);
    }
    await sleep(fast() ? 40 : 200);
    splash.classList.add('fade');
    setTimeout(() => splash.remove(), 350);
    os.state.booted = true;
    os.state.busy = false;
    bus.emit('booted');
    kickIdle();
    await sleep(fast() ? 40 : 320);
    if (!os.applyHash()) os.open('notebook');
  };

  os.reboot = async () => {
    os.menu?.close();
    os.saver.stop();
    os.wm.closeAll();
    bus.emit('reboot');
    await sleep(120);
    await os.boot();
  };

  os.shutdown = async () => {
    if (os.state.busy || !os.state.powered) return;
    os.state.busy = true;
    os.menu?.close();
    os.saver.stop();
    os.state.shutdowns += 1;
    store.set('shutdowns', os.state.shutdowns);
    os.wm.closeAll();
    bus.emit('shutdown');
    const post = el('div', { class: 'os-post' });
    root.append(post);
    const lines = [
      ['RickyOS is shutting down.', ''],
      ['Saving notes .............. done', ''],
      ['Parking the cat ........... done', 'dim'],
      ['Cooling the iron .......... done', ''],
      ['', ''],
      ['It is now safe to switch off the RK-1.', 'amber'],
    ];
    await sleep(300);
    for (const [text, cls] of lines) {
      post.append(el('div', { class: cls }, text));
      await sleep(fast() ? 40 : 260 + Math.random() * 200);
    }
    await sleep(fast() ? 100 : 1100);
    post.remove();
    os.state.busy = false;
    os.powerOff({ message: true });
  };

  let offOverlay = null;
  os.powerOff = ({ message = false } = {}) => {
    if (offOverlay) return;
    os.menu?.close();
    os.saver.stop();
    os.wm.closeAll();
    os.state.powered = false;
    os.state.booted = false;
    clearTimeout(idleTimer);
    const hint = phone ? 'Tap to wake the phone' : 'Flip the switch on the RK-1 to boot, or click here';
    offOverlay = el('div', { class: 'os-off', role: 'button', tabindex: '0', 'aria-label': 'Power on' },
      el('span', { class: 'tape' }, phone ? 'RK-1 remote  -  off' : message ? 'RK-1  -  safe to switch off' : 'RK-1  -  off'),
      el('small', { class: 'cursor-blink' }, hint)
    );
    const on = (e) => {
      e?.preventDefault?.();
      os.powerOn();
    };
    offOverlay.addEventListener('click', on);
    offOverlay.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') on(e); });
    root.append(offOverlay);
    bus.emit('power', false);
    sound.powerDown();
    setTimeout(() => offOverlay?.focus(), 50);
  };

  os.powerOn = () => {
    if (!offOverlay) return;
    offOverlay.remove();
    offOverlay = null;
    sound.unlock();
    os.boot();
  };

  os.togglePower = () => {
    if (os.state.powered) os.powerOff();
    else os.powerOn();
  };

  /* ---------- idle -> screensaver ---------- */
  let idleTimer = null;
  const kickIdle = () => {
    clearTimeout(idleTimer);
    if (os.saver.running) os.saver.stop();
    const minutes = Number(os.settings.saverMinutes) || 0;
    if (minutes > 0 && os.state.booted && os.state.powered) idleTimer = setTimeout(() => os.saver.start(), minutes * 60000);
  };
  os.kickIdle = kickIdle;
  for (const ev of ['pointermove', 'pointerdown', 'keydown', 'wheel']) {
    root.addEventListener(ev, () => {
      if (os.saver.running || idleTimer) kickIdle();
    }, { capture: true, passive: true });
  }
  root.addEventListener('keydown', () => bus.emit('activity'), true);

  if (phone) os.phone = createPhoneShell(os);
  else {
    createDesktop(os);
    createStrip(os);
  }
  os.applySettings();
  return os;
}
