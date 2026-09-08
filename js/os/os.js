// RickyOS: assembles the desktop, taskbar, window manager, boot splash,
// shutdown sequence, and power state. Used both inside the 3D monitor and
// as a stand-alone 2D site.
import { el, sleep, prefersReducedMotion } from '../util/dom.js';
import { Emitter } from '../util/events.js';
import { store } from '../util/storage.js';
import { WindowManager } from './windows.js';
import { createDesktop } from './desktop.js';
import { createTaskbar } from './taskbar.js';
import { runShutdown } from './shutdown.js';
import { APPS } from './apps/index.js';
import { iconEl } from './icons.js';
import { sound } from '../sound.js';

export const DEFAULT_SETTINGS = {
  wallpaper: 'dots',
  color: '#256470',
  accent: '#ff6b4a',
  crt: true,
  sounds: true,
};

function darken(hex, amount = 0.22) {
  const n = parseInt(hex.replace('#', ''), 16);
  if (Number.isNaN(n)) return hex;
  const f = (v) => Math.max(0, Math.round(v * (1 - amount)));
  const r = f((n >> 16) & 255);
  const g = f((n >> 8) & 255);
  const b = f(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

export function createOS(root, { mode = 'os', onSwitchMode = null } = {}) {
  const bus = new Emitter();
  root.classList.add('os');
  root.innerHTML = '';

  const screen = el('div', { class: 'os-screen' });
  const shortcutsEl = el('div', { class: 'os-shortcuts' });
  const windowsEl = el('div', { class: 'os-windows' });
  const desktopEl = el('div', { class: 'os-desktop' }, shortcutsEl, windowsEl);
  const taskbarEl = el('div', { class: 'os-taskbar' });
  screen.append(desktopEl, taskbarEl, el('div', { class: 'os-crt' }), el('div', { class: 'os-glass' }));
  root.append(screen);

  const os = {
    root,
    screen,
    desktopEl,
    windowsEl,
    shortcutsEl,
    taskbarEl,
    bus,
    mode,
    apps: APPS,
    onSwitchMode,
    settings: { ...DEFAULT_SETTINGS, ...(store.get('os.settings', {}) || {}) },
    state: { booted: false, powered: true, busy: false, shutdowns: store.get('shutdowns', 0) || 0 },
  };

  os.wm = new WindowManager(windowsEl, { os });

  os.open = (id, params = {}) => {
    const app = APPS.find((a) => a.id === id);
    if (!app) {
      console.warn(`[os] unknown app "${id}"`);
      return null;
    }
    sound.unlock();
    return app.launch(os, params);
  };

  os.applySettings = () => {
    const s = os.settings;
    screen.className = `os-screen wall-${s.wallpaper}`;
    root.style.setProperty('--os-accent', s.accent);
    root.style.setProperty('--os-accent-dark', darken(s.accent));
    root.style.setProperty('--os-desktop', s.color);
    root.style.setProperty('--os-desktop-2', darken(s.color, 0.3));
    root.classList.toggle('no-crt', !s.crt);
    sound.setUiSounds(s.sounds);
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

  /** Small modal-ish dialog window. Resolves with the clicked button label. */
  os.dialog = ({ title = 'RickyOS', icon = 'info', message, buttons = ['OK'], id }) =>
    new Promise((resolve) => {
      const dialogId = id || `dialog-${Date.now()}`;
      const actions = el('div', { class: 'os-dialog-actions' });
      const win = os.wm.open({
        id: dialogId,
        title,
        icon,
        width: 400,
        height: 180,
        resizable: false,
        maximizable: false,
        bodyClass: 'no-scroll',
        onClose: () => resolve(null),
        render: (body) => {
          body.append(
            el('div', { class: 'os-dialog' }, iconEl(icon, 'os-dialog-icon'), el('p', { style: { margin: 0 } }, message)),
            actions
          );
        },
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

  os.about = () => {
    const win = os.wm.open({
      id: 'about',
      title: 'About RickyOS',
      icon: 'logo',
      width: 420,
      height: 250,
      resizable: false,
      maximizable: false,
      bodyClass: 'no-scroll',
      render: (body) => {
        body.append(
          el('div', { class: 'about-os' },
            iconEl('logo'),
            el('div', {},
              el('h2', {}, 'RickyOS 98'),
              el('p', {}, 'Version 1.0 (build ', String(new Date().getFullYear()), '.', String(new Date().getMonth() + 1).padStart(2, '0'), ')'),
              el('p', {}, 'A small operating system that exists only on this website.'),
              el('dl', {},
                el('dt', {}, 'Memory'), el('dd', {}, '65,536 KB (plenty)'),
                el('dt', {}, 'Processor'), el('dd', {}, 'RICKY-1 @ 133 MHz'),
                el('dt', {}, 'Licensed to'), el('dd', {}, 'You, apparently'),
                el('dt', {}, 'Shutdowns'), el('dd', {}, `${os.state.shutdowns} attempt${os.state.shutdowns === 1 ? '' : 's'}, 0 successes`)
              )
            )
          )
        );
      },
    });
    win.center();
    return win;
  };

  /* ---------- boot / power ---------- */

  os.boot = async () => {
    if (os.state.busy) return;
    os.state.busy = true;
    os.state.powered = true;
    bus.emit('power', true);
    const fast = prefersReducedMotion();
    const bar = el('i');
    const status = el('div', { class: 'os-splash-status' }, 'Starting RickyOS');
    const splash = el('div', { class: 'os-splash' },
      el('div', { class: 'os-splash-logo' },
        iconEl('logo'),
        el('div', {}, el('h1', {}, 'Ricky', el('span', {}, 'OS')), el('small', {}, 'version 98 point 1'))
      ),
      el('div', { class: 'os-splash-bar' }, bar),
      status
    );
    root.append(splash);
    sound.success();
    const steps = ['Starting RickyOS', 'Warming up the CRT', 'Mounting C:\\', 'Loading desktop', 'Counting pixels', 'Ready'];
    for (let i = 0; i < steps.length; i++) {
      status.textContent = steps[i] + (i < steps.length - 1 ? '...' : '');
      bar.style.width = `${Math.round(((i + 1) / steps.length) * 100)}%`;
      await sleep(fast ? 60 : 220 + Math.random() * 220);
    }
    await sleep(fast ? 50 : 250);
    splash.classList.add('fade');
    setTimeout(() => splash.remove(), 350);
    os.state.booted = true;
    os.state.busy = false;
    bus.emit('booted');
    await sleep(fast ? 50 : 350);
    os.open('showcase');
  };

  os.reboot = async () => {
    os.startMenu?.close();
    os.wm.closeAll();
    bus.emit('reboot');
    await sleep(120);
    await os.boot();
  };

  os.shutdown = async () => {
    if (os.state.busy) return;
    os.state.busy = true;
    os.startMenu?.close();
    os.state.shutdowns += 1;
    store.set('shutdowns', os.state.shutdowns);
    os.wm.closeAll();
    bus.emit('shutdown');
    // after the "real" shutdown the counter cycles so the gag repeats
    const attempt = ((os.state.shutdowns - 1) % 10) + 1;
    await sleep(500);
    const result = await runShutdown(os, attempt);
    os.state.busy = false;
    if (result === 'off') os.powerOff({ message: true });
    else os.reboot();
  };

  let offOverlay = null;
  os.powerOff = ({ message = false } = {}) => {
    if (offOverlay) return;
    os.startMenu?.close();
    os.state.powered = false;
    offOverlay = el('div', { class: 'os-off', role: 'button', tabindex: '0', 'aria-label': 'Power on' },
      message ? el('div', {}, "It's now safe to turn off your computer.") : null,
      el('small', { class: 'cursor-blink' }, message ? 'Click anywhere or press any key to turn it back on' : ' ')
    );
    const on = (e) => {
      e?.preventDefault?.();
      os.powerOn();
    };
    offOverlay.addEventListener('click', on);
    offOverlay.addEventListener('keydown', on);
    root.append(offOverlay);
    bus.emit('power', false);
    sound.powerDown();
    setTimeout(() => offOverlay?.focus(), 50);
  };

  os.powerOn = () => {
    if (!offOverlay) return;
    offOverlay.remove();
    offOverlay = null;
    os.wm.closeAll();
    sound.unlock();
    os.boot();
  };

  os.togglePower = () => {
    if (os.state.powered) os.powerOff();
    else os.powerOn();
  };

  createDesktop(os);
  createTaskbar(os);
  os.applySettings();

  return os;
}
