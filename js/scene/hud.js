// HTML overlay for the bench: name tapes, bench switches, hints anchored to
// objects in the room, toasts, and the "step back" control.
import { el } from '../util/dom.js';
import * as THREE from '../../vendor/three.min.js';

export function createHUD({ container, sound, onFreeLook, onExit }) {
  const nameTape = el('span', { class: 'tape' });
  const titleTape = el('span', { class: 'tape sub' });
  const id = el('div', { class: 'hud-id' }, nameTape, titleTape);
  const mkSwitch = (label) => el('button', { class: 'hud-switch', type: 'button', 'aria-pressed': 'false' }, el('span', { class: 'sw' }), el('span', {}, label));
  const soundSw = mkSwitch('Sound');
  const freeSw = mkSwitch('Free look');
  const controls = el('div', { class: 'hud-controls' }, soundSw, freeSw);
  const help = el('div', { class: 'hud-help hide', 'aria-live': 'polite' }, el('span', { class: 'tape' }));
  const toast = el('div', { class: 'hud-toast', role: 'status' }, el('span', { class: 'tape orange' }));
  const anchorsEl = el('div', { class: 'hud-anchors' });
  const exitTape = el('span', { class: 'tape' }, 'Esc  -  step back');
  const exitBtn = el('button', { type: 'button' }, exitTape);
  const exit = el('div', { class: 'hud-exit' }, exitBtn);
  container.append(id, controls, help, toast, anchorsEl, exit);

  const renderSound = () => {
    soundSw.setAttribute('aria-pressed', String(!sound.muted));
    soundSw.lastElementChild.textContent = sound.muted ? 'Muted' : 'Sound';
  };
  renderSound();
  sound.on('mute', renderSound);
  soundSw.addEventListener('click', (e) => { e.stopPropagation(); sound.unlock(); sound.toggleMuted(); if (!sound.muted) sound.tick(); });
  freeSw.addEventListener('click', (e) => {
    e.stopPropagation();
    const on = freeSw.getAttribute('aria-pressed') !== 'true';
    freeSw.setAttribute('aria-pressed', String(on));
    onFreeLook?.(on);
  });
  exitBtn.addEventListener('click', (e) => { e.stopPropagation(); onExit?.(); });
  for (const b of [soundSw, freeSw, exitBtn]) b.addEventListener('pointerdown', (e) => e.stopPropagation());

  const anchors = new Map();
  const v = new THREE.Vector3();
  let toastTimer = null;

  return {
    reveal(name, title) {
      nameTape.textContent = name;
      titleTape.textContent = title;
      requestAnimationFrame(() => id.classList.add('show'));
      setTimeout(() => soundSw.classList.add('show'), 500);
      setTimeout(() => freeSw.classList.add('show'), 650);
    },
    setHelp(text) { help.firstElementChild.textContent = text; help.classList.remove('hide'); },
    hideHelp() { help.classList.add('hide'); },
    setExitLabel(text) { exitTape.textContent = text; exit.classList.toggle('hide', !text); },
    toast(text, ms = 2600) {
      toast.firstElementChild.textContent = text;
      toast.classList.add('show');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toast.classList.remove('show'), ms);
    },
    anchor(key, { text, position, subtle = false }) {
      let a = anchors.get(key);
      if (!a) {
        a = { el: el('div', { class: 'hud-anchor' }, el('span', { class: 'dot' }), el('span', { class: 'tape' })), position: new THREE.Vector3() };
        anchorsEl.append(a.el);
        anchors.set(key, a);
      }
      a.el.lastElementChild.textContent = text;
      a.el.classList.toggle('subtle', subtle);
      a.position.copy(position);
      a.el.classList.add('show');
    },
    clearAnchor(key) { anchors.get(key)?.el.classList.remove('show'); },
    updateAnchors(camera, width, height) {
      for (const a of anchors.values()) {
        if (!a.el.classList.contains('show')) continue;
        v.copy(a.position).project(camera);
        a.el.style.visibility = v.z > 1 ? 'hidden' : 'visible';
        a.el.style.transform = `translate(${((v.x + 1) / 2) * width - 6}px, ${((1 - v.y) / 2) * height}px) translateY(-50%)`;
      }
    },
    setVisible(visible) { container.classList.toggle('hidden-hud', !visible); },
    setFreeLookPressed(on) { freeSw.setAttribute('aria-pressed', String(on)); },
  };
}
