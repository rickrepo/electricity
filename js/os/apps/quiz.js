// Bench Quiz: resistor colour codes and Ohm's law, ten questions a round.
import { el, clear, pick } from '../../util/dom.js';
import { store } from '../../util/storage.js';
import { sound } from '../../sound.js';

const BANDS = [['black', '#1c1a17'], ['brown', '#6b3e1e'], ['red', '#d1262b'], ['orange', '#ff7a1a'], ['yellow', '#f2d13d'], ['green', '#2f8f4a'], ['blue', '#1d4fd8'], ['violet', '#7a4bd6'], ['grey', '#8a8578'], ['white', '#f3eee4']];
const fmtOhm = (v) => (v >= 1e6 ? `${+(v / 1e6).toFixed(2)} MΩ` : v >= 1e3 ? `${+(v / 1e3).toFixed(2)} kΩ` : `${+v.toFixed(2)} Ω`);
const fmtA = (a) => (a < 0.001 ? `${+(a * 1e6).toFixed(1)} µA` : a < 1 ? `${+(a * 1000).toFixed(1)} mA` : `${+a.toFixed(2)} A`);
const shuffle = (arr) => arr.map((v) => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);

function resistorSvg(d1, d2, m, tol) {
  const colors = [BANDS[d1][1], BANDS[d2][1], BANDS[m][1], tol === 5 ? '#c9a04a' : '#b9b9b9'];
  const bands = colors.map((c, i) => `<rect x="${64 + i * 26 + (i === 3 ? 22 : 0)}" y="26" width="12" height="48" fill="${c}"/>`).join('');
  return `<svg viewBox="0 0 260 100" aria-hidden="true"><rect x="0" y="46" width="50" height="8" fill="#8f98a3"/><rect x="210" y="46" width="50" height="8" fill="#8f98a3"/><rect x="48" y="24" width="164" height="52" rx="22" fill="#d9c9a5"/>${bands}</svg>`;
}

function resistorQuestion() {
  const d1 = 1 + Math.floor(Math.random() * 9);
  const d2 = Math.floor(Math.random() * 10);
  const m = Math.floor(Math.random() * 6);
  const tol = Math.random() < 0.6 ? 5 : 10;
  const value = (d1 * 10 + d2) * Math.pow(10, m);
  const wrong = new Set();
  while (wrong.size < 3) {
    const alt = Math.random() < 0.5 ? value * (Math.random() < 0.5 ? 10 : 0.1) : ((d2 * 10 + d1) || 12) * Math.pow(10, m);
    if (alt !== value) wrong.add(alt);
  }
  return {
    text: `What is the value of this resistor?`,
    figure: resistorSvg(d1, d2, m, tol),
    answer: `${fmtOhm(value)} ±${tol}%`,
    options: shuffle([`${fmtOhm(value)} ±${tol}%`, ...[...wrong].map((w) => `${fmtOhm(w)} ±${tol}%`)]),
    explain: `${BANDS[d1][0]} ${BANDS[d2][0]} = ${d1}${d2}, ${BANDS[m][0]} = x10^${m}, ${tol === 5 ? 'gold' : 'silver'} = ±${tol}%.`,
  };
}

function ohmQuestion() {
  const V = pick([3, 3.3, 5, 9, 12, 24]);
  const R = pick([10, 47, 100, 220, 330, 470, 1000, 2200, 4700, 10000]);
  const I = V / R;
  const P = V * I;
  const kind = pick(['I', 'V', 'R', 'P']);
  const mk = (ans, alts, text, explain) => ({ text, answer: ans, options: shuffle([ans, ...alts]), explain });
  if (kind === 'I') return mk(fmtA(I), [fmtA(I * 10), fmtA(I / 10), fmtA(I * 2)], `${V} V across ${fmtOhm(R)}. How much current flows?`, `I = V / R = ${V} / ${R} = ${fmtA(I)}.`);
  if (kind === 'V') return mk(`${+V.toFixed(2)} V`, [`${+(V * 2).toFixed(2)} V`, `${+(V / 2).toFixed(2)} V`, `${+(V * 10).toFixed(1)} V`], `${fmtA(I)} through ${fmtOhm(R)}. What is the voltage across it?`, `V = I x R = ${fmtA(I)} x ${fmtOhm(R)} = ${+V.toFixed(2)} V.`);
  if (kind === 'R') return mk(fmtOhm(R), [fmtOhm(R * 10), fmtOhm(R / 10), fmtOhm(R * 2)], `${V} V pushes ${fmtA(I)} through a resistor. What is its value?`, `R = V / I = ${V} / ${fmtA(I)} = ${fmtOhm(R)}.`);
  const fmtP = (p) => (p < 1 ? `${+(p * 1000).toFixed(1)} mW` : `${+p.toFixed(2)} W`);
  return mk(fmtP(P), [fmtP(P * 10), fmtP(P / 10), fmtP(P * 2)], `${V} V and ${fmtA(I)}. How much power is dissipated?`, `P = V x I = ${V} x ${fmtA(I)} = ${fmtP(P)}.`);
}

export default {
  id: 'quiz',
  name: 'Bench Quiz',
  icon: 'quiz',
  desktop: true,
  startMenu: true,
  launch(os) {
    const { width: W, height: H } = os.wm.bounds;
    return os.wm.open({
      id: 'quiz', title: 'Bench Quiz', icon: 'quiz',
      width: Math.min(560, W - 120), height: Math.min(560, H - 80), minWidth: 340, minHeight: 380,
      bodyClass: 'no-scroll',
      render: (body) => mountQuiz(os, body),
    });
  },
};

function mountQuiz(os, body) {
  const head = el('div', { class: 'qz-head' });
  const main = el('div', { class: 'qz-body' });
  body.append(el('div', { class: 'qz' }, head, main));
  let mode = 'mixed';
  let index = 0;
  let score = 0;
  let question = null;
  const TOTAL = 10;
  const best = () => store.get(`quiz.best.${mode}`, 0) || 0;

  const renderHead = (extra = '') => {
    head.replaceChildren(el('span', {}, `Q <b>${Math.min(index + 1, TOTAL)}</b> / ${TOTAL}`), el('span', {}, `Score <b>${score}</b>`), el('span', {}, extra || `Best ${best()}`));
  };

  const menu = () => {
    index = 0;
    score = 0;
    clear(main);
    const modes = el('div', { class: 'qz-modes' });
    for (const [id, label] of [['mixed', 'Mixed'], ['resistor', 'Resistor codes'], ['ohm', "Ohm's law"]]) {
      const b = el('button', { class: 'os-btn', type: 'button' }, label);
      b.addEventListener('click', () => { mode = id; sound.open(); next(); });
      modes.append(b);
    }
    main.append(
      el('div', { class: 'qz-q' }, 'Ten questions from the bench. Read the colour bands, do the arithmetic, keep the smoke inside the components.'),
      el('div', { class: 'qz-explain' }, 'Resistor codes: first two bands are digits, the third is the multiplier, the fourth is tolerance (gold 5%, silver 10%). Ohm\'s law: V = I x R, and P = V x I.'),
      modes
    );
    renderHead('Pick a mode');
  };

  const next = () => {
    if (index >= TOTAL) return finish();
    question = mode === 'resistor' ? resistorQuestion() : mode === 'ohm' ? ohmQuestion() : Math.random() < 0.5 ? resistorQuestion() : ohmQuestion();
    clear(main);
    const opts = el('div', { class: 'qz-opts' });
    const explain = el('div', { class: 'qz-explain' });
    explain.hidden = true;
    const nextBtn = el('button', { class: 'os-btn primary', type: 'button' }, index === TOTAL - 1 ? 'See score' : 'Next question');
    nextBtn.hidden = true;
    nextBtn.addEventListener('click', () => { index++; next(); });
    let answered = false;
    for (const opt of question.options) {
      const b = el('button', { class: 'os-btn qz-opt', type: 'button' }, opt);
      b.addEventListener('click', () => {
        if (answered) return;
        answered = true;
        const right = opt === question.answer;
        if (right) { score++; sound.success(); } else sound.error();
        for (const o of opts.children) {
          if (o.textContent === question.answer) o.classList.add('right');
          else if (o === b) o.classList.add('wrong');
          o.disabled = true;
        }
        explain.textContent = (right ? 'Correct. ' : 'Not quite. ') + question.explain;
        explain.hidden = false;
        nextBtn.hidden = false;
        renderHead();
        nextBtn.focus();
      });
      opts.append(b);
    }
    main.append(el('div', { class: 'qz-q' }, question.text));
    if (question.figure) main.append(el('div', { class: 'qz-fig', html: question.figure }));
    main.append(opts, explain, nextBtn);
    renderHead();
  };

  const finish = () => {
    clear(main);
    const prev = best();
    if (score > prev) store.set(`quiz.best.${mode}`, score);
    const again = el('button', { class: 'os-btn primary', type: 'button' }, 'Play again');
    again.addEventListener('click', menu);
    main.append(el('div', { class: 'qz-end' },
      el('div', { class: 'big' }, `${score} / ${TOTAL}`),
      el('p', {}, score === TOTAL ? 'Flawless. The smoke stayed inside.' : score >= 7 ? 'Solid. A few components may have opinions.' : score >= 4 ? 'Getting there. Keep a fire extinguisher nearby.' : 'The bench forgives. Try again.'),
      el('p', { class: 'nb-eyebrow' }, score > prev ? 'New best!' : `Best: ${Math.max(prev, score)}`),
      again
    ));
    renderHead('Done');
  };

  menu();
}
