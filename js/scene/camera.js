// Camera rig with named keyframes (loading, idle, desk, monitor, orbit) and
// smooth transitions between them. Keyframes can be dynamic (the idle view
// drifts, the desk view follows the mouse), so transitions blend toward the
// keyframe's *current* value every frame instead of a fixed target.
import * as THREE from '../../vendor/three.min.js';
import { OrbitControls } from '../../vendor/three.min.js';
import { tween, Easing, cancelTweens } from '../util/tween.js';
import { SCREEN, CAMERA_FOV } from './constants.js';

export const CameraKey = {
  LOADING: 'loading',
  IDLE: 'idle',
  DESK: 'desk',
  MONITOR: 'monitor',
  ORBIT: 'orbit',
};

export function createCameraRig({ camera, domElement, sizes, mouse }) {
  const position = new THREE.Vector3();
  const target = new THREE.Vector3();
  const from = { position: new THREE.Vector3(), target: new THREE.Vector3() };
  const blend = { t: 1 };
  let current = CameraKey.LOADING;
  let pending = null;
  let activeTween = null;
  let freeLook = false;
  let elapsed = 0;

  const deskState = { pos: new THREE.Vector3(0, 1.32, 1.35), look: new THREE.Vector3(0, 0.95, -0.2) };
  const tmpPos = new THREE.Vector3();
  const tmpLook = new THREE.Vector3();

  const keyframes = {
    [CameraKey.LOADING]: () => ({ position: tmpPos.set(-3.4, 3.4, 4.8), target: tmpLook.set(0.2, 0.3, 0) }),
    [CameraKey.IDLE]: () => {
      const a = Math.sin(elapsed * 0.09) * 0.58 - 0.1;
      const r = 3.05;
      tmpPos.set(Math.sin(a) * r, 1.95 + Math.sin(elapsed * 0.05 + 1) * 0.12, -0.1 + Math.cos(a) * r);
      tmpLook.set(0, 0.85, -0.2);
      return { position: tmpPos, target: tmpLook };
    },
    [CameraKey.DESK]: () => {
      const aspect = sizes.width / sizes.height;
      const mx = mouse.nx; // -1..1
      const my = mouse.ny;
      deskState.pos.x += (mx * 0.16 - deskState.pos.x) * 0.04;
      deskState.pos.y += (1.32 - my * 0.07 - deskState.pos.y) * 0.04;
      deskState.look.x += (mx * 0.06 - deskState.look.x) * 0.06;
      deskState.look.y += (0.95 - my * 0.03 - deskState.look.y) * 0.06;
      const z = aspect < 1 ? 1.35 + (1 / aspect - 1) * 0.9 : 1.35 + Math.max(0, 1.5 - aspect) * 0.3;
      tmpPos.set(deskState.pos.x, deskState.pos.y, z);
      tmpLook.set(deskState.look.x, deskState.look.y, -0.2);
      return { position: tmpPos, target: tmpLook };
    },
    [CameraKey.MONITOR]: () => {
      const aspect = sizes.width / sizes.height;
      const fov = THREE.MathUtils.degToRad(CAMERA_FOV);
      const fill = 0.92;
      const distH = SCREEN.height / 2 / Math.tan(fov / 2) / fill;
      const distW = SCREEN.width / 2 / (Math.tan(fov / 2) * aspect) / fill;
      const d = Math.max(distH, distW);
      tmpPos.set(SCREEN.center.x, SCREEN.center.y, SCREEN.center.z + d);
      tmpLook.set(SCREEN.center.x, SCREEN.center.y, SCREEN.center.z);
      return { position: tmpPos, target: tmpLook };
    },
    [CameraKey.ORBIT]: () => ({ position: tmpPos.set(-2.3, 1.9, 2.5), target: tmpLook.set(0, 0.9, -0.1) }),
  };

  const controls = new OrbitControls(camera, domElement);
  controls.enabled = false;
  controls.enablePan = false;
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.minDistance = 0.6;
  controls.maxDistance = 3.6;
  controls.maxPolarAngle = Math.PI / 2 - 0.05;
  controls.target.set(0, 0.9, -0.1);

  const evaluate = (key) => keyframes[key]();

  function transition(key, { duration = 1200, easing = Easing.quintInOut, onComplete } = {}) {
    if (current === key && !pending) return;
    if (activeTween) activeTween.cancel();
    from.position.copy(position);
    from.target.copy(target);
    blend.t = 0;
    pending = key;
    activeTween = tween(blend, { t: 1 }, {
      duration,
      easing,
      onComplete: () => {
        current = key;
        pending = null;
        activeTween = null;
        onComplete?.();
      },
    });
  }

  function setFreeLook(on) {
    if (on === freeLook) return;
    if (on) {
      transition(CameraKey.ORBIT, {
        duration: 900,
        easing: Easing.bezier(0.13, 0.99, 0, 1),
        onComplete: () => {
          controls.enabled = true;
          camera.position.copy(position);
          controls.target.copy(target);
          controls.update();
          freeLook = true;
        },
      });
    } else {
      freeLook = false;
      controls.enabled = false;
      position.copy(camera.position);
      target.copy(controls.target);
      transition(CameraKey.IDLE, { duration: 2500, easing: Easing.expoOut });
    }
  }

  function update(dt) {
    elapsed += dt;
    if (freeLook) {
      controls.update();
      position.copy(camera.position);
      target.copy(controls.target);
      return;
    }
    const key = pending || current;
    const kf = evaluate(key);
    if (pending) {
      position.lerpVectors(from.position, kf.position, blend.t);
      target.lerpVectors(from.target, kf.target, blend.t);
    } else {
      position.copy(kf.position);
      target.copy(kf.target);
    }
    camera.position.copy(position);
    camera.lookAt(target);
  }

  // start at the loading keyframe
  const initial = evaluate(CameraKey.LOADING);
  position.copy(initial.position);
  target.copy(initial.target);
  camera.position.copy(position);
  camera.lookAt(target);

  return {
    position,
    target,
    controls,
    transition,
    setFreeLook,
    update,
    get key() {
      return pending || current;
    },
    get settled() {
      return !pending;
    },
    get freeLook() {
      return freeLook;
    },
    get distanceToScreen() {
      return position.distanceTo(new THREE.Vector3(SCREEN.center.x, SCREEN.center.y, SCREEN.center.z));
    },
    dispose() {
      cancelTweens(blend);
      controls.dispose();
    },
  };
}
