// Notepad: read the bundled text files, edit them, and save to localStorage.
import { el } from '../../util/dom.js';
import { FILES } from '../content.js';
import { store } from '../../util/storage.js';
import { sound } from '../../sound.js';

const savedFiles = () => store.get('files', {}) || {};

export default {
  id: 'notepad',
  name: 'Notepad',
  icon: 'notepad',
  desktop: true,
  startMenu: true,
  launch(os, { file = 'README.txt' } = {}) {
    const { width: W, height: H } = os.wm.bounds;
    return os.wm.open({
      id: `notepad:${file}`,
      appId: 'notepad',
      title: `Notepad - ${file}`,
      icon: 'notepad',
      width: Math.min(560, W - 140),
      height: Math.min(440, H - 140),
      minWidth: 300,
      minHeight: 200,
      bodyClass: 'flush no-scroll',
      render: (body, win) => mountNotepad(os, body, win, file),
    });
  },
};

function mountNotepad(os, body, win, file) {
  const textarea = el('textarea', { spellcheck: false, 'aria-label': `Contents of ${file}` });
  const load = () => {
    textarea.value = savedFiles()[file] ?? FILES[file] ?? '';
  };
  load();
  const name = el('span', { class: 'notepad-name' }, file);
  const save = el('button', { class: 'os-btn sm', type: 'button' }, 'Save');
  const revert = el('button', { class: 'os-btn sm', type: 'button' }, 'Revert');
  const openSel = el('select', { class: 'os-select', style: { width: 'auto', padding: '3px 6px', fontSize: '12px' }, 'aria-label': 'Open file' },
    [...new Set([...Object.keys(FILES), ...Object.keys(savedFiles())])].map((f) => el('option', { value: f, selected: f === file }, f))
  );
  openSel.addEventListener('change', () => {
    if (openSel.value !== file) os.open('notepad', { file: openSel.value });
    openSel.value = file;
  });
  save.addEventListener('click', () => {
    const files = savedFiles();
    files[file] = textarea.value;
    store.set('files', files);
    name.textContent = `${file} (saved)`;
    sound.success();
    setTimeout(() => (name.textContent = file), 1500);
  });
  revert.addEventListener('click', () => {
    const files = savedFiles();
    delete files[file];
    store.set('files', files);
    load();
    sound.tick();
  });
  textarea.addEventListener('input', () => (name.textContent = `${file} *`));
  textarea.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      save.click();
    }
  });
  body.append(el('div', { class: 'notepad' }, el('div', { class: 'notepad-bar' }, openSel, save, revert, name), textarea));
  setTimeout(() => textarea.focus({ preventScroll: true }), 60);
}
