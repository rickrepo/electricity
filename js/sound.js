// All audio on this site is synthesized with the Web Audio API. No samples.
// UI clicks, the startup chime, rain, the fan in the RK-1, the fluorescent
// tube, thunder, a cat, a signal generator for the scope, and a small
// chiptune sequencer for the Jukebox.
import { store } from './util/storage.js';
import { Emitter } from './util/events.js';
import { trackSteps, songLength } from './songs.js';

const NOTE_INDEX = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };

export function noteToFreq(name) {
  const m = /^([A-G][#b]?)(-?\d)$/.exec(name);
  if (!m) return null;
  const midi = NOTE_INDEX[m[1]] + (parseInt(m[2], 10) + 1) * 12;
  return 440 * Math.pow(2, (midi - 69) / 12);
}

class ChipPlayer extends Emitter {
  constructor(engine) {
    super();
    this.engine = engine;
    this.song = null;
    this.playing = false;
    this.step = 0;
    this.volume = store.get('music.volume', 0.6);
    this._timer = null;
    this._nextTime = 0;
    this._stepDur = 0.125;
    this._steps = [];
    this._length = 0;
    this._out = null;
    this.analyser = null;
  }

  _ensureGraph() {
    const ctx = this.engine.ctx;
    if (this._out) return;
    this._out = ctx.createGain();
    this._out.gain.value = this.volume;
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 128;
    this.analyser.smoothingTimeConstant = 0.75;
    this._out.connect(this.analyser);
    this.analyser.connect(this.engine.music);
  }

  load(song) {
    this.stop();
    this.song = song;
    this._steps = song.tracks.map((t) => ({ track: t, steps: trackSteps(t) }));
    this._length = songLength(song);
    this._stepDur = 60 / song.bpm / song.stepsPerBeat;
    this.step = 0;
    this.emit('change');
  }

  play(song) {
    if (song && song !== this.song) this.load(song);
    if (!this.song || this.playing) return;
    this.engine.unlock();
    this._ensureGraph();
    this.playing = true;
    this._nextTime = this.engine.ctx.currentTime + 0.06;
    this._timer = setInterval(() => this._tick(), 25);
    this.emit('change');
  }

  pause() {
    if (!this.playing) return;
    this.playing = false;
    clearInterval(this._timer);
    this._timer = null;
    this.emit('change');
  }

  toggle() { if (this.playing) this.pause(); else this.play(); }
  stop() { this.pause(); this.step = 0; }

  setVolume(v) {
    this.volume = Math.max(0, Math.min(1, v));
    store.set('music.volume', this.volume);
    if (this._out) this._out.gain.setTargetAtTime(this.volume, this.engine.ctx.currentTime, 0.02);
  }

  get progress() { return this._length ? this.step / this._length : 0; }

  _tick() {
    const ctx = this.engine.ctx;
    while (this._nextTime < ctx.currentTime + 0.14) {
      this._scheduleStep(this.step, this._nextTime);
      this._nextTime += this._stepDur;
      this.step = (this.step + 1) % this._length;
      if (this.step === 0) this.emit('loop');
    }
  }

  _scheduleStep(index, time) {
    for (const { track, steps } of this._steps) {
      const token = steps[index % steps.length];
      if (!token || token === '.' || token === '_') continue;
      if (track.wave === 'noise') { this._drum(token, time, track.gain); continue; }
      const freq = noteToFreq(token);
      if (!freq) continue;
      let hold = 1;
      while (steps[(index + hold) % steps.length] === '_' && hold < steps.length) hold++;
      const dur = this._stepDur * (hold - 1 + (track.len ?? 0.9));
      this.engine.tone({ freq, type: track.wave || 'square', start: time, dur, gain: track.gain ?? 0.1, attack: 0.004, release: Math.min(0.12, dur * 0.4), dest: this._out });
    }
  }

  _drum(kind, time, gain) {
    const e = this.engine;
    if (kind === 'K') e.tone({ freq: 150, type: 'sine', start: time, dur: 0.18, gain: gain * 1.6, attack: 0.002, release: 0.12, slideTo: 42, dest: this._out });
    else if (kind === 'S') {
      e.noise({ start: time, dur: 0.14, gain: gain * 0.9, filter: { type: 'bandpass', freq: 1800, q: 0.7 }, dest: this._out });
      e.tone({ freq: 190, type: 'triangle', start: time, dur: 0.08, gain: gain * 0.6, release: 0.06, dest: this._out });
    } else if (kind === 'H') e.noise({ start: time, dur: 0.045, gain: gain * 0.45, filter: { type: 'highpass', freq: 6500, q: 0.8 }, dest: this._out });
  }

  levels(count = 24) {
    if (!this.analyser) return new Array(count).fill(0);
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(data);
    const out = [];
    const per = Math.max(1, Math.floor(data.length / count));
    for (let i = 0; i < count; i++) {
      let sum = 0;
      for (let j = 0; j < per; j++) sum += data[i * per + j] || 0;
      out.push(sum / per / 255);
    }
    return out;
  }
}

class SoundEngine extends Emitter {
  constructor() {
    super();
    this.ctx = null;
    this.master = null;
    this.analyser = null;
    this.sfx = null;
    this.music = null;
    this.muted = !!store.get('muted', false);
    this.uiSounds = store.get('ui.sounds', true) !== false;
    this.sigActive = false;
    this._noiseBuffer = null;
    this._brownBuffer = null;
    this._timeBuf = null;
    this._freqBuf = null;
    this._sig = null;
    this._fan = null;
    this._rain = null;
    this._buzz = null;
    this.chip = new ChipPlayer(this);
  }

  get ready() { return !!this.ctx; }

  /** Must be called from a user gesture before anything can play. */
  unlock() {
    if (!this.ctx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return false;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 1;
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.6;
      const comp = this.ctx.createDynamicsCompressor();
      comp.threshold.value = -12;
      comp.ratio.value = 4;
      this.master.connect(this.analyser);
      this.analyser.connect(comp);
      comp.connect(this.ctx.destination);
      this.sfx = this.ctx.createGain();
      this.sfx.gain.value = 0.9;
      this.sfx.connect(this.master);
      this.music = this.ctx.createGain();
      this.music.gain.value = 0.9;
      this.music.connect(this.master);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    return true;
  }

  setMuted(muted) {
    this.muted = !!muted;
    store.set('muted', this.muted);
    if (this.master) this.master.gain.setTargetAtTime(this.muted ? 0 : 1, this.ctx.currentTime, 0.03);
    this.emit('mute', this.muted);
  }
  toggleMuted() { this.setMuted(!this.muted); return this.muted; }
  setUiSounds(on) { this.uiSounds = !!on; store.set('ui.sounds', this.uiSounds); }

  /* ---------- analysis (scope) ---------- */
  waveform(n = 256) {
    const out = new Float32Array(n);
    if (!this.analyser) return out;
    if (!this._timeBuf) this._timeBuf = new Float32Array(this.analyser.fftSize);
    this.analyser.getFloatTimeDomainData(this._timeBuf);
    const step = this._timeBuf.length / n;
    for (let i = 0; i < n; i++) out[i] = this._timeBuf[Math.floor(i * step)];
    return out;
  }
  spectrum(n = 64) {
    const out = new Array(n).fill(0);
    if (!this.analyser) return out;
    if (!this._freqBuf) this._freqBuf = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(this._freqBuf);
    const usable = Math.floor(this._freqBuf.length / 4);
    const per = Math.max(1, Math.floor(usable / n));
    for (let i = 0; i < n; i++) {
      let sum = 0;
      for (let j = 0; j < per; j++) sum += this._freqBuf[i * per + j] || 0;
      out[i] = sum / per / 255;
    }
    return out;
  }

  /* ---------- primitives ---------- */
  tone({ freq, type = 'sine', start, dur = 0.2, gain = 0.2, attack = 0.005, release = 0.05, detune = 0, slideTo, dest }) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const t0 = start ?? ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    if (detune) osc.detune.value = detune;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), t0 + attack);
    g.gain.setValueAtTime(Math.max(0.0002, gain), t0 + Math.max(attack, dur - release));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + 0.01);
    osc.connect(g);
    g.connect(dest || this.sfx);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  _getNoise(brown = false) {
    const ctx = this.ctx;
    const key = brown ? '_brownBuffer' : '_noiseBuffer';
    if (this[key]) return this[key];
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1;
      if (brown) { last = (last + 0.02 * white) / 1.02; data[i] = last * 3.5; }
      else data[i] = white;
    }
    this[key] = buffer;
    return buffer;
  }

  noise({ start, dur = 0.05, gain = 0.2, filter, filter2, attack = 0.002, dest, brown = false, loop = false }) {
    if (!this.ctx) return null;
    const ctx = this.ctx;
    const t0 = start ?? ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this._getNoise(brown);
    src.loop = loop;
    let node = src;
    let filterNode = null;
    for (const f of [filter, filter2]) {
      if (!f) continue;
      const fn = ctx.createBiquadFilter();
      fn.type = f.type;
      fn.frequency.value = f.freq;
      fn.Q.value = f.q ?? 1;
      node.connect(fn);
      node = fn;
      if (!filterNode) filterNode = fn;
    }
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), t0 + attack);
    if (!loop) g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    node.connect(g);
    g.connect(dest || this.sfx);
    src.start(t0);
    if (!loop) src.stop(t0 + dur + 0.02);
    return { src, gain: g, filter: filterNode };
  }

  /* ---------- UI + system sounds ---------- */
  startup() {
    if (!this.unlock()) return;
    const t = this.ctx.currentTime + 0.05;
    [261.63, 392.0, 659.25, 1046.5].forEach((f, i) => {
      this.tone({ freq: f, type: 'sine', start: t + i * 0.14, dur: 1.6 - i * 0.15, gain: 0.16, attack: 0.02, release: 0.9 });
      this.tone({ freq: f * 2, type: 'triangle', start: t + i * 0.14, dur: 0.9, gain: 0.03, attack: 0.02, release: 0.5 });
    });
    [261.63, 329.63, 392.0].forEach((f) => this.tone({ freq: f, type: 'sine', start: t + 0.4, dur: 2.4, gain: 0.05, attack: 0.5, release: 1.4 }));
  }
  chime() { if (this.ctx) this.tone({ freq: 1180, type: 'square', dur: 0.07, gain: 0.04 }); }
  powerDown() {
    if (!this.unlock()) return;
    const t = this.ctx.currentTime;
    this.tone({ freq: 660, type: 'triangle', start: t, dur: 0.9, gain: 0.12, attack: 0.01, release: 0.5, slideTo: 60 });
    this.noise({ start: t, dur: 0.6, gain: 0.05, filter: { type: 'lowpass', freq: 900 } });
  }
  click(up = false) { if (this.ctx && this.uiSounds) this.noise({ dur: up ? 0.02 : 0.03, gain: up ? 0.11 : 0.16, filter: { type: 'bandpass', freq: up ? 3200 : 2200, q: 1.2 } }); }
  key() {
    if (!this.ctx || !this.uiSounds) return;
    this.noise({ dur: 0.035, gain: 0.12, filter: { type: 'bandpass', freq: 2600 + Math.random() * 1500, q: 1 } });
    this.tone({ freq: 900 + Math.random() * 500, type: 'square', dur: 0.02, gain: 0.015 });
  }
  tick() { if (this.ctx && this.uiSounds) this.tone({ freq: 1400, type: 'square', dur: 0.03, gain: 0.03 }); }
  beep() { if (this.ctx && this.uiSounds) this.tone({ freq: 880, type: 'square', dur: 0.09, gain: 0.05 }); }
  error() {
    if (!this.ctx || !this.uiSounds) return;
    const t = this.ctx.currentTime;
    this.tone({ freq: 440, type: 'square', start: t, dur: 0.12, gain: 0.05 });
    this.tone({ freq: 300, type: 'square', start: t + 0.13, dur: 0.18, gain: 0.05 });
  }
  success() {
    if (!this.ctx || !this.uiSounds) return;
    const t = this.ctx.currentTime;
    [523.25, 659.25, 783.99].forEach((f, i) => this.tone({ freq: f, type: 'square', start: t + i * 0.07, dur: 0.14, gain: 0.04 }));
  }
  open() { if (this.ctx && this.uiSounds) this.tone({ freq: 520, type: 'triangle', dur: 0.09, gain: 0.05, slideTo: 780 }); }
  close() { if (this.ctx && this.uiSounds) this.tone({ freq: 700, type: 'triangle', dur: 0.09, gain: 0.05, slideTo: 380 }); }
  boom() {
    if (!this.ctx || !this.uiSounds) return;
    this.noise({ dur: 0.5, gain: 0.3, filter: { type: 'lowpass', freq: 500 } });
    this.tone({ freq: 90, type: 'sine', dur: 0.5, gain: 0.25, slideTo: 30 });
  }
  clunk() {
    if (!this.unlock()) return;
    this.noise({ dur: 0.03, gain: 0.3, filter: { type: 'bandpass', freq: 900, q: 1.5 } });
    this.tone({ freq: 70, type: 'sine', dur: 0.09, gain: 0.18, release: 0.06 });
  }
  sizzle() {
    if (!this.unlock()) return;
    const t = this.ctx.currentTime;
    this.noise({ start: t, dur: 0.32, gain: 0.14, filter: { type: 'highpass', freq: 2400 } });
    for (let i = 0; i < 4; i++) this.noise({ start: t + 0.05 + Math.random() * 0.25, dur: 0.015, gain: 0.12, filter: { type: 'bandpass', freq: 5000 + Math.random() * 3000, q: 2 } });
  }
  buzz() {
    if (!this.unlock()) return;
    const t = this.ctx.currentTime;
    for (let i = 0; i < 2; i++) {
      this.tone({ freq: 140, type: 'square', start: t + i * 0.28, dur: 0.18, gain: 0.05, attack: 0.01, release: 0.05, dest: this.master });
      this.noise({ start: t + i * 0.28, dur: 0.18, gain: 0.04, filter: { type: 'bandpass', freq: 300, q: 2 }, dest: this.master });
    }
  }
  zap() { if (this.ctx) this.tone({ freq: 300, type: 'square', dur: 0.08, gain: 0.05, slideTo: 1500 }); }
  meow() {
    if (!this.unlock()) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(520, t);
    osc.frequency.exponentialRampToValueAtTime(880, t + 0.18);
    osc.frequency.exponentialRampToValueAtTime(430, t + 0.5);
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 1500;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.07, t + 0.05);
    g.gain.setValueAtTime(0.07, t + 0.3);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
    osc.connect(f);
    f.connect(g);
    g.connect(this.sfx);
    osc.start(t);
    osc.stop(t + 0.6);
  }
  flickerBurst() {
    if (!this.ctx) return;
    this.noise({ dur: 0.05, gain: 0.05, filter: { type: 'bandpass', freq: 1800, q: 3 } });
    this.tone({ freq: 120, type: 'sawtooth', dur: 0.06, gain: 0.012 });
  }
  tubeBuzz(on) {
    if (!this.ctx) return;
    if (on && !this._buzz) {
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = 120;
      const f = this.ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = 420;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.0001, this.ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0045, this.ctx.currentTime + 0.4);
      osc.connect(f);
      f.connect(g);
      g.connect(this.master);
      osc.start();
      this._buzz = { osc, g };
    } else if (!on && this._buzz) {
      const { osc, g } = this._buzz;
      g.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.1);
      setTimeout(() => { try { osc.stop(); } catch { /* ignore */ } }, 500);
      this._buzz = null;
    }
  }

  /* ---------- bench ambience ---------- */
  fanStart() {
    if (!this.unlock() || this._fan) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const bed = this.noise({ gain: 0.0001, brown: true, loop: true, filter: { type: 'lowpass', freq: 700, q: 0.6 }, attack: 0.01, dest: this.master });
    bed.gain.gain.exponentialRampToValueAtTime(0.03, t + 2.2);
    const hum = ctx.createOscillator();
    hum.type = 'sine';
    hum.frequency.setValueAtTime(40, t);
    hum.frequency.exponentialRampToValueAtTime(165, t + 2.2);
    const hg = ctx.createGain();
    hg.gain.setValueAtTime(0.0001, t);
    hg.gain.exponentialRampToValueAtTime(0.006, t + 2);
    hum.connect(hg);
    hg.connect(this.master);
    hum.start();
    this._fan = { bed, hum, hg };
  }
  fanStop() {
    if (!this._fan) return;
    const { bed, hum, hg } = this._fan;
    const t = this.ctx.currentTime;
    bed.gain.gain.setTargetAtTime(0.0001, t, 0.6);
    hum.frequency.setTargetAtTime(30, t, 0.8);
    hg.gain.setTargetAtTime(0.0001, t, 0.5);
    setTimeout(() => { try { bed.src.stop(); hum.stop(); } catch { /* ignore */ } }, 2500);
    this._fan = null;
  }
  rainStart() {
    if (!this.unlock() || this._rain) return;
    const ctx = this.ctx;
    const bed = this.noise({ gain: 0.0001, loop: true, filter: { type: 'highpass', freq: 500 }, filter2: { type: 'lowpass', freq: 3800 }, attack: 0.01, dest: this.master });
    bed.gain.gain.exponentialRampToValueAtTime(0.03, ctx.currentTime + 3);
    const drops = setInterval(() => {
      if (Math.random() < 0.75) {
        const n = 1 + Math.floor(Math.random() * 2);
        for (let i = 0; i < n; i++) this.noise({ start: ctx.currentTime + Math.random() * 0.14, dur: 0.012, gain: 0.015 + Math.random() * 0.03, filter: { type: 'bandpass', freq: 3000 + Math.random() * 4000, q: 3 }, dest: this.master });
      }
    }, 140);
    this._rain = { bed, drops };
  }
  rainStop() {
    if (!this._rain) return;
    clearInterval(this._rain.drops);
    this._rain.bed.gain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.5);
    const src = this._rain.bed.src;
    setTimeout(() => { try { src.stop(); } catch { /* ignore */ } }, 2000);
    this._rain = null;
  }
  thunder(delay = 1.5) {
    if (!this.ctx) return;
    setTimeout(() => {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      this.noise({ start: t, dur: 0.18, gain: 0.22, filter: { type: 'lowpass', freq: 900 }, dest: this.master });
      const rumble = this.noise({ start: t + 0.1, dur: 3.2, gain: 0.32, brown: true, filter: { type: 'lowpass', freq: 160 }, attack: 0.15, dest: this.master });
      if (rumble) rumble.gain.gain.exponentialRampToValueAtTime(0.0001, t + 3.2);
      this.tone({ freq: 46, type: 'sine', start: t + 0.1, dur: 2.4, gain: 0.12, attack: 0.1, release: 1.6, dest: this.master });
    }, delay * 1000);
  }
  /** 0 = far from the computer, 1 = nose against the screen. */
  setAmbientFocus(t) {
    if (!this.ctx) return;
    const k = Math.max(0, Math.min(1, t));
    const now = this.ctx.currentTime;
    if (this._fan) this._fan.bed.gain.gain.setTargetAtTime(0.022 + k * 0.03, now, 0.25);
    if (this._rain) this._rain.bed.filter.frequency.setTargetAtTime(500 + k * 600, now, 0.3);
  }

  /* ---------- signal generator (Scope app) ---------- */
  sigStart({ type = 'sine', freq = 220, level = 0.15 } = {}) {
    if (!this.unlock()) return;
    const ctx = this.ctx;
    if (!this._sig) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      g.gain.value = 0.0001;
      osc.connect(g);
      g.connect(this.sfx);
      osc.start();
      this._sig = { osc, g };
    }
    this._sig.osc.type = type;
    this._sig.osc.frequency.setTargetAtTime(freq, ctx.currentTime, 0.02);
    this._sig.g.gain.setTargetAtTime(Math.max(0.0001, level * 0.5), ctx.currentTime, 0.03);
    this.sigActive = true;
  }
  sigSet({ type, freq, level } = {}) {
    if (!this._sig) return;
    if (type) this._sig.osc.type = type;
    if (freq) this._sig.osc.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.02);
    if (level !== undefined) this._sig.g.gain.setTargetAtTime(Math.max(0.0001, level * 0.5), this.ctx.currentTime, 0.03);
  }
  sigStop() {
    if (!this._sig) return;
    const { osc, g } = this._sig;
    g.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.03);
    setTimeout(() => { try { osc.stop(); } catch { /* ignore */ } }, 300);
    this._sig = null;
    this.sigActive = false;
  }
}

export const sound = new SoundEngine();
