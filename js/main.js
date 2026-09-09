// Entry point. The bench is 3D only: desktops lean in to the CRT, phones
// pick up the phone lying on the bench.
import { hasWebGL, isCoarsePointer, sleep } from './util/dom.js';
import { runGate, showGateFailure } from './boot.js';
import { createOS } from './os/os.js';
import { fitPhoneToViewport } from './scene/constants.js';
import { sound } from './sound.js';

async function main() {
  const gateEl = document.getElementById('gate');
  if (!document.body.dataset.cam) document.body.dataset.cam = 'loading';
  const stage = document.getElementById('stage');
  const osRoot = document.getElementById('os-root');

  if (!hasWebGL()) {
    showGateFailure(gateEl, 'This bench needs WebGL, and this browser does not have it switched on. Try a current version of Chrome, Firefox, Safari, or Edge.');
    return;
  }

  const coarse = isCoarsePointer();
  const device = coarse && Math.min(innerWidth, innerHeight) < 700 ? 'phone' : 'crt';
  document.body.dataset.device = device;
  if (device === 'phone') fitPhoneToViewport(innerWidth, innerHeight);

  const os = createOS(osRoot, { layout: device });
  window.__rickyOS = os;

  const { createScene } = await import('./scene/app.js');
  const scene = createScene({ stage, osElement: osRoot, os, device });
  window.__rickyScene = scene;
  const tasks = scene.bootTasks();
  const notes = [];
  if (device === 'phone') notes.push('Phone detected: the phone on the bench is yours.');

  await runGate({
    container: gateEl,
    notes,
    touch: coarse,
    prepare: async (setStatus) => {
      for (const task of tasks) {
        setStatus(task.label);
        await task.run?.();
        await sleep(40);
      }
    },
  });

  sound.unlock();
  scene.start();
}

main().catch((err) => {
  console.error(err);
  showGateFailure(document.getElementById('gate'), `Something went wrong while switching on: ${String(err.message || err)}. Reload the page to try again.`);
});

// Handy from the console: ricky.os.open('terminal'), ricky.scene.world.cat.poke()
window.ricky = { get os() { return window.__rickyOS; }, get scene() { return window.__rickyScene; }, sound };
