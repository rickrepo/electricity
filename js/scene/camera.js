// Camera rig with named keyframes (loading, idle, desk, monitor, phone, orbit)
// and smooth transitions. Keyframes can be dynamic (idle drifts, desk follows
// the pointer), so transitions blend toward the keyframe's current value.
import * as THREE from '../../vendor/three.min.js';
import { OrbitControls } from '../../vendor/three.min.js';
import { tween, Easing, cancelTweens } from '../util/tween.js';
import { SCREEN, PHONE, CAMERA_FOV, CAM } from './constants.js';

export const CameraKey = { LOADING: 'loading', IDLE: 'idle', DESK: 'desk', MONITOR: 'monitor', PHONE: 'phone', ORBIT: 'orbit' };

export function createCameraRig({ camera, domElement, sizes, mouse, hero = 'crt' }) {
  const position = new THREE.Vector3();
  const target = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  const WORLD_UP = new THREE.Vector3(0, 1, 0);
  const from = { position: new THREE.Vector3(), target: new THREE.Vector3(), up: new THREE.Vector3(0, 1, 0) };
  const blend = { t: 1 };
  let current = CameraKey.LOADING;
  let pending = null;
  let activeTween = null;
  let freeLook = false;
  let elapsed = 0;

  const deskBase = hero === 'phone' ? CAM.deskPhone : CAM.desk;
  const deskState = { pos: new THREE.Vector3(...deskBase.position), look: new THREE.Vector3(...deskBase.target) };

  // Portrait screens get a taller field of view so the bench is not a keyhole.
  const viewFov = () => {
    const aspect = sizes.width / sizes.height;
    return aspect < 1 ? Math.min(60, CAMERA_FOV * (1 / aspect) ** 0.6) : CAMERA_FOV;
  };
  const applyFov = () => {
    const fov = viewFov();
    if (Math.abs(camera.fov - fov) > 0.01) { camera.fov = fov; camera.updateProjectionMatrix(); }
  };
  const phoneScreen = { center: new THREE.Vector3(-0.3, 1.0, 0.22), normal: new THREE.Vector3(0, 0.42, 0.9), up: new THREE.Vector3(0, 0.9, -0.42) };
  const tmpPos = new THREE.Vector3();
  const tmpLook = new THREE.Vector3();

  const fitDistance = (w, h, fill = 0.92) => {
    const aspect = sizes.width / sizes.height;
    const fov = THREE.MathUtils.degToRad(viewFov());
    const distH = h / 2 / Math.tan(fov / 2) / fill;
    const distW = w / 2 / (Math.tan(fov / 2) * aspect) / fill;
    return Math.max(distH, distW);
  };

  const keyframes = {
    [CameraKey.LOADING]: () => ({ position: tmpPos.set(...CAM.loading.position), target: tmpLook.set(...CAM.loading.target) }),
    [CameraKey.IDLE]: () => {
      const a = Math.sin(elapsed * 0.09) * 0.58 - 0.1;
      const [cx, , cz] = CAM.idle.center;
      tmpPos.set(cx + Math.sin(a) * CAM.idle.radius, CAM.idle.height + Math.sin(elapsed * 0.05 + 1) * 0.12, cz + Math.cos(a) * CAM.idle.radius);
      tmpLook.set(...CAM.idle.target);
      return { position: tmpPos, target: tmpLook };
    },
    [CameraKey.DESK]: () => {
      const aspect = sizes.width / sizes.height;
      const [bx, by, bz] = deskBase.position;
      const [lx, ly, lz] = deskBase.target;
      deskState.pos.x += (bx + mouse.nx * 0.16 - deskState.pos.x) * 0.04;
      deskState.pos.y += (by - mouse.ny * 0.07 - deskState.pos.y) * 0.04;
      deskState.look.x += (lx + mouse.nx * 0.06 - deskState.look.x) * 0.06;
      deskState.look.y += (ly - mouse.ny * 0.03 - deskState.look.y) * 0.06;
      const portrait = hero === 'phone' ? 0.18 : 0.42;
      const z = aspect < 1 ? bz + (1 / aspect - 1) * portrait : bz + Math.max(0, 1.5 - aspect) * 0.3;
      tmpPos.set(deskState.pos.x, deskState.pos.y, z);
      tmpLook.set(deskState.look.x, deskState.look.y, lz);
      return { position: tmpPos, target: tmpLook };
    },
    [CameraKey.MONITOR]: () => {
      const d = fitDistance(SCREEN.width, SCREEN.height);
      tmpPos.set(SCREEN.center.x, SCREEN.center.y, SCREEN.center.z + d);
      tmpLook.set(SCREEN.center.x, SCREEN.center.y, SCREEN.center.z);
      return { position: tmpPos, target: tmpLook };
    },
    [CameraKey.PHONE]: () => {
      // Edge to edge: the phone becomes the visitor's screen.
      const d = fitDistance(PHONE.width, PHONE.height, 1.0);
      tmpPos.copy(phoneScreen.center).addScaledVector(phoneScreen.normal, d);
      tmpLook.copy(phoneScreen.center);
      return { position: tmpPos, target: tmpLook, up: phoneScreen.up };
    },
    [CameraKey.ORBIT]: () => ({ position: tmpPos.set(...CAM.orbit.position), target: tmpLook.set(...CAM.orbit.target) }),
  };

  const controls = new OrbitControls(camera, domElement);
  controls.enabled = false;
  controls.enablePan = false;
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.minDistance = 0.6;
  controls.maxDistance = 3.6;
  controls.maxPolarAngle = Math.PI / 2 - 0.05;
  controls.target.set(...CAM.orbit.target);

  const evaluate = (key) => keyframes[key]();

  function transition(key, { duration = 1200, easing = Easing.quintInOut, onComplete } = {}) {
    if (current === key && !pending) return;
    if (activeTween) activeTween.cancel();
    from.position.copy(position);
    from.target.copy(target);
    from.up.copy(up);
    blend.t = 0;
    pending = key;
    activeTween = tween(blend, { t: 1 }, { duration, easing, onComplete: () => { current = key; pending = null; activeTween = null; onComplete?.(); } });
  }

  function setFreeLook(on) {
    if (on === freeLook) return;
    if (on) {
      transition(CameraKey.ORBIT, {
        duration: 900, easing: Easing.bezier(0.13, 0.99, 0, 1),
        onComplete: () => { controls.enabled = true; camera.position.copy(position); controls.target.copy(target); controls.update(); freeLook = true; },
      });
    } else {
      freeLook = false;
      controls.enabled = false;
      position.copy(camera.position);
      target.copy(controls.target);
      up.copy(WORLD_UP);
      transition(CameraKey.IDLE, { duration: 2500, easing: Easing.expoOut });
    }
  }

  function update(dt) {
    elapsed += dt;
    applyFov();
    if (freeLook) {
      controls.update();
      position.copy(camera.position);
      target.copy(controls.target);
      return;
    }
    const kf = evaluate(pending || current);
    const kfUp = kf.up || WORLD_UP;
    if (pending) {
      position.lerpVectors(from.position, kf.position, blend.t);
      target.lerpVectors(from.target, kf.target, blend.t);
      up.lerpVectors(from.up, kfUp, blend.t).normalize();
    } else {
      position.copy(kf.position);
      target.copy(kf.target);
      up.copy(kfUp);
    }
    camera.position.copy(position);
    camera.up.copy(up);
    camera.lookAt(target);
  }

  const initial = evaluate(CameraKey.LOADING);
  position.copy(initial.position);
  target.copy(initial.target);
  camera.position.copy(position);
  camera.lookAt(target);

  const screenCenter = new THREE.Vector3(SCREEN.center.x, SCREEN.center.y, SCREEN.center.z);
  return {
    position, target, controls, transition, setFreeLook, update,
    setPhoneScreen(center, normal, upVec) {
      phoneScreen.center.copy(center);
      phoneScreen.normal.copy(normal).normalize();
      if (upVec) phoneScreen.up.copy(upVec).normalize();
      else phoneScreen.up.copy(WORLD_UP).addScaledVector(phoneScreen.normal, -WORLD_UP.dot(phoneScreen.normal)).normalize();
    },
    get key() { return pending || current; },
    get settled() { return !pending; },
    get freeLook() { return freeLook; },
    get isOnScreen() { return (pending || current) === CameraKey.MONITOR || (pending || current) === CameraKey.PHONE; },
    get distanceToScreen() { return position.distanceTo(screenCenter); },
    dispose() { cancelTweens(blend); controls.dispose(); },
  };
}
