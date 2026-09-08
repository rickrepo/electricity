// Desktop shortcuts + right-click context menu.
import { el } from '../util/dom.js';
import { iconEl } from './icons.js';
import { sound } from '../sound.js';

export function createDesktop(os) {
  const { shortcutsEl, desktopEl } = os;
  let selected = null;
  let lastPointerType = 'mouse';
  let contextMenu = null;

  const select = (btn) => {
    selected?.classList.remove('selected');
    selected = btn;
    btn?.classList.add('selected');
  };

  for (const app of os.apps.filter((a) => a.desktop !== false)) {
    const iconWrap = el('span', { class: 'os-shortcut-icon' }, iconEl(app.icon));
    const btn = el('button', { class: 'os-shortcut', type: 'button', dataset: { app: app.id }, 'aria-label': `Open ${app.name}` },
      iconWrap,
      el('span', { class: 'os-shortcut-label' }, app.name)
    );
    btn.addEventListener('pointerdown', (e) => { lastPointerType = e.pointerType || 'mouse'; });
    btn.addEventListener('click', (e) => {
      select(btn);
      // touch: single tap opens; mouse: double click opens
      if (lastPointerType === 'touch' || e.detail >= 2) os.open(app.id);
      else sound.tick();
    });
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        os.open(app.id);
      }
    });
    if (app.corner === 'bottom-right') {
      btn.classList.add('os-shortcut-corner');
      desktopEl.append(btn);
    } else shortcutsEl.append(btn);
    app.updateIcon = () => iconWrap.replaceChildren(iconEl(typeof app.iconFor === 'function' ? app.iconFor(os) : app.icon));
    app.updateIcon();
  }

  os.bus.on('trash:change', () => os.apps.find((a) => a.id === 'trash')?.updateIcon?.());

  desktopEl.addEventListener('pointerdown', (e) => {
    if (e.target === desktopEl || e.target === shortcutsEl || e.target === os.windowsEl) select(null);
    if (!e.target.closest('.os-context-menu')) closeContextMenu();
  });

  const closeContextMenu = () => {
    contextMenu?.remove();
    contextMenu = null;
  };

  desktopEl.addEventListener('contextmenu', (e) => {
    if (e.target.closest('.os-window') || e.target.closest('.os-shortcut')) return;
    e.preventDefault();
    closeContextMenu();
    const rect = desktopEl.getBoundingClientRect();
    const scale = rect.width / desktopEl.clientWidth || 1;
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;
    const item = (label, iconName, fn) => el('button', { class: 'os-menu-item', type: 'button', onClick: () => { closeContextMenu(); fn(); } }, iconEl(iconName), label);
    contextMenu = el('div', { class: 'os-context-menu', role: 'menu' },
      item('Arrange icons', 'folder', () => sound.tick()),
      item('Change wallpaper...', 'settings', () => os.open('settings')),
      item('New text file', 'notepad', () => os.open('notepad', { file: 'untitled.txt' })),
      el('div', { class: 'os-menu-sep' }),
      item('About RickyOS', 'info', () => os.about())
    );
    desktopEl.append(contextMenu);
    const mw = contextMenu.offsetWidth;
    const mh = contextMenu.offsetHeight;
    contextMenu.style.left = `${Math.min(x, desktopEl.clientWidth - mw - 4)}px`;
    contextMenu.style.top = `${Math.min(y, desktopEl.clientHeight - mh - 4)}px`;
    sound.tick();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeContextMenu();
  });

  return { select, closeContextMenu };
}
