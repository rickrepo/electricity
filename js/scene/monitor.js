// The CRT screen: a CSS3D plane carrying the RickyOS DOM, an occluder that
// punches a hole in the WebGL canvas so the DOM shows through, plus glare,
// vignette, and an angle-based dimmer rendered in WebGL on top.
import * as THREE from '../../vendor/three.min.js';
import { CSS3DObject } from '../../vendor/three.min.js';
import { SCREEN } from './constants.js';
import { glareTexture, vignetteTexture } from './textures.js';

export function createMonitorScreen({ scene, cssScene, osElement }) {
  const group = new THREE.Group();
  group.position.set(SCREEN.center.x, SCREEN.center.y, SCREEN.center.z);
  scene.add(group);

  // DOM shell (the OS root is moved inside it)
  const shell = document.createElement('div');
  shell.className = 'screen-shell jitter';
  shell.style.width = `${SCREEN.cssWidth}px`;
  shell.style.height = `${SCREEN.cssHeight}px`;
  shell.append(osElement);

  const cssObject = new CSS3DObject(shell);
  const scale = SCREEN.width / SCREEN.cssWidth;
  cssObject.scale.set(scale, scale, scale);
  cssObject.position.copy(group.position);
  cssScene.add(cssObject);

  const planeGeo = new THREE.PlaneGeometry(SCREEN.width, SCREEN.height);

  // Occluder: transparent, no blending -> transparent hole in the canvas
  const occluder = new THREE.Mesh(
    planeGeo,
    new THREE.MeshBasicMaterial({ color: 0x000000, opacity: 0, transparent: true, blending: THREE.NoBlending, side: THREE.DoubleSide })
  );
  occluder.renderOrder = 1;
  group.add(occluder);

  // Black plane shown when the monitor is powered off
  const offPlane = new THREE.Mesh(planeGeo, new THREE.MeshBasicMaterial({ color: 0x050607 }));
  offPlane.position.z = 0.001;
  offPlane.visible = false;
  group.add(offPlane);

  // vignette (inner shadow of the tube)
  const vignette = new THREE.Mesh(planeGeo, new THREE.MeshBasicMaterial({ map: vignetteTexture(), transparent: true, depthWrite: false }));
  vignette.position.z = 0.003;
  vignette.renderOrder = 2;
  group.add(vignette);

  // glare / smudge
  const glare = new THREE.Mesh(planeGeo, new THREE.MeshBasicMaterial({ map: glareTexture(), transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false }));
  glare.position.z = 0.005;
  glare.renderOrder = 3;
  group.add(glare);

  // dimmer: darkens the screen when viewed from an angle or far away
  const dimmer = new THREE.Mesh(planeGeo, new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0, depthWrite: false }));
  dimmer.position.z = 0.007;
  dimmer.renderOrder = 4;
  group.add(dimmer);

  const normal = new THREE.Vector3(0, 0, 1);
  const view = new THREE.Vector3();
  const worldPos = new THREE.Vector3();

  return {
    group,
    shell,
    cssObject,
    setPower(on) {
      offPlane.visible = !on;
      shell.classList.toggle('screen-off', !on);
    },
    setJitter(on) {
      shell.classList.toggle('jitter', on);
    },
    update(camera) {
      group.getWorldPosition(worldPos);
      view.copy(camera.position).sub(worldPos);
      const distance = view.length();
      view.normalize();
      const facing = Math.max(0, view.dot(normal));
      const angleDim = (1 - facing) * 0.9;
      const distDim = THREE.MathUtils.clamp((distance - 0.7) / 3.2, 0, 1) * 0.45;
      dimmer.material.opacity = THREE.MathUtils.clamp(angleDim + distDim, 0, 0.9);
      glare.material.opacity = 0.05 + (1 - facing) * 0.25;
    },
  };
}
