// Notes: read the bundled text files, edit them, save to this browser.
import { el } from '../../util/dom.js';
import { FILES } from '../content.js';
import { store } from '../../util/storage.js';
import { sound } from '../../sound.js';

const savedFiles = () => store.get('files', {}) || {};

export default {
  id: 'notes',
  name: 'Notes',
  icon: 'notes',
  desktop: true,
  startMenu: true,
  launch(os, { file, path } = {}) {
    const name = file || path || 'README.txt';
    const { width: W, height: H } = os.wm.bounds;
    return os.wm.open({
      id: `notes:${name}`,
      appId: 'notes',
      title: `Notes - ${name}`,
      icon: 'notes',
      width: Math.min(600, W - 140),
      height: Math.min(460, H - 140),
      minWidth: 300,
      minHeight: 200,
      bodyClass: 'no-scroll',
      render: (body) => mountNotes(os, body, name),
    });
  },
};

function mountNotes(os, body, file) {
  const textarea = el('textarea', { spellcheck: false, 'aria-label': `Contents of ${file}` });
  const load = () => { textarea.value = savedFiles()[file] ?? FILES[file] ?? ''; };
  load();
  const name = el('span', { class: 'notes-name' }, file);
  const save = el('button', { class: 'os-btn sm', type: 'button' }, 'Save');
  const revert = el('button', { class: 'os-btn sm', type: 'button' }, 'Revert');
  const openSel = el('select', { class: 'os-select', style: { width: 'auto', padding: '4px 26px 4px 8px', fontSize: '12px' }, 'aria-label': 'Open file' },
    [...new Set([...Object.keys(FILES), ...Object.keys(savedFiles()), file])].map((f) => el('option', { value: f, selected: f === file }, f))
  );
  openSel.addEventListener('change', () => {
    if (openSel.value !== file) os.open('notes', { file: openSel.value });
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
  body.append(el('div', { class: 'notes' }, el('div', { class: 'notes-bar' }, openSel, save, revert, name), textarea));
  setTimeout(() => textarea.focus({ preventScroll: true }), 60);
}
