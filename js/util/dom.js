// DOM + misc helpers shared by the scene HUD, boot screen, and RickyOS.

/**
 * el('div', { class: 'x', onClick: fn, style: { color: 'red' } }, 'text', childNode, [more])
 */
export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs || {})) {
    if (value === null || value === undefined || value === false) continue;
    if (key === 'class' || key === 'className') node.className = value;
    else if (key === 'style' && typeof value === 'object') Object.assign(node.style, value);
    else if (key === 'dataset') Object.assign(node.dataset, value);
    else if (key === 'html') node.innerHTML = value;
    else if (key === 'text') node.textContent = value;
    else if (key.startsWith('on') && typeof value === 'function') {
      node.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (key in node && typeof value !== 'string' && key !== 'list') node[key] = value;
    else node.setAttribute(key, value === true ? '' : value);
  }
  append(node, children);
  return node;
}

export function append(parent, children) {
  for (const child of children.flat(Infinity)) {
    if (child === null || child === undefined || child === false) continue;
    parent.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return parent;
}

/** Build an element from an HTML/SVG string. */
export function fromHTML(markup) {
  const tpl = document.createElement('template');
  tpl.innerHTML = markup.trim();
  return tpl.content.firstElementChild;
}

export function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
  return node;
}

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const rand = (min, max) => min + Math.random() * (max - min);
export const randInt = (min, max) => Math.floor(rand(min, max + 1));
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

/** Deterministic PRNG (mulberry32) for seeded placeholder art. */
export function seededRandom(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function formatClock(date = new Date(), { seconds = false } = {}) {
  let h = date.getHours();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  const m = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return seconds ? `${h}:${m}:${s} ${ampm}` : `${h}:${m} ${ampm}`;
}

export function formatDate(date = new Date()) {
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${mm}/${dd}/${date.getFullYear()}`;
}

export const isCoarsePointer = () =>
  typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;

export const prefersReducedMotion = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Types `text` into `target` one character at a time.
 * Returns a promise; pass a `token` object and set token.cancelled = true to stop.
 */
export function typeText(target, text, { min = 28, max = 70, onChar, token, append: doAppend = true } = {}) {
  if (!doAppend) target.textContent = '';
  const fast = prefersReducedMotion();
  return new Promise((resolve) => {
    let i = 0;
    const step = () => {
      if (token?.cancelled) return resolve(false);
      if (i >= text.length) return resolve(true);
      const ch = text[i++];
      target.textContent += ch;
      onChar?.(ch);
      setTimeout(step, fast ? 8 : rand(min, max));
    };
    step();
  });
}

/** Detects whether a WebGL context can be created at all. */
export function hasWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}
