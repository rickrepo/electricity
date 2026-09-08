// Entry point. Decides between the 3D desk and plain 2D RickyOS, runs the
// BIOS boot screen, then starts the chosen experience.
import { hasWebGL, isCoarsePointer, sleep } from './util/dom.js';
import { runBoot } from './boot.js';
import { createOS } from './os/os.js';
import { sound } from './sound.js';

async function main() {
  const params = new URLSearchParams(location.search);
  const webgl = hasWebGL();
  const smallScreen = Math.min(innerWidth, innerHeight) < 560 || (isCoarsePointer() && innerWidth < 900);
  const requested = params.get('mode');

  let mode;
  if (requested === 'os') mode = 'os';
  else if (requested === '3d') mode = webgl ? 'scene' : 'os';
  else mode = webgl && !smallScreen ? 'scene' : 'os';

  document.body.dataset.mode = mode;

  const switchMode = (next) => {
    const url = new URL(location.href);
    url.searchParams.set('mode', next === 'scene' ? '3d' : 'os');
    location.href = url.toString();
  };

  const osRoot = document.getElementById('os-root');
  const stage = document.getElementById('stage');
  const bootEl = document.getElementById('boot');

  const os = createOS(osRoot, { mode, onSwitchMode: () => switchMode(mode === 'scene' ? 'os' : 'scene') });
  window.__rickyOS = os;

  let scene = null;
  let tasks;
  const notes = [];

  if (mode === 'scene') {
    try {
      const { createScene } = await import('./scene/app.js');
      scene = createScene({ stage, osElement: osRoot, os, onSwitchMode: switchMode });
      window.__rickyScene = scene;
      tasks = scene.bootTasks();
      if (isCoarsePointer()) notes.push('Best experienced with a mouse and keyboard.');
    } catch (err) {
      console.error('[main] 3D scene failed to initialise, falling back to 2D', err);
      mode = 'os';
      document.body.dataset.mode = 'os';
      stage.hidden = true;
      notes.push('The 3D desk could not start in this browser, so RickyOS is running in 2D.');
    }
  }
  if (mode === 'os') {
    stage.hidden = true;
    tasks = [
      { label: 'Loading fonts', run: () => Promise.race([document.fonts.ready, sleep(2500)]) },
      { label: 'Preparing desktop', run: () => sleep(140) },
      { label: 'Indexing applications', run: () => sleep(120) },
      { label: 'Polishing icons', run: () => sleep(90) },
    ];
    if (requested === '3d' && !webgl) notes.push('WebGL is not available here, so the 3D desk is disabled.');
    else if (!requested && webgl && smallScreen) notes.push('Small screen detected: starting in 2D mode.');
  }

  const altMode = mode === 'scene' ? 'os' : webgl ? 'scene' : null;
  const result = await runBoot({ container: bootEl, mode, tasks, notes, altMode, onAlt: (m) => switchMode(m) });
  if (result.switched) return;

  sound.unlock();
  sound.startup();
  if (scene) scene.start();
  else os.boot();
}

// Handy for poking around from the console: ricky.os.open("terminal"), etc.
window.ricky = { get os() { return window.__rickyOS; }, get scene() { return window.__rickyScene; }, sound };

main().catch((err) => {
  console.error(err);
  const boot = document.getElementById('boot');
  if (boot) boot.innerHTML = `<p class="boot-red">CRITICAL ERROR: ${String(err.message || err)}</p><p>Reload the page to try again.</p>`;
});
