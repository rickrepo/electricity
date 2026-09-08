// BIOS-style boot screen. Prints a fake POST sequence, runs the real setup
// tasks (building the 3D room, loading fonts, ...) as "resources", then waits
// for the visitor to press START.
import { el, sleep, formatDate, prefersReducedMotion } from './util/dom.js';

const MEMORY_KB = 65536;

export function runBoot({ container, mode, tasks = [], notes = [], altMode = null, onAlt }) {
  return new Promise((resolve) => {
    const fast = prefersReducedMotion();
    let skipMemory = false;
    let started = false;

    container.innerHTML = '';
    container.hidden = false;

    const header = el('div', { class: 'boot-header' },
      el('div', { class: 'boot-logo' }, 'Ricky', el('br'), 'Systems'),
      el('div', {},
        el('p', {}, 'RSBIOS v4.51 Plug & Pray'),
        el('p', {}, 'Copyright (C) 1998-', String(new Date().getFullYear()), ' Ricky Systems Inc.'),
        el('p', { class: 'boot-dim' }, 'Released: 04/01/1998')
      )
    );
    const body = el('div', { class: 'boot-body' });
    const footer = el('div', { class: 'boot-footer' },
      el('p', {}, 'Press ', el('b', {}, 'ENTER'), ' to start, ', el('b', {}, 'ESC'), ' to skip memory test'),
      el('p', {}, formatDate())
    );

    const popupWrap = el('div', { class: 'boot-popup-wrap' });
    container.append(header, body, footer, popupWrap);

    const line = (text, cls) => {
      const p = el('p', { class: cls || '' }, text);
      body.append(p);
      body.scrollTop = body.scrollHeight;
      return p;
    };
    const pause = (ms) => sleep(fast ? Math.min(ms, 60) : ms);

    const onKey = (e) => {
      if (e.key === 'Escape') skipMemory = true;
      if (e.key === 'Enter' && popupWrap.classList.contains('show')) start();
    };
    document.addEventListener('keydown', onKey);

    const finish = () => {
      document.removeEventListener('keydown', onKey);
      container.classList.add('done');
      setTimeout(() => {
        container.hidden = true;
        container.innerHTML = '';
      }, 400);
    };

    const start = () => {
      if (started) return;
      started = true;
      finish();
      resolve({ mode });
    };

    const chooseAlt = () => {
      if (started) return;
      started = true;
      finish();
      onAlt?.(altMode);
      resolve({ mode: altMode, switched: true });
    };

    (async () => {
      line('RICKY-1 Main Processor @ 133 MHz, 1 core, 0 regrets');
      await pause(180);
      const mem = line('Memory Test :  0K');
      const stepKb = 1024;
      for (let kb = 0; kb <= MEMORY_KB; kb += stepKb) {
        mem.textContent = `Memory Test :  ${kb}K`;
        if (skipMemory || fast) {
          mem.textContent = `Memory Test :  ${MEMORY_KB}K`;
          break;
        }
        await sleep(18);
      }
      mem.append(el('span', { class: 'boot-green' }, ' OK'));
      await pause(160);
      line('Detecting IDE Primary Master  ... RICKY DISK 4.3 GB');
      await pause(120);
      line('Detecting IDE Primary Slave   ... RS-ROM 24x');
      await pause(120);
      line('Detecting Display Adapter     ... CRT 1280x960 @ 60Hz');
      await pause(120);
      line(mode === 'scene' ? 'Detecting 3D Accelerator      ... WebGL2 OK' : 'Detecting 3D Accelerator      ... skipped (2D mode)', 'boot-dim');
      await pause(220);
      body.append(el('div', { style: { height: '0.8em' } }));

      const status = line(`Loading resources (0/${tasks.length})`, 'dots');
      const list = el('div', { class: 'boot-list' });
      body.append(list);
      let done = 0;
      for (const task of tasks) {
        const row = el('p', {}, `${task.label.padEnd(26, '.')} `);
        list.append(row);
        body.scrollTop = body.scrollHeight;
        const t0 = performance.now();
        try {
          await task.run?.();
          // keep a readable rhythm even when a task is instant
          const spent = performance.now() - t0;
          if (spent < 90) await pause(90 - spent + Math.random() * 90);
          row.append(el('span', { class: 'boot-green' }, 'OK'));
        } catch (err) {
          console.error(`[boot] task "${task.label}" failed`, err);
          row.append(el('span', { class: 'boot-red' }, 'FAILED'));
        }
        done++;
        status.textContent = `Loading resources (${done}/${tasks.length})`;
      }
      status.classList.remove('dots');
      status.textContent = 'All resources loaded.';
      body.append(el('div', { style: { height: '0.8em' } }));
      line('Launching ').append(el('b', { class: 'boot-green' }, "'Ricky Portfolio Showcase'"), ' v1.0');
      const cur = el('p', { class: 'cursor-blink' });
      body.append(cur);

      await pause(700);
      body.style.opacity = '0';
      header.style.opacity = '0';
      body.style.transition = header.style.transition = 'opacity 0.3s';
      await pause(320);

      const popup = el('div', { class: 'boot-popup', role: 'dialog', 'aria-label': 'Start' },
        el('h1', {}, 'Ricky Portfolio Showcase'),
        el('p', {}, mode === 'scene'
          ? 'A small room, a big CRT, and an operating system that only exists here.'
          : 'RickyOS will start in 2D mode and fill this window.'),
        ...notes.map((n) => el('p', { class: 'boot-warning' }, n)),
        el('p', { class: 'cursor-blink', style: { marginTop: '10px' } }, mode === 'scene' ? 'Sound on recommended. Click START to power on' : 'Click START to power on'),
        el('div', { class: 'boot-actions' },
          el('button', { class: 'boot-btn primary', type: 'button', onClick: start }, 'Start'),
          altMode ? el('button', { class: 'boot-alt', type: 'button', onClick: chooseAlt },
            altMode === 'os' ? 'or skip the 3D desk and open RickyOS directly' : 'or launch the full 3D desk experience') : null
        )
      );
      popupWrap.append(popup);
      requestAnimationFrame(() => popupWrap.classList.add('show'));
      setTimeout(() => popup.querySelector('button')?.focus(), 450);
    })();
  });
}
