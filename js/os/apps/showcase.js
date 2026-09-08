// The Showcase: a small "site within the site" with Ricky's (placeholder)
// bio, experience, projects, and a contact form.
import { el, clear, seededRandom, sleep } from '../../util/dom.js';
import { iconEl } from '../icons.js';
import { PROFILE, ABOUT, EXPERIENCE, PROJECT_CATEGORIES, PROJECTS, CONTACT } from '../content.js';
import { sound } from '../../sound.js';
import { AVATAR, AVATAR_COLORS, DESK_SCENE, DESK_COLORS, pixelCanvas } from '../../util/pixelart.js';

const PAGE_FILES = {
  home: 'INDEX.HTM',
  about: 'ABOUT.HTM',
  experience: 'WORK.HTM',
  projects: 'PROJECTS.HTM',
  'projects/software': 'SOFTWARE.HTM',
  'projects/hardware': 'HARDWARE.HTM',
  'projects/music': 'MUSIC.HTM',
  contact: 'CONTACT.HTM',
};

/* ---------- placeholder art ---------- */

/** A fake "screenshot" of an app, generated from a seed so every project looks different. */
function fakeScreenshot(seed, accent) {
  const rnd = seededRandom(seed * 7919);
  const w = 160;
  const h = 120;
  const canvas = el('canvas', { width: w, height: h });
  const ctx = canvas.getContext('2d');
  const palettes = [
    ['#0a0f0c', '#9dff9d', '#57a557', '#ffe27a'],
    ['#fbf8f0', '#1e1b18', '#3aa0a8', accent],
    ['#1b2a3a', '#8ad0ff', '#ffd166', '#ff6b4a'],
    ['#2a1e3d', '#c9a8ff', '#ff8fd6', '#ffe27a'],
  ];
  const pal = palettes[Math.floor(rnd() * palettes.length)];
  ctx.fillStyle = pal[0];
  ctx.fillRect(0, 0, w, h);
  // title bar
  ctx.fillStyle = pal[1];
  ctx.fillRect(0, 0, w, 10);
  ctx.fillStyle = pal[0];
  ctx.fillRect(3, 3, 4, 4);
  ctx.fillRect(w - 7, 3, 4, 4);
  const style = Math.floor(rnd() * 3);
  if (style === 0) {
    // bars chart
    for (let i = 0; i < 12; i++) {
      const bh = 10 + rnd() * 80;
      ctx.fillStyle = i % 3 === 0 ? pal[3] : pal[2];
      ctx.fillRect(8 + i * 12, h - 8 - bh, 8, bh);
    }
  } else if (style === 1) {
    // text lines + window blocks
    for (let i = 0; i < 9; i++) {
      ctx.fillStyle = rnd() > 0.8 ? pal[3] : pal[2];
      ctx.fillRect(8, 16 + i * 11, 20 + rnd() * 100, 4);
    }
    ctx.fillStyle = pal[1];
    ctx.fillRect(100, 40, 50, 40);
    ctx.fillStyle = pal[3];
    ctx.fillRect(104, 44, 42, 6);
  } else {
    // pixel grid
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
  // scanlines
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  for (let y = 0; y < h; y += 3) ctx.fillRect(0, y, w, 1);
  return canvas;
}

/* ---------- app ---------- */

export default {
  id: 'showcase',
  name: 'Showcase',
  icon: 'showcase',
  desktop: true,
  startMenu: true,
  launch(os, { page } = {}) {
    const existing = os.wm.get('showcase');
    if (existing) {
      existing.restore();
      existing.focus();
      if (page) existing.app?.navigate(page);
      return existing;
    }
    const { width: W, height: H } = os.wm.bounds;
    const win = os.wm.open({
      id: 'showcase',
      title: `Ricky - ${PROFILE.showcaseLabel}`,
      icon: 'showcase',
      width: Math.min(980, W - 90),
      height: Math.min(690, H - 60),
      minWidth: 360,
      minHeight: 280,
      bodyClass: 'flush no-scroll',
      status: { left: `(c) ${PROFILE.year} Ricky`, right: 'C:\\RICKY\\INDEX.HTM' },
      render: (body, w) => {
        w.app = mountShowcase(os, body, w, page || 'home');
      },
    });
    return win;
  },
};

function mountShowcase(os, body, win, initialPage) {
  const nav = el('nav', { class: 'sc-nav', 'aria-label': 'Showcase sections' });
  const pageEl = el('div', { class: 'sc-page' });
  body.append(el('div', { class: 'sc' }, nav, pageEl));
  const state = { page: initialPage };
  const links = new Map();

  const link = (page, label, sub = false) => {
    const btn = el('button', { class: `sc-link${sub ? ' sub' : ''}`, type: 'button' }, label);
    btn.addEventListener('click', () => navigate(page));
    links.set(page, btn);
    return btn;
  };

  nav.append(
    el('div', { class: 'sc-nav-head' }, el('h1', {}, PROFILE.name), el('small', {}, PROFILE.showcaseLabel)),
    link('home', 'Home'),
    link('about', 'About'),
    link('experience', 'Experience'),
    link('projects', 'Projects'),
    link('projects/software', 'Software', true),
    link('projects/hardware', 'Hardware', true),
    link('projects/music', 'Music', true),
    link('contact', 'Contact'),
    el('div', { class: 'sc-nav-foot' }, `${PROFILE.name}.exe`, el('br'), 'running since 1998')
  );

  const PAGES = {
    home: renderHome,
    about: renderAbout,
    experience: renderExperience,
    projects: renderProjects,
    'projects/software': () => renderProjectList('software'),
    'projects/hardware': () => renderProjectList('hardware'),
    'projects/music': () => renderProjectList('music'),
    contact: renderContact,
  };

  function navigate(page) {
    if (!PAGES[page]) page = 'home';
    state.page = page;
    for (const [key, btn] of links) btn.classList.toggle('active', key === page || (page.startsWith('projects') && key === 'projects' && page !== 'projects' ? false : false) || key === page);
    if (page.startsWith('projects/')) links.get('projects')?.classList.add('active');
    clear(pageEl);
    pageEl.append(PAGES[page]());
    pageEl.scrollTop = 0;
    win.setStatus(`(c) ${PROFILE.year} Ricky`, `C:\\RICKY\\${PAGE_FILES[page] || 'INDEX.HTM'}`);
    sound.tick();
  }

  const inlineLink = (page, label) => {
    const b = el('button', { class: 'sc-inline-link', type: 'button' }, label);
    b.addEventListener('click', () => navigate(page));
    return b;
  };

  function renderHome() {
    const links = el('div', { class: 'sc-home-links' });
    for (const [page, label] of [['about', 'About'], ['experience', 'Experience'], ['projects', 'Projects'], ['contact', 'Contact']]) {
      const b = el('button', { class: 'os-btn', type: 'button' }, label);
      b.addEventListener('click', () => navigate(page));
      links.append(b);
    }
    return el('div', { class: 'sc-home' },
      el('div', { class: 'sc-home-hero' },
        el('h1', {}, 'Hi, I\'m ', el('span', {}, PROFILE.name), '.'),
        el('h2', {}, PROFILE.title),
        el('p', { class: 'sc-lead' }, PROFILE.tagline),
        links,
        el('div', { class: 'sc-construction' }, el('i'), 'This site is permanently under construction')
      ),
      el('div', { class: 'sc-marquee' }, el('span', {}, `Welcome to my corner of the internet ~ best viewed on a CRT ~ you are visitor number ${(1337 + (Date.now() % 100000)).toLocaleString()} ~ no cookies were harmed ~ thanks for stopping by!`))
    );
  }

  function renderAbout() {
    const fig1 = el('figure', { class: 'sc-figure' }, pixelCanvas(DESK_SCENE, DESK_COLORS, 8), el('figcaption', {}, ABOUT.figure1));
    const fig2 = el('figure', { class: 'sc-figure left' }, pixelCanvas(AVATAR, AVATAR_COLORS, 12), el('figcaption', {}, ABOUT.figure2));
    const page = el('div', {}, el('h1', {}, 'Welcome'), el('h3', {}, `I'm ${PROFILE.name}.`));
    ABOUT.intro.forEach((t) => page.append(el('p', {}, t)));
    page.append(el('h2', {}, 'About me'), fig1);
    ABOUT.story.forEach((t) => page.append(el('p', {}, t)));
    page.append(el('h2', {}, 'Hobbies'), fig2);
    for (const hobby of ABOUT.hobbies) {
      page.append(el('p', {}, el('b', {}, hobby.label, ': '), hobby.text, ' ', inlineLink(hobby.page, 'See the projects'), '.'));
    }
    page.append(el('p', { style: { clear: 'both' } }, ABOUT.outro, ' ', el('a', { href: `mailto:${PROFILE.email}` }, PROFILE.email), '.'));
    return page;
  }

  function renderExperience() {
    const page = el('div', {}, el('h1', {}, 'Experience'), el('p', { class: 'sc-lead' }, 'Places I have worked, and what I broke and fixed while there.'));
    for (const job of EXPERIENCE) {
      const tags = el('div', { class: 'sc-tags' }, job.tags.map((t) => el('span', { class: 'sc-tag' }, t)));
      page.append(
        el('section', { class: 'sc-job' },
          el('h2', {}, job.company),
          el('div', { class: 'sc-url' }, job.url),
          el('div', { class: 'sc-role' }, el('h3', {}, job.role), el('span', { class: 'sc-period' }, job.period)),
          el('p', {}, job.summary),
          el('ul', {}, job.bullets.map((b) => el('li', {}, b))),
          tags
        )
      );
    }
    return page;
  }

  function renderProjects() {
    const cats = el('div', { class: 'sc-cats' });
    for (const cat of PROJECT_CATEGORIES) {
      const card = el('button', { class: 'sc-cat', type: 'button' },
        iconEl(cat.icon),
        el('div', {}, el('h2', {}, cat.title), el('small', {}, cat.subtitle.toUpperCase()), el('p', { style: { margin: '8px 0 0', fontSize: '13px' } }, cat.blurb)),
        el('span', { class: 'sc-cat-arrow' }, '>')
      );
      card.addEventListener('click', () => navigate(`projects/${cat.id}`));
      cats.append(card);
    }
    return el('div', {}, el('h1', {}, 'Projects'), el('h3', {}, '& hobbies'), el('p', {}, 'Three piles of things I made on purpose. Pick a pile.'), cats);
  }

  function renderProjectList(category) {
    const cat = PROJECT_CATEGORIES.find((c) => c.id === category);
    const back = el('button', { class: 'os-btn sm sc-back', type: 'button' }, iconEl('back'), 'All projects');
    back.addEventListener('click', () => navigate('projects'));
    const page = el('div', {}, back, el('h1', {}, cat.title), el('p', { class: 'sc-lead' }, cat.blurb));
    const accent = getComputedStyle(os.root).getPropertyValue('--os-accent').trim() || '#ff6b4a';
    for (const project of PROJECTS[category]) {
      const shot = el('div', { class: 'sc-project-shot' }, fakeScreenshot(project.seed, accent));
      const info = el('div', {},
        el('h3', {}, project.title, ' ', el('span', { class: 'sc-period' }, project.year)),
        el('p', {}, project.description),
        el('div', { class: 'sc-tags' }, project.tags.map((t) => el('span', { class: 'sc-tag' }, t)))
      );
      if (project.songId) {
        const play = el('button', { class: 'os-btn sm', type: 'button', style: { marginTop: '10px' } }, iconEl('play'), 'Play in Music');
        play.addEventListener('click', () => os.open('music', { songId: project.songId, autoplay: true }));
        info.append(play);
      }
      page.append(el('article', { class: 'sc-project' }, shot, info));
    }
    return page;
  }

  function renderContact() {
    const name = el('input', { class: 'os-input', type: 'text', name: 'name', autocomplete: 'name', placeholder: 'Ada Lovelace' });
    const email = el('input', { class: 'os-input', type: 'email', name: 'email', autocomplete: 'email', placeholder: 'ada@example.com' });
    const message = el('textarea', { class: 'os-textarea', name: 'message', placeholder: 'Tell me about the strange thing you want to build.' });
    const submit = el('button', { class: 'os-btn primary', type: 'submit' }, 'Send message');
    const form = el('form', { class: 'sc-contact-form', novalidate: true },
      el('div', { class: 'os-field' }, el('label', { class: 'os-label', for: 'sc-name' }, 'Your name *'), name),
      el('div', { class: 'os-field' }, el('label', { class: 'os-label', for: 'sc-email' }, 'Email *'), email),
      el('div', { class: 'os-field' }, el('label', { class: 'os-label', for: 'sc-message' }, 'Message *'), message),
      submit
    );
    name.id = 'sc-name';
    email.id = 'sc-email';
    message.id = 'sc-message';
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
      form.replaceWith(
        el('div', { class: 'sc-contact-sent' },
          el('p', { style: { margin: 0 } }, el('b', {}, 'Thanks, ', name.value.trim(), '! '), CONTACT.sent, el('a', { href: `mailto:${PROFILE.email}` }, PROFILE.email), '.')
        )
      );
    });
    const socials = el('div', { class: 'sc-socials' }, PROFILE.links.map((l) => el('a', { class: 'os-btn sm', href: l.url, target: '_blank', rel: 'noopener', title: l.hint }, l.label)));
    return el('div', {},
      el('h1', {}, 'Contact'),
      el('p', {}, CONTACT.intro),
      el('p', {}, el('b', {}, 'Email: '), el('a', { href: `mailto:${PROFILE.email}` }, PROFILE.email)),
      socials,
      form
    );
  }

  navigate(initialPage);
  return { navigate };
}
