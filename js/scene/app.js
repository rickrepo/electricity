// The 3D experience: renderer, room, CSS3D monitor, camera rig, HUD, and the
// interaction state machine (idle -> desk -> monitor, free look, clicks on
// objects in the room).
import * as THREE from '../../vendor/three.min.js';
import { CSS3DRenderer } from '../../vendor/three.min.js';
import { createWorld } from './world.js';
import { createMonitorScreen } from './monitor.js';
import { createCameraRig, CameraKey } from './camera.js';
import { createHUD } from './hud.js';
import { createGrain } from './effects.js';
import { CAMERA_FOV } from './constants.js';
import { updateTweens } from '../util/tween.js';
import { sleep, isCoarsePointer, prefersReducedMotion } from '../util/dom.js';
import { bus } from '../util/events.js';
import { sound } from '../sound.js';
import { SONGS } from '../songs.js';
import { PROFILE } from '../os/content.js';

export function createScene({ stage, osElement, os, onSwitchMode }) {
  const webglEl = stage.querySelector('#webgl');
  const cssEl = stage.querySelector('#css3d');
  const hudEl = document.getElementById('hud');

  const sizes = { width: stage.clientWidth || innerWidth, height: stage.clientHeight || innerHeight, pixelRatio: Math.min(devicePixelRatio || 1, 2) };
  const mouse = { x: 0, y: 0, nx: 0, ny: 0 };

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(sizes.pixelRatio);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  webglEl.append(renderer.domElement);

  const cssRenderer = new CSS3DRenderer();
  cssRenderer.setSize(sizes.width, sizes.height);
  cssEl.append(cssRenderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#06080a');
  const cssScene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(CAMERA_FOV, sizes.width / sizes.height, 0.05, 60);
  scene.add(camera);

  const rig = createCameraRig({ camera, domElement: renderer.domElement, sizes, mouse });
  const grain = createGrain(renderer);
  if (prefersReducedMotion()) grain.setAmount(0.02);

  let world = null;
  let monitor = null;
  let hud = null;
  let started = false;
  let helpStage = 0;
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let hovered = null;
  let lastRaycast = 0;
  let leaveTimer = null;
  let lastFrame = performance.now();

  const setCamState = (key) => {
    document.body.dataset.cam = key;
  };
  setCamState('loading');

  /* ---------- boot tasks (run by the BIOS screen) ---------- */
  const bootTasks = () => [
    { label: 'Loading fonts', run: () => Promise.race([document.fonts.ready, sleep(2500)]) },
    { label: 'Building the room', run: async () => { world = createWorld({ scene, bus, sound }); world.setCamera(camera); } },
    { label: 'Plugging in the CRT', run: async () => { monitor = createMonitorScreen({ scene, cssScene, osElement }); } },
    { label: 'Compiling shaders', run: async () => { await sleep(30); renderer.compile(scene, camera); } },
    { label: 'Warming up the lamp', run: () => sleep(120) },
    { label: 'Tuning the radio', run: () => sleep(90) },
  ];

  /* ---------- interaction ---------- */
  const updatePointer = (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.nx = (e.clientX / sizes.width) * 2 - 1;
    mouse.ny = (e.clientY / sizes.height) * 2 - 1;
    pointer.set(mouse.nx, -mouse.ny);
  };

  const raycast = () => {
    if (!world) return null;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects([...world.interactives.keys()], false);
    return hits.length ? world.interactives.get(hits[0].object) : null;
  };

  const inScreen = (target) => target instanceof Node && osElement.contains(target);
  const inHud = (target) => target instanceof Node && hudEl.contains(target);

  stage.addEventListener('pointermove', (e) => {
    updatePointer(e);
    if (!started || !world) return;
    const now = performance.now();
    if (now - lastRaycast < 60) return;
    lastRaycast = now;
    if (rig.key === CameraKey.MONITOR || inScreen(e.target)) {
      hovered = null;
      document.body.classList.remove('stage-hover');
      hud.hint(null);
      return;
    }
    const hit = raycast();
    hovered = hit;
    document.body.classList.toggle('stage-hover', !!hit || rig.key === CameraKey.IDLE);
    hud.hint(hit ? hit.label : null, e.clientX, e.clientY);
  });

  stage.addEventListener('pointerdown', (e) => {
    if (!started || !world) return;
    if (inScreen(e.target) || inHud(e.target)) return;
    if (e.button !== 0) return;
    updatePointer(e);
    sound.unlock();
    const hit = raycast();
    if (hit) {
      hit.action();
      return;
    }
    if (rig.freeLook) return;
    if (rig.key === CameraKey.IDLE) {
      rig.transition(CameraKey.DESK, { duration: 1400 });
      setCamState('desk');
      if (helpStage === 0) {
        helpStage = 1;
        hud.setHelp(isCoarsePointer() ? 'Tap the monitor to take a closer look' : 'Move your mouse over the monitor to take a closer look');
      }
    } else if (rig.key === CameraKey.DESK) {
      rig.transition(CameraKey.IDLE, { duration: 1600 });
      setCamState('idle');
    } else if (rig.key === CameraKey.MONITOR) {
      leaveMonitor();
    }
  });

  const enterMonitor = () => {
    if (!started || rig.freeLook) return;
    clearTimeout(leaveTimer);
    if (rig.key === CameraKey.MONITOR) return;
    if (rig.key !== CameraKey.DESK) return;
    rig.transition(CameraKey.MONITOR, { duration: 1800, easing: (t) => 1 - Math.pow(1 - t, 4) });
    setCamState('monitor');
    monitor?.setJitter(false);
    hud.setVisible(false);
    hud.hideHelp();
    helpStage = 2;
  };

  const leaveMonitor = () => {
    if (rig.key !== CameraKey.MONITOR) return;
    rig.transition(CameraKey.DESK, { duration: 1100 });
    setCamState('desk');
    monitor?.setJitter(true);
    hud.setVisible(true);
    if (document.activeElement && osElement.contains(document.activeElement)) document.activeElement.blur();
  };

  osElement.addEventListener('pointerenter', enterMonitor);
  osElement.addEventListener('pointerdown', () => {
    if (rig.key === CameraKey.DESK) enterMonitor();
  });
  osElement.addEventListener('pointerleave', (e) => {
    if (rig.key !== CameraKey.MONITOR) return;
    if (e.pointerType === 'touch') return;
    clearTimeout(leaveTimer);
    leaveTimer = setTimeout(() => {
      if (rig.key === CameraKey.MONITOR && !osElement.matches(':hover')) leaveMonitor();
    }, 350);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || !started) return;
    if (rig.freeLook) {
      rig.setFreeLook(false);
      hud.setFreeLookPressed(false);
      webglEl.classList.remove('free-look');
      setCamState('idle');
    } else if (rig.key === CameraKey.MONITOR) leaveMonitor();
    else if (rig.key === CameraKey.DESK) {
      rig.transition(CameraKey.IDLE, { duration: 1600 });
      setCamState('idle');
    }
  });

  /* ---------- HUD ---------- */
  hud = createHUD({
    container: hudEl,
    sound,
    onFreeLook: (on) => {
      if (rig.key === CameraKey.MONITOR) leaveMonitor();
      rig.setFreeLook(on);
      webglEl.classList.toggle('free-look', on);
      setCamState(on ? 'free' : 'idle');
      hud.hint(null);
      if (on) hud.toast('Drag to orbit, scroll to zoom. Esc to return.');
    },
    onFlat: () => onSwitchMode?.('os'),
    onExit: () => {
      if (rig.freeLook) {
        rig.setFreeLook(false);
        hud.setFreeLookPressed(false);
        webglEl.classList.remove('free-look');
        setCamState('idle');
      } else leaveMonitor();
    },
  });

  /* ---------- bus wiring ---------- */
  bus.on('monitor:power', () => {
    os.togglePower();
    sound.click();
  });
  bus.on('tower:power', () => {
    sound.click();
    hud.toast('Reset button pressed. Rebooting RickyOS...');
    os.reboot();
  });
  os.bus.on('power', (on) => {
    monitor?.setPower(on);
    world?.setScreenPower(on);
  });
  bus.on('radio:toggle', () => {
    const chip = sound.chip;
    if (!chip.song) chip.load(SONGS[0]);
    chip.toggle();
    hud.toast(chip.playing ? `Radio: now playing "${chip.song.title}"` : 'Radio off');
  });
  bus.on('lamp', (on) => hud.toast(on ? 'Desk lamp on' : 'Desk lamp off', 1400));
  bus.on('night', (night) => hud.toast(night ? 'Lights off. Cozy.' : 'Lights on.', 1400));

  /* ---------- resize ---------- */
  const onResize = () => {
    sizes.width = stage.clientWidth || innerWidth;
    sizes.height = stage.clientHeight || innerHeight;
    sizes.pixelRatio = Math.min(devicePixelRatio || 1, 2);
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(sizes.pixelRatio);
    cssRenderer.setSize(sizes.width, sizes.height);
  };
  window.addEventListener('resize', onResize);

  /* ---------- render loop ---------- */
  let elapsed = 0;
  let ambientTick = 0;
  const tick = () => {
    const now = performance.now();
    const dt = Math.min(0.05, (now - lastFrame) / 1000);
    lastFrame = now;
    elapsed += dt;
    updateTweens();
    rig.update(dt);
    world?.update(dt, elapsed);
    monitor?.update(camera);
    renderer.render(scene, camera);
    grain.render(elapsed);
    cssRenderer.render(cssScene, camera);
    ambientTick += dt;
    if (ambientTick > 0.25) {
      ambientTick = 0;
      const d = rig.distanceToScreen;
      sound.setAmbientFocus(1 - THREE.MathUtils.clamp((d - 0.5) / 3, 0, 1));
    }
  };
  renderer.setAnimationLoop(tick);

  return {
    bootTasks,
    renderer,
    scene,
    camera,
    rig,
    get world() {
      return world;
    },
    async start() {
      started = true;
      sound.ambientStart();
      rig.transition(CameraKey.IDLE, { duration: 2600, easing: (t) => 1 - Math.pow(1 - t, 3) });
      setCamState('idle');
      os.boot();
      hud.intro({ name: PROFILE.name, title: PROFILE.title });
      await sleep(1400);
      if (helpStage === 0) hud.setHelp(isCoarsePointer() ? 'Tap anywhere to sit down' : 'Click anywhere to sit down');
    },
  };
}
