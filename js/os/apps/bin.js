// The parts bin (recycle bin). Nothing in it is important.
import { el, clear } from '../../util/dom.js';
import { iconEl } from '../icons.js';
import { BIN_ITEMS } from '../content.js';
import { store } from '../../util/storage.js';
import { sound } from '../../sound.js';

const items = () => (store.get('bin.emptied', false) ? [] : BIN_ITEMS);

export default {
  id: 'bin',
  name: 'Bin',
  icon: 'binFull',
  iconFor: () => (items().length ? 'binFull' : 'bin'),
  desktop: true,
  corner: 'bottom-right',
  startMenu: false,
  launch(os) {
    const { width: W, height: H } = os.wm.bounds;
    return os.wm.open({
      id: 'bin', title: 'Bin', icon: 'bin',
      width: Math.min(500, W - 160), height: Math.min(380, H - 160), minWidth: 300, minHeight: 200,
      render: (body) => {
        const list = el('div', { class: 'bin-list' });
        const emptyBtn = el('button', { class: 'os-btn', type: 'button' }, 'Empty the bin');
        const render = () => {
          clear(list);
          const current = items();
          if (!current.length) {
            list.append(el('div', { class: 'bin-empty' }, 'The bin is empty. Suspiciously tidy.'));
            emptyBtn.disabled = true;
            return;
          }
          for (const item of current) {
            const restore = el('button', { class: 'os-btn sm', type: 'button' }, 'Restore');
            restore.addEventListener('click', async () => {
              sound.error();
              await os.dialog({ title: 'Bin', icon: 'warning', message: item.name.includes('virus') ? 'Nice try. That one stays in the bin.' : item.name.includes('DO_NOT_FLASH') ? 'The toaster has suffered enough.' : `"${item.name}" was not restored. Some things are better left deleted.` });
            });
            list.append(el('div', { class: 'bin-item' }, iconEl(item.type), el('span', {}, item.name), el('small', {}, item.size), restore));
          }
        };
        emptyBtn.addEventListener('click', async () => {
          const answer = await os.dialog({ title: 'Empty the bin', icon: 'warning', message: `Permanently delete ${items().length} items? (They are fictional, but still.)`, buttons: ['Delete', 'Cancel'] });
          if (answer !== 'Delete') return;
          store.set('bin.emptied', true);
          sound.boom();
          render();
          os.bus.emit('bin:change');
        });
        body.append(el('div', { class: 'bin' }, list, emptyBtn));
        render();
      },
    });
  },
};
