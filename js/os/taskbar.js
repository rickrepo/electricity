// Taskbar: start button + start menu, running window tabs, volume, clock.
import { el, formatClock } from '../util/dom.js';
import { iconEl } from './icons.js';
import { sound } from '../sound.js';

export function createTaskbar(os) {
  const startBtn = el('button', { class: 'os-start-btn', type: 'button', 'aria-haspopup': 'menu', 'aria-expanded': 'false' }, iconEl('logo'), 'Start');
  const tasks = el('div', { class: 'os-tasks', role: 'list' });
  const volBtn = el('button', { class: 'os-tray-btn', type: 'button', title: 'Toggle sound', 'aria-label': 'Toggle sound' });
  const clock = el('span', { class: 'os-clock', role: 'timer' });
  const tray = el('div', { class: 'os-tray' }, volBtn, clock);
  os.taskbarEl.append(startBtn, tasks, tray);

  /* ----- clock ----- */
  const tickClock = () => {
    const now = new Date();
    clock.textContent = formatClock(now);
    clock.title = now.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };
  tickClock();
  setInterval(tickClock, 10000);

  /* ----- volume ----- */
  const renderVol = () => volBtn.replaceChildren(iconEl(sound.muted ? 'volumeOff' : 'volumeOn'));
  renderVol();
  sound.on('mute', renderVol);
  volBtn.addEventListener('click', () => {
    sound.unlock();
    sound.toggleMuted();
    if (!sound.muted) sound.tick();
  });

  /* ----- window tabs ----- */
  const renderTasks = () => {
    tasks.replaceChildren();
    for (const win of os.wm.list().sort((a, b) => a.created - b.created)) {
      const btn = el('button', {
        class: `os-task${os.wm.focusedId === win.id && !win.minimized ? ' active' : ''}${win.minimized ? ' minimized' : ''}`,
        type: 'button',
        role: 'listitem',
        title: win.title,
      }, iconEl(win.iconName), el('span', {}, win.title));
      btn.addEventListener('click', () => {
        win.toggleMinimize();
        sound.tick();
      });
      tasks.append(btn);
    }
  };
  os.wm.on('change', renderTasks);

  /* ----- start menu ----- */
  let menu = null;

  const closeMenu = () => {
    if (!menu) return;
    menu.remove();
    menu = null;
    startBtn.classList.remove('open');
    startBtn.setAttribute('aria-expanded', 'false');
  };

  const menuItem = (label, iconName, fn, hint) => {
    const item = el('button', { class: 'os-menu-item', type: 'button', role: 'menuitem' }, iconEl(iconName), label, hint ? el('span', { class: 'os-menu-hint' }, hint) : null);
    item.addEventListener('click', () => {
      closeMenu();
      fn();
    });
    return item;
  };

  const openMenu = () => {
    if (menu) return;
    const items = el('div', { class: 'os-startmenu-items' });
    for (const app of os.apps.filter((a) => a.startMenu !== false)) {
      items.append(menuItem(app.name, typeof app.iconFor === 'function' ? app.iconFor(os) : app.icon, () => os.open(app.id)));
    }
    items.append(el('div', { class: 'os-menu-sep' }));
    items.append(menuItem('About RickyOS', 'info', () => os.about()));
    if (os.onSwitchMode) {
      items.append(menuItem(os.mode === 'scene' ? 'Leave the 3D desk' : 'Enter the 3D desk', 'cube', () => os.onSwitchMode(), os.mode === 'scene' ? '2D' : '3D'));
    }
    items.append(menuItem('Shut Down...', 'power', () => os.shutdown()));
    menu = el('div', { class: 'os-startmenu', role: 'menu' },
      el('div', { class: 'os-startmenu-banner' }, el('span', {}, 'RickyOS 98')),
      items
    );
    os.screen.append(menu);
    startBtn.classList.add('open');
    startBtn.setAttribute('aria-expanded', 'true');
    items.querySelector('button')?.focus();
  };

  startBtn.addEventListener('click', () => {
    sound.unlock();
    sound.click();
    if (menu) closeMenu();
    else openMenu();
  });

  document.addEventListener('pointerdown', (e) => {
    if (menu && !menu.contains(e.target) && !startBtn.contains(e.target)) closeMenu();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu) {
      closeMenu();
      startBtn.focus();
    }
  });

  os.startMenu = { open: openMenu, close: closeMenu };
  renderTasks();
}
