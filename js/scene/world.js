// The workshop. Everything is built from three.js primitives and canvas
// textures: a pegboard wall, a rainy window, a workbench with an open-frame
// homemade computer (the RK-1), a CRT, a phone on a stand, an oscilloscope,
// a breadboard, a soldering station, a multimeter, and a cat asleep on a
// stack of manuals. Several objects are clickable (see `interactives`).
import * as THREE from '../../vendor/three.min.js';
import { SCREEN, PHONE, BENCH, ROOM } from './constants.js';
import {
  woodTexture, concreteTexture, pegboardTexture, skyTexture, timeOfDay, blueprintTexture, stickyTexture, labelTexture, tapeTexture,
  clockTexture, photoTexture, breadboardTexture, resistorTexture, jarTexture, scopeScreen, lcdTexture, rainTexture,
} from './textures.js';
import { createWisp } from './effects.js';
import { seededRandom, sleep } from '../util/dom.js';

const std = (color, opts = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0.0, ...opts });
const MORSE = { R: '.-.', I: '..', C: '-.-.', K: '-.-', Y: '-.--' };

export function createWorld({ scene, bus, sound, device = 'crt', lowPower = false }) {
  const group = new THREE.Group();
  scene.add(group);
  const interactives = new Map();
  const updaters = [];
  const rnd = seededRandom(7);
  let camera = null;
  let elapsedTime = 0;
  const shadowSize = lowPower ? 512 : 1024;

  const box = (w, h, d, material, { x = 0, y = 0, z = 0, cast = true, receive = true, name, parent = group } = {}) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    mesh.position.set(x, y, z);
    mesh.castShadow = cast;
    mesh.receiveShadow = receive;
    if (name) mesh.name = name;
    parent.add(mesh);
    return mesh;
  };
  const cylinder = (rt, rb, h, material, { x = 0, y = 0, z = 0, segments = 24, cast = true, receive = true, name, parent = group } = {}) => {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, segments), material);
    mesh.position.set(x, y, z);
    mesh.castShadow = cast;
    mesh.receiveShadow = receive;
    if (name) mesh.name = name;
    parent.add(mesh);
    return mesh;
  };
  const sphere = (r, material, { x = 0, y = 0, z = 0, parent = group, cast = true } = {}) => {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 14), material);
    mesh.position.set(x, y, z);
    mesh.castShadow = cast;
    parent.add(mesh);
    return mesh;
  };
  const plane = (w, h, material, { x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, parent = group, receive = false } = {}) => {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material);
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    mesh.receiveShadow = receive;
    parent.add(mesh);
    return mesh;
  };
  const tube = (points, radius, material, { parent = group } = {}) => {
    const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, radius, 6, false), material);
    mesh.castShadow = true;
    parent.add(mesh);
    return mesh;
  };
  const interactive = (meshes, def) => {
    for (const m of [].concat(meshes)) m.traverse((child) => { if (child.isMesh) interactives.set(child, def); });
  };
  const tapePlane = (text, w, { parent, x, y, z, ry = 0, rz = 0 }) => plane(w, w * 0.19, new THREE.MeshBasicMaterial({ map: tapeTexture(text) }), { parent, x, y, z, ry, rz });

  /* ---------------- materials ---------------- */
  const wallMat = std('#cfc8b8', { roughness: 0.95 });
  const ceilingMat = std('#e6e0d2', { roughness: 0.95 });
  const floorMat = std('#ffffff', { map: concreteTexture({ repeat: [4, 3] }), roughness: 0.9 });
  const benchMat = std('#ffffff', { map: woodTexture({ base: '#a5743f', dark: '#6b4423', light: '#c08f55', planks: 3, seed: 21, repeat: [3, 1] }), roughness: 0.6 });
  const steel = std('#8f949c', { roughness: 0.4, metalness: 0.6 });
  const darkSteel = std('#3a3f47', { roughness: 0.5, metalness: 0.5 });
  const charcoal = std('#24272c', { roughness: 0.7 });
  const cream = std('#d9d1bd', { roughness: 0.7 });
  const creamDark = std('#bfb49c', { roughness: 0.75 });
  const black = std('#151517', { roughness: 0.5 });
  const white = std('#f4f1ea', { roughness: 0.6 });
  const orange = std('#ff7a1a', { roughness: 0.6 });
  const red = std('#c0392b', { roughness: 0.55 });
  const pcbGreen = std('#1f5a3a', { roughness: 0.6 });
  const copper = std('#b8773f', { roughness: 0.4, metalness: 0.7 });
  const wireMat = (c) => std(c, { roughness: 0.5 });

  /* ---------------- room shell ---------------- */
  const roomDepth = ROOM.frontZ - ROOM.backZ;
  const roomCenterZ = (ROOM.frontZ + ROOM.backZ) / 2;
  plane(ROOM.halfWidth * 2, roomDepth, floorMat, { rx: -Math.PI / 2, z: roomCenterZ, receive: true });
  plane(ROOM.halfWidth * 2, roomDepth, ceilingMat, { rx: Math.PI / 2, y: ROOM.height, z: roomCenterZ });
  const wallThickness = 0.08;
  const win = { x0: 1.5, x1: 2.4, y0: 1.3, y1: 2.2 };
  const backZ = ROOM.backZ - wallThickness / 2;
  box(win.x0 + ROOM.halfWidth, ROOM.height, wallThickness, wallMat, { x: (win.x0 - ROOM.halfWidth) / 2, y: ROOM.height / 2, z: backZ, cast: false });
  box(ROOM.halfWidth - win.x1, ROOM.height, wallThickness, wallMat, { x: (win.x1 + ROOM.halfWidth) / 2, y: ROOM.height / 2, z: backZ, cast: false });
  box(win.x1 - win.x0, win.y0, wallThickness, wallMat, { x: (win.x0 + win.x1) / 2, y: win.y0 / 2, z: backZ, cast: false });
  box(win.x1 - win.x0, ROOM.height - win.y1, wallThickness, wallMat, { x: (win.x0 + win.x1) / 2, y: (ROOM.height + win.y1) / 2, z: backZ, cast: false });
  plane(roomDepth, ROOM.height, wallMat, { x: -ROOM.halfWidth, y: ROOM.height / 2, z: roomCenterZ, ry: Math.PI / 2, receive: true });
  plane(roomDepth, ROOM.height, wallMat, { x: ROOM.halfWidth, y: ROOM.height / 2, z: roomCenterZ, ry: -Math.PI / 2, receive: true });
  plane(ROOM.halfWidth * 2, ROOM.height, wallMat, { y: ROOM.height / 2, z: ROOM.frontZ, ry: Math.PI });
  box(ROOM.halfWidth * 2, 0.1, 0.02, charcoal, { y: 0.05, z: ROOM.backZ + 0.01, cast: false });
  box(0.02, 0.1, roomDepth, charcoal, { x: -ROOM.halfWidth + 0.01, y: 0.05, z: roomCenterZ, cast: false });
  box(0.02, 0.1, roomDepth, charcoal, { x: ROOM.halfWidth - 0.01, y: 0.05, z: roomCenterZ, cast: false });
  box(2.8, 0.012, 1.3, std('#262a30', { roughness: 0.98 }), { x: 0, y: 0.006, z: 0.55, cast: false });

  /* ---------------- window with rain ---------------- */
  const variant = timeOfDay();
  const winW = win.x1 - win.x0;
  const winH = win.y1 - win.y0;
  const winCX = (win.x0 + win.x1) / 2;
  const winCY = (win.y0 + win.y1) / 2;
  box(winW + 0.12, 0.06, 0.1, white, { x: winCX, y: win.y1 + 0.03, z: ROOM.backZ - 0.02 });
  box(winW + 0.12, 0.08, 0.16, white, { x: winCX, y: win.y0 - 0.04, z: ROOM.backZ + 0.02 });
  box(0.06, winH, 0.1, white, { x: win.x0 - 0.03, y: winCY, z: ROOM.backZ - 0.02 });
  box(0.06, winH, 0.1, white, { x: win.x1 + 0.03, y: winCY, z: ROOM.backZ - 0.02 });
  box(0.03, winH, 0.03, white, { x: winCX, y: winCY, z: ROOM.backZ - 0.03, cast: false });
  box(winW, 0.03, 0.03, white, { x: winCX, y: winCY, z: ROOM.backZ - 0.03, cast: false });
  const skyBase = new THREE.Color(variant === 'night' ? '#8b93a3' : '#ffffff');
  const skyMat = new THREE.MeshBasicMaterial({ map: skyTexture(variant), color: skyBase.clone() });
  plane(winW + 0.7, winH + 0.6, skyMat, { x: winCX, y: winCY, z: ROOM.backZ - 0.34 });
  const rain = rainTexture();
  plane(winW, winH, new THREE.MeshBasicMaterial({ map: rain.texture, transparent: true, opacity: 0.85, depthWrite: false }), { x: winCX, y: winCY, z: ROOM.backZ - 0.12 });
  plane(winW, winH, new THREE.MeshPhysicalMaterial({ color: '#cfe6ff', transparent: true, opacity: 0.1, roughness: 0.05, metalness: 0 }), { x: winCX, y: winCY, z: ROOM.backZ - 0.06 });
  let rainAcc = 0;
  updaters.push((dt) => { rainAcc += dt; if (rainAcc > 0.04) { rain.update(rainAcc); rainAcc = 0; } });

  /* ---------------- pegboard + tools ---------------- */
  const pegW = 2.9;
  const pegH = 1.1;
  const pegY = 1.85;
  const pegZ = ROOM.backZ + 0.015;
  box(pegW + 0.04, pegH + 0.04, 0.02, charcoal, { x: 0, y: pegY, z: pegZ - 0.005, cast: false });
  const pegTex = pegboardTexture();
  pegTex.repeat.set(pegW / 0.7, pegH / 0.7);
  plane(pegW, pegH, std('#ffffff', { map: pegTex, roughness: 0.9 }), { x: 0, y: pegY, z: pegZ + 0.006, receive: true });
  const hook = (x, y) => { const h = cylinder(0.004, 0.004, 0.05, steel, { x, y, z: pegZ + 0.03, segments: 8, cast: false }); h.rotation.x = Math.PI / 2; };
  [['#ff7a1a', 0.5], ['#1d4fd8', 0.5], ['#d1262b', 0.5]].forEach(([c, len], i) => {
    const x = -1.2 + i * 0.12;
    hook(x, pegY + 0.42);
    cylinder(0.012, 0.014, 0.1, std(c, { roughness: 0.5 }), { x, y: pegY + 0.35, z: pegZ + 0.045, segments: 12 });
    cylinder(0.003, 0.003, len * 0.4, steel, { x, y: pegY + 0.2, z: pegZ + 0.045, segments: 8 });
  });
  hook(-0.75, pegY + 0.42);
  box(0.03, 0.34, 0.012, steel, { x: -0.75, y: pegY + 0.22, z: pegZ + 0.04 }).rotation.z = 0.15;
  box(0.07, 0.07, 0.012, steel, { x: -0.78, y: pegY + 0.38, z: pegZ + 0.04 });
  box(0.07, 0.07, 0.012, steel, { x: -0.72, y: pegY + 0.05, z: pegZ + 0.04 });
  hook(-0.45, pegY + 0.42);
  [-0.06, 0.06].forEach((dx) => { box(0.02, 0.24, 0.014, std('#c0392b'), { x: -0.45 + dx, y: pegY + 0.18, z: pegZ + 0.04 }).rotation.z = dx > 0 ? -0.22 : 0.22; });
  cylinder(0.02, 0.02, 0.014, steel, { x: -0.45, y: pegY + 0.3, z: pegZ + 0.04, segments: 12, cast: false }).rotation.x = Math.PI / 2;
  box(0.02, 0.09, 0.008, steel, { x: -0.47, y: pegY + 0.38, z: pegZ + 0.04 });
  box(0.02, 0.09, 0.008, steel, { x: -0.43, y: pegY + 0.38, z: pegZ + 0.04 });
  hook(0.1, pegY + 0.42);
  const coil = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.028, 10, 30), orange);
  coil.position.set(0.1, pegY + 0.28, pegZ + 0.05);
  coil.castShadow = true;
  group.add(coil);
  hook(0.45, pegY + 0.42);
  cylinder(0.045, 0.045, 0.03, std('#e6c027', { roughness: 0.5 }), { x: 0.45, y: pegY + 0.33, z: pegZ + 0.045, segments: 20 }).rotation.x = Math.PI / 2;
  hook(0.85, pegY + 0.42);
  box(0.3, 0.02, 0.012, darkSteel, { x: 0.85, y: pegY + 0.36, z: pegZ + 0.04 });
  box(0.3, 0.02, 0.012, darkSteel, { x: 0.85, y: pegY + 0.2, z: pegZ + 0.04 });
  box(0.02, 0.18, 0.012, darkSteel, { x: 0.71, y: pegY + 0.28, z: pegZ + 0.04 });
  box(0.02, 0.18, 0.012, darkSteel, { x: 0.99, y: pegY + 0.28, z: pegZ + 0.04 });
  box(0.28, 0.006, 0.004, steel, { x: 0.85, y: pegY + 0.19, z: pegZ + 0.04, cast: false });
  plane(0.13, 0.13, std('#ffffff', { map: photoTexture(), roughness: 0.9 }), { x: 1.15, y: pegY + 0.05, z: pegZ + 0.012, rz: -0.08 });
  sphere(0.008, red, { x: 1.15, y: pegY + 0.11, z: pegZ + 0.02, cast: false });
  plane(0.11, 0.11, std('#ffffff', { map: stickyTexture(['fix the', 'rain leak', '(above win)']), roughness: 0.9 }), { x: 0.75, y: pegY - 0.35, z: pegZ + 0.012, rz: 0.1 });
  plane(0.1, 0.1, std('#ffffff', { map: stickyTexture(['jar #4', '= ???'], '#b9e6ff'), roughness: 0.9 }), { x: -1.0, y: pegY - 0.38, z: pegZ + 0.012, rz: -0.12 });

  /* ---------------- shelf with jars + drawers ---------------- */
  const shelfY = 2.48;
  box(3.0, 0.03, 0.26, std('#5a3d24', { roughness: 0.75 }), { x: 0, y: shelfY, z: ROOM.backZ + 0.13 });
  for (const x of [-1.3, 0, 1.3]) box(0.03, 0.2, 0.22, darkSteel, { x, y: shelfY - 0.12, z: ROOM.backZ + 0.11, cast: false });
  const jars = [['screws', '#8f949c'], ['leds', '#d1262b'], ['resist.', '#c9a04a'], ['caps', '#1d4fd8'], ['???', '#7a4bd6']];
  jars.forEach(([label, color], i) => {
    const jar = new THREE.Group();
    jar.position.set(-1.35 + i * 0.16, shelfY + 0.015, ROOM.backZ + 0.13);
    group.add(jar);
    cylinder(0.04, 0.04, 0.075, std(color, { roughness: 0.8 }), { y: 0.04, parent: jar, segments: 16 });
    cylinder(0.046, 0.046, 0.12, new THREE.MeshPhysicalMaterial({ color: '#dfeaf0', transparent: true, opacity: 0.32, roughness: 0.08 }), { y: 0.06, parent: jar, segments: 18, cast: false });
    cylinder(0.048, 0.048, 0.02, charcoal, { y: 0.13, parent: jar, segments: 18 });
    plane(0.07, 0.026, new THREE.MeshBasicMaterial({ map: jarTexture(label, color) }), { y: 0.05, z: 0.047, parent: jar });
    interactive(jar, { name: `jar${i}`, label: label === '???' ? 'Jar #4 (unlabelled)' : `Jar of ${label}`, action: () => { bus.emit('toast', label === '???' ? 'Nobody knows what is in jar #4. Nobody has checked.' : `A jar of ${label}. Full, for once.`); sound.tick(); } });
  });
  const cabinet = new THREE.Group();
  cabinet.position.set(0.85, shelfY + 0.015, ROOM.backZ + 0.13);
  group.add(cabinet);
  box(0.42, 0.26, 0.2, cream, { y: 0.13, parent: cabinet });
  for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) box(0.09, 0.07, 0.008, new THREE.MeshPhysicalMaterial({ color: '#dbe3ea', transparent: true, opacity: 0.75, roughness: 0.3 }), { x: -0.15 + c * 0.1, y: 0.05 + r * 0.08, z: 0.104, parent: cabinet, cast: false });
  const cardboard = std('#c19a6b', { roughness: 0.95 });
  box(0.34, 0.22, 0.2, cardboard, { x: 1.35, y: shelfY + 0.125, z: ROOM.backZ + 0.13 });

  /* ---------------- blueprint, clock, light switch ---------------- */
  box(0.64, 0.84, 0.02, charcoal, { x: -1.98, y: 1.72, z: ROOM.backZ + 0.01, cast: false });
  plane(0.58, 0.76, std('#ffffff', { map: blueprintTexture(), roughness: 0.9 }), { x: -1.98, y: 1.72, z: ROOM.backZ + 0.021 });
  const clock = clockTexture();
  plane(0.3, 0.3, std('#ffffff', { map: clock.texture, roughness: 0.6, transparent: true }), { x: 2.15, y: 2.3, z: ROOM.backZ + 0.025 });
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.014, 10, 40), charcoal);
  rim.position.set(2.15, 2.3, ROOM.backZ + 0.025);
  group.add(rim);
  updaters.push(() => clock.update());
  const switchPlate = box(0.08, 0.12, 0.012, white, { x: -2.35, y: 1.3, z: ROOM.backZ + 0.006, cast: false, name: 'switch' });
  const switchNub = box(0.02, 0.035, 0.014, creamDark, { x: -2.35, y: 1.3 + 0.015, z: ROOM.backZ + 0.016, cast: false, name: 'switch' });

  /* ---------------- bench ---------------- */
  box(BENCH.width, 0.05, BENCH.depth, benchMat, { x: 0, y: BENCH.height - 0.025, z: BENCH.centerZ });
  for (const [x, z] of [[-1.15, -0.5], [1.15, -0.5], [-1.15, 0.2], [1.15, 0.2]]) box(0.05, BENCH.height - 0.05, 0.05, darkSteel, { x, y: (BENCH.height - 0.05) / 2, z });
  box(2.3, 0.04, 0.05, darkSteel, { y: 0.6, z: -0.5 });
  box(2.3, 0.03, 0.66, std('#4a4a4f', { roughness: 0.9 }), { y: 0.3, z: BENCH.centerZ });
  box(0.5, 0.28, 0.4, std('#2e6b8a', { roughness: 0.7 }), { x: -0.7, y: 0.455, z: -0.15 });
  box(0.4, 0.22, 0.36, std('#8a2e2e', { roughness: 0.7 }), { x: 0.6, y: 0.425, z: -0.15 });
  box(1.5, 0.004, 0.62, std('#1f3d33', { roughness: 0.98 }), { x: 0.15, y: BENCH.height + 0.002, z: -0.13, cast: false });

  /* ---------------- RK-1 open-frame computer ---------------- */
  const machine = new THREE.Group();
  machine.position.set(-0.66, BENCH.height, -0.28);
  machine.rotation.y = 0.12;
  group.add(machine);
  const mp = { parent: machine };
  box(0.36, 0.02, 0.3, charcoal, { y: 0.01, ...mp });
  box(0.3, 0.004, 0.24, pcbGreen, { y: 0.032, cast: false, ...mp });
  for (let i = 0; i < 6; i++) box(0.002, 0.0005, 0.05 + rnd() * 0.12, copper, { x: -0.12 + i * 0.045, y: 0.0345, z: -0.02 + rnd() * 0.04, cast: false, ...mp });
  box(0.05, 0.01, 0.05, black, { x: -0.08, y: 0.04, z: -0.02, ...mp });
  box(0.03, 0.008, 0.06, black, { x: 0.0, y: 0.038, z: -0.03, ...mp });
  box(0.06, 0.008, 0.02, black, { x: 0.07, y: 0.038, z: 0.02, ...mp });
  for (let i = 0; i < 5; i++) box(0.05, 0.03, 0.002, steel, { x: -0.08, y: 0.06, z: -0.052 + i * 0.008, cast: false, ...mp });
  for (let i = 0; i < 3; i++) cylinder(0.006, 0.006, 0.016, std('#1d4fd8', { roughness: 0.5 }), { x: 0.04 + i * 0.02, y: 0.042, z: -0.07, parent: machine, segments: 10 });
  box(0.012, 0.006, 0.005, steel, { x: -0.03, y: 0.037, z: 0.05, ...mp });
  for (const [x, z] of [[-0.16, -0.13], [0.16, -0.13], [-0.16, 0.13], [0.16, 0.13]]) cylinder(0.004, 0.004, 0.11, steel, { x, y: 0.075, z, segments: 8, parent: machine, cast: false });
  box(0.36, 0.004, 0.3, new THREE.MeshPhysicalMaterial({ color: '#dfeaf0', transparent: true, opacity: 0.22, roughness: 0.05 }), { y: 0.132, cast: false, ...mp });
  const fanRing = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.005, 8, 24), charcoal);
  fanRing.position.set(0.1, 0.075, -0.13);
  machine.add(fanRing);
  const fan = new THREE.Group();
  fan.position.set(0.1, 0.075, -0.13);
  machine.add(fan);
  cylinder(0.008, 0.008, 0.012, charcoal, { parent: fan, segments: 10, cast: false }).rotation.x = Math.PI / 2;
  for (let i = 0; i < 4; i++) {
    const blade = box(0.022, 0.009, 0.002, std('#3a3f47'), { parent: fan, cast: false });
    blade.position.set(Math.cos((i / 4) * Math.PI * 2) * 0.016, Math.sin((i / 4) * Math.PI * 2) * 0.016, 0);
    blade.rotation.z = (i / 4) * Math.PI * 2;
  }
  const ledMats = [];
  for (let i = 0; i < 8; i++) {
    const m = new THREE.MeshStandardMaterial({ color: i % 2 ? '#4fe3c1' : '#ff7a1a', emissive: i % 2 ? '#4fe3c1' : '#ff7a1a', emissiveIntensity: 0 });
    ledMats.push(m);
    box(0.008, 0.006, 0.006, m, { x: -0.07 + i * 0.02, y: 0.038, z: 0.11, cast: false, ...mp });
  }
  box(0.36, 0.05, 0.012, charcoal, { y: 0.045, z: 0.156, ...mp });
  const switchBase = cylinder(0.011, 0.011, 0.01, steel, { x: 0.13, y: 0.045, z: 0.163, segments: 14, parent: machine, cast: false });
  switchBase.rotation.x = Math.PI / 2;
  const lever = cylinder(0.003, 0.004, 0.026, steel, { x: 0.13, y: 0.035, z: 0.175, segments: 8, parent: machine, cast: false, name: 'machineSwitch' });
  lever.rotation.x = Math.PI / 2 + 0.9;
  const powerLedMat = new THREE.MeshStandardMaterial({ color: '#ff4b3e', emissive: '#ff4b3e', emissiveIntensity: 0 });
  sphere(0.005, powerLedMat, { x: 0.095, y: 0.045, z: 0.163, parent: machine, cast: false });
  tapePlane('RK-1', 0.09, { parent: machine, x: -0.1, y: 0.045, z: 0.163 });
  interactive([switchBase, lever], { name: 'machineSwitch', label: 'RK-1 power switch', action: () => bus.emit('machine:switch') });
  const machineState = { powered: false, fanSpeed: 0 };
  let ledPattern = 'chase';
  let ledPulseUntil = 0;
  let ledClock = 0;
  const morse = (() => {
    const seq = [];
    for (const ch of 'RICKY') {
      for (const sym of MORSE[ch]) { for (let i = 0; i < (sym === '.' ? 1 : 3); i++) seq.push(1); seq.push(0); }
      seq.push(0, 0);
    }
    seq.push(0, 0, 0, 0);
    return seq;
  })();
  updaters.push((dt, t) => {
    const targetSpeed = machineState.powered ? 34 : 0;
    machineState.fanSpeed += (targetSpeed - machineState.fanSpeed) * Math.min(1, dt * (machineState.powered ? 1.2 : 0.6));
    fan.rotation.z += machineState.fanSpeed * dt;
    powerLedMat.emissiveIntensity = machineState.powered ? 1.4 : 0;
    ledClock += dt;
    const music = sound.ready && sound.chip.playing;
    const levels = music ? sound.chip.levels(8) : null;
    const pattern = t < ledPulseUntil ? 'busy' : ledPattern;
    for (let i = 0; i < 8; i++) {
      let target = 0;
      if (machineState.powered && pattern !== 'off') {
        if (levels) target = Math.min(1.6, levels[i] * 2.6);
        else if (pattern === 'chase') target = Math.floor(ledClock * 6) % 8 === i ? 1.6 : 0;
        else if (pattern === 'blink') target = Math.floor(ledClock * 3) % 2 === 0 ? 1.6 : 0;
        else if (pattern === 'busy') target = Math.random() < 0.45 ? 1.6 : 0;
        else if (pattern === 'bounce') { const k = Math.floor(ledClock * 8) % 14; target = (k < 8 ? k : 14 - k) === i ? 1.6 : 0; }
        else if (pattern === 'morse') target = morse[Math.floor(ledClock / 0.14) % morse.length] ? 1.6 : 0;
      }
      ledMats[i].emissiveIntensity += (target - ledMats[i].emissiveIntensity) * Math.min(1, dt * 30);
    }
  });

  /* ---------------- monitor (CRT) ---------------- */
  const monitor = new THREE.Group();
  monitor.position.set(SCREEN.center.x, BENCH.height, SCREEN.center.z - 0.185);
  group.add(monitor);
  const mon = { parent: monitor };
  cylinder(0.16, 0.18, 0.04, charcoal, { y: 0.02, ...mon });
  box(0.18, 0.03, 0.18, charcoal, { y: 0.055, ...mon });
  const bodyW = 0.46;
  const bodyH = 0.38;
  const bezelD = 0.05;
  const cy = SCREEN.center.y - BENCH.height;
  const frontZ = 0.185 + 0.01;
  const sideW = (bodyW - SCREEN.width) / 2;
  const topH = (bodyH - SCREEN.height) / 2;
  const bezel = std('#24272c', { roughness: 0.6 });
  const bezelParts = [
    box(sideW, bodyH, bezelD, bezel, { x: -bodyW / 2 + sideW / 2, y: cy, z: frontZ - bezelD / 2, ...mon }),
    box(sideW, bodyH, bezelD, bezel, { x: bodyW / 2 - sideW / 2, y: cy, z: frontZ - bezelD / 2, ...mon }),
    box(SCREEN.width, topH, bezelD, bezel, { y: cy + SCREEN.height / 2 + topH / 2, z: frontZ - bezelD / 2, ...mon }),
    box(SCREEN.width, topH, bezelD, bezel, { y: cy - SCREEN.height / 2 - topH / 2, z: frontZ - bezelD / 2, ...mon }),
  ];
  const screenBacking = box(SCREEN.width, SCREEN.height, 0.01, black, { y: cy, z: 0.185 - 0.006, cast: false, ...mon });
  const tubeMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.33, 0.32, 4, 1), cream);
  tubeMesh.rotation.x = Math.PI / 2;
  tubeMesh.rotation.y = Math.PI / 4;
  tubeMesh.position.set(0, cy, frontZ - bezelD - 0.16);
  tubeMesh.castShadow = true;
  monitor.add(tubeMesh);
  box(bodyW, bodyH, 0.02, cream, { y: cy, z: frontZ - bezelD - 0.01, ...mon });
  for (let i = 0; i < 5; i++) box(0.012, 0.004, 0.16, creamDark, { x: -0.06 + i * 0.03, y: cy + bodyH / 2 - 0.03, z: frontZ - bezelD - 0.14, cast: false, ...mon });
  tapePlane('DO NOT UNPLUG', 0.13, { parent: monitor, x: -0.1, y: cy - SCREEN.height / 2 - topH / 2, z: frontZ + 0.001 });
  const monitorLedMat = new THREE.MeshStandardMaterial({ color: '#52e07a', emissive: '#52e07a', emissiveIntensity: 0 });
  box(0.012, 0.006, 0.004, monitorLedMat, { x: 0.17, y: cy - SCREEN.height / 2 - topH / 2, z: frontZ + 0.002, cast: false, ...mon });
  interactive([...bezelParts, screenBacking, tubeMesh], { name: 'monitor', label: device === 'crt' ? 'Lean in' : 'The RK-1\'s screen', action: () => bus.emit('monitor:click') });

  /* ---------------- the phone on its stand ---------------- */
  const phoneG = new THREE.Group();
  // The phone rests on top of its stand's base (12 mm tall).
  phoneG.position.set(-0.31, BENCH.height + 0.012, 0.24);
  phoneG.rotation.set(-0.436, 0.18, 0);
  group.add(phoneG);
  const phoneBodyH = PHONE.height + 0.008;
  const phoneCy = phoneBodyH / 2;
  const phoneBody = box(PHONE.width + 0.007, phoneBodyH, 0.008, std('#1a1c20', { roughness: 0.35, metalness: 0.3 }), { y: phoneCy, parent: phoneG });
  const phoneBacking = box(PHONE.width, PHONE.height, 0.002, black, { y: phoneCy, z: 0.0035, cast: false, parent: phoneG });
  box(0.02, 0.003, 0.002, std('#3a3f47'), { y: phoneCy + PHONE.height / 2 + 0.0022, z: 0.0045, cast: false, parent: phoneG });
  const stand = new THREE.Group();
  stand.position.set(-0.31, BENCH.height, 0.24);
  stand.rotation.y = 0.18;
  group.add(stand);
  box(0.07, 0.012, 0.04, std('#2a2f36', { roughness: 0.6 }), { y: 0.006, z: -0.014, parent: stand });
  const support = box(0.05, 0.07, 0.008, std('#2a2f36', { roughness: 0.6 }), { y: 0.036, z: -0.03, parent: stand });
  support.rotation.x = -0.436;
  interactive([phoneBody, phoneBacking, stand], { name: 'phone', label: device === 'phone' ? 'Pick up the phone' : "Ricky's phone", action: () => bus.emit('phone:click') });
  phoneG.updateMatrixWorld(true);
  const phoneScreen = {
    position: phoneG.localToWorld(new THREE.Vector3(0, phoneCy, 0.0046)),
    quaternion: phoneG.getWorldQuaternion(new THREE.Quaternion()),
    normal: new THREE.Vector3(0, 0, 1).applyQuaternion(phoneG.getWorldQuaternion(new THREE.Quaternion())).normalize(),
    up: new THREE.Vector3(0, 1, 0).applyQuaternion(phoneG.getWorldQuaternion(new THREE.Quaternion())).normalize(),
    top: phoneG.localToWorld(new THREE.Vector3(0, phoneBodyH + 0.015, 0.01)),
  };
  let phoneBuzz = 0;
  const phoneBaseX = phoneG.position.x;
  updaters.push((dt, t) => {
    if (phoneBuzz > 0) {
      phoneBuzz -= dt;
      phoneG.position.x = phoneBaseX + Math.sin(t * 90) * 0.0012;
      if (phoneBuzz <= 0) phoneG.position.x = phoneBaseX;
    }
  });

  /* ---------------- oscilloscope ---------------- */
  const scopeG = new THREE.Group();
  scopeG.position.set(0.8, BENCH.height, -0.33);
  scopeG.rotation.y = -0.32;
  group.add(scopeG);
  box(0.3, 0.2, 0.26, std('#c8c1b0', { roughness: 0.7 }), { y: 0.1, parent: scopeG });
  box(0.3, 0.2, 0.012, std('#2a2f36', { roughness: 0.6 }), { y: 0.1, z: 0.13, parent: scopeG, cast: false });
  const scope = scopeScreen();
  plane(0.13, 0.1, new THREE.MeshBasicMaterial({ map: scope.texture }), { x: -0.06, y: 0.11, z: 0.137, parent: scopeG });
  for (let i = 0; i < 4; i++) {
    cylinder(0.013, 0.013, 0.01, std('#e6e1d6', { roughness: 0.5 }), { x: 0.07 + (i % 2) * 0.045, y: 0.14 - Math.floor(i / 2) * 0.05, z: 0.14, segments: 16, parent: scopeG, cast: false }).rotation.x = Math.PI / 2;
    box(0.003, 0.01, 0.003, charcoal, { x: 0.07 + (i % 2) * 0.045, y: 0.145 - Math.floor(i / 2) * 0.05, z: 0.146, parent: scopeG, cast: false });
  }
  cylinder(0.006, 0.006, 0.014, steel, { x: 0.05, y: 0.035, z: 0.14, segments: 10, parent: scopeG, cast: false }).rotation.x = Math.PI / 2;
  cylinder(0.006, 0.006, 0.014, steel, { x: 0.1, y: 0.035, z: 0.14, segments: 10, parent: scopeG, cast: false }).rotation.x = Math.PI / 2;
  tapePlane('SCOPE', 0.07, { parent: scopeG, x: -0.06, y: 0.035, z: 0.137 });
  interactive(scopeG, { name: 'scope', label: 'Oscilloscope', action: () => { scope.setMode(scope.mode === 'xy' ? 'wave' : 'xy'); sound.click(); bus.emit('toast', scope.mode === 'xy' ? 'Scope: X-Y mode' : 'Scope: waveform'); } });
  let scopeAcc = 0;
  updaters.push((dt, t) => {
    scopeAcc += dt;
    if (scopeAcc < 0.04) return;
    scopeAcc = 0;
    const live = sound.ready && (sound.chip.playing || sound.sigActive);
    scope.draw(live ? sound.waveform(128) : null, t);
  });

  /* ---------------- keyboard + mouse ---------------- */
  const kb = new THREE.Group();
  kb.position.set(0.08, BENCH.height, 0.12);
  kb.rotation.y = 0.02;
  group.add(kb);
  box(0.45, 0.022, 0.16, creamDark, { y: 0.011, parent: kb });
  const keyGeo = new THREE.BoxGeometry(0.0155, 0.009, 0.0155);
  const keyMat = std('#e4dccb', { roughness: 0.6 });
  const rowChars = ['1234567890-=', 'qwertyuiop[]', "asdfghjkl;'", 'zxcvbnm,./'];
  const keys = new THREE.InstancedMesh(keyGeo, keyMat, rowChars.reduce((a, r) => a + r.length, 0));
  keys.castShadow = true;
  const keyIndex = new Map();
  const keyBase = [];
  const m4 = new THREE.Matrix4();
  let k = 0;
  rowChars.forEach((chars, r) => {
    [...chars].forEach((ch, i) => {
      const pos = new THREE.Vector3(-0.2 + r * 0.006 + i * 0.0185, 0.027, -0.05 + r * 0.019);
      keyBase.push(pos);
      keyIndex.set(ch, k);
      m4.makeTranslation(pos.x, pos.y, pos.z);
      keys.setMatrixAt(k++, m4);
    });
  });
  kb.add(keys);
  const spaceBar = box(0.11, 0.009, 0.0155, keyMat, { x: -0.03, y: 0.027, z: 0.03, parent: kb });
  box(0.05, 0.009, 0.0155, keyMat, { x: 0.15, y: 0.027, z: 0.03, parent: kb });
  box(0.05, 0.009, 0.0155, keyMat, { x: -0.16, y: 0.027, z: 0.03, parent: kb });
  box(0.0155, 0.009, 0.0155, orange, { x: -0.2, y: 0.028, z: -0.05, parent: kb }).castShadow = false;
  const pressed = new Map();
  const pressKey = (char) => {
    const ch = (char || '').toLowerCase();
    if (ch === ' ') { spaceBar.position.y = 0.023; setTimeout(() => (spaceBar.position.y = 0.027), 90); return; }
    const idx = keyIndex.get(ch);
    if (idx === undefined) return;
    const base = keyBase[idx];
    m4.makeTranslation(base.x, base.y - 0.004, base.z);
    keys.setMatrixAt(idx, m4);
    keys.instanceMatrix.needsUpdate = true;
    clearTimeout(pressed.get(idx));
    pressed.set(idx, setTimeout(() => { m4.makeTranslation(base.x, base.y, base.z); keys.setMatrixAt(idx, m4); keys.instanceMatrix.needsUpdate = true; }, 90));
  };
  box(0.24, 0.004, 0.2, std('#243b44', { roughness: 0.95 }), { x: 0.56, y: BENCH.height + 0.002, z: 0.12, cast: false });
  const mouseMesh = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), cream);
  mouseMesh.scale.set(0.03, 0.02, 0.048);
  mouseMesh.position.set(0.56, BENCH.height + 0.02, 0.1);
  mouseMesh.castShadow = true;
  group.add(mouseMesh);
  const mouseTarget = new THREE.Vector3(0.56, BENCH.height + 0.02, 0.1);
  updaters.push((dt) => { mouseMesh.position.lerp(mouseTarget, Math.min(1, dt * 6)); });

  /* ---------------- breadboard ---------------- */
  const bb = new THREE.Group();
  bb.position.set(-0.55, BENCH.height, 0.08);
  bb.rotation.y = -0.15;
  group.add(bb);
  box(0.17, 0.01, 0.06, white, { y: 0.005, parent: bb });
  plane(0.17, 0.06, std('#ffffff', { map: breadboardTexture(), roughness: 0.8 }), { y: 0.0101, rx: -Math.PI / 2, parent: bb });
  const resTex = resistorTexture();
  for (const [x, z] of [[-0.04, -0.008], [0.01, 0.012]]) {
    cylinder(0.0035, 0.0035, 0.012, std('#ffffff', { map: resTex, roughness: 0.6 }), { x, y: 0.016, z, parent: bb, segments: 10, cast: false }).rotation.z = Math.PI / 2;
    cylinder(0.0006, 0.0006, 0.012, steel, { x: x - 0.008, y: 0.013, z, parent: bb, segments: 6, cast: false });
    cylinder(0.0006, 0.0006, 0.012, steel, { x: x + 0.008, y: 0.013, z, parent: bb, segments: 6, cast: false });
  }
  const bbLeds = [];
  [['#ff4b3e', 0.035], ['#52e07a', 0.05], ['#ffb02e', 0.065]].forEach(([c, x]) => {
    const m = new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.2 });
    sphere(0.0045, m, { x, y: 0.02, z: -0.01, parent: bb, cast: false });
    cylinder(0.0006, 0.0006, 0.01, steel, { x: x - 0.002, y: 0.013, z: -0.01, parent: bb, segments: 6, cast: false });
    bbLeds.push(m);
  });
  tube([[-0.07, 0.012, 0.02], [-0.05, 0.03, 0.005], [-0.02, 0.012, -0.012]], 0.0013, wireMat('#d1262b'), { parent: bb });
  tube([[0.0, 0.012, 0.022], [0.03, 0.028, 0.012], [0.055, 0.012, -0.005]], 0.0013, wireMat('#1d4fd8'), { parent: bb });
  tube([[-0.06, 0.012, -0.02], [-0.03, 0.025, -0.024], [0.01, 0.012, -0.02]], 0.0013, wireMat('#e6c027'), { parent: bb });
  box(0.026, 0.017, 0.048, black, { x: -0.11, y: 0.0085, z: 0.0, parent: bb });
  box(0.012, 0.006, 0.008, steel, { x: -0.11, y: 0.02, z: -0.02, parent: bb, cast: false });
  tube([[-0.11, 0.023, -0.02], [-0.1, 0.035, -0.03], [-0.075, 0.012, -0.027]], 0.0012, wireMat('#d1262b'), { parent: bb });
  tube([[-0.105, 0.023, -0.02], [-0.09, 0.03, 0.01], [-0.075, 0.012, 0.024]], 0.0012, wireMat('#1c1a17'), { parent: bb });
  let bbClock = 0;
  updaters.push((dt) => { bbClock += dt; const k2 = Math.floor(bbClock * 4) % 4; bbLeds.forEach((m, i) => { m.emissiveIntensity = (k2 < 3 ? k2 : 1) === i ? 1.8 : 0.15; }); });

  /* ---------------- soldering station ---------------- */
  const solder = new THREE.Group();
  solder.position.set(-1.0, BENCH.height, 0.02);
  solder.rotation.y = 0.3;
  group.add(solder);
  box(0.12, 0.06, 0.1, std('#2d4a8a', { roughness: 0.55 }), { y: 0.03, parent: solder });
  cylinder(0.014, 0.014, 0.008, std('#e6e1d6'), { x: 0.03, y: 0.035, z: 0.052, segments: 14, parent: solder, cast: false }).rotation.x = Math.PI / 2;
  plane(0.045, 0.02, new THREE.MeshBasicMaterial({ map: labelTexture('350°C', { w: 256, h: 112, bg: '#9fae8a', fg: '#1c2419', font: "56px 'VT323', monospace" }) }), { x: -0.025, y: 0.038, z: 0.051, parent: solder });
  cylinder(0.014, 0.011, 0.07, steel, { x: 0.1, y: 0.045, z: -0.01, segments: 12, parent: solder, cast: false }).rotation.z = -0.65;
  const iron = new THREE.Group();
  iron.position.set(0.1, 0.06, -0.01);
  iron.rotation.z = -0.65;
  solder.add(iron);
  cylinder(0.008, 0.007, 0.12, std('#1d3f7a', { roughness: 0.5 }), { y: 0.03, parent: iron, segments: 12 });
  cylinder(0.0025, 0.0025, 0.06, steel, { y: -0.055, parent: iron, segments: 8 });
  cylinder(0.0025, 0.0008, 0.012, new THREE.MeshStandardMaterial({ color: '#8a8f96', emissive: '#ff5a1a', emissiveIntensity: 0.4 }), { y: -0.09, parent: iron, segments: 8, cast: false });
  const smoke = createWisp({ width: 0.05, height: 0.2, color: '#c9c9c9', speed: 0.45, strength: 0.35 });
  smoke.mesh.position.set(0.16, 0.14, -0.01);
  solder.add(smoke.mesh);
  box(0.03, 0.018, 0.03, std('#c9a04a', { roughness: 0.9 }), { x: -0.02, y: 0.009, z: 0.08, parent: solder });
  let smokePuff = 0;
  interactive(iron, { name: 'iron', label: 'Soldering iron (hot)', action: () => { smokePuff = 1; sound.sizzle(); } });
  updaters.push((dt, t) => {
    smoke.update(t);
    smoke.mesh.rotation.y = -solder.rotation.y + Math.atan2(camera.position.x - (solder.position.x + 0.16), camera.position.z - solder.position.z);
    if (smokePuff > 0) smokePuff = Math.max(0, smokePuff - dt * 0.5);
    smoke.setStrength(0.32 + smokePuff * 0.6);
  });

  /* ---------------- multimeter ---------------- */
  const meter = new THREE.Group();
  meter.position.set(0.98, BENCH.height + 0.017, 0.08);
  meter.rotation.set(-1.15, 0.4, 0);
  group.add(meter);
  box(0.075, 0.15, 0.03, std('#f2c12e', { roughness: 0.6 }), { parent: meter });
  box(0.062, 0.06, 0.004, charcoal, { y: 0.035, z: 0.017, parent: meter, cast: false });
  const lcd = lcdTexture();
  plane(0.054, 0.02, new THREE.MeshBasicMaterial({ map: lcd.texture }), { y: 0.035, z: 0.0195, parent: meter });
  cylinder(0.02, 0.02, 0.008, charcoal, { y: -0.025, z: 0.018, segments: 18, parent: meter, cast: false }).rotation.x = Math.PI / 2;
  box(0.004, 0.018, 0.004, white, { y: -0.018, z: 0.023, parent: meter, cast: false });
  tube([[0.98, BENCH.height + 0.005, 0.15], [1.05, BENCH.height + 0.01, 0.22], [1.15, BENCH.height + 0.003, 0.15]], 0.002, wireMat('#d1262b'));
  tube([[0.965, BENCH.height + 0.005, 0.15], [0.92, BENCH.height + 0.012, 0.24], [0.84, BENCH.height + 0.003, 0.2]], 0.002, wireMat('#1c1a17'));
  const readings = [() => [`${(12 + (Math.random() - 0.5) * 0.08).toFixed(2)} V`, 'DC AUTO'], () => ['4.70 kΩ', 'OHM'], () => [`${(23 + Math.random() * 0.6).toFixed(1)} °C`, 'TEMP'], () => ['OL', 'DIODE']];
  let readingIdx = 0;
  let meterAcc = 0;
  updaters.push((dt) => { meterAcc += dt; if (meterAcc > 1.4) { meterAcc = 0; lcd.set(...readings[readingIdx]()); } });
  interactive(meter, { name: 'meter', label: 'Multimeter', action: () => { readingIdx = (readingIdx + 1) % readings.length; lcd.set(...readings[readingIdx]()); sound.tick(); } });

  /* ---------------- mug ---------------- */
  const mug = new THREE.Group();
  mug.position.set(-0.3, BENCH.height, -0.06);
  group.add(mug);
  const mugMat = std('#f3eee4', { roughness: 0.45 });
  cylinder(0.042, 0.038, 0.095, mugMat, { y: 0.0475, parent: mug });
  cylinder(0.036, 0.036, 0.004, std('#2a1a12', { roughness: 0.3 }), { y: 0.088, cast: false, parent: mug });
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.026, 0.008, 10, 24, Math.PI), mugMat);
  handle.position.set(-0.04, 0.05, 0);
  handle.rotation.set(0, Math.PI / 2, Math.PI / 2);
  handle.castShadow = true;
  mug.add(handle);
  tapePlane('NOT FLUX', 0.06, { parent: mug, x: 0, y: 0.05, z: 0.043 });
  let mugWobble = 0;
  interactive(mug, { name: 'mug', label: 'Coffee (allegedly)', action: () => { mugWobble = 1; sound.tick(); } });
  updaters.push((dt, t) => {
    if (mugWobble > 0) {
      mugWobble = Math.max(0, mugWobble - dt * 1.4);
      mug.rotation.z = Math.sin(t * 28) * 0.12 * mugWobble;
      mug.rotation.x = Math.cos(t * 23) * 0.08 * mugWobble;
    }
  });

  /* ---------------- cat on the manuals ---------------- */
  const catG = new THREE.Group();
  catG.position.set(1.0, BENCH.height, -0.3);
  catG.rotation.y = -0.4;
  group.add(catG);
  [['#3b4a6b', 0], ['#b5533c', 0.04], ['#d9d1bd', -0.03]].forEach(([c, rot], i) => { box(0.24, 0.03, 0.3, std(c, { roughness: 0.8 }), { y: 0.015 + i * 0.03, parent: catG }).rotation.y = rot; });
  const cat = new THREE.Group();
  cat.position.set(0, 0.09, 0);
  catG.add(cat);
  const fur = std('#8d8378', { roughness: 0.95 });
  const furLight = std('#b3a99c', { roughness: 0.95 });
  const body = sphere(1, fur, { parent: cat });
  body.scale.set(0.13, 0.06, 0.09);
  body.position.y = 0.05;
  const head = new THREE.Group();
  head.position.set(-0.1, 0.07, 0.03);
  cat.add(head);
  sphere(0.05, fur, { parent: head });
  sphere(0.02, furLight, { x: -0.035, y: -0.01, z: 0.02, parent: head, cast: false });
  for (const s of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.014, 0.028, 4), fur);
    ear.position.set(-0.01, 0.045, s * 0.03);
    ear.rotation.z = 0.2;
    head.add(ear);
  }
  const eyeMat = new THREE.MeshStandardMaterial({ color: '#52e07a', emissive: '#52e07a', emissiveIntensity: 1.2 });
  const eyes = [-1, 1].map((s) => sphere(0.006, eyeMat, { x: -0.044, y: 0.008, z: s * 0.018, parent: head, cast: false }));
  eyes.forEach((e) => (e.visible = false));
  sphere(0.005, std('#e59b8b'), { x: -0.05, y: -0.005, z: 0, parent: head, cast: false });
  tube([[0.1, 0.03, 0.0], [0.15, 0.03, 0.05], [0.1, 0.03, 0.1], [0.02, 0.03, 0.1]], 0.012, fur, { parent: cat });
  let catAwake = 0;
  const pokeCat = () => {
    catAwake = 2.4;
    eyes.forEach((e) => (e.visible = true));
    sound.meow();
    bus.emit('toast', 'The cat has acknowledged you and gone back to sleep.');
  };
  interactive(catG, { name: 'cat', label: 'Cat (asleep)', action: pokeCat });
  updaters.push((dt, t) => {
    body.scale.set(0.13, 0.06 * (1 + Math.sin(t * 1.6) * 0.03), 0.09);
    if (catAwake > 0) {
      catAwake -= dt;
      head.rotation.z += ((-0.55) - head.rotation.z) * Math.min(1, dt * 6);
      if (catAwake <= 0) eyes.forEach((e) => (e.visible = false));
    } else head.rotation.z += (0 - head.rotation.z) * Math.min(1, dt * 3);
  });

  /* ---------------- magnifier ring lamp ---------------- */
  const lamp = new THREE.Group();
  lamp.position.set(-1.1, BENCH.height, -0.48);
  group.add(lamp);
  const lampMat = std('#e6e1d6', { roughness: 0.5 });
  box(0.08, 0.06, 0.08, darkSteel, { y: 0.03, parent: lamp });
  cylinder(0.012, 0.012, 0.42, lampMat, { x: 0.06, y: 0.24, parent: lamp }).rotation.z = -0.3;
  sphere(0.02, darkSteel, { x: 0.125, y: 0.44, parent: lamp });
  cylinder(0.011, 0.011, 0.5, lampMat, { x: 0.33, y: 0.47, z: 0.2, parent: lamp }).rotation.set(0.7, 0, -1.35);
  const ring = new THREE.Group();
  ring.position.set(0.55, 0.46, 0.42);
  ring.rotation.x = -1.25;
  lamp.add(ring);
  const ringMesh = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.024, 12, 32), lampMat);
  ringMesh.castShadow = true;
  ring.add(ringMesh);
  const ringLightMat = new THREE.MeshStandardMaterial({ color: '#fff6dc', emissive: '#ffe9b8', emissiveIntensity: 1.6 });
  ring.add(new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.008, 8, 32), ringLightMat));
  ring.add(new THREE.Mesh(new THREE.CircleGeometry(0.075, 32), new THREE.MeshPhysicalMaterial({ color: '#dfeaf0', transparent: true, opacity: 0.18, roughness: 0.05, side: THREE.DoubleSide })));
  const ringLight = new THREE.SpotLight('#ffe2b6', 16, 4, 0.8, 0.6, 2);
  ringLight.position.set(0, 0, -0.02);
  ringLight.target.position.set(0, 0, 1);
  ringLight.castShadow = true;
  ringLight.shadow.mapSize.set(shadowSize, shadowSize);
  ringLight.shadow.bias = -0.0008;
  ringLight.shadow.normalBias = 0.01;
  ring.add(ringLight, ringLight.target);
  const benchLightState = { on: true };
  const setBenchLight = (on) => {
    benchLightState.on = on;
    ringLight.visible = on;
    ringLightMat.emissiveIntensity = on ? 1.6 : 0;
    bus.emit('lamp', on);
  };
  interactive(lamp, { name: 'lamp', label: 'Ring lamp', action: () => { setBenchLight(!benchLightState.on); sound.click(!benchLightState.on); } });

  /* ---------------- fire extinguisher, cabinet, stool, boxes, door ---------------- */
  const ext = new THREE.Group();
  ext.position.set(2.3, 0, 0.6);
  group.add(ext);
  cylinder(0.07, 0.07, 0.45, red, { y: 0.24, parent: ext });
  cylinder(0.05, 0.07, 0.04, red, { y: 0.485, parent: ext });
  cylinder(0.025, 0.025, 0.06, black, { y: 0.53, parent: ext });
  box(0.02, 0.05, 0.1, black, { y: 0.57, z: 0.03, parent: ext });
  tube([[0.06, 0.5, 0], [0.13, 0.42, 0.02], [0.1, 0.2, 0.05]], 0.008, black, { parent: ext });
  tapePlane('FIRE', 0.08, { parent: ext, x: 0, y: 0.3, z: 0.071 });
  interactive(ext, { name: 'extinguisher', label: 'Fire extinguisher', action: () => { bus.emit('toast', 'Not today. (Hopefully.)'); sound.tick(); } });
  const cab = new THREE.Group();
  cab.position.set(-2.1, 0, 0.7);
  group.add(cab);
  box(0.7, 0.86, 0.5, red, { y: 0.5, parent: cab });
  for (let i = 0; i < 5; i++) {
    box(0.62, 0.13, 0.02, std('#d94a3a', { roughness: 0.5 }), { y: 0.17 + i * 0.16, z: 0.26, parent: cab, cast: false });
    box(0.2, 0.014, 0.02, steel, { y: 0.17 + i * 0.16, z: 0.275, parent: cab, cast: false });
  }
  for (const [x, z] of [[-0.25, -0.18], [0.25, -0.18], [-0.25, 0.18], [0.25, 0.18]]) cylinder(0.04, 0.04, 0.03, black, { x, y: 0.04, z, segments: 14, parent: cab }).rotation.z = Math.PI / 2;
  box(0.72, 0.03, 0.52, std('#3a3f47', { roughness: 0.6 }), { y: 0.945, parent: cab });
  const stool = new THREE.Group();
  stool.position.set(0.3, 0, 0.85);
  group.add(stool);
  cylinder(0.17, 0.17, 0.04, charcoal, { y: 0.62, parent: stool, segments: 24 });
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    cylinder(0.012, 0.012, 0.62, steel, { x: Math.cos(a) * 0.14, y: 0.31, z: Math.sin(a) * 0.14, parent: stool, segments: 8 }).rotation.set(Math.sin(a) * 0.12, 0, -Math.cos(a) * 0.12);
  }
  const stoolRing = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.008, 8, 30), steel);
  stoolRing.rotation.x = Math.PI / 2;
  stoolRing.position.y = 0.22;
  stool.add(stoolRing);
  let stoolSpin = 0;
  interactive(stool, { name: 'stool', label: 'Stool', action: () => { stoolSpin = 7; sound.click(); } });
  updaters.push((dt) => { if (stoolSpin > 0.001) { stool.rotation.y += stoolSpin * dt; stoolSpin *= Math.pow(0.3, dt); } });
  box(0.5, 0.36, 0.42, cardboard, { x: 2.15, y: 0.18, z: 2.6 });
  box(0.36, 0.3, 0.32, cardboard, { x: 2.1, y: 0.51, z: 2.62 });
  box(0.05, 2.1, 0.9, std('#ded5c2', { roughness: 0.8 }), { x: ROOM.halfWidth - 0.03, y: 1.05, z: 1.9, cast: false });
  box(0.04, 2.2, 1.0, white, { x: ROOM.halfWidth - 0.01, y: 1.1, z: 1.9, cast: false });
  sphere(0.03, steel, { x: ROOM.halfWidth - 0.08, y: 1.0, z: 1.55 });

  /* ---------------- lights ---------------- */
  const preset = { night: { hemi: 0.12, amb: 0.05, daylight: 0, moon: 0.35 }, dusk: { hemi: 0.22, amb: 0.08, daylight: 0.7, moon: 0.15 }, day: { hemi: 0.45, amb: 0.2, daylight: 1.6, moon: 0 } }[variant];
  const hemi = new THREE.HemisphereLight('#a9bdd6', '#4a4038', preset.hemi);
  scene.add(hemi);
  const ambient = new THREE.AmbientLight('#ffffff', preset.amb);
  scene.add(ambient);
  box(1.6, 0.06, 0.22, white, { x: 0.1, y: ROOM.height - 0.03, z: -0.05, cast: false });
  const tubeLightMat = new THREE.MeshStandardMaterial({ color: '#f4f6ee', emissive: '#f4f6ee', emissiveIntensity: 0 });
  cylinder(0.018, 0.018, 1.4, tubeLightMat, { x: 0.1, y: ROOM.height - 0.07, z: -0.05, segments: 12, cast: false }).rotation.z = Math.PI / 2;
  const roomLight = new THREE.SpotLight('#e9eef4', 0, 9, 1.15, 0.9, 1.6);
  roomLight.position.set(0.1, ROOM.height - 0.1, -0.05);
  roomLight.target.position.set(0.1, 0, 0.3);
  roomLight.castShadow = !lowPower;
  roomLight.shadow.mapSize.set(shadowSize, shadowSize);
  roomLight.shadow.bias = -0.0006;
  roomLight.shadow.normalBias = 0.02;
  scene.add(roomLight, roomLight.target);
  const roomLightState = { on: false };
  const setRoomLight = (on) => {
    roomLightState.on = on;
    roomLight.intensity = on ? 22 : 0;
    tubeLightMat.emissiveIntensity = on ? 1.4 : 0;
    hemi.intensity = preset.hemi + (on ? 0.25 : 0);
    ambient.intensity = preset.amb + (on ? 0.12 : 0);
    switchNub.position.y = on ? 1.3 + 0.015 : 1.3 - 0.015;
    bus.emit('lights', on);
  };
  interactive([switchPlate, switchNub], { name: 'switch', label: 'Light switch', action: () => { setRoomLight(!roomLightState.on); sound.click(!roomLightState.on); sound.tubeBuzz(roomLightState.on); } });
  const daylight = new THREE.DirectionalLight(variant === 'dusk' ? '#ffb27a' : '#dfe8ff', preset.daylight);
  daylight.position.set(2.2, 2.4, -1.4);
  daylight.target.position.set(0, 0.8, 0.6);
  scene.add(daylight, daylight.target);
  const moon = new THREE.DirectionalLight('#8fa4d6', preset.moon);
  moon.position.set(2.2, 2.4, -1.4);
  moon.target = daylight.target;
  scene.add(moon);
  const flash = new THREE.DirectionalLight('#dfe8ff', 0);
  flash.position.set(2.4, 2.4, -1.5);
  flash.target.position.set(0, 0.9, 0.5);
  scene.add(flash, flash.target);
  const screenGlow = new THREE.PointLight('#8fd7ff', 0, 1.8, 2);
  screenGlow.position.set(SCREEN.center.x, SCREEN.center.y, SCREEN.center.z + 0.12);
  scene.add(screenGlow);
  const glowState = { on: false };
  updaters.push((dt, t) => {
    const target = glowState.on ? 1.5 + Math.sin(t * 9.1) * 0.08 + Math.sin(t * 23.7) * 0.05 : 0;
    screenGlow.intensity += (target - screenGlow.intensity) * Math.min(1, dt * 8);
    monitorLedMat.emissiveIntensity = glowState.on ? 1.5 : 0.1;
  });

  const lightning = async () => {
    for (const [intensity, ms] of [[6, 70], [0, 90], [4, 50], [0, 40], [2.5, 60]]) {
      flash.intensity = intensity;
      skyMat.color.copy(skyBase).lerp(new THREE.Color('#ffffff'), intensity / 6);
      await sleep(ms);
    }
    flash.intensity = 0;
    skyMat.color.copy(skyBase);
  };
  const flicker = async () => {
    for (const [on, ms] of [[true, 70], [false, 110], [true, 50], [false, 160], [true, 40], [false, 90], [true, 0]]) {
      setRoomLight(on);
      if (on) sound.flickerBurst();
      if (ms) await sleep(ms);
    }
    sound.tubeBuzz(true);
  };

  const anchors = {
    monitorTop: new THREE.Vector3(SCREEN.center.x, SCREEN.center.y + 0.26, SCREEN.center.z - 0.05),
    machineSwitch: new THREE.Vector3(),
    phoneTop: phoneScreen.top,
  };
  machine.updateMatrixWorld(true);
  lever.getWorldPosition(anchors.machineSwitch);
  anchors.machineSwitch.y += 0.06;

  return {
    group,
    interactives,
    anchors,
    variant,
    screens: {
      crt: { position: new THREE.Vector3(SCREEN.center.x, SCREEN.center.y, SCREEN.center.z), quaternion: new THREE.Quaternion() },
      phone: phoneScreen,
    },
    setCamera(cam) { camera = cam; },
    setScreenPower(on) { glowState.on = on; },
    machine: {
      get powered() { return machineState.powered; },
      setPowered(on) { if (machineState.powered === on) return; machineState.powered = on; if (on) sound.fanStart(); else sound.fanStop(); },
    },
    lights: {
      room: { get on() { return roomLightState.on; }, set: setRoomLight },
      bench: { get on() { return benchLightState.on; }, set: setBenchLight },
    },
    keyboard: { press: pressKey },
    mouse: { set(nx, ny) { mouseTarget.set(0.56 + nx * 0.05, BENCH.height + 0.02, 0.1 + ny * 0.045); } },
    cat: { poke: pokeCat },
    phone: { buzz() { phoneBuzz = 0.55; } },
    leds: {
      pattern(name) { ledPattern = ['chase', 'blink', 'off', 'bounce', 'busy', 'morse'].includes(name) ? name : 'chase'; },
      pulse(ms = 600) { ledPulseUntil = elapsedTime + ms / 1000; },
    },
    scope: { setMode: (m) => scope.setMode(m) },
    flicker,
    lightning,
    update(dt, elapsed) {
      elapsedTime = elapsed;
      if (!camera) return;
      for (const fn of updaters) fn(dt, elapsed);
    },
  };
}
