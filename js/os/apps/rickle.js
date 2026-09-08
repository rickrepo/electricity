// Rickle: a five-letter word game. New word every day, or grab a random one.
import { el, clear, sleep } from '../../util/dom.js';
import { ANSWERS } from './words.js';
import { store } from '../../util/storage.js';
import { sound } from '../../sound.js';

const ROWS = 6;
const COLS = 5;
const KEY_ROWS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];

const dailyIndex = () => Math.floor(Date.now() / 86400000) % ANSWERS.length;

export default {
  id: 'rickle',
  name: 'Rickle',
  icon: 'rickle',
  desktop: true,
  startMenu: true,
  launch(os) {
    const { height: H } = os.wm.bounds;
    return os.wm.open({
      id: 'rickle',
      title: 'Rickle - daily word',
      icon: 'rickle',
      width: 440,
      height: Math.min(640, H - 40),
      minWidth: 360,
      minHeight: 420,
      render: (body, win) => mountRickle(os, body, win),
    });
  },
};

function mountRickle(os, body, win) {
  let answer = ANSWERS[dailyIndex()].toUpperCase();
  let daily = true;
  let guesses = [];
  let current = '';
  let done = false;
  let busy = false;

  const stats = store.get('rickle.stats', { played: 0, won: 0, streak: 0 });
  const msg = el('div', { class: 'rickle-msg', role: 'status' });
  const grid = el('div', { class: 'rickle-grid', 'aria-label': 'Guesses' });
  const keys = el('div', { class: 'rickle-keys' });
  const statsEl = el('div', { class: 'rickle-stats' });
  const newBtn = el('button', { class: 'os-btn sm', type: 'button' }, 'Random word');
  const tiles = [];
  const keyButtons = new Map();

  for (let r = 0; r < ROWS; r++) {
    const row = el('div', { class: 'rickle-row' });
    const rowTiles = [];
    for (let c = 0; c < COLS; c++) {
      const t = el('div', { class: 'rickle-tile' });
      row.append(t);
      rowTiles.push(t);
    }
    tiles.push({ row, tiles: rowTiles });
    grid.append(row);
  }

  const makeKey = (label, wide = false) => {
    const btn = el('button', { class: `rickle-key${wide ? ' wide' : ''}`, type: 'button' }, label);
    btn.addEventListener('click', () => handleKey(label === 'ENTER' ? 'Enter' : label === 'DEL' ? 'Backspace' : label));
    keyButtons.set(label, btn);
    return btn;
  };
  KEY_ROWS.forEach((letters, i) => {
    const row = el('div', { class: 'rickle-keys-row' });
    if (i === 2) row.append(makeKey('ENTER', true));
    for (const ch of letters) row.append(makeKey(ch));
    if (i === 2) row.append(makeKey('DEL', true));
    keys.append(row);
  });

  body.append(
    el('div', { class: 'rickle' },
      el('div', { class: 'rickle-head' }, el('h2', {}, 'Rick', el('span', {}, 'le')), newBtn),
      msg, grid, keys, statsEl
    )
  );

  const renderStats = () => {
    const pct = stats.played ? Math.round((stats.won / stats.played) * 100) : 0;
    statsEl.textContent = `Played ${stats.played} - Won ${pct}% - Streak ${stats.streak}`;
  };
  renderStats();

  let msgTimer = null;
  const say = (text, sticky = false) => {
    msg.textContent = text;
    msg.classList.add('show');
    clearTimeout(msgTimer);
    if (!sticky) msgTimer = setTimeout(() => msg.classList.remove('show'), 1800);
  };

  const renderCurrent = () => {
    const rowTiles = tiles[guesses.length]?.tiles;
    if (!rowTiles) return;
    rowTiles.forEach((t, i) => {
      t.textContent = current[i] || '';
      t.classList.toggle('filled', !!current[i]);
    });
  };

  const evaluate = (guess) => {
    const result = new Array(COLS).fill('absent');
    const remaining = {};
    for (let i = 0; i < COLS; i++) {
      if (guess[i] === answer[i]) result[i] = 'correct';
      else remaining[answer[i]] = (remaining[answer[i]] || 0) + 1;
    }
    for (let i = 0; i < COLS; i++) {
      if (result[i] === 'correct') continue;
      if (remaining[guess[i]] > 0) {
        result[i] = 'present';
        remaining[guess[i]]--;
      }
    }
    return result;
  };

  const rank = { absent: 1, present: 2, correct: 3 };
  const paintKey = (letter, state) => {
    const btn = keyButtons.get(letter);
    if (!btn) return;
    const cur = ['correct', 'present', 'absent'].find((s) => btn.classList.contains(s));
    if (!cur || rank[state] > rank[cur]) {
      btn.classList.remove('correct', 'present', 'absent');
      btn.classList.add(state);
    }
  };

  const submit = async () => {
    if (current.length < COLS) {
      tiles[guesses.length].row.classList.add('shake');
      setTimeout(() => tiles[guesses.length].row.classList.remove('shake'), 450);
      say('Not enough letters');
      sound.error();
      return;
    }
    busy = true;
    const guess = current;
    const result = evaluate(guess);
    const rowTiles = tiles[guesses.length].tiles;
    for (let i = 0; i < COLS; i++) {
      rowTiles[i].classList.add('flip');
      await sleep(180);
      rowTiles[i].classList.add(result[i]);
      paintKey(guess[i], result[i]);
      sound.tick();
    }
    guesses.push(guess);
    current = '';
    busy = false;
    if (guess === answer) {
      done = true;
      stats.played++;
      stats.won++;
      stats.streak++;
      store.set('rickle.stats', stats);
      renderStats();
      sound.success();
      say(['Genius!', 'Magnificent!', 'Impressive!', 'Splendid!', 'Great!', 'Phew!'][guesses.length - 1], true);
    } else if (guesses.length === ROWS) {
      done = true;
      stats.played++;
      stats.streak = 0;
      store.set('rickle.stats', stats);
      renderStats();
      sound.error();
      say(`The word was ${answer}`, true);
    }
  };

  const handleKey = (key) => {
    if (done || busy) return;
    if (key === 'Enter') return submit();
    if (key === 'Backspace') {
      current = current.slice(0, -1);
      renderCurrent();
      return;
    }
    if (/^[a-zA-Z]$/.test(key) && current.length < COLS) {
      current += key.toUpperCase();
      renderCurrent();
      sound.key();
    }
  };

  const reset = (random) => {
    daily = !random;
    answer = (random ? ANSWERS[Math.floor(Math.random() * ANSWERS.length)] : ANSWERS[dailyIndex()]).toUpperCase();
    guesses = [];
    current = '';
    done = false;
    for (const { tiles: t } of tiles) t.forEach((tile) => { tile.textContent = ''; tile.className = 'rickle-tile'; });
    for (const btn of keyButtons.values()) btn.classList.remove('correct', 'present', 'absent');
    msg.classList.remove('show');
    win.setTitle(daily ? 'Rickle - daily word' : 'Rickle - random word');
    sound.open();
  };

  newBtn.addEventListener('click', () => reset(true));
  body.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'Enter' || e.key === 'Backspace' || /^[a-zA-Z]$/.test(e.key)) {
      e.preventDefault();
      handleKey(e.key);
    }
  });
  say('Guess the five-letter word');
}
