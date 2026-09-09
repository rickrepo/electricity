// The phone itself: a 2007-era iPhone built from three.js primitives.
// Units are millimetres. x is right, y is up, z is toward the viewer.
//
//   115 x 61 x 11.6 mm body, 9 mm corners
//   3.5" screen, 320 x 480, 2:3 (49.3 x 74 mm) 15 mm below the top edge
//   chrome bezel, black glass, aluminium back with a black plastic band
import * as THREE from '../vendor/three.min.js';
import { backTextures, grilleTexture, homeIconTexture, meshTexture } from './textures.js';

export const SPEC = {
  width: 61,
  height: 115,
  depth: 11.6,
  corner: 9,
  bezel: 1.6,
  seam: 25,
  screen: { width: 49.3, height: 74, top: 15, cssWidth: 320, cssHeight: 480 },
};

// A rounded rectangle centred on the origin. `splits` inserts extra points on
// the straight vertical edges so the extruded walls can change material there.
function roundedRect(w, h, r, splits = [], Ctor = THREE.Shape) {
  const s = new Ctor();
  const x0 = -w / 2, x1 = w / 2, y0 = -h / 2, y1 = h / 2;
  const inside = splits.filter((y) => y > y0 + r && y < y1 - r);
  s.moveTo(x0 + r, y0);
  s.lineTo(x1 - r, y0);
  s.absarc(x1 - r, y0 + r, r, -Math.PI / 2, 0, false);
  for (const y of [...inside].sort((a, b) => a - b)) s.lineTo(x1, y);
  s.lineTo(x1, y1 - r);
  s.absarc(x1 - r, y1 - r, r, 0, Math.PI / 2, false);
  s.lineTo(x0 + r, y1);
  s.absarc(x0 + r, y1 - r, r, Math.PI / 2, Math.PI, false);
  for (const y of [...inside].sort((a, b) => b - a)) s.lineTo(x0, y);
  s.lineTo(x0, y0 + r);
  s.absarc(x0 + r, y0 + r, r, Math.PI, Math.PI * 1.5, false);
  return s;
}

function stadium(cx, cy, w, h, Ctor = THREE.Path) {
  const p = new Ctor();
  const r = h / 2;
  p.moveTo(cx - w / 2 + r, cy - r);
  p.lineTo(cx + w / 2 - r, cy - r);
  p.absarc(cx + w / 2 - r, cy, r, -Math.PI / 2, Math.PI / 2, false);
  p.lineTo(cx - w / 2 + r, cy + r);
  p.absarc(cx - w / 2 + r, cy, r, Math.PI / 2, Math.PI * 1.5, false);
  return p;
}

export function createPhone({ screenCanvas }) {
  const S = SPEC;
  const halfW = S.width / 2, halfH = S.height / 2, halfD = S.depth / 2;
  const seamY = -halfH + S.seam;
  const screenTop = halfH - S.screen.top;
  const screenCY = screenTop - S.screen.height / 2;
  const homeY = (screenTop - S.screen.height - halfH) / 2;
  const earY = (screenTop + halfH) / 2;

  const group = new THREE.Group();
  group.name = 'phone';
  const add = (mesh, { cast = true } = {}) => { mesh.castShadow = cast; group.add(mesh); return mesh; };

  /* ---------- materials ---------- */
  const chrome = new THREE.MeshStandardMaterial({ color: 0xdfe1e3, metalness: 1, roughness: 0.3, envMapIntensity: 0.7 });
  const alu = new THREE.MeshStandardMaterial({ color: 0xc2c4c7, metalness: 0.92, roughness: 0.4 });
  const plastic = new THREE.MeshStandardMaterial({ color: 0x141517, metalness: 0.05, roughness: 0.6 });
  const black = new THREE.MeshStandardMaterial({ color: 0x0b0b0d, metalness: 0.1, roughness: 0.35 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x1e1f23, metalness: 0.2, roughness: 0.5 });
  // Black glass: kept from washing out white when the room lights land on it head-on.
  const glassMat = new THREE.MeshPhysicalMaterial({ color: 0x07070a, metalness: 0, roughness: 0.12, clearcoat: 0.7, clearcoatRoughness: 0.08, envMapIntensity: 0.35 });

  /* ---------- the back shell ---------- */
  // Extruded from an outline inset by the bevel, so the bevel brings it back
  // to full size with rounded back edges. The front bevel hides inside the
  // chrome bezel slab.
  const B = 3.2;
  const shellShape = roundedRect(S.width - 2 * B, S.height - 2 * B, S.corner - B, [seamY]);
  const shellGeo = new THREE.ExtrudeGeometry(shellShape, { depth: S.depth - 2 * B, bevelEnabled: true, bevelThickness: B, bevelSize: B, bevelSegments: 10, curveSegments: 18 });
  shellGeo.translate(0, 0, -(S.depth - 2 * B) / 2 - 0.35);
  // Caps keep material 0 (textured). Walls split at the seam: 1 metal, 2 plastic.
  const [caps, walls] = shellGeo.groups.map((g) => ({ ...g }));
  shellGeo.clearGroups();
  shellGeo.addGroup(caps.start, caps.count, 0);
  const pos = shellGeo.attributes.position;
  let runStart = walls.start, runMat = -1;
  for (let i = walls.start; i < walls.start + walls.count; i += 3) {
    const cy = (pos.getY(i) + pos.getY(i + 1) + pos.getY(i + 2)) / 3;
    const m = cy > seamY ? 1 : 2;
    if (m !== runMat) {
      if (runMat !== -1) shellGeo.addGroup(runStart, i - runStart, runMat);
      runStart = i;
      runMat = m;
    }
  }
  shellGeo.addGroup(runStart, walls.start + walls.count - runStart, runMat);

  const back = backTextures({ seamV: 0.5 + seamY / (S.height - 2 * B) });
  for (const t of [back.map, back.props]) {
    t.repeat.set(1 / (S.width - 2 * B), 1 / (S.height - 2 * B));
    t.offset.set(0.5, 0.5);
  }
  const capMat = new THREE.MeshStandardMaterial({ map: back.map, roughnessMap: back.props, metalnessMap: back.props, metalness: 1, roughness: 1 });
  add(new THREE.Mesh(shellGeo, [capMat, alu, plastic]));

  /* ---------- the chrome bezel slab and the glass ---------- */
  const b = 0.7;
  const slabGeo = new THREE.ExtrudeGeometry(roundedRect(S.width - 2 * b, S.height - 2 * b, S.corner - b), { depth: 3 - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 4, curveSegments: 18 });
  slabGeo.translate(0, 0, halfD - 3 + b);
  add(new THREE.Mesh(slabGeo, chrome));

  const glassShape = roundedRect(S.width - 2 * S.bezel, S.height - 2 * S.bezel, S.corner - S.bezel);
  glassShape.holes.push(stadium(0, earY, 12, 2.4));
  const homeHole = new THREE.Path();
  homeHole.absarc(0, homeY, 5.75, 0, Math.PI * 2, true);
  glassShape.holes.push(homeHole);
  const glass = add(new THREE.Mesh(new THREE.ShapeGeometry(glassShape, 24), glassMat), { cast: false });
  glass.position.z = halfD + 0.2;

  /* ---------- the screen ---------- */
  const screenTex = new THREE.CanvasTexture(screenCanvas);
  screenTex.colorSpace = THREE.SRGBColorSpace;
  screenTex.anisotropy = 8;
  // Unlit: the picture is the light source. The glass around it carries the reflections.
  const screenMat = new THREE.MeshBasicMaterial({ map: screenTex });
  const screen = add(new THREE.Mesh(new THREE.PlaneGeometry(S.screen.width, S.screen.height), screenMat), { cast: false });
  screen.position.set(0, screenCY, halfD + 0.45);
  screen.name = 'screen';

  /* ---------- earpiece and home button ---------- */
  const ear = add(new THREE.Mesh(new THREE.ShapeGeometry(stadium(0, earY, 11.6, 2.0, THREE.Shape), 12), new THREE.MeshStandardMaterial({ map: meshTexture(), roughness: 0.9 })), { cast: false });
  ear.geometry.computeBoundingBox();
  {
    // map the mesh texture across the slot
    const bb = ear.geometry.boundingBox;
    const uv = ear.geometry.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) - bb.min.x) / (bb.max.x - bb.min.x), (uv.getY(i) - bb.min.y) / (bb.max.y - bb.min.y));
  }
  ear.position.z = halfD + 0.1;

  const home = add(new THREE.Mesh(new THREE.CylinderGeometry(5.5, 5.5, 1.2, 48), black), { cast: false });
  home.rotation.x = Math.PI / 2;
  home.position.set(0, homeY, halfD - 0.5);
  home.name = 'home-button';
  const homeIcon = add(new THREE.Mesh(new THREE.PlaneGeometry(9, 9), new THREE.MeshBasicMaterial({ map: homeIconTexture(), transparent: true })), { cast: false });
  homeIcon.position.set(0, homeY, halfD + 0.16);
  const homeRing = add(new THREE.Mesh(new THREE.RingGeometry(5.55, 6.2, 48), dark), { cast: false });
  homeRing.position.set(0, homeY, halfD + 0.3);

  /* ---------- buttons and ports around the edge ---------- */
  const capsule = (r, len, mat) => new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 6, 20), mat);

  // volume rocker, left edge
  const rocker = add(capsule(1.7, 14.6, chrome));
  rocker.scale.x = 0.85;
  rocker.position.set(-halfW - 0.9 + 1.45, 27, 0);

  // ring/silent switch above it
  const slot = add(new THREE.Mesh(new THREE.BoxGeometry(1.0, 5.4, 2.6), black), { cast: false });
  slot.position.set(-halfW + 0.5 - 0.15, 43, 0);
  const nub = add(capsule(0.85, 1.4, chrome));
  nub.scale.x = 0.8;
  nub.position.set(-halfW - 1.0 + 0.68, 43.9, 0);

  // sleep/wake on top, right side
  const sleep = add(capsule(1.5, 6, chrome));
  sleep.rotation.z = Math.PI / 2;
  sleep.scale.set(0.6, 1, 1);
  sleep.position.set(20.5, halfH, 0);
  sleep.name = 'sleep-button';

  // headphone jack on top, left side
  const jack = add(new THREE.Mesh(new THREE.CylinderGeometry(1.9, 1.9, 3, 32), black), { cast: false });
  jack.position.set(-20.5, halfH - 1.5 + 0.02, 0);
  const jackRing = add(new THREE.Mesh(new THREE.RingGeometry(1.9, 2.7, 32), dark), { cast: false });
  jackRing.rotation.x = -Math.PI / 2;
  jackRing.position.set(-20.5, halfH + 0.15, 0);

  // SIM tray outline and its pinhole, top centre
  const sim = add(new THREE.Mesh(new THREE.BoxGeometry(15, 0.2, 0.25), dark), { cast: false });
  sim.position.set(0, halfH + 0.12, 0);
  const pin = add(new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.4, 16), black), { cast: false });
  pin.position.set(6, halfH + 0.12, 0);

  // 30-pin dock connector and the grilles either side, bottom edge
  const dockFrame = add(new THREE.Mesh(new THREE.BoxGeometry(22.6, 0.3, 3.4), new THREE.MeshStandardMaterial({ color: 0x9a9da1, metalness: 0.8, roughness: 0.4 })), { cast: false });
  dockFrame.position.set(0, -halfH + 0.05, 0);
  const dock = add(new THREE.Mesh(new THREE.BoxGeometry(21, 0.5, 2.2), black), { cast: false });
  dock.position.set(0, -halfH + 0.05, 0);
  const grille = grilleTexture();
  for (const x of [-15.5, 15.5]) {
    const g = add(new THREE.Mesh(new THREE.PlaneGeometry(9, 2.7), new THREE.MeshStandardMaterial({ map: grille, roughness: 0.7, metalness: 0.1 })), { cast: false });
    g.rotation.x = Math.PI / 2;
    g.position.set(x, -halfH - 0.15, 0.4);
  }

  /* ---------- the camera on the back ---------- */
  const camRing = add(new THREE.Mesh(new THREE.CylinderGeometry(3.3, 3.3, 0.5, 40), dark), { cast: false });
  camRing.rotation.x = Math.PI / 2;
  camRing.position.set(21.5, 47.5, -halfD + 0.15);
  const lens = add(new THREE.Mesh(new THREE.CylinderGeometry(1.9, 1.9, 0.4, 40), new THREE.MeshPhysicalMaterial({ color: 0x06101e, roughness: 0.05, metalness: 0, clearcoat: 1 })), { cast: false });
  lens.rotation.x = Math.PI / 2;
  lens.position.set(21.5, 47.5, -halfD - 0.05);

  const screenCenter = new THREE.Vector3(0, screenCY, halfD + 0.1);
  return { group, screen, screenTexture: screenTex, screenCenter, spec: S, buttons: { home, homeIcon, sleep } };
}
