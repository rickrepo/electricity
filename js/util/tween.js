// Tiny tween system used for camera transitions. Targets are plain objects
// (or three.js Vector3s) whose numeric properties get interpolated.

export const Easing = {
  linear: (t) => t,
  quadOut: (t) => 1 - (1 - t) * (1 - t),
  cubicInOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  quintInOut: (t) => (t < 0.5 ? 16 * t ** 5 : 1 - Math.pow(-2 * t + 2, 5) / 2),
  expoOut: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  expoInOut: (t) =>
    t === 0 ? 0 : t === 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2,
  /** CSS-style cubic-bezier(x1, y1, x2, y2) easing. */
  bezier(x1, y1, x2, y2) {
    const A = (a1, a2) => 1 - 3 * a2 + 3 * a1;
    const B = (a1, a2) => 3 * a2 - 6 * a1;
    const C = (a1) => 3 * a1;
    const calc = (t, a1, a2) => ((A(a1, a2) * t + B(a1, a2)) * t + C(a1)) * t;
    const slope = (t, a1, a2) => 3 * A(a1, a2) * t * t + 2 * B(a1, a2) * t + C(a1);
    const solve = (x) => {
      let t = x;
      for (let i = 0; i < 6; i++) {
        const s = slope(t, x1, x2);
        if (Math.abs(s) < 1e-6) break;
        t -= (calc(t, x1, x2) - x) / s;
      }
      // bisection fallback for safety
      if (t < 0 || t > 1 || Math.abs(calc(t, x1, x2) - x) > 1e-4) {
        let lo = 0;
        let hi = 1;
        for (let i = 0; i < 24; i++) {
          t = (lo + hi) / 2;
          if (calc(t, x1, x2) < x) lo = t;
          else hi = t;
        }
      }
      return t;
    };
    return (x) => (x <= 0 ? 0 : x >= 1 ? 1 : calc(solve(x), y1, y2));
  },
};

const active = new Set();

class Tween {
  constructor(target, to, { duration = 1000, easing = Easing.cubicInOut, onUpdate, onComplete, delay = 0 }) {
    this.target = target;
    this.to = to;
    this.from = {};
    for (const key of Object.keys(to)) this.from[key] = target[key];
    this.duration = Math.max(1, duration);
    this.easing = easing;
    this.onUpdate = onUpdate;
    this.onComplete = onComplete;
    this.start = performance.now() + delay;
    this.done = false;
  }

  update(now) {
    if (this.done) return;
    const raw = (now - this.start) / this.duration;
    if (raw < 0) return;
    const t = Math.min(1, raw);
    const e = this.easing(t);
    for (const key of Object.keys(this.to)) {
      this.target[key] = this.from[key] + (this.to[key] - this.from[key]) * e;
    }
    this.onUpdate?.(e);
    if (t >= 1) {
      this.done = true;
      active.delete(this);
      this.onComplete?.();
    }
  }

  cancel() {
    this.done = true;
    active.delete(this);
  }
}

export function tween(target, to, options = {}) {
  const t = new Tween(target, to, options);
  active.add(t);
  return t;
}

export function updateTweens(now = performance.now()) {
  for (const t of [...active]) t.update(now);
}

export function cancelTweens(target) {
  for (const t of [...active]) if (!target || t.target === target) t.cancel();
}
