// All audio on this site is synthesized with the Web Audio API — no audio
// files. Startup chime, UI clicks, keyboard clacks, ambient room hum, and a
// small chiptune sequencer used by the music player and the room's radio.
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

  toggle() {
    if (this.playing) this.pause();
    else this.play();
  }

  stop() {
    this.pause();
    this.step = 0;
  }

  setVolume(v) {
    this.volume = Math.max(0, Math.min(1, v));
    store.set('music.volume', this.volume);
    if (this._out) this._out.gain.setTargetAtTime(this.volume, this.engine.ctx.currentTime, 0.02);
  }

  get progress() {
    return this._length ? this.step / this._length : 0;
  }

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
      if (track.wave === 'noise') {
        this._drum(token, time, track.gain);
        continue;
      }
      const freq = noteToFreq(token);
      if (!freq) continue;
      // count sustain markers to extend the note
      let hold = 1;
      while (steps[(index + hold) % steps.length] === '_' && hold < steps.length) hold++;
      const dur = this._stepDur * (hold - 1 + (track.len ?? 0.9));
      this.engine.tone({
        freq,
        type: track.wave || 'square',
        start: time,
        dur,
        gain: track.gain ?? 0.1,
        attack: 0.004,
        release: Math.min(0.12, dur * 0.4),
        dest: this._out,
      });
    }
  }

  _drum(kind, time, gain) {
    const e = this.engine;
    if (kind === 'K') {
      e.tone({ freq: 150, type: 'sine', start: time, dur: 0.18, gain: gain * 1.6, attack: 0.002, release: 0.12, slideTo: 42, dest: this._out });
    } else if (kind === 'S') {
      e.noise({ start: time, dur: 0.14, gain: gain * 0.9, filter: { type: 'bandpass', freq: 1800, q: 0.7 }, dest: this._out });
      e.tone({ freq: 190, type: 'triangle', start: time, dur: 0.08, gain: gain * 0.6, release: 0.06, dest: this._out });
    } else if (kind === 'H') {
      e.noise({ start: time, dur: 0.045, gain: gain * 0.45, filter: { type: 'highpass', freq: 6500, q: 0.8 }, dest: this._out });
    }
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
    this.sfx = null;
    this.music = null;
    this.muted = !!store.get('muted', false);
    this.uiSounds = store.get('ui.sounds', true) !== false;
    this._noiseBuffer = null;
    this._brownBuffer = null;
    this._ambient = null;
    this.chip = new ChipPlayer(this);
  }

  get ready() {
    return !!this.ctx;
  }

  /** Must be called from a user gesture before anything can play. */
  unlock() {
    if (!this.ctx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return false;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 1;
      const comp = this.ctx.createDynamicsCompressor();
      comp.threshold.value = -12;
      comp.ratio.value = 4;
      this.master.connect(comp);
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

  toggleMuted() {
    this.setMuted(!this.muted);
    return this.muted;
  }

  setUiSounds(on) {
    this.uiSounds = !!on;
    store.set('ui.sounds', this.uiSounds);
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
    const seconds = 2;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1;
      if (brown) {
        last = (last + 0.02 * white) / 1.02;
        data[i] = last * 3.5;
      } else data[i] = white;
    }
    this[key] = buffer;
    return buffer;
  }

  noise({ start, dur = 0.05, gain = 0.2, filter, attack = 0.002, dest, brown = false, loop = false }) {
    if (!this.ctx) return null;
    const ctx = this.ctx;
    const t0 = start ?? ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this._getNoise(brown);
    src.loop = loop;
    let node = src;
    let filterNode = null;
    if (filter) {
      filterNode = ctx.createBiquadFilter();
      filterNode.type = filter.type;
      filterNode.frequency.value = filter.freq;
      filterNode.Q.value = filter.q ?? 1;
      node.connect(filterNode);
      node = filterNode;
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

  /* ---------- presets ---------- */

  startup() {
    if (!this.unlock()) return;
    const t = this.ctx.currentTime + 0.05;
    const notes = [261.63, 392.0, 659.25, 1046.5]; // C4 G4 E5 C6
    notes.forEach((f, i) => {
      this.tone({ freq: f, type: 'sine', start: t + i * 0.14, dur: 1.6 - i * 0.15, gain: 0.16, attack: 0.02, release: 0.9 });
      this.tone({ freq: f * 2, type: 'triangle', start: t + i * 0.14, dur: 0.9, gain: 0.03, attack: 0.02, release: 0.5 });
    });
    [261.63, 329.63, 392.0].forEach((f) =>
      this.tone({ freq: f, type: 'sine', start: t + 0.4, dur: 2.4, gain: 0.05, attack: 0.5, release: 1.4 })
    );
  }

  powerDown() {
    if (!this.unlock()) return;
    const t = this.ctx.currentTime;
    this.tone({ freq: 660, type: 'triangle', start: t, dur: 0.9, gain: 0.12, attack: 0.01, release: 0.5, slideTo: 60 });
    this.noise({ start: t, dur: 0.6, gain: 0.05, filter: { type: 'lowpass', freq: 900 } });
  }

  click(up = false) {
    if (!this.ctx || !this.uiSounds) return;
    this.noise({ dur: up ? 0.02 : 0.03, gain: up ? 0.11 : 0.16, filter: { type: 'bandpass', freq: up ? 3200 : 2200, q: 1.2 } });
  }

  key() {
    if (!this.ctx || !this.uiSounds) return;
    this.noise({ dur: 0.035, gain: 0.12, filter: { type: 'bandpass', freq: 2600 + Math.random() * 1500, q: 1 } });
    this.tone({ freq: 900 + Math.random() * 500, type: 'square', dur: 0.02, gain: 0.015 });
  }

  tick() {
    if (!this.ctx || !this.uiSounds) return;
    this.tone({ freq: 1400, type: 'square', dur: 0.03, gain: 0.03 });
  }

  beep() {
    if (!this.ctx || !this.uiSounds) return;
    this.tone({ freq: 880, type: 'square', dur: 0.09, gain: 0.05 });
  }

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

  open() {
    if (!this.ctx || !this.uiSounds) return;
    this.tone({ freq: 520, type: 'triangle', dur: 0.09, gain: 0.05, slideTo: 780 });
  }

  close() {
    if (!this.ctx || !this.uiSounds) return;
    this.tone({ freq: 700, type: 'triangle', dur: 0.09, gain: 0.05, slideTo: 380 });
  }

  boom() {
    if (!this.ctx || !this.uiSounds) return;
    this.noise({ dur: 0.5, gain: 0.3, filter: { type: 'lowpass', freq: 500 } });
    this.tone({ freq: 90, type: 'sine', dur: 0.5, gain: 0.25, slideTo: 30 });
  }

  /* ---------- ambience (3D room) ---------- */

  ambientStart() {
    if (!this.unlock() || this._ambient) return;
    const ctx = this.ctx;
    const bed = this.noise({ gain: 0.045, brown: true, loop: true, filter: { type: 'lowpass', freq: 320, q: 0.5 }, attack: 2, dest: this.master });
    const hum = ctx.createOscillator();
    hum.type = 'sine';
    hum.frequency.value = 60;
    const hum2 = ctx.createOscillator();
    hum2.type = 'triangle';
    hum2.frequency.value = 120;
    const humGain = ctx.createGain();
    humGain.gain.setValueAtTime(0.0001, ctx.currentTime);
    humGain.gain.exponentialRampToValueAtTime(0.012, ctx.currentTime + 2);
    hum.connect(humGain);
    hum2.connect(humGain);
    humGain.connect(this.master);
    hum.start();
    hum2.start();
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.08;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.012;
    lfo.connect(lfoGain);
    lfoGain.connect(bed.gain.gain);
    lfo.start();
    this._ambient = { bed, hum, hum2, humGain, lfo };
  }

  ambientStop() {
    if (!this._ambient) return;
    const { bed, hum, hum2, lfo } = this._ambient;
    const t = this.ctx.currentTime;
    bed.gain.gain.setTargetAtTime(0.0001, t, 0.3);
    setTimeout(() => {
      try {
        bed.src.stop();
        hum.stop();
        hum2.stop();
        lfo.stop();
      } catch {
        /* already stopped */
      }
    }, 1200);
    this._ambient = null;
  }

  /** 0 = far from the computer, 1 = nose against the screen. */
  setAmbientFocus(t) {
    if (!this._ambient) return;
    const k = Math.max(0, Math.min(1, t));
    const now = this.ctx.currentTime;
    this._ambient.bed.filter.frequency.setTargetAtTime(260 + k * 900, now, 0.2);
    this._ambient.bed.gain.gain.setTargetAtTime(0.04 + k * 0.05, now, 0.2);
    this._ambient.humGain.gain.setTargetAtTime(0.008 + k * 0.018, now, 0.2);
  }
}

export const sound = new SoundEngine();
