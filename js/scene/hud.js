// HTML overlay for the 3D scene: typed name/title/clock, toggles, help text,
// toasts, and cursor hints for clickable objects.
import { el, typeText, formatClock, sleep } from '../util/dom.js';

const ICON = {
  soundOn: '<svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9H4zm11.5 3a3.5 3.5 0 0 0-2-3.2v6.4a3.5 3.5 0 0 0 2-3.2zm-2-7v2.1a5 5 0 0 1 0 9.8V19a7 7 0 0 0 0-14z"/></svg>',
  soundOff: '<svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9H4zm12.6 3 2.7-2.7-1.4-1.4-2.7 2.7-2.7-2.7-1.4 1.4 2.7 2.7-2.7 2.7 1.4 1.4 2.7-2.7 2.7 2.7 1.4-1.4-2.7-2.7z"/></svg>',
  camera: '<svg viewBox="0 0 24 24"><path d="M4 7h3l2-2h6l2 2h3v11H4V7zm8 2a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm0 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4z"/></svg>',
  flat: '<svg viewBox="0 0 24 24"><path d="M3 5h18v11H3V5zm2 2v7h14V7H5zm3 11h8v2H8v-2z"/></svg>',
};

export function createHUD({ container, sound, onFreeLook, onFlat, onExit }) {
  const name = el('div', { class: 'hud-box' });
  const title = el('div', { class: 'hud-box' });
  const clock = el('div', { class: 'hud-box' });
  const muteBtn = el('button', { class: 'hud-btn', type: 'button', 'aria-pressed': String(sound.muted), title: 'Toggle sound' });
  const freeBtn = el('button', { class: 'hud-btn', type: 'button', 'aria-pressed': 'false', title: 'Free look (drag to orbit)' });
  const flatBtn = el('button', { class: 'hud-btn', type: 'button', title: 'Open RickyOS in 2D' });
  const info = el('div', { class: 'hud-info' }, name, title, el('div', { class: 'hud-row' }, clock, muteBtn, freeBtn, flatBtn));
  const help = el('div', { class: 'hud-help hide', 'aria-live': 'polite' });
  const toast = el('div', { class: 'hud-toast', role: 'status' });
  const hint = el('div', { class: 'hud-hint' });
  const exitBtn = el('button', { type: 'button' }, 'Esc  Step back');
  const exit = el('div', { class: 'hud-exit' }, exitBtn);
  container.append(info, help, toast, hint, exit);

  const renderMute = () => {
    muteBtn.innerHTML = `${sound.muted ? ICON.soundOff : ICON.soundOn}<span>${sound.muted ? 'Sound off' : 'Sound on'}</span>`;
    muteBtn.setAttribute('aria-pressed', String(sound.muted));
  };
  renderMute();
  sound.on('mute', renderMute);
  freeBtn.innerHTML = `${ICON.camera}<span>Free look</span>`;
  flatBtn.innerHTML = `${ICON.flat}<span>2D mode</span>`;

  muteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    sound.unlock();
    sound.toggleMuted();
    if (!sound.muted) sound.tick();
  });
  freeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const on = freeBtn.getAttribute('aria-pressed') !== 'true';
    freeBtn.setAttribute('aria-pressed', String(on));
    onFreeLook?.(on);
  });
  flatBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    onFlat?.();
  });
  exitBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    onExit?.();
  });
  for (const b of [muteBtn, freeBtn, flatBtn, exitBtn]) b.addEventListener('pointerdown', (e) => e.stopPropagation());

  let clockTimer = null;
  let helpToken = { cancelled: false };
  let toastTimer = null;
  let introDone = false;

  const typeInto = (target, text, opts = {}) => typeText(target, text, { min: 40, max: 90, onChar: () => sound.key(), ...opts });

  return {
    async intro({ name: nameText, title: titleText }) {
      if (introDone) return;
      introDone = true;
      await sleep(300);
      await typeInto(name, nameText);
      await typeInto(title, titleText);
      await typeInto(clock, formatClock(new Date(), { seconds: true }));
      clockTimer = setInterval(() => {
        clock.textContent = formatClock(new Date(), { seconds: true });
      }, 1000);
      await sleep(200);
      muteBtn.classList.add('show');
      await sleep(150);
      freeBtn.classList.add('show');
      await sleep(150);
      flatBtn.classList.add('show');
    },
    async setHelp(text) {
      helpToken.cancelled = true;
      helpToken = { cancelled: false };
      help.classList.remove('hide');
      help.textContent = '';
      help.classList.add('cursor-blink');
      await typeInto(help, text, { token: helpToken, min: 30, max: 80 });
    },
    hideHelp() {
      helpToken.cancelled = true;
      help.classList.add('hide');
    },
    toast(text, ms = 2600) {
      toast.textContent = text;
      toast.classList.add('show');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toast.classList.remove('show'), ms);
    },
    hint(text, x, y) {
      if (!text) {
        hint.classList.remove('show');
        return;
      }
      hint.textContent = text;
      hint.style.left = `${x + 16}px`;
      hint.style.top = `${y + 18}px`;
      hint.classList.add('show');
    },
    setVisible(visible) {
      container.classList.toggle('hidden-hud', !visible);
    },
    setFreeLookPressed(on) {
      freeBtn.setAttribute('aria-pressed', String(on));
    },
    dispose() {
      clearInterval(clockTimer);
    },
  };
}
