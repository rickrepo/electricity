// Settings: board colour, accent, CRT effect, sounds, screensaver.
import { el } from '../../util/dom.js';
import { store } from '../../util/storage.js';
import { WALLPAPERS, pcbWallpaper } from '../wallpaper.js';
import { sound } from '../../sound.js';

const ACCENTS = ['#ff7a1a', '#4fe3c1', '#ffb02e', '#ff4b3e', '#7a4bd6', '#52e07a'];

export default {
  id: 'settings',
  name: 'Settings',
  icon: 'settings',
  desktop: true,
  startMenu: true,
  launch(os) {
    const { width: W, height: H } = os.wm.bounds;
    return os.wm.open({
      id: 'settings', title: 'Settings', icon: 'settings',
      width: Math.min(470, W - 160), height: Math.min(560, H - 100), minWidth: 300, minHeight: 240,
      render: (body) => mountSettings(os, body),
    });
  },
};

function mountSettings(os, body) {
  const root = el('div', { class: 'st' });
  const swatchRow = (options, current, onPick, labelOf, paint) => {
    const row = el('div', { class: 'os-swatches' });
    const buttons = options.map((value) => {
      const btn = el('button', { class: `os-swatch${value === current() ? ' selected' : ''}`, type: 'button', title: labelOf(value), 'aria-label': labelOf(value) });
      paint(btn, value);
      btn.addEventListener('click', () => {
        onPick(value);
        buttons.forEach((b) => b.classList.toggle('selected', b === btn));
        sound.tick();
      });
      return btn;
    });
    row.append(...buttons);
    return row;
  };

  root.append(el('h3', {}, 'Board'));
  root.append(swatchRow(Object.keys(WALLPAPERS), () => os.settings.wallpaper, (v) => os.saveSettings({ wallpaper: v }), (v) => WALLPAPERS[v].label, (btn, v) => {
    btn.style.backgroundImage = `url(${pcbWallpaper(v, 256)})`;
    btn.style.backgroundSize = '128px 128px';
    btn.style.width = '64px';
  }));

  root.append(el('h3', {}, 'Accent'));
  root.append(swatchRow(ACCENTS, () => os.settings.accent, (v) => os.saveSettings({ accent: v }), (v) => v, (btn, v) => { btn.style.background = v; }));

  root.append(el('h3', {}, 'Display & sound'));
  const toggle = (label, key) => {
    const input = el('input', { type: 'checkbox', checked: !!os.settings[key] });
    input.addEventListener('change', () => { os.saveSettings({ [key]: input.checked }); sound.tick(); });
    return el('div', { class: 'st-row' }, el('span', {}, label), el('label', { class: 'os-toggle' }, input, el('span', { class: 'os-toggle-track' })));
  };
  root.append(toggle('CRT scanlines', 'crt'), toggle('Interface sounds', 'sounds'));
  const muteInput = el('input', { type: 'checkbox', checked: !sound.muted });
  muteInput.addEventListener('change', () => { sound.unlock(); sound.setMuted(!muteInput.checked); if (!sound.muted) sound.tick(); });
  sound.on('mute', (m) => (muteInput.checked = !m));
  root.append(el('div', { class: 'st-row' }, el('span', {}, 'Master volume'), el('label', { class: 'os-toggle' }, muteInput, el('span', { class: 'os-toggle-track' }))));

  const saverSel = el('select', { class: 'os-select', style: { width: 'auto' }, 'aria-label': 'Screensaver delay' },
    [[0, 'Off'], [1, 'After 1 minute'], [2, 'After 2 minutes'], [5, 'After 5 minutes']].map(([v, l]) => el('option', { value: v, selected: Number(os.settings.saverMinutes) === v }, l)));
  saverSel.addEventListener('change', () => { os.saveSettings({ saverMinutes: Number(saverSel.value) }); sound.tick(); });
  const saverNow = el('button', { class: 'os-btn sm', type: 'button' }, 'Preview');
  saverNow.addEventListener('click', () => os.saver.start());
  root.append(el('div', { class: 'st-row' }, el('span', {}, 'Screensaver'), el('span', { style: { display: 'flex', gap: '8px' } }, saverSel, saverNow)));

  root.append(el('h3', {}, 'Danger zone'));
  const reset = el('button', { class: 'os-btn', type: 'button' }, 'Reset RickyOS');
  reset.addEventListener('click', async () => {
    const answer = await os.dialog({ title: 'Reset RickyOS', icon: 'warning', message: 'Clear saved settings, best scores, notes, and the shutdown counter?', buttons: ['Reset', 'Cancel'] });
    if (answer !== 'Reset') return;
    store.clear();
    os.state.shutdowns = 0;
    os.resetSettings();
    os.bus.emit('bin:change');
    sound.boom();
    os.reboot();
  });
  root.append(el('div', { class: 'st-row' }, el('span', {}, 'Everything back to factory settings'), reset));
  root.append(el('p', { class: 'st-note' }, 'Settings live in this browser only. The RK-1 has no cloud and is proud of it.'));
  body.append(root);
}
