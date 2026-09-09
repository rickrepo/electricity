// Screens in the room. An OS screen carries the RickyOS DOM on a CSS3D
// plane with an occluder that punches a hole in the WebGL canvas. A canvas
// screen shows a 2D canvas (the CRT's idle traces, the phone's lock screen).
import * as THREE from '../../vendor/three.min.js';
import { CSS3DObject } from '../../vendor/three.min.js';
import { glareTexture, vignetteTexture } from './textures.js';
import { CSS_SCALE } from './constants.js';

export function createOSScreen({ scene, cssScene, element, spec, position, quaternion, crt = true }) {
  const group = new THREE.Group();
  group.position.copy(position);
  group.quaternion.copy(quaternion);
  scene.add(group);

  const shell = document.createElement('div');
  shell.className = crt ? 'screen-shell jitter' : 'screen-shell phone-shell';
  shell.style.width = `${spec.cssWidth}px`;
  shell.style.height = `${spec.cssHeight}px`;
  shell.append(element);

  const cssObject = new CSS3DObject(shell);
  const scale = (spec.width / spec.cssWidth) * CSS_SCALE;
  cssObject.scale.set(scale, scale, scale);
  cssObject.position.copy(position).multiplyScalar(CSS_SCALE);
  cssObject.quaternion.copy(quaternion);
  cssScene.add(cssObject);

  const planeGeo = new THREE.PlaneGeometry(spec.width, spec.height);
  const occluder = new THREE.Mesh(planeGeo, new THREE.MeshBasicMaterial({ color: 0x000000, opacity: 0, transparent: true, blending: THREE.NoBlending, side: THREE.DoubleSide }));
  occluder.renderOrder = 1;
  group.add(occluder);

  const offPlane = new THREE.Mesh(planeGeo, new THREE.MeshBasicMaterial({ color: 0x050607 }));
  offPlane.position.z = 0.001;
  offPlane.visible = false;
  group.add(offPlane);

  let dimmer = null;
  let glare = null;
  if (crt) {
    const vignette = new THREE.Mesh(planeGeo, new THREE.MeshBasicMaterial({ map: vignetteTexture(), transparent: true, depthWrite: false }));
    vignette.position.z = 0.003;
    vignette.renderOrder = 2;
    group.add(vignette);
    glare = new THREE.Mesh(planeGeo, new THREE.MeshBasicMaterial({ map: glareTexture(), transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false }));
    glare.position.z = 0.005;
    glare.renderOrder = 3;
    group.add(glare);
    dimmer = new THREE.Mesh(planeGeo, new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0, depthWrite: false }));
    dimmer.position.z = 0.007;
    dimmer.renderOrder = 4;
    group.add(dimmer);
  } else {
    glare = new THREE.Mesh(planeGeo, new THREE.MeshBasicMaterial({ map: glareTexture(), transparent: true, opacity: 0.08, blending: THREE.AdditiveBlending, depthWrite: false }));
    glare.position.z = 0.0015;
    glare.renderOrder = 3;
    group.add(glare);
  }

  const normal = new THREE.Vector3();
  const view = new THREE.Vector3();
  const worldPos = new THREE.Vector3();
  return {
    group, shell, cssObject, occluder,
    setPower(on) { offPlane.visible = !on; shell.classList.toggle('screen-off', !on); },
    setJitter(on) { if (crt) shell.classList.toggle('jitter', on); },
    update(camera) {
      group.getWorldPosition(worldPos);
      normal.set(0, 0, 1).applyQuaternion(group.quaternion);
      view.copy(camera.position).sub(worldPos);
      const distance = view.length();
      view.normalize();
      const facing = Math.max(0, view.dot(normal));
      if (dimmer) {
        const angleDim = (1 - facing) * 0.9;
        const distDim = THREE.MathUtils.clamp((distance - 0.7) / 3.2, 0, 1) * 0.45;
        dimmer.material.opacity = THREE.MathUtils.clamp(angleDim + distDim, 0, 0.9);
      }
      if (glare) glare.material.opacity = (crt ? 0.05 : 0.03) + (1 - facing) * (crt ? 0.25 : 0.12);
    },
  };
}

export function createCanvasScreen({ scene, spec, position, quaternion, canvas, offColor = 0x050607 }) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.MeshBasicMaterial({ map: texture, color: 0xffffff });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(spec.width, spec.height), material);
  mesh.position.copy(position);
  mesh.quaternion.copy(quaternion);
  scene.add(mesh);
  const off = new THREE.MeshBasicMaterial({ color: offColor });
  let on = true;
  return {
    mesh, texture,
    setPower(v) { on = v; mesh.material = v ? material : off; },
    get on() { return on; },
    /** Call after drawing on the canvas. */
    refresh() { if (on) texture.needsUpdate = true; },
  };
}
