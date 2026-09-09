// Ricky's phone, 2007. You are standing in the den: the poster over the
// desk, two 1200s by the bed, the N64 under the CRT, a nitro buggy on the
// rug. The phone on the desk boots when you walk in. Click anywhere to walk
// up to the desk, click the phone to pick it up, slide to unlock.
import * as THREE from '../vendor/three.min.js';
import { OrbitControls } from '../vendor/three.min.js';
import { createPhone, SPEC } from './phone.js';
import { createPhoneOS } from './os/core.js';
import { createRoom, DESK } from './room.js';

const $ = (id) => document.getElementById(id);
const stage = $('stage');
const ui = { hint: $('hint'), fail: $('fail') };
const coarse = matchMedia('(pointer: coarse)').matches;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const WORLD_UP = new THREE.Vector3(0, 1, 0);
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

// A small photo studio for the reflections on chrome and glass.
function studioEnvironment() {
  const env = new THREE.Scene();
  const room = new THREE.Mesh(new THREE.BoxGeometry(6, 4, 6), new THREE.MeshBasicMaterial({ color: 0x7c7d81, side: THREE.BackSide }));
  room.position.y = 1.6;
  env.add(room);
  const panel = (w, h, level, x, y, z, rx, ry) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(level, level, level * 1.04), side: THREE.DoubleSide }));
    m.position.set(x, y, z);
    m.rotation.set(rx, ry, 0);
    env.add(m);
  };
  panel(2.6, 1.3, 14, 0, 3.4, 0.9, Math.PI / 2, 0);
  panel(0.5, 2.6, 9, -2.9, 1.7, 0.5, 0, Math.PI / 2);
  panel(0.5, 2.6, 6, 2.9, 1.7, -0.3, 0, -Math.PI / 2);
  panel(3.2, 0.35, 5, 0, 2.5, -2.9, 0, 0);
  return env;
}

function hasWebGL() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; }
}

function main() {
  if (!hasWebGL()) { ui.fail.hidden = false; return; }

  /* ---------- renderer, scene ---------- */
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  stage.append(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x120f0d);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(studioEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.55;
  pmrem.dispose();

  // near plane at 20 mm: nothing gets closer, and depth precision across the room depends on it
  const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 20, 20000);

  /* ---------- the room and the phone on the desk ---------- */
  const room = createRoom({ scene });
  const rig = new THREE.Group();
  const TILT = 0.314;
  rig.position.set(room.phoneSpot.x, room.phoneSpot.y + 6.05, room.phoneSpot.z + 9);
  rig.rotation.x = -TILT;
  scene.add(rig);
  const standMat = new THREE.MeshStandardMaterial({ color: 0x232527, roughness: 0.65, metalness: 0.15 });
  const base = new THREE.Mesh(new THREE.BoxGeometry(74, 6, 46), standMat);
  base.position.set(room.phoneSpot.x, room.phoneSpot.y + 3, room.phoneSpot.z);
  base.castShadow = base.receiveShadow = true;
  scene.add(base);
  const support = new THREE.Mesh(new THREE.BoxGeometry(26, 52, 6), standMat);
  support.position.set(0, 29, -SPEC.depth / 2 - 3 - 0.3);
  support.castShadow = support.receiveShadow = true;
  rig.add(support);

  const os = createPhoneOS({ carrier: 'Ricky', logo: 'R' });
  os.draw();
  const phone = createPhone({ screenCanvas: os.canvas });
  phone.group.position.y = SPEC.height / 2;
  rig.add(phone.group);

  /* ---------- light: the window, the ceiling, the desk lamp ---------- */
  const sun = new THREE.DirectionalLight(0xfff0dc, 2.6);
  sun.position.set(2600, 2500, 2100);
  sun.target.position.set(room.phoneSpot.x, room.phoneSpot.y, room.phoneSpot.z);
  scene.add(sun.target);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = sun.shadow.camera.bottom = -1100;
  sun.shadow.camera.right = sun.shadow.camera.top = 1100;
  sun.shadow.camera.near = 500;
  sun.shadow.camera.far = 8000;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 1.5;
  scene.add(sun);
  scene.add(new THREE.HemisphereLight(0xfff4e6, 0x5a4636, 0.7));
  const ceilingLight = new THREE.PointLight(0xffe6c4, 1.1, 0, 0);
  ceilingLight.position.set(200, 2450, 700);
  scene.add(ceilingLight);

  /* ---------- camera: the room, the desk, the phone in hand ---------- */
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.autoRotateSpeed = 0.35;
  controls.enabled = false;
  const phoneCenter = () => phone.group.localToWorld(new THREE.Vector3(0, 0, SPEC.depth / 2));
  const POSES = {
    room: { target: new THREE.Vector3(-100, 850, 250), distance: 2300, polar: 1.15, azimuth: 0.2, limits: { min: 700, max: 2300, polar: [0.55, 1.5], azimuth: [-0.75, 0.75] } },
    desk: { get target() { return phoneCenter(); }, distance: 430, polar: 1.25, azimuth: 0.15, limits: { min: 240, max: 1500, polar: [0.35, 1.55], azimuth: [-1.05, 1.05] } },
  };
  const applyLimits = (pose) => {
    controls.minDistance = pose.limits.min;
    controls.maxDistance = pose.limits.max;
    controls.minPolarAngle = pose.limits.polar[0];
    controls.maxPolarAngle = pose.limits.polar[1];
    controls.minAzimuthAngle = pose.limits.azimuth[0];
    controls.maxAzimuthAngle = pose.limits.azimuth[1];
  };
  const posePosition = (pose, azimuth = pose.azimuth, polar = pose.polar) => new THREE.Vector3().setFromSphericalCoords(pose.distance, polar, azimuth).add(pose.target);

  let state = 'moving'; // room | desk | up | moving
  let idleSince = performance.now();
  const look = new THREE.Vector3();
  const saved = { pos: new THREE.Vector3(), target: new THREE.Vector3(), state: 'desk' };
  const move = { active: false, start: 0, dur: 0, from: null, to: null, onDone: null };
  const tmpQ = new THREE.Quaternion();
  const sph = new THREE.Spherical();

  const flyTo = (to, dur, onDone) => {
    move.active = true;
    move.start = performance.now();
    move.dur = reduced ? 1 : dur;
    move.from = { pos: camera.position.clone(), target: look.clone(), up: camera.up.clone() };
    move.to = to;
    move.onDone = onDone;
    controls.enabled = false;
    controls.autoRotate = false;
  };
  const settle = (poseKey) => {
    camera.up.copy(WORLD_UP);
    controls.target.copy(look);
    applyLimits(POSES[poseKey]);
    controls.enabled = true;
    controls.update();
    state = poseKey;
    idleSince = performance.now();
    document.body.classList.toggle('close', poseKey !== 'room');
    setHint();
  };
  // keep the viewer's angle when moving between the room and the desk
  const currentAngles = () => { sph.setFromVector3(camera.position.clone().sub(look)); return sph; };
  const walkUp = () => {
    if (state !== 'room') return;
    const a = currentAngles();
    const pose = POSES.desk;
    const target = pose.target;
    state = 'moving';
    setHint('');
    flyTo({ pos: posePosition(pose, THREE.MathUtils.clamp(a.theta, -0.9, 0.9), THREE.MathUtils.clamp(a.phi, 0.6, 1.45)), target, up: WORLD_UP.clone() }, 1500, () => settle('desk'));
  };
  const stepBack = () => {
    if (state !== 'desk') return;
    const a = currentAngles();
    const pose = POSES.room;
    state = 'moving';
    setHint('');
    flyTo({ pos: posePosition(pose, THREE.MathUtils.clamp(a.theta, -0.8, 0.8), 1.15), target: pose.target.clone(), up: WORLD_UP.clone() }, 1400, () => settle('room'));
  };
  const fitDistance = (w, h, fill) => {
    const fov = THREE.MathUtils.degToRad(camera.fov);
    const dh = h / 2 / Math.tan(fov / 2) / fill;
    const dw = w / 2 / (Math.tan(fov / 2) * camera.aspect) / fill;
    return Math.max(dh, dw);
  };
  const handPose = () => {
    phone.group.updateWorldMatrix(true, false);
    phone.group.getWorldQuaternion(tmpQ);
    const center = phoneCenter();
    const normal = new THREE.Vector3(0, 0, 1).applyQuaternion(tmpQ);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(tmpQ);
    const d = fitDistance(SPEC.width, SPEC.height, coarse ? 0.98 : 0.92);
    return { pos: center.clone().addScaledVector(normal, d), target: center, up };
  };
  const pickUp = () => {
    if (state !== 'room' && state !== 'desk') return;
    saved.pos.copy(camera.position);
    saved.target.copy(controls.target);
    saved.state = state === 'room' ? 'desk' : state;
    look.copy(controls.target);
    state = 'moving';
    setHint('');
    document.body.classList.add('close', 'in-hand');
    flyTo(handPose(), state === 'room' ? 1600 : 950, () => { state = 'up'; setHint(); });
  };
  const putDown = () => {
    if (state !== 'up') return;
    state = 'moving';
    setHint('');
    document.body.classList.remove('in-hand');
    const back = saved.state === 'desk' && saved.pos.distanceTo(phoneCenter()) > 1500
      ? { pos: posePosition(POSES.desk), target: POSES.desk.target, up: WORLD_UP.clone() }
      : { pos: saved.pos.clone(), target: saved.target.clone(), up: WORLD_UP.clone() };
    flyTo(back, 850, () => settle(saved.state));
  };

  /* ---------- pointer: walk, pick up, press buttons, use the screen ---------- */
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const screenPlane = new THREE.Plane();
  const hitPoint = new THREE.Vector3();
  let down = null;
  let screenGrab = false;
  const setRay = (e) => {
    ndc.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
  };
  const hitsPhone = (e) => { setRay(e); return raycaster.intersectObject(phone.group, true).length > 0; };
  const deckAt = (e) => { setRay(e); for (const it of room.interactives) if (raycaster.intersectObjects(it.meshes, false).length) return it; return null; };
  const screenPoint = (e, anywhere = false) => {
    setRay(e);
    if (!anywhere) {
      const hit = raycaster.intersectObject(phone.screen, false)[0];
      if (!hit) return null;
      return { x: hit.uv.x * os.width, y: (1 - hit.uv.y) * os.height };
    }
    phone.screen.getWorldQuaternion(tmpQ);
    const n = new THREE.Vector3(0, 0, 1).applyQuaternion(tmpQ);
    screenPlane.setFromNormalAndCoplanarPoint(n, phone.screen.getWorldPosition(new THREE.Vector3()));
    if (!raycaster.ray.intersectPlane(screenPlane, hitPoint)) return null;
    const local = phone.screen.worldToLocal(hitPoint.clone());
    return { x: (local.x / SPEC.screen.width + 0.5) * os.width, y: (0.5 - local.y / SPEC.screen.height) * os.height };
  };
  const pressAnim = new Map();
  const pressButton = (which) => {
    const mesh = phone.buttons[which];
    if (pressAnim.has(mesh)) return;
    pressAnim.set(mesh, { rest: mesh.position.clone(), dir: which === 'home' ? new THREE.Vector3(0, 0, -0.35) : new THREE.Vector3(0, -0.45, 0), start: performance.now() });
    if (which === 'home') os.pressHome(); else os.pressSleep();
  };
  const buttonAt = (e) => {
    setRay(e);
    const hit = raycaster.intersectObjects([phone.buttons.home, phone.buttons.homeIcon, phone.buttons.sleep], false)[0];
    if (!hit) return null;
    return hit.object === phone.buttons.sleep ? 'sleep' : 'home';
  };

  const el = renderer.domElement;
  el.addEventListener('pointerdown', (e) => {
    down = { x: e.clientX, y: e.clientY, t: performance.now() };
    if (move.active) return;
    const p = screenPoint(e);
    if (p && os.pointer.down(p.x, p.y, performance.now())) {
      screenGrab = true;
      controls.enabled = false;
      el.setPointerCapture(e.pointerId);
    }
  });
  el.addEventListener('pointermove', (e) => {
    if (screenGrab) { const p = screenPoint(e, true); if (p) os.pointer.move(p.x, p.y, performance.now()); return; }
    if (!coarse && !down && !move.active) el.style.cursor = buttonAt(e) || hitsPhone(e) || deckAt(e) ? 'pointer' : '';
  });
  const endPointer = (e) => {
    if (screenGrab) {
      screenGrab = false;
      const p = screenPoint(e, true) || { x: -1, y: -1 };
      os.pointer.up(p.x, p.y, performance.now());
      if (state !== 'up' && state !== 'moving') controls.enabled = true;
      down = null;
      return;
    }
    if (!down) return;
    const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
    const quick = performance.now() - down.t < 700;
    down = null;
    if (moved > 8 || !quick || move.active) return;
    const button = buttonAt(e);
    if (button) return pressButton(button);
    if (state === 'up') { if (!screenPoint(e)) putDown(); return; }
    if (hitsPhone(e)) return pickUp();
    const deck = deckAt(e);
    if (deck) return deck.action();
    if (state === 'room') walkUp();
    else if (state === 'desk') stepBack();
  };
  el.addEventListener('pointerup', endPointer);
  el.addEventListener('pointercancel', () => { if (screenGrab) { screenGrab = false; os.pointer.up(-1, -1); if (state !== 'up') controls.enabled = true; } down = null; });
  el.addEventListener('contextmenu', (e) => e.preventDefault());
  controls.addEventListener('start', () => { controls.autoRotate = false; idleSince = performance.now(); });
  controls.addEventListener('end', () => { idleSince = performance.now(); });

  /* ---------- hints ---------- */
  const hints = {
    room: coarse ? 'Drag to look around  ·  tap anywhere to walk up to the desk' : 'Drag to look around  ·  click anywhere to walk up to the desk',
    desk: coarse ? 'Tap the phone to pick it up  ·  tap away to step back' : 'Click the phone to pick it up  ·  click away or Esc to step back',
    up: {
      off: coarse ? 'Press the home button to wake it  ·  tap the bezel to put it down' : 'Press the home button to wake it  ·  Esc puts it down',
      boot: '',
      lock: coarse ? 'Slide to unlock  ·  tap the bezel to put it down' : 'Slide to unlock  ·  Esc or click the bezel to put it down',
      home: coarse ? 'Safari has the about page  ·  the home button goes home' : 'Safari has the about page  ·  the home button goes home  ·  Esc puts it down',
      app: coarse ? 'Press the home button to go home' : 'Press the home button to go home  ·  Esc puts it down',
    },
  };
  function setHint(text) {
    let t = text;
    if (t === undefined) t = state === 'up' ? hints.up[os.mode] ?? '' : hints[state] ?? '';
    ui.hint.textContent = t;
    ui.hint.classList.toggle('hide', !t);
  }
  os.onMode(() => { if (state === 'up') setHint(); });
  addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === 'Escape') { if (state === 'up') putDown(); else if (state === 'desk') stepBack(); }
    if (e.key === 'h' || e.key === 'H') pressButton('home');
    if (e.key === 's' || e.key === 'S') pressButton('sleep');
  });

  /* ---------- resize ---------- */
  addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
    if (state === 'up') { const p = handPose(); camera.position.copy(p.pos); look.copy(p.target); camera.up.copy(p.up); camera.lookAt(look); }
  });

  /* ---------- walking in ---------- */
  look.copy(POSES.room.target);
  camera.position.copy(posePosition(POSES.room, 0.05, 1.22)).add(new THREE.Vector3(120, 40, 200));
  camera.lookAt(look);
  setHint('');
  flyTo({ pos: posePosition(POSES.room), target: POSES.room.target.clone(), up: WORLD_UP.clone() }, 3200, () => { settle('room'); controls.autoRotate = !reduced; });

  /* ---------- loop ---------- */
  const screenWorld = new THREE.Vector3();
  let first = true;
  let lastFrame = performance.now();
  const tick = () => {
    requestAnimationFrame(tick);
    const now = performance.now();
    const dt = Math.min(0.05, (now - lastFrame) / 1000);
    lastFrame = now;

    if (move.active) {
      const t = Math.min(1, (now - move.start) / move.dur);
      const k = easeInOut(t);
      camera.position.lerpVectors(move.from.pos, move.to.pos, k);
      look.lerpVectors(move.from.target, move.to.target, k);
      camera.up.lerpVectors(move.from.up, move.to.up, k).normalize();
      camera.lookAt(look);
      if (t >= 1) { move.active = false; move.onDone?.(); }
    } else if (state === 'up') {
      camera.lookAt(look);
    } else if (state === 'room' || state === 'desk') {
      if (state === 'room' && !controls.autoRotate && !reduced && !down && now - idleSince > 12000) controls.autoRotate = true;
      controls.update();
      look.copy(controls.target);
    }

    for (const [mesh, a] of pressAnim) {
      const t = (now - a.start) / 160;
      if (t >= 1) { mesh.position.copy(a.rest); pressAnim.delete(mesh); continue; }
      mesh.position.copy(a.rest).addScaledVector(a.dir, Math.sin(t * Math.PI));
    }
    room.update(dt);

    phone.screen.getWorldPosition(screenWorld);
    const dist = camera.position.distanceTo(screenWorld);
    const interval = dist < 300 ? 33 : dist < 900 ? 120 : 1000;
    if (os.needsRedraw(now, interval)) { os.draw(now); phone.screenTexture.needsUpdate = true; }

    renderer.render(scene, camera);
    if (first) { first = false; document.body.classList.add('ready'); setTimeout(() => os.boot(), reduced ? 200 : 1600); }
  };
  tick();

  window.ricky = { scene, camera, controls, phone, os, room, pickUp, putDown, walkUp, stepBack, pressButton, get state() { return state; } };
}

try { main(); } catch (err) { console.error(err); ui.fail.hidden = false; ui.fail.querySelector('p').textContent = `Something went wrong while drawing the room: ${err.message || err}`; }
