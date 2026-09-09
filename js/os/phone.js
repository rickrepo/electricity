// RickyOS phone layout: a home screen with an app grid, one full-screen app
// at a time, and bottom sheets for dialogs. Provides the same window-manager
// interface the apps already use.
import { el, formatClock } from '../util/dom.js';
import { Emitter } from '../util/events.js';
import { iconEl } from './icons.js';
import { sound } from '../sound.js';
import { PROFILE } from './content.js';

const BACK_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15.4 5.4 8.8 12l6.6 6.6 1.4-1.4L11.6 12l5.2-5.2z"/></svg>';

export function createPhoneShell(os) {
  const clock = el('span', {});
  const status = el('div', { class: 'os-phone-status' }, clock, el('span', {}, 'RK-1 remote'), el('span', { class: 'batt' }, '73%', el('i')));
  const bigClock = el('div', { class: 'clock' });
  const date = el('div', { class: 'date' });
  const widget = el('div', { class: 'os-home-widget' }, bigClock, date, el('div', { class: 'tapes' }, el('span', { class: 'tape orange' }, PROFILE.name), el('span', { class: 'tape' }, PROFILE.title)));
  const grid = el('div', { class: 'os-home-grid' });
  for (const app of os.apps.filter((a) => a.desktop !== false)) {
    const btn = el('button', { class: 'os-app-icon', type: 'button', 'aria-label': `Open ${app.name}` }, el('span', { class: 'tile' }, iconEl(typeof app.iconFor === 'function' ? app.iconFor(os) : app.icon)), el('span', {}, app.name));
    btn.addEventListener('click', () => os.open(app.id));
    grid.append(btn);
    app.updateIcon = () => btn.firstElementChild.replaceChildren(iconEl(typeof app.iconFor === 'function' ? app.iconFor(os) : app.icon));
  }
  os.bus.on('bin:change', () => os.apps.find((a) => a.id === 'bin')?.updateIcon?.());
  const home = el('div', { class: 'os-home' }, widget, grid);
  const appview = el('div', { class: 'os-appview', hidden: true });
  const powerBtn = el('button', { class: 'side', type: 'button', 'aria-label': 'Power' }, iconEl('power'));
  const infoBtn = el('button', { class: 'side', type: 'button', 'aria-label': 'About RickyOS' }, iconEl('info'));
  const pill = el('button', { class: 'pill', type: 'button', 'aria-label': 'Home' });
  const benchBtn = el('button', { class: 'side bench', type: 'button', 'aria-label': 'Put the phone down' }, iconEl('bench'));
  const nav = el('div', { class: 'os-phone-nav' }, powerBtn, benchBtn, pill, infoBtn);
  const sheets = el('div', { class: 'os-sheets' });
  os.screen.append(status, home, appview, nav, sheets);

  const tickClock = () => {
    const now = new Date();
    clock.textContent = formatClock(now);
    bigClock.textContent = formatClock(now).replace(/ (AM|PM)$/, '');
    date.textContent = now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  };
  tickClock();
  setInterval(tickClock, 10000);

  pill.addEventListener('click', () => { sound.tick(); os.wm.current?.close(); });
  powerBtn.addEventListener('click', async () => {
    sound.tick();
    const answer = await os.dialog({ title: 'Power', icon: 'power', message: 'Shut down RickyOS?', buttons: ['Shut down', 'Cancel'] });
    if (answer === 'Shut down') os.shutdown();
  });
  infoBtn.addEventListener('click', () => os.about());
  benchBtn.addEventListener('click', () => { sound.tick(); os.bus.emit('leave'); });

  return {
    sheetLayer: sheets,
    showApp(win) { appview.replaceChildren(win.el); appview.hidden = false; },
    showHome() { appview.hidden = true; appview.replaceChildren(); },
  };
}

let created = 0;

export class PhoneWindowManager extends Emitter {
  constructor(os) {
    super();
    this.os = os;
    this.windows = new Map();
    this.current = null;
    this.focusedId = null;
    this.zCounter = 10;
  }
  get bounds() { return { width: this.os.root.clientWidth || 390, height: this.os.root.clientHeight || 844 }; }
  get isSmallScreen() { return true; }
  get(id) { return this.windows.get(id) || null; }
  list() { return [...this.windows.values()].sort((a, b) => a.order - b.order); }
  open(options) {
    const existing = this.windows.get(options.id);
    if (existing) { existing.focus(); return existing; }
    const modal = options.maximizable === false && options.resizable === false;
    const win = new PhoneWindow(this, options, modal);
    this.windows.set(win.id, win);
    if (modal) this.os.phone.sheetLayer.append(win.el);
    else {
      if (this.current && this.current !== win) this.current.close(true);
      this.current = win;
      this.os.phone.showApp(win);
    }
    win.focus();
    sound.open();
    this.emit('change');
    return win;
  }
  _remove(win) {
    this.windows.delete(win.id);
    if (this.current === win) { this.current = null; this.os.phone.showHome(); }
    if (this.focusedId === win.id) this.focusedId = null;
    this.emit('change');
  }
  closeAll() { for (const w of [...this.windows.values()]) w.close(true); }
}

class PhoneWindow {
  constructor(manager, options, modal) {
    this.manager = manager;
    this.os = manager.os;
    this.id = options.id;
    this.appId = options.appId || options.id;
    this.title = options.title || 'App';
    this.iconName = options.icon || 'file';
    this.options = options;
    this.modal = modal;
    this.order = ++created;
    this.created = this.order;
    this.minimized = false;
    this.maximized = true;
    this.closed = false;
    this.rect = { x: 0, y: 0, width: manager.bounds.width, height: manager.bounds.height };
    this._listeners = [];
    this.body = el('div', { class: `os-window-body ${options.bodyClass || ''}`, tabindex: '-1' });
    this.titleEl = el('span', { class: 'os-title-text' }, iconEl(this.iconName), el('span', {}, this.title));
    this.statusLeft = el('span');
    this.statusRight = el('span');
    this.statusbar = options.status ? el('div', { class: 'os-statusbar' }, this.statusLeft, this.statusRight) : null;
    if (modal) {
      this.el = el('div', { class: 'os-sheet', role: 'dialog', 'aria-label': this.title }, el('div', { class: 'os-sheet-card' }, el('div', { class: 'os-phone-sheet-head' }, this.titleEl), this.body));
      this.el.addEventListener('click', (e) => { if (e.target === this.el) this.close(); });
    } else {
      const back = el('button', { class: 'back', type: 'button', 'aria-label': 'Back to home', html: BACK_SVG });
      back.addEventListener('click', () => this.close());
      this.el = el('div', { class: 'os-phone-app', role: 'dialog', 'aria-label': this.title }, el('div', { class: 'os-phone-head' }, back, this.titleEl), this.body, this.statusbar);
    }
    if (options.status) this.setStatus(options.status.left, options.status.right);
    options.render?.(this.body, this);
  }
  focus() {
    if (this.closed) return;
    this.manager.focusedId = this.id;
    if (!this.el.contains(document.activeElement)) this.body.focus({ preventScroll: true });
    this.options.onFocus?.(this);
  }
  minimize() { this.close(); }
  restore() {}
  toggleMinimize() { this.focus(); }
  maximize() {}
  unmaximize() {}
  toggleMaximize() {}
  resize() {}
  center() {}
  close(silent = false) {
    if (this.closed) return;
    this.closed = true;
    this.options.onClose?.(this);
    for (const off of this._listeners) off();
    if (!silent) sound.close();
    this.el.remove();
    this.manager._remove(this);
  }
  setTitle(title) { this.title = title; this.titleEl.lastElementChild.textContent = title; this.manager.emit('change'); }
  setStatus(left, right) { if (!this.statusbar) return; this.statusLeft.textContent = left ?? ''; this.statusRight.textContent = right ?? ''; }
  onCleanup(fn) { this._listeners.push(fn); }
}
