// Credits: a click-through slideshow.
import { el, clear } from '../../util/dom.js';
import { CREDITS } from '../content.js';
import { sound } from '../../sound.js';

export default {
  id: 'credits',
  name: 'Credits',
  icon: 'credits',
  desktop: true,
  startMenu: true,
  launch(os) {
    const { width: W, height: H } = os.wm.bounds;
    return os.wm.open({
      id: 'credits',
      title: 'Credits',
      icon: 'credits',
      width: Math.min(560, W - 160),
      height: Math.min(400, H - 160),
      minWidth: 300,
      minHeight: 220,
      bodyClass: 'flush no-scroll',
      render: (body, win) => {
        let index = -1;
        let timer = null;
        const root = el('div', { class: 'credits', tabindex: '0', role: 'button', 'aria-label': 'Next credits slide' });
        body.append(root);
        const show = () => {
          index = (index + 1) % (CREDITS.length + 1);
          clear(root);
          if (index === CREDITS.length) {
            root.append(
              el('div', { class: 'credits-slide' },
                el('h2', {}, 'Thanks for visiting'),
                el('div', { class: 'credits-sub' }, 'ricky.example, est. 1998 (allegedly)'),
                el('p', {}, 'Every credit on the previous slides is real, except the ones that are not.'),
                el('div', { class: 'credits-hint' }, 'Click to start over')
              )
            );
          } else {
            const slide = CREDITS[index];
            root.append(
              el('div', { class: 'credits-slide' },
                index === 0 ? el('h2', {}, 'Credits') : null,
                index === 0 ? el('div', { class: 'credits-sub' }, `Ricky Portfolio Showcase, ${new Date().getFullYear()}`) : null,
                el('h3', {}, slide.title),
                el('div', { class: 'credits-rows' }, slide.rows.flatMap(([a, b]) => [el('span', {}, a), el('span', {}, b)])),
                el('div', { class: 'credits-hint' }, `Click to continue (${index + 1}/${CREDITS.length})`)
              )
            );
          }
          sound.tick();
          clearTimeout(timer);
          timer = setTimeout(show, 6000);
        };
        root.addEventListener('click', show);
        root.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            show();
          }
        });
        win.onCleanup(() => clearTimeout(timer));
        show();
      },
    });
  },
};
