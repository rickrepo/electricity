// Window manager: draggable, resizable, focusable windows with minimize,
// maximize, and close. Works with mouse and touch (pointer events).
import { el, clamp, isCoarsePointer } from '../util/dom.js';
import { Emitter } from '../util/events.js';
import { iconEl } from './icons.js';
import { sound } from '../sound.js';

const CASCADE = 28;
const SMALL_SCREEN = 720;

export class WindowManager extends Emitter {
  constructor(layer, { os }) {
    super();
    this.layer = layer;
    this.os = os;
    this.windows = new Map();
    this.zCounter = 10;
    this.cascadeIndex = 0;
    this.focusedId = null;
    window.addEventListener('resize', () => this._onResize());
  }

  get bounds() {
    return { width: this.layer.clientWidth, height: this.layer.clientHeight };
  }

  get isSmallScreen() {
    return this.bounds.width < SMALL_SCREEN;
  }

  get(id) {
    return this.windows.get(id) || null;
  }

  list() {
    return [...this.windows.values()].sort((a, b) => a.order - b.order);
  }

  open(options) {
    const existing = this.windows.get(options.id);
    if (existing) {
      existing.restore();
      existing.focus();
      return existing;
    }
    const win = new OSWindow(this, options);
    this.windows.set(win.id, win);
    this.layer.append(win.el);
    win.focus();
    requestAnimationFrame(() => win.el.classList.add('open'));
    sound.open();
    this.emit('change');
    return win;
  }

  _remove(win) {
    this.windows.delete(win.id);
    if (this.focusedId === win.id) {
      this.focusedId = null;
      const next = this.list().filter((w) => !w.minimized).pop();
      next?.focus();
    }
    this.emit('change');
  }

  closeAll() {
    for (const win of [...this.windows.values()]) win.close(true);
  }

  _nextPosition(width, height) {
    const { width: W, height: H } = this.bounds;
    const i = this.cascadeIndex++ % 8;
    const x = clamp(112 + i * CASCADE, 0, Math.max(0, W - width));
    const y = clamp(22 + i * CASCADE, 0, Math.max(0, H - height));
    return { x, y };
  }

  _onResize() {
    for (const win of this.windows.values()) win._fit();
  }
}

let orderCounter = 0;
let createdCounter = 0;

class OSWindow {
  constructor(manager, options) {
    this.manager = manager;
    this.os = manager.os;
    this.id = options.id;
    this.appId = options.appId || options.id;
    this.title = options.title || 'Window';
    this.iconName = options.icon || 'file';
    this.options = options;
    this.order = ++orderCounter;
    this.created = ++createdCounter;
    this.minimized = false;
    this.maximized = false;
    this.closed = false;
    this._prevRect = null;
    this._listeners = [];

    const { width: W, height: H } = manager.bounds;
    const width = clamp(options.width || 640, options.minWidth || 240, Math.max(240, W - 8));
    const height = clamp(options.height || 480, options.minHeight || 140, Math.max(140, H - 8));
    const pos = options.x !== undefined && options.y !== undefined ? { x: options.x, y: options.y } : manager._nextPosition(width, height);
    this.rect = { x: pos.x, y: pos.y, width, height };

    this._build();
    this._apply();

    const shouldMaximize = options.maximized || (manager.isSmallScreen && options.maximizable !== false);
    if (shouldMaximize) this.maximize();

    options.render?.(this.body, this);
  }

  _build() {
    const o = this.options;
    this.titleEl = el('span', { class: 'os-title-text' }, iconEl(this.iconName), el('span', {}, this.title));
    this.closeBtn = el('button', { class: 'os-title-btn close', type: 'button', title: 'Close', 'aria-label': 'Close window' });
    this.minBtn = el('button', { class: 'os-title-btn min', type: 'button', title: 'Minimize', 'aria-label': 'Minimize window' });
    this.maxBtn = el('button', { class: 'os-title-btn max', type: 'button', title: 'Maximize', 'aria-label': 'Maximize window' });

    this.titlebar = el('div', { class: 'os-titlebar' },
      this.titleEl,
      el('span', { class: 'os-title-spacer' }),
      this.minBtn,
      o.maximizable === false ? null : this.maxBtn,
      this.closeBtn
    );

    this.body = el('div', { class: `os-window-body ${o.bodyClass || ''}`, tabindex: '-1' });

    this.statusLeft = el('span');
    this.statusRight = el('span');
    this.statusbar = o.status ? el('div', { class: 'os-statusbar' }, this.statusLeft, this.statusRight) : null;
    if (o.status) this.setStatus(o.status.left, o.status.right);

    this.resizeHandle = o.resizable === false ? null : el('div', { class: 'os-resize-handle', 'aria-hidden': 'true' });

    this.el = el('div', { class: 'os-window', role: 'dialog', 'aria-label': this.title, dataset: { id: this.id } },
      this.titlebar, this.body, this.statusbar, this.resizeHandle
    );

    this.el.addEventListener('pointerdown', () => this.focus(), true);
    this.closeBtn.addEventListener('click', (e) => { e.stopPropagation(); this.close(); });
    this.minBtn.addEventListener('click', (e) => { e.stopPropagation(); this.minimize(); });
    this.maxBtn.addEventListener('click', (e) => { e.stopPropagation(); this.toggleMaximize(); });
    for (const btn of [this.closeBtn, this.minBtn, this.maxBtn]) {
      btn.addEventListener('pointerdown', (e) => e.stopPropagation());
      btn.addEventListener('dblclick', (e) => e.stopPropagation());
    }

    this.titlebar.addEventListener('pointerdown', (e) => this._startDrag(e));
    this.titlebar.addEventListener('dblclick', () => {
      if (this.options.maximizable !== false) this.toggleMaximize();
    });
    this.resizeHandle?.addEventListener('pointerdown', (e) => this._startResize(e));
  }

  _apply() {
    if (this.maximized) {
      Object.assign(this.el.style, { left: '0px', top: '0px', width: '100%', height: '100%' });
    } else {
      const { x, y, width, height } = this.rect;
      Object.assign(this.el.style, { left: `${x}px`, top: `${y}px`, width: `${width}px`, height: `${height}px` });
    }
  }

  _fit() {
    if (this.maximized) return;
    const { width: W, height: H } = this.manager.bounds;
    if (!W || !H) return;
    this.rect.width = clamp(this.rect.width, this.options.minWidth || 240, Math.max(240, W));
    this.rect.height = clamp(this.rect.height, this.options.minHeight || 140, Math.max(140, H));
    this.rect.x = clamp(this.rect.x, -(this.rect.width - 80), Math.max(0, W - 80));
    this.rect.y = clamp(this.rect.y, 0, Math.max(0, H - 32));
    this._apply();
  }

  focus() {
    if (this.closed) return;
    const m = this.manager;
    if (m.focusedId !== this.id) {
      for (const w of m.windows.values()) w.el.classList.toggle('active', w === this);
      m.focusedId = this.id;
      this.el.style.zIndex = String(++m.zCounter);
      this.order = ++orderCounter;
      m.emit('change');
      this.options.onFocus?.(this);
    } else {
      this.el.classList.add('active');
    }
    if (!this.el.contains(document.activeElement)) this.body.focus({ preventScroll: true });
  }

  minimize() {
    if (this.minimized) return;
    this.minimized = true;
    this.el.classList.add('minimized');
    this.el.classList.remove('active');
    if (this.manager.focusedId === this.id) {
      this.manager.focusedId = null;
      const next = this.manager.list().filter((w) => !w.minimized && w !== this).pop();
      next?.focus();
    }
    sound.close();
    this.manager.emit('change');
  }

  restore() {
    if (!this.minimized) return;
    this.minimized = false;
    this.el.classList.remove('minimized');
    this.manager.emit('change');
  }

  toggleMinimize() {
    if (this.minimized) {
      this.restore();
      this.focus();
    } else if (this.manager.focusedId === this.id) this.minimize();
    else this.focus();
  }

  maximize() {
    if (this.maximized) return;
    this._prevRect = { ...this.rect };
    this.maximized = true;
    this.el.classList.add('maximized');
    this.maxBtn.title = 'Restore';
    this._apply();
    this.options.onResize?.(this);
  }

  unmaximize() {
    if (!this.maximized) return;
    this.maximized = false;
    this.el.classList.remove('maximized');
    this.maxBtn.title = 'Maximize';
    if (this._prevRect) this.rect = { ...this._prevRect };
    this._fit();
    this._apply();
    this.options.onResize?.(this);
  }

  toggleMaximize() {
    if (this.maximized) this.unmaximize();
    else this.maximize();
    sound.tick();
  }

  close(silent = false) {
    if (this.closed) return;
    this.closed = true;
    this.options.onClose?.(this);
    for (const off of this._listeners) off();
    if (!silent) sound.close();
    this.el.classList.add('closing');
    this.el.classList.remove('open');
    this.manager._remove(this);
    setTimeout(() => this.el.remove(), 150);
  }

  resize(width, height) {
    if (this.maximized) return;
    this.rect.width = width;
    this.rect.height = height;
    this._fit();
    this._apply();
    this.options.onResize?.(this);
  }

  center() {
    if (this.maximized) return;
    const { width: W, height: H } = this.manager.bounds;
    this.rect.x = Math.max(0, Math.round((W - this.rect.width) / 2));
    this.rect.y = Math.max(0, Math.round((H - this.rect.height) / 2));
    this._apply();
  }

  setTitle(title) {
    this.title = title;
    this.titleEl.lastElementChild.textContent = title;
    this.el.setAttribute('aria-label', title);
    this.manager.emit('change');
  }

  setStatus(left, right) {
    if (!this.statusbar) return;
    this.statusLeft.textContent = left ?? '';
    this.statusRight.textContent = right ?? '';
  }

  onCleanup(fn) {
    this._listeners.push(fn);
  }

  _startDrag(e) {
    if (e.button !== undefined && e.button !== 0) return;
    if (e.target.closest('.os-title-btn')) return;
    if (this.maximized) return;
    e.preventDefault();
    this.focus();
    const startX = e.clientX;
    const startY = e.clientY;
    const origin = { x: this.rect.x, y: this.rect.y };
    const scale = this._scale();
    const { width: W, height: H } = this.manager.bounds;
    this.el.classList.add('dragging');
    this.titlebar.setPointerCapture?.(e.pointerId);
    const move = (ev) => {
      this.rect.x = clamp(origin.x + (ev.clientX - startX) / scale, -(this.rect.width - 80), W - 80);
      this.rect.y = clamp(origin.y + (ev.clientY - startY) / scale, 0, H - 32);
      this._apply();
    };
    const up = (ev) => {
      this.titlebar.removeEventListener('pointermove', move);
      this.titlebar.removeEventListener('pointerup', up);
      this.titlebar.removeEventListener('pointercancel', up);
      try { this.titlebar.releasePointerCapture?.(ev.pointerId); } catch { /* ignore */ }
      this.el.classList.remove('dragging');
    };
    this.titlebar.addEventListener('pointermove', move);
    this.titlebar.addEventListener('pointerup', up);
    this.titlebar.addEventListener('pointercancel', up);
  }

  _startResize(e) {
    if (e.button !== undefined && e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    this.focus();
    const startX = e.clientX;
    const startY = e.clientY;
    const origin = { width: this.rect.width, height: this.rect.height };
    const scale = this._scale();
    const { width: W, height: H } = this.manager.bounds;
    const minW = this.options.minWidth || 240;
    const minH = this.options.minHeight || 140;
    this.el.classList.add('resizing');
    this.resizeHandle.setPointerCapture?.(e.pointerId);
    const move = (ev) => {
      this.rect.width = clamp(origin.width + (ev.clientX - startX) / scale, minW, W - this.rect.x);
      this.rect.height = clamp(origin.height + (ev.clientY - startY) / scale, minH, H - this.rect.y);
      this._apply();
      this.options.onResize?.(this);
    };
    const up = (ev) => {
      this.resizeHandle.removeEventListener('pointermove', move);
      this.resizeHandle.removeEventListener('pointerup', up);
      this.resizeHandle.removeEventListener('pointercancel', up);
      try { this.resizeHandle.releasePointerCapture?.(ev.pointerId); } catch { /* ignore */ }
      this.el.classList.remove('resizing');
      this.options.onResize?.(this);
    };
    this.resizeHandle.addEventListener('pointermove', move);
    this.resizeHandle.addEventListener('pointerup', up);
    this.resizeHandle.addEventListener('pointercancel', up);
  }

  /** Screen px per CSS px: inside the 3D monitor the OS is scaled. */
  _scale() {
    const w = this.manager.layer.getBoundingClientRect().width;
    const cw = this.manager.layer.clientWidth;
    return w && cw ? w / cw : 1;
  }
}

export const isTouch = isCoarsePointer;
