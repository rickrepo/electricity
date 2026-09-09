// The gate is a breaker panel. Flipping MAIN powers the bench (and unlocks
// audio); LIGHTS and RK-1 flip themselves as the room comes alive.
import { el, sleep } from './util/dom.js';

export function runGate({ container, prepare, notes = [], touch = false }) {
  return new Promise((resolve) => {
    container.innerHTML = '';
    container.hidden = false;
    const row = (label, sub, { main = false } = {}) => {
      const breaker = el('button', { class: `breaker${main ? '' : ' auto'}`, type: 'button', 'aria-label': `${label} breaker`, disabled: main }, el('span', { class: 'handle' }));
      const r = el('div', { class: 'panel-row' }, el('span', { class: 'led' }), el('span', { class: 'label' }, label, el('small', {}, sub)), breaker);
      return { row: r, breaker };
    };
    const main = row('Main', touch ? 'tap to power the bench' : 'flip to power the bench', { main: true });
    const lights = row('Lights', 'fluorescent tube, ring lamp');
    const rk1 = row('RK-1', 'homemade computer, one fan');
    const status = el('div', { class: 'panel-status dots' }, 'Warming up the bench');
    const panel = el('div', { class: 'panel', role: 'dialog', 'aria-label': "Ricky's Bench breaker panel" },
      el('span', { class: 'screw-l' }), el('span', { class: 'screw-r' }),
      el('div', { class: 'panel-head' }, el('span', { class: 'tape orange' }, "Ricky's Bench"), el('small', {}, 'Main panel')),
      el('div', { class: 'panel-note' }, 'A workshop, a homemade computer, and a ', el('b', {}, 'portfolio'), ' hiding inside it. Sound on is worth it.', ...notes.map((n) => el('div', { class: 'panel-warn' }, n))),
      main.row, lights.row, rk1.row,
      status
    );
    container.append(panel);

    let ready = false;
    let started = false;
    const flip = (r) => { r.breaker.classList.add('on'); r.row.classList.add('on'); };
    const onKey = (e) => { if (e.key === 'Enter' || e.key === ' ') start(); };
    const start = async () => {
      if (!ready || started) return;
      started = true;
      document.removeEventListener('keydown', onKey);
      flip(main);
      main.breaker.disabled = true;
      status.textContent = 'Bench powered.';
      resolve();
      await sleep(650);
      flip(lights);
      await sleep(550);
      flip(rk1);
      await sleep(500);
      container.classList.add('done');
      setTimeout(() => { container.hidden = true; container.innerHTML = ''; }, 800);
    };
    main.breaker.addEventListener('click', start);
    document.addEventListener('keydown', onKey);

    (async () => {
      try {
        await prepare?.((text) => { status.textContent = text; });
      } catch (err) {
        console.error('[gate] preparation failed', err);
        status.textContent = 'Something failed to warm up, but the breaker still works.';
      }
      status.classList.remove('dots');
      status.textContent = touch ? 'Ready. Tap MAIN.' : 'Ready. Flip MAIN (or press Enter).';
      ready = true;
      main.breaker.disabled = false;
      main.breaker.focus({ preventScroll: true });
    })();
  });
}

export function showGateFailure(container, message) {
  container.innerHTML = '';
  container.hidden = false;
  container.append(el('div', { class: 'panel-fail' }, el('span', { class: 'tape orange' }, "Ricky's Bench"), el('p', {}, message)));
}
