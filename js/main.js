// Ricky's phone: a 2007-era iPhone rebuilt from primitives, on a stand, in a
// small studio. Look it over, pick it up, slide to unlock.
import * as THREE from '../vendor/three.min.js';
import { OrbitControls, RoomEnvironment } from '../vendor/three.min.js';
import { createPhone, SPEC } from './phone.js';
import { createLockScreen } from './lockscreen.js';
import { floorAlphaTexture } from './textures.js';

const $ = (id) => document.getElementById(id);
const stage = $('stage');
const ui = { pick: $('pick'), flip: $('flip'), hint: $('hint'), fail: $('fail') };
const coarse = matchMedia('(pointer: coarse)').matches;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const WORLD_UP = new THREE.Vector3(0, 1, 0);
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

function hasWebGL() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; }
}

function main() {
  if (!hasWebGL()) { ui.fail.hidden = false; return; }

  /* ---------- renderer, scene, environment ---------- */
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  stage.append(renderer.domElement);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.9;
  pmrem.dispose();

  const camera = new THREE.PerspectiveCamera(30, innerWidth / innerHeight, 1, 6000);
  camera.position.set(150, 150, 340);

  /* ---------- the table and the stand ---------- */
  const floor = new THREE.Mesh(new THREE.CircleGeometry(720, 72), new THREE.MeshStandardMaterial({ color: 0x1b1917, roughness: 0.95, metalness: 0, transparent: true, alphaMap: floorAlphaTexture() }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const TILT = 0.314; // 18 degrees back
  const standMat = new THREE.MeshStandardMaterial({ color: 0x232527, roughness: 0.65, metalness: 0.15 });
  const base = new THREE.Mesh(new THREE.BoxGeometry(74, 6, 46), standMat);
  base.position.set(0, 3, 0);
  base.castShadow = base.receiveShadow = true;
  scene.add(base);

  const rig = new THREE.Group();
  rig.position.set(0, 6.05, 9);
  rig.rotation.x = -TILT;
  scene.add(rig);
  const support = new THREE.Mesh(new THREE.BoxGeometry(26, 52, 6), standMat);
  support.position.set(0, 29, -SPEC.depth / 2 - 3 - 0.3);
  support.castShadow = support.receiveShadow = true;
  rig.add(support);

  /* ---------- the phone ---------- */
  const lock = createLockScreen({ carrier: 'Ricky' });
  lock.draw();
  const phone = createPhone({ screenCanvas: lock.canvas });
  phone.group.position.y = SPEC.height / 2;
  rig.add(phone.group);

  /* ---------- lights ---------- */
  const key = new THREE.DirectionalLight(0xfff1e4, 2.4);
  key.position.set(180, 330, 230);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = key.shadow.camera.bottom = -170;
  key.shadow.camera.right = key.shadow.camera.top = 170;
  key.shadow.camera.near = 50;
  key.shadow.camera.far = 900;
  key.shadow.bias = -0.0002;
  key.shadow.normalBias = 0.4;
  key.shadow.radius = 3;
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xd6e4ff, 0.45);
  fill.position.set(-260, 120, 120);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(0xffffff, 0.9);
  rim.position.set(-90, 220, -320);
  scene.add(rim);
  scene.add(new THREE.AmbientLight(0xffffff, 0.12));

  /* ---------- controls ---------- */
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 62, 2);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 110;
  controls.maxDistance = 900;
  controls.maxPolarAngle = Math.PI / 2 - 0.03;
  controls.enablePan = false;
  controls.autoRotate = !reduced;
  controls.autoRotateSpeed = 0.7;
  controls.update();
  let idleSince = performance.now();
  controls.addEventListener('start', () => { controls.autoRotate = false; idleSince = performance.now(); });
  controls.addEventListener('end', () => { idleSince = performance.now(); });

  /* ---------- camera moves: pick up, put down, flip ---------- */
  let state = 'orbit'; // orbit | moving | up
  const saved = { pos: new THREE.Vector3(), target: new THREE.Vector3() };
  const move = { active: false, start: 0, dur: 0, from: null, to: null, onDone: null };
  const spin = { active: false, start: 0, dur: 0, from: 0, to: 0, radius: 0, phi: 0 };
  const tmpQ = new THREE.Quaternion();
  const look = new THREE.Vector3();

  const fitDistance = (w, h, fill) => {
    const fov = THREE.MathUtils.degToRad(camera.fov);
    const dh = h / 2 / Math.tan(fov / 2) / fill;
    const dw = w / 2 / (Math.tan(fov / 2) * camera.aspect) / fill;
    return Math.max(dh, dw);
  };
  const screenPose = () => {
    phone.group.updateWorldMatrix(true, false);
    phone.group.getWorldQuaternion(tmpQ);
    const center = phone.group.localToWorld(phone.screenCenter.clone());
    const normal = new THREE.Vector3(0, 0, 1).applyQuaternion(tmpQ);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(tmpQ);
    const d = fitDistance(SPEC.screen.width, SPEC.screen.height, coarse ? 0.97 : 0.84);
    return { pos: center.clone().addScaledVector(normal, d), target: center, up };
  };
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
  const pickUp = () => {
    if (state !== 'orbit' || spin.active) return;
    saved.pos.copy(camera.position);
    saved.target.copy(controls.target);
    look.copy(controls.target);
    state = 'moving';
    flyTo(screenPose(), 950, () => { state = 'up'; setHint(); });
    document.body.classList.add('in-hand');
    ui.pick.textContent = 'Put it down';
    ui.flip.disabled = true;
    setHint('');
  };
  const putDown = () => {
    if (state !== 'up') return;
    state = 'moving';
    flyTo({ pos: saved.pos.clone(), target: saved.target.clone(), up: WORLD_UP.clone() }, 850, () => {
      camera.up.copy(WORLD_UP);
      controls.enabled = true;
      controls.update();
      state = 'orbit';
      idleSince = performance.now();
      setHint();
    });
    document.body.classList.remove('in-hand');
    ui.pick.textContent = 'Pick it up';
    ui.flip.disabled = false;
    setHint('');
  };
  const flip = () => {
    if (state !== 'orbit' || move.active || spin.active) return;
    const off = camera.position.clone().sub(controls.target);
    const sph = new THREE.Spherical().setFromVector3(off);
    Object.assign(spin, { active: true, start: performance.now(), dur: reduced ? 1 : 1100, from: sph.theta, to: sph.theta + Math.PI, radius: sph.radius, phi: sph.phi });
    controls.enabled = false;
    controls.autoRotate = false;
  };

  /* ---------- pointer: pick the phone, slide the knob ---------- */
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const screenPlane = new THREE.Plane();
  const hitPoint = new THREE.Vector3();
  let down = null;
  let knobDrag = false;

  const setRay = (e) => {
    ndc.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
  };
  const hitsPhone = (e) => { setRay(e); return raycaster.intersectObject(phone.group, true).length > 0; };
  // where on the 320 x 480 lock screen the pointer is; `anywhere` uses the
  // screen's plane so a drag keeps working past the glass
  const screenPoint = (e, anywhere = false) => {
    setRay(e);
    if (!anywhere) {
      const hit = raycaster.intersectObject(phone.screen, false)[0];
      if (!hit) return null;
      return { x: hit.uv.x * lock.width, y: (1 - hit.uv.y) * lock.height };
    }
    phone.screen.getWorldQuaternion(tmpQ);
    const n = new THREE.Vector3(0, 0, 1).applyQuaternion(tmpQ);
    screenPlane.setFromNormalAndCoplanarPoint(n, phone.screen.getWorldPosition(new THREE.Vector3()));
    if (!raycaster.ray.intersectPlane(screenPlane, hitPoint)) return null;
    const local = phone.screen.worldToLocal(hitPoint.clone());
    return { x: (local.x / SPEC.screen.width + 0.5) * lock.width, y: (0.5 - local.y / SPEC.screen.height) * lock.height };
  };

  const el = renderer.domElement;
  el.addEventListener('pointerdown', (e) => {
    down = { x: e.clientX, y: e.clientY, t: performance.now() };
    if (move.active || spin.active) return;
    const p = screenPoint(e);
    if (p && lock.pointer.down(p.x, p.y)) {
      knobDrag = true;
      controls.enabled = false;
      el.setPointerCapture(e.pointerId);
    }
  });
  el.addEventListener('pointermove', (e) => {
    if (knobDrag) { const p = screenPoint(e, true); if (p) lock.pointer.move(p.x); return; }
    if (!coarse && state === 'orbit' && !down) el.style.cursor = hitsPhone(e) ? 'pointer' : '';
  });
  const endPointer = (e) => {
    if (knobDrag) {
      knobDrag = false;
      lock.pointer.up(performance.now());
      if (state === 'orbit') controls.enabled = true;
      down = null;
      return;
    }
    if (!down) return;
    const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
    const quick = performance.now() - down.t < 700;
    down = null;
    if (moved > 8 || !quick || move.active || spin.active) return;
    if (state === 'orbit' && hitsPhone(e)) pickUp();
    else if (state === 'up' && !screenPoint(e)) putDown();
  };
  el.addEventListener('pointerup', endPointer);
  el.addEventListener('pointercancel', () => { if (knobDrag) { knobDrag = false; lock.pointer.up(); if (state === 'orbit') controls.enabled = true; } down = null; });
  el.addEventListener('contextmenu', (e) => e.preventDefault());

  /* ---------- HUD ---------- */
  const hints = {
    orbit: coarse ? 'Drag to look around  ·  pinch to zoom  ·  tap the phone to pick it up' : 'Drag to look around  ·  scroll to zoom  ·  click the phone to pick it up',
    up: coarse ? 'Slide to unlock  ·  tap the bezel to put it down' : 'Slide to unlock  ·  Esc or click the bezel to put it down',
  };
  function setHint(text) {
    const t = text === undefined ? hints[state] || '' : text;
    ui.hint.textContent = t;
    ui.hint.classList.toggle('hide', !t);
  }
  ui.pick.addEventListener('click', () => (state === 'up' ? putDown() : pickUp()));
  ui.flip.addEventListener('click', flip);
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && state === 'up') putDown();
    if ((e.key === 'f' || e.key === 'F') && state === 'orbit' && !e.metaKey && !e.ctrlKey) flip();
  });
  setHint();

  /* ---------- resize ---------- */
  addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
    if (state === 'up') { const p = screenPose(); camera.position.copy(p.pos); look.copy(p.target); camera.up.copy(p.up); camera.lookAt(look); }
  });

  /* ---------- loop ---------- */
  const screenWorld = new THREE.Vector3();
  let first = true;
  const tick = () => {
    requestAnimationFrame(tick);
    const now = performance.now();

    if (move.active) {
      const t = Math.min(1, (now - move.start) / move.dur);
      const k = easeInOut(t);
      camera.position.lerpVectors(move.from.pos, move.to.pos, k);
      look.lerpVectors(move.from.target, move.to.target, k);
      camera.up.lerpVectors(move.from.up, move.to.up, k).normalize();
      camera.lookAt(look);
      if (t >= 1) { move.active = false; move.onDone?.(); }
    } else if (spin.active) {
      const t = Math.min(1, (now - spin.start) / spin.dur);
      const theta = spin.from + (spin.to - spin.from) * easeInOut(t);
      camera.position.setFromSphericalCoords(spin.radius, spin.phi, theta).add(controls.target);
      camera.lookAt(controls.target);
      if (t >= 1) { spin.active = false; controls.enabled = true; controls.update(); idleSince = now; }
    } else if (state === 'up') {
      camera.lookAt(look);
    } else {
      if (!controls.autoRotate && !reduced && !down && now - idleSince > 9000) controls.autoRotate = true;
      controls.update();
    }

    // the lock screen: ~30 fps up close (the shimmer), a slow clock far away
    phone.screen.getWorldPosition(screenWorld);
    const dist = camera.position.distanceTo(screenWorld);
    const interval = dist < 260 ? 33 : dist < 600 ? 120 : 1000;
    if (lock.needsRedraw(now, interval)) { lock.draw(now); phone.screenTexture.needsUpdate = true; }

    renderer.render(scene, camera);
    if (first) { first = false; document.body.classList.add('ready'); }
  };
  tick();

  // handy from the console
  window.ricky = { scene, camera, controls, phone, lock, pickUp, putDown, flip, get state() { return state; } };
}

try { main(); } catch (err) { console.error(err); ui.fail.hidden = false; ui.fail.querySelector('p').textContent = `Something went wrong while drawing the phone: ${err.message || err}`; }
