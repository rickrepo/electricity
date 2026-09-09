// Scope: an oscilloscope on whatever the RK-1 is playing, plus a signal
// generator so there is always something to look at.
import { el } from '../../util/dom.js';
import { sound } from '../../sound.js';

const WAVES = ['sine', 'square', 'triangle', 'sawtooth'];

export default {
  id: 'scope',
  name: 'Scope',
  icon: 'scope',
  desktop: true,
  startMenu: true,
  launch(os) {
    const { width: W, height: H } = os.wm.bounds;
    return os.wm.open({
      id: 'scope', title: 'Scope', icon: 'scope',
      width: Math.min(520, W - 140), height: Math.min(470, H - 100), minWidth: 340, minHeight: 360,
      bodyClass: 'no-scroll',
      render: (body, win) => mountScope(os, body, win),
    });
  },
};

function mountScope(os, body, win) {
  const canvas = el('canvas', { width: 480, height: 220, 'aria-label': 'Oscilloscope screen' });
  const ctx = canvas.getContext('2d');
  let mode = 'wave';
  let gain = 1;
  let span = 512;
  let sig = { on: false, type: 'sine', freq: 220, level: 0.15 };

  const modeBtns = {};
  const modeRow = el('div', { class: 'scope-btns' });
  for (const [m, label] of [['wave', 'Wave'], ['spectrum', 'Spectrum'], ['xy', 'X-Y']]) {
    modeBtns[m] = el('button', { class: `os-btn sm dark${m === mode ? ' pressed' : ''}`, type: 'button' }, label);
    modeBtns[m].addEventListener('click', () => { mode = m; for (const [k, b] of Object.entries(modeBtns)) b.classList.toggle('pressed', k === m); sound.tick(); });
    modeRow.append(modeBtns[m]);
  }
  const ctl = (label, input, valueEl) => el('div', { class: 'scope-ctl' }, el('label', {}, label, valueEl), input);
  const gainVal = el('span', { class: 'val' }, '1.0x');
  const gainIn = el('input', { class: 'os-range', type: 'range', min: 1, max: 40, value: 10, 'aria-label': 'Vertical gain' });
  gainIn.addEventListener('input', () => { gain = gainIn.value / 10; gainVal.textContent = `${gain.toFixed(1)}x`; });
  const spanVal = el('span', { class: 'val' }, '512 smp');
  const spanIn = el('input', { class: 'os-range', type: 'range', min: 128, max: 2048, step: 128, value: 512, 'aria-label': 'Time base' });
  spanIn.addEventListener('input', () => { span = Number(spanIn.value); spanVal.textContent = `${span} smp`; });

  const waveBtns = {};
  const waveRow = el('div', { class: 'scope-btns' });
  const applySig = () => {
    if (sig.on) sound.sigStart({ type: sig.type, freq: sig.freq, level: sig.level });
    else sound.sigStop();
    for (const [k, b] of Object.entries(waveBtns)) b.classList.toggle('pressed', sig.on && k === sig.type);
    offBtn.classList.toggle('pressed', !sig.on);
  };
  for (const w of WAVES) {
    waveBtns[w] = el('button', { class: 'os-btn sm dark', type: 'button' }, w);
    waveBtns[w].addEventListener('click', () => { sound.unlock(); sig.on = true; sig.type = w; applySig(); sound.tick(); });
    waveRow.append(waveBtns[w]);
  }
  const offBtn = el('button', { class: 'os-btn sm dark pressed', type: 'button' }, 'off');
  offBtn.addEventListener('click', () => { sig.on = false; applySig(); sound.tick(); });
  waveRow.append(offBtn);
  const freqVal = el('span', { class: 'val' }, '220 Hz');
  const freqIn = el('input', { class: 'os-range', type: 'range', min: 0, max: 100, value: 38, 'aria-label': 'Generator frequency' });
  const toFreq = (v) => Math.round(40 * Math.pow(50, v / 100));
  freqIn.addEventListener('input', () => { sig.freq = toFreq(Number(freqIn.value)); freqVal.textContent = `${sig.freq} Hz`; if (sig.on) sound.sigSet({ freq: sig.freq }); });
  const levelVal = el('span', { class: 'val' }, '15%');
  const levelIn = el('input', { class: 'os-range', type: 'range', min: 0, max: 60, value: 15, 'aria-label': 'Generator level' });
  levelIn.addEventListener('input', () => { sig.level = levelIn.value / 100; levelVal.textContent = `${levelIn.value}%`; if (sig.on) sound.sigSet({ level: sig.level }); });

  body.append(el('div', { class: 'scope' },
    el('div', { class: 'scope-screen' }, canvas),
    el('div', { class: 'scope-panel' },
      ctl('Mode', modeRow, el('span')),
      ctl('Volts / div', gainIn, gainVal),
      ctl('Time base', spanIn, spanVal),
      ctl('Signal generator', waveRow, el('span')),
      ctl('Frequency', freqIn, freqVal),
      ctl('Level', levelIn, levelVal)
    ),
    el('div', { class: 'scope-foot' }, 'Probe: RK-1 audio out. Put a record on in the Jukebox, or switch the generator on.')
  ));

  let raf = null;
  const draw = () => {
    raf = requestAnimationFrame(draw);
    const w = canvas.width;
    const h = canvas.height;
    ctx.fillStyle = '#08150d';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(157,255,157,0.14)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= w; x += w / 10) { ctx.beginPath(); ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, h); ctx.stroke(); }
    for (let y = 0; y <= h; y += h / 8) { ctx.beginPath(); ctx.moveTo(0, y + 0.5); ctx.lineTo(w, y + 0.5); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(157,255,157,0.3)';
    ctx.beginPath(); ctx.moveTo(0, h / 2 + 0.5); ctx.lineTo(w, h / 2 + 0.5); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(w / 2 + 0.5, 0); ctx.lineTo(w / 2 + 0.5, h); ctx.stroke();
    const ready = sound.ready;
    ctx.shadowColor = 'rgba(157,255,157,0.8)';
    ctx.shadowBlur = 6;
    ctx.strokeStyle = '#9dff9d';
    ctx.lineWidth = 2;
    if (mode === 'spectrum') {
      const bins = ready ? sound.spectrum(64) : new Array(64).fill(0);
      const bw = w / bins.length;
      ctx.fillStyle = '#9dff9d';
      bins.forEach((v, i) => ctx.fillRect(i * bw + 1, h - v * gain * (h - 6) - 2, bw - 2, v * gain * (h - 6) + 2));
    } else if (mode === 'xy') {
      const data = ready ? sound.waveform(span) : new Float32Array(span);
      ctx.beginPath();
      const lag = Math.floor(span / 8);
      for (let i = lag; i < data.length; i++) {
        const x = w / 2 + data[i] * gain * (w / 2.4);
        const y = h / 2 - data[i - lag] * gain * (h / 2.4);
        if (i === lag) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    } else {
      const data = ready ? sound.waveform(span) : new Float32Array(span);
      ctx.beginPath();
      for (let i = 0; i < data.length; i++) {
        const x = (i / (data.length - 1)) * w;
        const y = h / 2 - data[i] * gain * (h / 2.4);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(157,255,157,0.7)';
    ctx.font = "13px 'VT323', monospace";
    ctx.fillText(`${mode.toUpperCase()}  ${gain.toFixed(1)}V/div  ${span}smp${sig.on ? `  GEN ${sig.type} ${sig.freq}Hz` : ''}`, 8, 16);
    if (!ready) ctx.fillText('NO SIGNAL - click something to wake the audio', 8, h - 10);
  };
  draw();
  win.onCleanup(() => { cancelAnimationFrame(raf); sound.sigStop(); });
}
