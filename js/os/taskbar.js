// The power strip: menu button, one outlet per open window, sound switch,
// and an LCD clock.
import { el, formatClock } from '../util/dom.js';
import { iconEl } from './icons.js';
import { sound } from '../sound.js';

export function createStrip(os) {
  const menuBtn = el('button', { class: 'os-menu-btn', type: 'button', 'aria-haspopup': 'menu', 'aria-expanded': 'false' }, iconEl('menu'), 'Menu');
  const outlets = el('div', { class: 'os-outlets', role: 'list' });
  const soundBtn = el('button', { class: 'os-switch', type: 'button', title: 'Toggle sound', 'aria-label': 'Toggle sound' });
  const lcd = el('span', { class: 'os-lcd', role: 'timer' });
  os.stripEl.append(menuBtn, outlets, el('div', { class: 'os-strip-right' }, soundBtn, lcd));

  const tickClock = () => {
    const now = new Date();
    lcd.textContent = formatClock(now);
    lcd.title = now.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };
  tickClock();
  setInterval(tickClock, 10000);

  const renderSound = () => soundBtn.replaceChildren(iconEl(sound.muted ? 'volumeOff' : 'volumeOn'), sound.muted ? 'Off' : 'Snd');
  renderSound();
  sound.on('mute', renderSound);
  soundBtn.addEventListener('click', () => {
    sound.unlock();
    sound.toggleMuted();
    if (!sound.muted) sound.tick();
  });

  const renderOutlets = () => {
    outlets.replaceChildren();
    for (const win of os.wm.list().sort((a, b) => a.created - b.created)) {
      const active = os.wm.focusedId === win.id && !win.minimized;
      const btn = el('button', { class: `os-outlet${active ? ' active' : ''}${win.minimized ? ' minimized' : ''}`, type: 'button', role: 'listitem', title: win.title },
        el('i', { class: 'led' }), iconEl(win.iconName), el('span', {}, win.title));
      btn.addEventListener('click', () => {
        win.toggleMinimize();
        sound.tick();
      });
      outlets.append(btn);
    }
  };
  os.wm.on('change', renderOutlets);

  let menu = null;
  const closeMenu = () => {
    if (!menu) return;
    menu.remove();
    menu = null;
    menuBtn.classList.remove('open');
    menuBtn.setAttribute('aria-expanded', 'false');
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
    const items = el('div', { class: 'os-menu-items' });
    for (const app of os.apps.filter((a) => a.startMenu !== false)) {
      items.append(menuItem(app.name, typeof app.iconFor === 'function' ? app.iconFor(os) : app.icon, () => os.open(app.id)));
    }
    const foot = el('div', { class: 'os-menu-foot' });
    foot.append(menuItem('About RickyOS', 'info', () => os.about()));
    foot.append(menuItem('Shut down', 'power', () => os.shutdown()));
    menu = el('div', { class: 'os-menu', role: 'menu' },
      el('div', { class: 'os-menu-head' }, el('span', { class: 'tape orange' }, 'RickyOS'), el('small', {}, 'RK-1 / v1.0')),
      items,
      foot
    );
    os.screen.append(menu);
    menuBtn.classList.add('open');
    menuBtn.setAttribute('aria-expanded', 'true');
    items.querySelector('button')?.focus();
  };

  menuBtn.addEventListener('click', () => {
    sound.unlock();
    sound.click();
    if (menu) closeMenu();
    else openMenu();
  });
  document.addEventListener('pointerdown', (e) => {
    if (menu && !menu.contains(e.target) && !menuBtn.contains(e.target)) closeMenu();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu) {
      closeMenu();
      menuBtn.focus();
    }
  });

  os.menu = { open: openMenu, close: closeMenu };
  renderOutlets();
}
