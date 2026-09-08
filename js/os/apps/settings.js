// Settings: wallpaper, colours, CRT effect, sounds.
import { el } from '../../util/dom.js';
import { store } from '../../util/storage.js';
import { sound } from '../../sound.js';

const WALLPAPERS = [
  ['dots', 'Dots'],
  ['grid', 'Grid'],
  ['diag', 'Stripes'],
  ['waves', 'Scales'],
  ['plain', 'Plain'],
];
const COLORS = ['#256470', '#2f4f6f', '#4a3a6b', '#5a3a2a', '#2a5a3a', '#3a3a3a'];
const ACCENTS = ['#ff6b4a', '#ffb347', '#4caf7d', '#3aa0a8', '#7a4bd6', '#ff5fa2'];

export default {
  id: 'settings',
  name: 'Settings',
  icon: 'settings',
  desktop: true,
  startMenu: true,
  launch(os) {
    const { width: W, height: H } = os.wm.bounds;
    return os.wm.open({
      id: 'settings',
      title: 'Settings',
      icon: 'settings',
      width: Math.min(460, W - 160),
      height: Math.min(520, H - 100),
      minWidth: 300,
      minHeight: 240,
      render: (body) => mountSettings(os, body),
    });
  },
};

function mountSettings(os, body) {
  const root = el('div', { class: 'settings' });

  const swatchRow = (options, current, onPick, labelOf = () => '') => {
    const row = el('div', { class: 'os-swatches' });
    const buttons = options.map((value) => {
      const btn = el('button', { class: `os-swatch${value === current() ? ' selected' : ''}`, type: 'button', title: labelOf(value) || value, 'aria-label': labelOf(value) || value });
      btn.addEventListener('click', () => {
        onPick(value);
        buttons.forEach((b) => b.classList.toggle('selected', b === btn));
        sound.tick();
      });
      return btn;
    });
    row.append(...buttons);
    return { row, buttons };
  };

  // wallpaper patterns
  root.append(el('h3', {}, 'Wallpaper pattern'));
  const wall = swatchRow(WALLPAPERS.map((w) => w[0]), () => os.settings.wallpaper, (v) => os.saveSettings({ wallpaper: v }), (v) => WALLPAPERS.find((w) => w[0] === v)?.[1]);
  wall.buttons.forEach((b, i) => {
    b.classList.add('os-screen', `wall-${WALLPAPERS[i][0]}`);
    b.style.position = 'static';
    b.style.width = '54px';
    b.style.backgroundColor = 'var(--os-desktop)';
  });
  root.append(wall.row);

  root.append(el('h3', {}, 'Desktop colour'));
  const colors = swatchRow(COLORS, () => os.settings.color, (v) => {
    os.saveSettings({ color: v });
    wall.buttons.forEach((b) => (b.style.backgroundColor = v));
  });
  colors.buttons.forEach((b, i) => (b.style.background = COLORS[i]));
  root.append(colors.row);

  root.append(el('h3', {}, 'Accent colour'));
  const accents = swatchRow(ACCENTS, () => os.settings.accent, (v) => os.saveSettings({ accent: v }));
  accents.buttons.forEach((b, i) => (b.style.background = ACCENTS[i]));
  root.append(accents.row);

  root.append(el('h3', {}, 'Display & sound'));
  const toggle = (label, key, onChange) => {
    const input = el('input', { type: 'checkbox', checked: !!os.settings[key] });
    input.addEventListener('change', () => {
      os.saveSettings({ [key]: input.checked });
      onChange?.(input.checked);
      sound.tick();
    });
    return el('div', { class: 'settings-row' }, el('span', {}, label), el('label', { class: 'os-toggle' }, input, el('span', { class: 'os-toggle-track' })));
  };
  root.append(toggle('CRT scanlines', 'crt'), toggle('Interface sounds', 'sounds'));

  const muteInput = el('input', { type: 'checkbox', checked: !sound.muted });
  muteInput.addEventListener('change', () => {
    sound.unlock();
    sound.setMuted(!muteInput.checked);
    if (!sound.muted) sound.tick();
  });
  sound.on('mute', (m) => (muteInput.checked = !m));
  root.append(el('div', { class: 'settings-row' }, el('span', {}, 'Master volume'), el('label', { class: 'os-toggle' }, muteInput, el('span', { class: 'os-toggle-track' }))));

  root.append(el('h3', {}, 'Danger zone'));
  const reset = el('button', { class: 'os-btn', type: 'button' }, 'Reset RickyOS');
  reset.addEventListener('click', async () => {
    const answer = await os.dialog({ title: 'Reset RickyOS', icon: 'warning', message: 'Clear saved settings, high scores, notes, and the shutdown counter?', buttons: ['Reset', 'Cancel'] });
    if (answer !== 'Reset') return;
    store.clear();
    os.state.shutdowns = 0;
    os.resetSettings();
    os.bus.emit('trash:change');
    sound.boom();
    os.reboot();
  });
  root.append(el('div', { class: 'settings-row' }, el('span', {}, 'Everything back to factory settings'), reset));
  root.append(el('p', { class: 'settings-note' }, 'Settings are stored in this browser only. RickyOS has no cloud, and it is proud of that.'));
  body.append(root);
}
