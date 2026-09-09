// Jukebox: plays the chiptune loops. The oscilloscope on the bench follows.
import { el, clear } from '../../util/dom.js';
import { iconEl } from '../icons.js';
import { SONGS, songDurationSeconds } from '../../songs.js';
import { sound } from '../../sound.js';

const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export default {
  id: 'jukebox',
  name: 'Jukebox',
  icon: 'jukebox',
  desktop: true,
  startMenu: true,
  launch(os, { songId, autoplay, path } = {}) {
    const wanted = songId || path || null;
    const existing = os.wm.get('jukebox');
    const { width: W, height: H } = os.wm.bounds;
    const win = existing || os.wm.open({
      id: 'jukebox', title: 'Jukebox', icon: 'jukebox',
      width: Math.min(430, W - 160), height: Math.min(520, H - 100), minWidth: 300, minHeight: 340,
      bodyClass: 'no-scroll dark',
      render: (body, w) => mountJukebox(os, body, w),
    });
    if (existing) {
      existing.restore();
      existing.focus();
    }
    if (wanted) {
      const song = SONGS.find((s) => s.id === wanted);
      if (song) {
        sound.unlock();
        sound.chip.load(song);
        if (autoplay !== false) sound.chip.play();
      }
    }
    return win;
  },
};

function mountJukebox(os, body, win) {
  const chip = sound.chip;
  if (!chip.song) chip.load(SONGS[0]);
  const title = el('div', { class: 'jb-title' });
  const meta = el('div', { class: 'jb-meta' }, el('span'), el('span'));
  const viz = el('canvas', { class: 'jb-viz', width: 380, height: 60, 'aria-hidden': 'true' });
  const playBtn = el('button', { class: 'os-btn primary', type: 'button', 'aria-label': 'Play or pause' });
  const prevBtn = el('button', { class: 'os-btn', type: 'button', 'aria-label': 'Previous track' }, iconEl('prev'));
  const nextBtn = el('button', { class: 'os-btn', type: 'button', 'aria-label': 'Next track' }, iconEl('next'));
  const list = el('div', { class: 'jb-list', role: 'list' });
  const vol = el('input', { class: 'os-range', type: 'range', min: 0, max: 100, value: Math.round(chip.volume * 100), 'aria-label': 'Music volume' });
  body.append(el('div', { class: 'jb' }, el('div', { class: 'jb-lcd' }, title, meta, viz), el('div', { class: 'jb-transport' }, prevBtn, playBtn, nextBtn), list, el('div', { class: 'jb-vol' }, 'Vol', vol)));

  const index = () => SONGS.indexOf(chip.song);
  const render = () => {
    const song = chip.song;
    title.textContent = song ? `${chip.playing ? '>' : '||'} ${song.title}` : 'No track';
    meta.firstChild.textContent = song ? `${song.artist} - ${song.bpm} BPM` : '';
    playBtn.replaceChildren(iconEl(chip.playing ? 'pause' : 'play'));
    clear(list);
    SONGS.forEach((s, i) => {
      const row = el('button', { class: `jb-track${s === song ? ' playing' : ''}`, type: 'button', role: 'listitem' },
        el('span', { class: 'jb-num' }, String(i + 1).padStart(2, '0')),
        el('span', {}, s.title, el('small', {}, `${s.artist} - ${s.tracks.length} channels`)),
        el('span', { class: 'jb-dur' }, fmt(songDurationSeconds(s)))
      );
      row.addEventListener('click', () => { sound.unlock(); chip.load(s); chip.play(); });
      list.append(row);
    });
  };
  const offChange = chip.on('change', render);
  playBtn.addEventListener('click', () => { sound.unlock(); chip.toggle(); });
  prevBtn.addEventListener('click', () => { chip.load(SONGS[(index() - 1 + SONGS.length) % SONGS.length]); chip.play(); });
  nextBtn.addEventListener('click', () => { chip.load(SONGS[(index() + 1) % SONGS.length]); chip.play(); });
  vol.addEventListener('input', () => chip.setVolume(vol.value / 100));

  const vctx = viz.getContext('2d');
  let raf = null;
  const draw = () => {
    raf = requestAnimationFrame(draw);
    const w = viz.width;
    const h = viz.height;
    vctx.clearRect(0, 0, w, h);
    const levels = chip.playing ? chip.levels(30) : new Array(30).fill(0);
    const bw = w / levels.length;
    levels.forEach((v, i) => {
      const bh = Math.max(2, v * (h - 4));
      vctx.fillStyle = v > 0.7 ? '#ff7a1a' : '#9dff9d';
      for (let y = 0; y < bh; y += 4) vctx.fillRect(i * bw + 1, h - y - 3, bw - 3, 2);
    });
    if (chip.song) {
      const dur = songDurationSeconds(chip.song);
      meta.lastChild.textContent = `${fmt(chip.progress * dur)} / ${fmt(dur)}`;
    }
  };
  draw();
  win.onCleanup(() => { cancelAnimationFrame(raf); offChange(); });
  render();
}
