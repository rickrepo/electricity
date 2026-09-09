// The Notebook: Ricky's lab notebook. Hello, About, Work, Builds, Contact.
import { el, clear, seededRandom, sleep } from '../../util/dom.js';
import { iconEl } from '../icons.js';
import { PROFILE, ABOUT, WORK, BUILDS, BUILD_CATEGORIES, CONTACT } from '../content.js';
import { AVATAR, AVATAR_COLORS, DESK_SCENE, DESK_COLORS, pixelCanvas } from '../../util/pixelart.js';
import { sound } from '../../sound.js';

const PAGES = [
  { id: 'hello', label: 'Hello', color: '#ff7a1a' },
  { id: 'about', label: 'About', color: '#4fe3c1' },
  { id: 'work', label: 'Work', color: '#ffb02e' },
  { id: 'builds', label: 'Builds', color: '#b8773f' },
  { id: 'contact', label: 'Contact', color: '#52e07a' },
];

/** A fake "screenshot" of a build, generated from a seed. */
function fakeScreenshot(seed, accent) {
  const rnd = seededRandom(seed * 7919);
  const w = 160;
  const h = 120;
  const canvas = el('canvas', { width: w, height: h });
  const ctx = canvas.getContext('2d');
  const palettes = [
    ['#0a0f0c', '#9dff9d', '#57a557', '#ffe27a'],
    ['#f3eee4', '#1c1a17', '#4fe3c1', accent],
    ['#1b2a3a', '#8ad0ff', '#ffd166', accent],
    ['#0d1b2a', '#b8773f', '#e6c27a', '#4fe3c1'],
  ];
  const pal = palettes[Math.floor(rnd() * palettes.length)];
  ctx.fillStyle = pal[0];
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = pal[1];
  ctx.fillRect(0, 0, w, 10);
  ctx.fillStyle = pal[0];
  ctx.fillRect(3, 3, 4, 4);
  ctx.fillRect(w - 7, 3, 4, 4);
  const style = Math.floor(rnd() * 3);
  if (style === 0) {
    for (let i = 0; i < 12; i++) {
      const bh = 10 + rnd() * 80;
      ctx.fillStyle = i % 3 === 0 ? pal[3] : pal[2];
      ctx.fillRect(8 + i * 12, h - 8 - bh, 8, bh);
    }
  } else if (style === 1) {
    for (let i = 0; i < 9; i++) {
      ctx.fillStyle = rnd() > 0.8 ? pal[3] : pal[2];
      ctx.fillRect(8, 16 + i * 11, 20 + rnd() * 100, 4);
    }
    ctx.fillStyle = pal[1];
    ctx.fillRect(100, 40, 50, 40);
    ctx.fillStyle = pal[3];
    ctx.fillRect(104, 44, 42, 6);
  } else {
    for (let y = 14; y < h - 4; y += 8) {
      for (let x = 4; x < w - 4; x += 8) {
        const v = rnd();
        if (v > 0.72) {
          ctx.fillStyle = v > 0.92 ? pal[3] : pal[2];
          ctx.fillRect(x, y, 6, 6);
        }
      }
    }
  }
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  for (let y = 0; y < h; y += 3) ctx.fillRect(0, y, w, 1);
  return canvas;
}

export default {
  id: 'notebook',
  name: 'Notebook',
  icon: 'notebook',
  desktop: true,
  startMenu: true,
  launch(os, { path, page } = {}) {
    const target = page || (path ? path.split('/')[0] : null);
    const existing = os.wm.get('notebook');
    if (existing) {
      existing.restore();
      existing.focus();
      if (target) existing.app?.navigate(target);
      return existing;
    }
    const { width: W, height: H } = os.wm.bounds;
    return os.wm.open({
      id: 'notebook',
      title: 'Notebook',
      icon: 'notebook',
      width: Math.min(960, W - 100),
      height: Math.min(680, H - 60),
      minWidth: 360,
      minHeight: 280,
      bodyClass: 'no-scroll',
      status: { left: `Ricky's notebook`, right: '' },
      render: (body, win) => {
        win.app = mountNotebook(os, body, win, target || 'hello');
      },
    });
  },
};

function mountNotebook(os, body, win, initialPage) {
  const tabs = el('nav', { class: 'nb-tabs', 'aria-label': 'Notebook sections' });
  const pageEl = el('div', { class: 'nb-page' });
  body.append(el('div', { class: 'nb' }, tabs, pageEl));
  const tabEls = new Map();
  for (const p of PAGES) {
    const tab = el('button', { class: 'nb-tab', type: 'button', style: { '--tab-color': p.color } }, el('i'), p.label);
    tab.addEventListener('click', () => navigate(p.id));
    tabs.append(tab);
    tabEls.set(p.id, tab);
  }
  tabs.append(el('div', { class: 'nb-tabs-foot' }, 'Lab notebook', el('br'), `vol. ${PROFILE.year}`, el('br'), 'all entries fictional'));

  const renderers = { hello: renderHello, about: renderAbout, work: renderWork, builds: renderBuilds, contact: renderContact };
  let current = null;

  function navigate(page) {
    if (!renderers[page]) page = 'hello';
    current = page;
    for (const [id, tab] of tabEls) tab.classList.toggle('active', id === page);
    clear(pageEl);
    pageEl.append(renderers[page]());
    pageEl.scrollTop = 0;
    win.setStatus(`Ricky's notebook`, `page: ${page}`);
    os.setHash(`notebook/${page}`);
    sound.tick();
  }

  const link = (page, label) => {
    const b = el('button', { class: 'nb-link', type: 'button' }, label);
    b.addEventListener('click', () => navigate(page));
    return b;
  };

  function renderHello() {
    const actions = el('div', { class: 'nb-hero-actions' });
    for (const [page, label, cls] of [['about', 'Read about me', 'primary'], ['builds', 'See the builds', ''], ['contact', 'Say hello', '']]) {
      const b = el('button', { class: `os-btn ${cls}`, type: 'button' }, label);
      b.addEventListener('click', () => navigate(page));
      actions.append(b);
    }
    return el('div', { class: 'nb-hello' },
      el('div', { class: 'nb-sheet nb-hero' },
        el('div', { class: 'nb-eyebrow' }, `Lab notebook - entry #${PROFILE.year}`),
        el('h1', {}, 'Hi, I\'m ', el('span', {}, PROFILE.name), '.'),
        el('h2', {}, PROFILE.title),
        el('p', { class: 'nb-lead' }, PROFILE.tagline),
        actions,
        el('div', { class: 'nb-status' }, el('i'), PROFILE.status),
        el('h2', {}, 'Around the bench'),
        el('p', {}, 'Most of this computer is a toy, and the toys are the point. Type ', el('span', { class: 'os-kbd' }, 'help'), ' in the Terminal, put a record on in the Jukebox and watch the oscilloscope, or waste ten minutes in Wire Up. The Notebook is the serious part, and even that is not very serious.')
      )
    );
  }

  function renderAbout() {
    const fig1 = el('figure', { class: 'nb-figure' }, pixelCanvas(DESK_SCENE, DESK_COLORS, 8), el('figcaption', {}, ABOUT.figure1));
    const fig2 = el('figure', { class: 'nb-figure left' }, pixelCanvas(AVATAR, AVATAR_COLORS, 12), el('figcaption', {}, ABOUT.figure2));
    const page = el('div', { class: 'nb-sheet' }, el('div', { class: 'nb-eyebrow' }, 'About'), el('h1', {}, 'Who is at this bench?'));
    ABOUT.intro.forEach((t) => page.append(el('p', {}, t)));
    page.append(el('h2', {}, 'A short history'), fig1);
    ABOUT.story.forEach((t) => page.append(el('p', {}, t)));
    page.append(el('h2', {}, 'Datasheet'), fig2);
    page.append(el('dl', { class: 'nb-spec' }, ABOUT.spec.flatMap(([k, v]) => [el('dt', {}, k), el('dd', {}, v)])));
    page.append(el('p', {}, 'The full datasheet lives in Notes as ', el('button', { class: 'nb-link', type: 'button', onClick: () => os.open('notes', { file: 'datasheet.txt' }) }, 'datasheet.txt'), '.'));
    page.append(el('p', { style: { clear: 'both' } }, ABOUT.outro, ' ', el('a', { href: `mailto:${PROFILE.email}` }, PROFILE.email), '.'));
    return page;
  }

  function renderWork() {
    const page = el('div', { class: 'nb-sheet' }, el('div', { class: 'nb-eyebrow' }, 'Work'), el('h1', {}, 'Places I have worked'), el('p', { class: 'nb-lead' }, 'And what I broke and fixed while there.'));
    for (const job of WORK) {
      page.append(
        el('section', { class: 'nb-job' },
          el('h2', {}, job.company),
          el('div', { class: 'nb-role' }, el('h3', {}, job.role), el('span', { class: 'nb-period' }, job.period)),
          el('div', { class: 'nb-build .nb-bom', style: { fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--os-muted)', margin: '0 0 8px' } }, job.url),
          el('p', {}, job.summary),
          el('ul', {}, job.bullets.map((b) => el('li', {}, b))),
          el('div', { class: 'nb-chips' }, job.tags.map((t) => el('span', { class: 'os-chip' }, t)))
        )
      );
    }
    return page;
  }

  function renderBuilds() {
    const page = el('div', { class: 'nb-sheet' }, el('div', { class: 'nb-eyebrow' }, 'Builds'), el('h1', {}, 'Things made on purpose'), el('p', { class: 'nb-lead' }, 'Software, hardware, and a few chiptunes. Each one lists its bill of materials.'));
    const filter = el('div', { class: 'nb-filter' });
    const list = el('div');
    let active = 'all';
    const accent = getComputedStyle(os.root).getPropertyValue('--os-accent').trim() || '#ff7a1a';
    const renderList = () => {
      clear(list);
      for (const b of BUILDS.filter((x) => active === 'all' || x.category === active)) {
        const info = el('div', {},
          el('h3', {}, b.title, ' ', el('span', { class: 'nb-period' }, b.year)),
          el('p', {}, b.description),
          el('div', { class: 'nb-bom' }, 'Bill of materials'),
          el('div', { class: 'nb-chips' }, b.bom.map((t) => el('span', { class: 'os-chip' }, t)))
        );
        if (b.songId) {
          const play = el('button', { class: 'os-btn sm', type: 'button', style: { marginTop: '10px' } }, iconEl('play'), 'Play in Jukebox');
          play.addEventListener('click', () => os.open('jukebox', { songId: b.songId, autoplay: true }));
          info.append(play);
        }
        list.append(el('article', { class: 'nb-build' }, el('div', { class: 'nb-build-shot' }, fakeScreenshot(b.seed, accent)), info));
      }
    };
    const chips = [['all', 'All'], ...BUILD_CATEGORIES.map((c) => [c.id, c.label])].map(([id, label]) => {
      const chip = el('button', { class: `os-chip${id === active ? ' on' : ''}`, type: 'button' }, label);
      chip.addEventListener('click', () => {
        active = id;
        chips.forEach((c) => c.classList.toggle('on', c === chip));
        renderList();
        sound.tick();
      });
      return chip;
    });
    filter.append(...chips);
    page.append(filter, list);
    renderList();
    return page;
  }

  function renderContact() {
    const name = el('input', { class: 'os-input', type: 'text', id: 'nb-name', autocomplete: 'name', placeholder: 'Ada Lovelace' });
    const email = el('input', { class: 'os-input', type: 'email', id: 'nb-email', autocomplete: 'email', placeholder: 'ada@example.com' });
    const message = el('textarea', { class: 'os-textarea', id: 'nb-message', placeholder: 'Tell me about the strange thing you want to build.' });
    const submit = el('button', { class: 'os-btn primary', type: 'submit' }, 'Send message');
    const form = el('form', { class: 'nb-contact-form', novalidate: true },
      el('div', { class: 'os-field' }, el('label', { class: 'os-label', for: 'nb-name' }, 'Your name *'), name),
      el('div', { class: 'os-field' }, el('label', { class: 'os-label', for: 'nb-email' }, 'Email *'), email),
      el('div', { class: 'os-field' }, el('label', { class: 'os-label', for: 'nb-message' }, 'Message *'), message),
      submit
    );
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!name.value.trim() || !email.value.trim() || !message.value.trim()) {
        sound.error();
        await os.dialog({ title: 'Contact', icon: 'warning', message: 'All three fields are required. The form is fake, but it has standards.' });
        return;
      }
      submit.disabled = true;
      submit.textContent = 'Sending...';
      await sleep(900);
      sound.success();
      form.replaceWith(el('div', { class: 'nb-sent' }, el('p', { style: { margin: 0 } }, el('b', {}, 'Thanks, ', name.value.trim(), '! '), CONTACT.sent, el('a', { href: `mailto:${PROFILE.email}` }, PROFILE.email), '.')));
    });
    return el('div', { class: 'nb-sheet' },
      el('div', { class: 'nb-eyebrow' }, 'Contact'),
      el('h1', {}, 'Say hello'),
      el('p', {}, CONTACT.intro),
      el('p', {}, el('b', {}, 'Email: '), el('a', { href: `mailto:${PROFILE.email}` }, PROFILE.email)),
      el('div', { class: 'nb-socials' }, PROFILE.links.map((l) => el('a', { class: 'os-btn sm', href: l.url, target: '_blank', rel: 'noopener', title: l.hint }, l.label))),
      form
    );
  }

  navigate(initialPage);
  return { navigate, get page() { return current; } };
}
