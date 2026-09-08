// Music: a chiptune player with a bouncing visualiser. Songs are synthesized
// live from the patterns in js/songs.js.
import { el, clear } from '../../util/dom.js';
import { iconEl } from '../icons.js';
import { SONGS, songDurationSeconds } from '../../songs.js';
import { sound } from '../../sound.js';

const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export default {
  id: 'music',
  name: 'Music',
  icon: 'music',
  desktop: true,
  startMenu: true,
  launch(os, { songId, autoplay } = {}) {
    const existing = os.wm.get('music');
    const { width: W, height: H } = os.wm.bounds;
    const win = existing || os.wm.open({
      id: 'music',
      title: 'Music - RickyAmp',
      icon: 'music',
      width: Math.min(420, W - 160),
      height: Math.min(500, H - 100),
      minWidth: 300,
      minHeight: 320,
      bodyClass: 'flush no-scroll',
      render: (body, w) => mountMusic(os, body, w),
    });
    if (existing) {
      existing.restore();
      existing.focus();
    }
    if (songId) {
      const song = SONGS.find((s) => s.id === songId);
      if (song) {
        sound.unlock();
        sound.chip.load(song);
        if (autoplay !== false) sound.chip.play();
      }
    }
    return win;
  },
};

function mountMusic(os, body, win) {
  const chip = sound.chip;
  if (!chip.song) chip.load(SONGS[0]);

  const title = el('div', { class: 'music-title' });
  const meta = el('div', { class: 'music-meta' }, el('span'), el('span'));
  const viz = el('canvas', { class: 'music-viz', width: 360, height: 56, 'aria-hidden': 'true' });
  const lcd = el('div', { class: 'music-lcd' }, title, meta, viz);
  const playBtn = el('button', { class: 'os-btn', type: 'button', 'aria-label': 'Play or pause' });
  const prevBtn = el('button', { class: 'os-btn', type: 'button', 'aria-label': 'Previous track' }, iconEl('prev'));
  const nextBtn = el('button', { class: 'os-btn', type: 'button', 'aria-label': 'Next track' }, iconEl('next'));
  const list = el('div', { class: 'music-list', role: 'list' });
  const vol = el('input', { type: 'range', min: 0, max: 100, value: Math.round(chip.volume * 100), 'aria-label': 'Music volume' });
  body.append(el('div', { class: 'music' }, lcd, el('div', { class: 'music-transport' }, prevBtn, playBtn, nextBtn), list, el('div', { class: 'music-vol' }, 'Vol', vol)));

  const index = () => SONGS.indexOf(chip.song);

  const render = () => {
    const song = chip.song;
    title.textContent = song ? `${chip.playing ? '>' : '||'} ${song.title}` : 'No track';
    meta.firstChild.textContent = song ? `${song.artist} - ${song.bpm} BPM` : '';
    playBtn.replaceChildren(iconEl(chip.playing ? 'pause' : 'play'));
    clear(list);
    SONGS.forEach((s, i) => {
      const row = el('button', { class: `music-track${s === song ? ' playing' : ''}`, type: 'button', role: 'listitem' },
        el('span', { class: 'music-num' }, String(i + 1).padStart(2, '0')),
        el('span', {}, s.title, el('small', {}, `${s.artist} - ${s.tracks.length} channels`)),
        el('span', { class: 'music-dur' }, fmt(songDurationSeconds(s)))
      );
      row.addEventListener('click', () => {
        sound.unlock();
        chip.load(s);
        chip.play();
      });
      list.append(row);
    });
  };

  const offChange = chip.on('change', render);
  playBtn.addEventListener('click', () => {
    sound.unlock();
    chip.toggle();
  });
  prevBtn.addEventListener('click', () => {
    const i = (index() - 1 + SONGS.length) % SONGS.length;
    chip.load(SONGS[i]);
    chip.play();
  });
  nextBtn.addEventListener('click', () => {
    const i = (index() + 1) % SONGS.length;
    chip.load(SONGS[i]);
    chip.play();
  });
  vol.addEventListener('input', () => chip.setVolume(vol.value / 100));

  const vctx = viz.getContext('2d');
  let raf = null;
  const drawViz = () => {
    raf = requestAnimationFrame(drawViz);
    const w = viz.width;
    const h = viz.height;
    vctx.clearRect(0, 0, w, h);
    const levels = chip.playing ? chip.levels(28) : new Array(28).fill(0);
    const bw = w / levels.length;
    levels.forEach((v, i) => {
      const bh = Math.max(2, v * (h - 4));
      vctx.fillStyle = v > 0.7 ? '#ff6b4a' : '#9dff9d';
      for (let y = 0; y < bh; y += 4) vctx.fillRect(i * bw + 1, h - y - 3, bw - 3, 2);
    });
    if (chip.song) {
      const dur = songDurationSeconds(chip.song);
      meta.lastChild.textContent = `${fmt(chip.progress * dur)} / ${fmt(dur)}`;
    }
  };
  drawViz();
  win.onCleanup(() => {
    cancelAnimationFrame(raf);
    offChange();
  });
  render();
}
