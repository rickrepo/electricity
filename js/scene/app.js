// The 3D bench: renderer, room, screens, camera rig, HUD, and the
// interaction state machine. Desktops lean in to the CRT; phones pick up
// the phone on the bench and get RickyOS in a phone layout.
import * as THREE from '../../vendor/three.min.js';
import { CSS3DRenderer } from '../../vendor/three.min.js';
import { createWorld } from './world.js';
import { createOSScreen, createCanvasScreen } from './screens.js';
import { createCameraRig, CameraKey } from './camera.js';
import { createHUD } from './hud.js';
import { createGrain } from './effects.js';
import { lockScreen } from './textures.js';
import { CAMERA_FOV, SCREEN, PHONE, CSS_SCALE } from './constants.js';
import { createTraceAnimation } from '../os/saver.js';
import { updateTweens } from '../util/tween.js';
import { sleep, isCoarsePointer, prefersReducedMotion } from '../util/dom.js';
import { bus } from '../util/events.js';
import { sound } from '../sound.js';
import { PROFILE } from '../os/content.js';

const NOTIFICATIONS = [
  ['Mom', 'Call me back when you can.'],
  ['Mom', 'Did you eat?'],
  ['Parts Co.', 'Your order of 500 resistors has shipped.'],
  ['Cat', '(paw print)'],
  ['RK-1', 'Fan speed nominal. Cat detected.'],
  ['Mom', 'Also the fern looks thirsty.'],
];

export function createScene({ stage, osElement, os, device = 'crt' }) {
  const webglEl = stage.querySelector('#webgl');
  const cssEl = stage.querySelector('#css3d');
  const hudEl = document.getElementById('hud');
  const coarse = isCoarsePointer();
  const lowPower = coarse;
  const phoneDevice = device === 'phone';
  const osKey = phoneDevice ? CameraKey.PHONE : CameraKey.MONITOR;

  const sizes = { width: stage.clientWidth || innerWidth, height: stage.clientHeight || innerHeight, pixelRatio: Math.min(devicePixelRatio || 1, lowPower ? 1.5 : 2) };
  const mouse = { x: 0, y: 0, nx: 0, ny: 0 };

  const renderer = new THREE.WebGLRenderer({ antialias: !lowPower, alpha: true, powerPreference: 'high-performance' });
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
  scene.background = new THREE.Color('#05070b');
  const cssScene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(CAMERA_FOV, sizes.width / sizes.height, 0.05, 60);
  scene.add(camera);
  // Shadow camera for the CSS3D layer: same view, scaled world (see CSS_SCALE).
  const cssCamera = new THREE.PerspectiveCamera(CAMERA_FOV, sizes.width / sizes.height, 0.05 * CSS_SCALE, 60 * CSS_SCALE);
  const syncCssCamera = () => {
    camera.getWorldPosition(cssCamera.position).multiplyScalar(CSS_SCALE);
    camera.getWorldQuaternion(cssCamera.quaternion);
    if (cssCamera.fov !== camera.fov || cssCamera.aspect !== camera.aspect) { cssCamera.fov = camera.fov; cssCamera.aspect = camera.aspect; cssCamera.updateProjectionMatrix(); }
    cssCamera.updateMatrixWorld(true);
  };

  const rig = createCameraRig({ camera, domElement: renderer.domElement, sizes, mouse, hero: phoneDevice ? 'phone' : 'crt' });
  const grain = createGrain(renderer);
  if (prefersReducedMotion() || lowPower) grain.setAmount(0.025);

  let world = null;
  let osScreen = null;
  let crtCanvasScreen = null;
  let crtTrace = null;
  let phoneCanvasScreen = null;
  let phoneLock = null;
  let started = false;
  let helpStage = 0;
  let lastRaycast = 0;
  let lightningTimer = null;
  let buzzTimer = null;
  let phoneLitTimer = null;
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const hitPoint = new THREE.Vector3();

  const setCamState = (key) => { document.body.dataset.cam = key; };
  setCamState('loading');

  const bootTasks = () => [
    { label: 'Loading fonts', run: () => Promise.race([document.fonts.ready, sleep(2500)]) },
    { label: 'Building the workshop', run: async () => { world = createWorld({ scene, bus, sound, device, lowPower }); world.setCamera(camera); rig.setPhoneScreen(world.screens.phone.position, world.screens.phone.normal, world.screens.phone.up); } },
    {
      label: phoneDevice ? 'Charging the phone' : 'Plugging in the CRT',
      run: async () => {
        const { crt, phone } = world.screens;
        if (phoneDevice) {
          osScreen = createOSScreen({ scene, cssScene, element: osElement, spec: PHONE, position: phone.position, quaternion: phone.quaternion, crt: false });
          osScreen.setPower(false);
          const canvas = document.createElement('canvas');
          canvas.width = 512;
          canvas.height = 384;
          crtCanvasScreen = createCanvasScreen({ scene, spec: SCREEN, position: crt.position, quaternion: crt.quaternion, canvas });
          crtCanvasScreen.setPower(false);
          crtTrace = createTraceAnimation(canvas, { onFrame: () => crtCanvasScreen.refresh() });
        } else {
          osScreen = createOSScreen({ scene, cssScene, element: osElement, spec: SCREEN, position: crt.position, quaternion: crt.quaternion, crt: true });
          osScreen.setPower(false);
          phoneLock = lockScreen();
          phoneCanvasScreen = createCanvasScreen({ scene, spec: PHONE, position: phone.position, quaternion: phone.quaternion, canvas: phoneLock.canvas });
        }
      },
    },
    { label: 'Compiling shaders', run: async () => { await sleep(30); renderer.compile(scene, camera); } },
    { label: 'Feeding the cat', run: () => sleep(120) },
  ];

  /* ---------- HUD ---------- */
  const hud = createHUD({
    container: hudEl,
    sound,
    onFreeLook: (on) => {
      if (rig.isOnScreen) leaveScreen();
      rig.setFreeLook(on);
      webglEl.classList.toggle('free-look', on);
      setCamState(on ? 'free' : 'idle');
      hud.clearAnchor('hover');
      hud.clearAnchor('help');
      hud.setExitLabel(coarse ? 'Back' : 'Esc  -  back');
      if (on) hud.toast(coarse ? 'Drag to look around, pinch to zoom.' : 'Drag to look around, scroll to zoom. Esc to come back.');
      else showIdleHelp();
    },
    onExit: () => {
      if (rig.freeLook) {
        rig.setFreeLook(false);
        hud.setFreeLookPressed(false);
        webglEl.classList.remove('free-look');
        setCamState('idle');
        showIdleHelp();
      } else leaveScreen();
    },
  });

  const showIdleHelp = () => {
    if (helpStage >= 2) return;
    hud.setHelp(coarse ? 'Tap anywhere to walk up to the bench' : 'Click anywhere to walk up to the bench');
  };
  const showDeskHelp = () => {
    hud.hideHelp();
    if (helpStage >= 2 || !world) return;
    if (phoneDevice) hud.anchor('help', { text: 'Tap the phone to pick it up', position: world.anchors.phoneTop });
    else hud.anchor('help', { text: coarse ? 'Tap the screen to lean in' : 'Click the screen to lean in', position: world.anchors.monitorTop });
  };

  /* ---------- pointer helpers ---------- */
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
    if (!hits.length) return null;
    hitPoint.copy(hits[0].point);
    return world.interactives.get(hits[0].object);
  };
  const inScreen = (target) => target instanceof Node && osElement.contains(target);
  const inHud = (target) => target instanceof Node && hudEl.contains(target);

  stage.addEventListener('pointermove', (e) => {
    updatePointer(e);
    if (!started || !world) return;
    if (rig.isOnScreen) {
      if (!phoneDevice && inScreen(e.target)) world.mouse.set(mouse.nx, mouse.ny);
      document.body.classList.remove('stage-hover');
      hud.clearAnchor('hover');
      return;
    }
    if (coarse) return;
    const now = performance.now();
    if (now - lastRaycast < 60) return;
    lastRaycast = now;
    const hit = raycast();
    document.body.classList.toggle('stage-hover', !!hit || rig.key === CameraKey.IDLE);
    if (hit && !rig.freeLook) hud.anchor('hover', { text: hit.label, position: hitPoint, subtle: true });
    else hud.clearAnchor('hover');
  });

  stage.addEventListener('pointerdown', (e) => {
    if (!started || !world) return;
    if (inScreen(e.target) || inHud(e.target)) return;
    if (e.button !== undefined && e.button !== 0) return;
    updatePointer(e);
    sound.unlock();
    const hit = raycast();
    if (rig.freeLook) { hit?.action(); return; }
    if (rig.key === CameraKey.IDLE) {
      if (hit && hit.name !== 'monitor' && hit.name !== 'phone') hit.action();
      goDesk();
    } else if (rig.key === CameraKey.DESK) {
      if (hit) hit.action();
      else goIdle();
    } else if (rig.isOnScreen) {
      leaveScreen();
    }
  });

  const goDesk = () => {
    rig.transition(CameraKey.DESK, { duration: 1400 });
    setCamState('desk');
    if (helpStage === 0) helpStage = 1;
    showDeskHelp();
  };
  const goIdle = () => {
    rig.transition(CameraKey.IDLE, { duration: 1600 });
    setCamState('idle');
    hud.clearAnchor('help');
    showIdleHelp();
  };
  const enterScreen = (key) => {
    if (!started || rig.freeLook || rig.key === key) return;
    rig.transition(key, { duration: key === CameraKey.PHONE ? 1400 : 1700, easing: (t) => 1 - Math.pow(1 - t, 4) });
    setCamState(key);
    if (key === osKey) osScreen?.setJitter(false);
    hud.setVisible(false);
    hud.hideHelp();
    hud.clearAnchor('help');
    hud.clearAnchor('hover');
    // On a phone visit the OS nav bar has its own "put it down" button.
    hud.setExitLabel(key === CameraKey.PHONE ? (phoneDevice ? '' : coarse ? 'Put the phone down' : 'Esc  -  put it down') : coarse ? 'Step back' : 'Esc  -  step back');
    if (key === osKey) { helpStage = 2; os.kickIdle?.(); }
  };
  const leaveScreen = () => {
    if (!rig.isOnScreen) return;
    rig.transition(CameraKey.DESK, { duration: 1100 });
    setCamState('desk');
    osScreen?.setJitter(true);
    hud.setVisible(true);
    if (document.activeElement && osElement.contains(document.activeElement)) document.activeElement.blur();
    if (helpStage < 2) showDeskHelp();
  };

  document.addEventListener('keydown', (e) => {
    if (!started) return;
    if (e.key === 'Escape') {
      if (rig.freeLook) {
        rig.setFreeLook(false);
        hud.setFreeLookPressed(false);
        webglEl.classList.remove('free-look');
        setCamState('idle');
        showIdleHelp();
      } else if (rig.isOnScreen) leaveScreen();
      else if (rig.key === CameraKey.DESK) goIdle();
      return;
    }
    if (!phoneDevice && rig.key === CameraKey.MONITOR && world && (e.key.length === 1 || e.key === 'Enter' || e.key === 'Backspace')) {
      world.keyboard.press(e.key === 'Enter' ? '\n' : e.key === 'Backspace' ? '=' : e.key);
    }
  });

  /* ---------- the phone on the bench (desktop: lock screen) ---------- */
  const litPhone = (ms = 4500) => {
    if (!phoneLock) return;
    phoneLock.draw(true);
    phoneCanvasScreen.refresh();
    clearTimeout(phoneLitTimer);
    phoneLitTimer = setTimeout(() => { phoneLock.draw(false); phoneCanvasScreen.refresh(); }, ms);
  };
  const scheduleBuzz = () => {
    clearTimeout(buzzTimer);
    buzzTimer = setTimeout(() => {
      if (phoneLock && world) {
        const [from, text] = NOTIFICATIONS[phoneLock.count % NOTIFICATIONS.length];
        phoneLock.notify(from, text);
        litPhone(5000);
        world.phone.buzz();
        sound.buzz();
      }
      scheduleBuzz();
    }, 60000 + Math.random() * 80000);
  };

  /* ---------- bus wiring ---------- */
  bus.on('monitor:click', () => {
    if (rig.key === CameraKey.IDLE) return goDesk();
    if (rig.key !== CameraKey.DESK) return;
    if (phoneDevice) {
      // The CRT is only drawing traces on a phone visit; the portfolio lives on the phone.
      sound.tick();
      litPhone();
      world.phone.buzz();
      hud.toast('The RK-1 is busy drawing traces. Everything is on the phone.', 2600);
      return;
    }
    enterScreen(CameraKey.MONITOR);
  });
  bus.on('phone:click', () => {
    if (rig.key === CameraKey.IDLE) return goDesk();
    if (rig.key !== CameraKey.DESK) return;
    if (phoneDevice) enterScreen(CameraKey.PHONE);
    else {
      litPhone();
      sound.tick();
      hud.toast(phoneLock?.count ? `Ricky's phone. Locked. ${phoneLock.count} notification${phoneLock.count === 1 ? '' : 's'} from Mom, probably.` : "Ricky's phone. Locked. The passcode is not 1234.");
    }
  });
  bus.on('machine:switch', () => {
    sound.clunk();
    if (phoneDevice) {
      const on = !world.machine.powered;
      world.machine.setPowered(on);
      crtCanvasScreen?.setPower(on);
      world.setScreenPower(on);
      if (on) crtTrace?.start(); else crtTrace?.stop();
    } else os.togglePower();
  });
  bus.on('toast', (text) => hud.toast(text));
  bus.on('lamp', (on) => hud.toast(on ? 'Ring lamp on' : 'Ring lamp off', 1300));
  bus.on('lights', (on) => { if (started) hud.toast(on ? 'Lights on' : 'Lights off', 1300); });
  bus.on('bench', ({ cmd, args = [] }) => {
    if (!world) return;
    if (cmd === 'lights') { world.lights.room.set(!world.lights.room.on); sound.tubeBuzz(world.lights.room.on); }
    else if (cmd === 'meow') world.cat.poke();
    else if (cmd === 'storm') doLightning();
    else if (cmd === 'led') world.leds.pattern(args[0] || 'chase');
  });
  os.bus.on('power', (on) => {
    osScreen?.setPower(on);
    if (!world) return;
    if (!phoneDevice) {
      world.setScreenPower(on);
      world.machine.setPowered(on);
      if (on) hud.clearAnchor('boot');
      else hud.anchor('boot', { text: 'Flip the switch to boot the RK-1', position: world.anchors.machineSwitch });
    }
  });
  os.bus.on('activity', () => world?.leds.pulse());
  os.bus.on('toast', (text) => hud.toast(text));
  os.bus.on('leave', () => { if (rig.isOnScreen) leaveScreen(); });

  const doLightning = async () => {
    if (!world) return;
    world.lightning();
    sound.thunder(1.2 + Math.random() * 2.2);
  };
  const scheduleLightning = () => {
    clearTimeout(lightningTimer);
    lightningTimer = setTimeout(async () => { await doLightning(); scheduleLightning(); }, 25000 + Math.random() * 45000);
  };

  /* ---------- resize ---------- */
  const onResize = () => {
    sizes.width = stage.clientWidth || innerWidth;
    sizes.height = stage.clientHeight || innerHeight;
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();
    cssCamera.aspect = camera.aspect;
    cssCamera.updateProjectionMatrix();
    renderer.setSize(sizes.width, sizes.height);
    cssRenderer.setSize(sizes.width, sizes.height);
  };
  window.addEventListener('resize', onResize);

  /* ---------- render loop ---------- */
  let elapsed = 0;
  let ambientTick = 0;
  let lastFrame = performance.now();
  const tick = () => {
    const now = performance.now();
    const dt = Math.min(0.05, (now - lastFrame) / 1000);
    lastFrame = now;
    elapsed += dt;
    updateTweens();
    rig.update(dt);
    world?.update(dt, elapsed);
    osScreen?.update(camera);
    renderer.render(scene, camera);
    grain.render(elapsed);
    syncCssCamera();
    cssRenderer.render(cssScene, cssCamera);
    hud.updateAnchors(camera, sizes.width, sizes.height);
    ambientTick += dt;
    if (ambientTick > 0.25) {
      ambientTick = 0;
      sound.setAmbientFocus(1 - THREE.MathUtils.clamp((rig.distanceToScreen - 0.5) / 3, 0, 1));
    }
  };
  renderer.setAnimationLoop(tick);

  return {
    bootTasks,
    renderer,
    scene,
    camera,
    rig,
    device,
    get world() { return world; },
    async start() {
      started = true;
      sound.rainStart();
      rig.transition(CameraKey.IDLE, { duration: 3200, easing: (t) => 1 - Math.pow(1 - t, 3) });
      setCamState('idle');
      await sleep(450);
      await world.flicker();
      world.machine.setPowered(true);
      if (phoneDevice) {
        crtCanvasScreen.setPower(true);
        world.setScreenPower(true);
        crtTrace.start();
      }
      await sleep(350);
      os.boot();
      hud.reveal(PROFILE.name, PROFILE.title);
      await sleep(1400);
      showIdleHelp();
      scheduleLightning();
      if (!phoneDevice) { buzzTimer = setTimeout(() => { phoneLock.notify('Mom', 'Call me back when you can.'); litPhone(5000); world.phone.buzz(); sound.buzz(); scheduleBuzz(); }, 24000); }
    },
  };
}
