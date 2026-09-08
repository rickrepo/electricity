// The Recycle Bin. Nothing in it is important, which is why it is still there.
import { el, clear } from '../../util/dom.js';
import { iconEl } from '../icons.js';
import { TRASH_ITEMS } from '../content.js';
import { store } from '../../util/storage.js';
import { sound } from '../../sound.js';

const items = () => (store.get('trash.emptied', false) ? [] : TRASH_ITEMS);

export default {
  id: 'trash',
  name: 'Recycle Bin',
  icon: 'trashFull',
  iconFor: () => (items().length ? 'trashFull' : 'trash'),
  desktop: true,
  corner: 'bottom-right',
  startMenu: false,
  launch(os) {
    const { width: W, height: H } = os.wm.bounds;
    return os.wm.open({
      id: 'trash',
      title: 'Recycle Bin',
      icon: 'trash',
      width: Math.min(480, W - 160),
      height: Math.min(360, H - 160),
      minWidth: 300,
      minHeight: 200,
      render: (body) => {
        const list = el('div', { class: 'trash-list' });
        const emptyBtn = el('button', { class: 'os-btn', type: 'button' }, 'Empty Recycle Bin');
        const render = () => {
          clear(list);
          const current = items();
          if (!current.length) {
            list.append(el('div', { class: 'trash-empty' }, 'The Recycle Bin is empty. Very tidy.'));
            emptyBtn.disabled = true;
            return;
          }
          for (const item of current) {
            const restore = el('button', { class: 'os-btn sm', type: 'button' }, 'Restore');
            restore.addEventListener('click', async () => {
              sound.error();
              await os.dialog({
                title: 'Recycle Bin',
                icon: 'warning',
                message: item.name.includes('virus') ? 'Nice try. That one stays in the bin.' : `"${item.name}" was not restored. Some things are better left deleted.`,
              });
            });
            list.append(el('div', { class: 'trash-item' }, iconEl(item.type), el('span', {}, item.name), el('small', {}, item.size), restore));
          }
        };
        emptyBtn.addEventListener('click', async () => {
          const answer = await os.dialog({ title: 'Empty Recycle Bin', icon: 'warning', message: `Permanently delete ${items().length} items? (They are fictional, but still.)`, buttons: ['Delete', 'Cancel'] });
          if (answer !== 'Delete') return;
          store.set('trash.emptied', true);
          sound.boom();
          render();
          os.bus.emit('trash:change');
        });
        body.append(el('div', { class: 'trash' }, list, emptyBtn));
        render();
      },
    });
  },
};
