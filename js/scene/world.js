// The room. Everything is built from three.js primitives and canvas textures:
// walls, a window with a view, a desk, a CRT monitor, keyboard, mouse, lamp,
// coffee, a fern, a beige tower, a radio, a chair, a bookshelf, and some
// wall decor. Several objects are clickable (see `interactives`).
import * as THREE from '../../vendor/three.min.js';
import { SCREEN, DESK, ROOM } from './constants.js';
import { woodTexture, skyTexture, posterTexture, stickyTexture, labelTexture, clockTexture, calendarTexture, photoTexture } from './textures.js';
import { createSteam } from './effects.js';
import { seededRandom } from '../util/dom.js';

const std = (color, opts = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0.0, ...opts });

export function createWorld({ scene, bus, sound }) {
  const group = new THREE.Group();
  scene.add(group);
  const interactives = new Map();
  const updaters = [];
  const rnd = seededRandom(7);

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
  const interactive = (meshes, def) => {
    for (const m of [].concat(meshes)) {
      m.traverse((child) => {
        if (child.isMesh) interactives.set(child, def);
      });
    }
  };

  /* ---------------- materials ---------------- */
  const wallMat = std('#d8cfbc', { roughness: 0.95 });
  const ceilingMat = std('#efe9dc', { roughness: 0.95 });
  const floorMat = std('#ffffff', { map: woodTexture({ base: '#6b4a2e', dark: '#4a3120', light: '#85603c', planks: 7, seed: 3, repeat: [3, 2.2] }), roughness: 0.8 });
  const deskMat = std('#ffffff', { map: woodTexture({ base: '#a5743f', dark: '#7a5128', light: '#c08f55', planks: 4, seed: 11, repeat: [2, 1] }), roughness: 0.65 });
  const deskDark = std('#7a5128', { roughness: 0.7 });
  const beige = std('#d9d1bd', { roughness: 0.7 });
  const beigeDark = std('#bfb49c', { roughness: 0.75 });
  const dark = std('#2b2a2e', { roughness: 0.6 });
  const black = std('#151517', { roughness: 0.5 });
  const white = std('#f4f1ea', { roughness: 0.6 });
  const metal = std('#8f949c', { roughness: 0.4, metalness: 0.6 });

  /* ---------------- room shell ---------------- */
  const roomDepth = ROOM.frontZ - ROOM.backZ;
  const roomCenterZ = (ROOM.frontZ + ROOM.backZ) / 2;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(ROOM.halfWidth * 2, roomDepth), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0, roomCenterZ);
  floor.receiveShadow = true;
  group.add(floor);

  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(ROOM.halfWidth * 2, roomDepth), ceilingMat);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(0, ROOM.height, roomCenterZ);
  group.add(ceiling);

  const wallThickness = 0.08;
  const win = { x0: 0.75, x1: 1.95, y0: 1.2, y1: 2.15 };
  // back wall with a window opening (4 pieces)
  const backZ = ROOM.backZ - wallThickness / 2;
  box(win.x0 + ROOM.halfWidth, ROOM.height, wallThickness, wallMat, { x: (win.x0 - ROOM.halfWidth) / 2, y: ROOM.height / 2, z: backZ, cast: false });
  box(ROOM.halfWidth - win.x1, ROOM.height, wallThickness, wallMat, { x: (win.x1 + ROOM.halfWidth) / 2, y: ROOM.height / 2, z: backZ, cast: false });
  box(win.x1 - win.x0, win.y0, wallThickness, wallMat, { x: (win.x0 + win.x1) / 2, y: win.y0 / 2, z: backZ, cast: false });
  box(win.x1 - win.x0, ROOM.height - win.y1, wallThickness, wallMat, { x: (win.x0 + win.x1) / 2, y: (ROOM.height + win.y1) / 2, z: backZ, cast: false });
  // side + front walls (front-facing only, so the camera can look in from outside)
  const sideWall = (x, ry) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(roomDepth, ROOM.height), wallMat);
    m.rotation.y = ry;
    m.position.set(x, ROOM.height / 2, roomCenterZ);
    m.receiveShadow = true;
    group.add(m);
  };
  sideWall(-ROOM.halfWidth, Math.PI / 2);
  sideWall(ROOM.halfWidth, -Math.PI / 2);
  const frontWall = new THREE.Mesh(new THREE.PlaneGeometry(ROOM.halfWidth * 2, ROOM.height), wallMat);
  frontWall.rotation.y = Math.PI;
  frontWall.position.set(0, ROOM.height / 2, ROOM.frontZ);
  group.add(frontWall);
  // baseboards
  box(ROOM.halfWidth * 2, 0.09, 0.02, white, { x: 0, y: 0.045, z: ROOM.backZ + 0.01, cast: false });
  box(0.02, 0.09, roomDepth, white, { x: -ROOM.halfWidth + 0.01, y: 0.045, z: roomCenterZ, cast: false });
  box(0.02, 0.09, roomDepth, white, { x: ROOM.halfWidth - 0.01, y: 0.045, z: roomCenterZ, cast: false });

  /* ---------------- window ---------------- */
  const winW = win.x1 - win.x0;
  const winH = win.y1 - win.y0;
  const winCX = (win.x0 + win.x1) / 2;
  const winCY = (win.y0 + win.y1) / 2;
  const frameDepth = 0.1;
  box(winW + 0.12, 0.06, frameDepth, white, { x: winCX, y: win.y1 + 0.03, z: ROOM.backZ - 0.02 });
  box(winW + 0.12, 0.08, frameDepth + 0.04, white, { x: winCX, y: win.y0 - 0.04, z: ROOM.backZ });
  box(0.06, winH, frameDepth, white, { x: win.x0 - 0.03, y: winCY, z: ROOM.backZ - 0.02 });
  box(0.06, winH, frameDepth, white, { x: win.x1 + 0.03, y: winCY, z: ROOM.backZ - 0.02 });
  box(0.03, winH, 0.03, white, { x: winCX, y: winCY, z: ROOM.backZ - 0.03, cast: false });
  box(winW, 0.03, 0.03, white, { x: winCX, y: winCY, z: ROOM.backZ - 0.03, cast: false });
  const skyDay = skyTexture(false);
  const skyNight = skyTexture(true);
  const skyMat = new THREE.MeshBasicMaterial({ map: skyNight });
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(winW + 0.6, winH + 0.5), skyMat);
  sky.position.set(winCX, winCY, ROOM.backZ - 0.32);
  group.add(sky);
  const glassMat = new THREE.MeshPhysicalMaterial({ color: '#cfe6ff', transparent: true, opacity: 0.12, roughness: 0.05, metalness: 0, transmission: 0 });
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(winW, winH), glassMat);
  glass.position.set(winCX, winCY, ROOM.backZ - 0.06);
  group.add(glass);
  // blinds (half drawn)
  const slatMat = std('#efe7d3', { roughness: 0.6 });
  const slatCount = 9;
  for (let i = 0; i < slatCount; i++) {
    const slat = box(winW + 0.04, 0.012, 0.05, slatMat, { x: winCX, y: win.y1 - 0.06 - i * 0.055, z: ROOM.backZ + 0.03, cast: false });
    slat.rotation.x = 0.55;
  }
  box(winW + 0.08, 0.05, 0.07, white, { x: winCX, y: win.y1 + 0.02, z: ROOM.backZ + 0.035, cast: false });

  /* ---------------- wall decor ---------------- */
  // poster
  box(0.56, 0.76, 0.02, black, { x: -1.15, y: 1.62, z: ROOM.backZ + 0.01, cast: false });
  const poster = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.7), new THREE.MeshStandardMaterial({ map: posterTexture(), roughness: 0.9 }));
  poster.position.set(-1.15, 1.62, ROOM.backZ + 0.021);
  group.add(poster);

  // wall clock
  const clock = clockTexture();
  const clockFace = new THREE.Mesh(new THREE.CircleGeometry(0.15, 40), new THREE.MeshStandardMaterial({ map: clock.texture, roughness: 0.6 }));
  clockFace.position.set(-2.0, 2.15, ROOM.backZ + 0.025);
  group.add(clockFace);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.014, 10, 40), black);
  rim.position.copy(clockFace.position);
  group.add(rim);
  updaters.push(() => clock.update());

  // calendar
  box(0.3, 0.38, 0.012, white, { x: 2.25, y: 1.72, z: ROOM.backZ + 0.006, cast: false });
  const calendar = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.35), new THREE.MeshStandardMaterial({ map: calendarTexture(), roughness: 0.9 }));
  calendar.position.set(2.25, 1.72, ROOM.backZ + 0.013);
  group.add(calendar);

  // light switch
  const switchPlate = box(0.08, 0.12, 0.012, white, { x: -2.3, y: 1.3, z: ROOM.backZ + 0.006, cast: false, name: 'switch' });
  const switchNub = box(0.02, 0.035, 0.014, beigeDark, { x: -2.3, y: 1.3, z: ROOM.backZ + 0.016, cast: false, name: 'switch' });

  /* ---------------- desk ---------------- */
  const deskTop = box(DESK.width, 0.04, DESK.depth, deskMat, { x: 0, y: DESK.height - 0.02, z: DESK.centerZ });
  deskTop.receiveShadow = true;
  box(0.05, DESK.height - 0.04, DESK.depth - 0.06, deskDark, { x: -DESK.width / 2 + 0.05, y: (DESK.height - 0.04) / 2, z: DESK.centerZ });
  box(0.05, DESK.height - 0.04, DESK.depth - 0.06, deskDark, { x: DESK.width / 2 - 0.05, y: (DESK.height - 0.04) / 2, z: DESK.centerZ });
  box(DESK.width - 0.2, 0.14, 0.03, deskDark, { x: 0, y: DESK.height - 0.12, z: DESK.centerZ - DESK.depth / 2 + 0.05 });
  // drawer unit
  const drawerX = 0.58;
  box(0.42, 0.56, 0.6, deskDark, { x: drawerX, y: 0.28, z: DESK.centerZ });
  for (let i = 0; i < 2; i++) {
    box(0.38, 0.22, 0.02, deskMat, { x: drawerX, y: 0.16 + i * 0.26, z: DESK.centerZ + 0.31, cast: false });
    box(0.1, 0.02, 0.02, metal, { x: drawerX, y: 0.16 + i * 0.26, z: DESK.centerZ + 0.33, cast: false });
  }

  /* ---------------- monitor ---------------- */
  const monitor = new THREE.Group();
  monitor.position.set(0, DESK.height, SCREEN.center.z - 0.185);
  group.add(monitor);
  const mp = { parent: monitor };
  cylinder(0.17, 0.19, 0.05, beigeDark, { y: 0.025, ...mp });
  box(0.18, 0.03, 0.18, beigeDark, { y: 0.065, ...mp });
  const bodyW = 0.46;
  const bodyH = 0.38;
  const bezelD = 0.06;
  const cy = 0.07 + bodyH / 2; // screen centre height within group -> matches SCREEN.center.y
  const frontZ = 0.185 + 0.01; // bezel front face (screen sits 1cm behind it)
  const sideW = (bodyW - SCREEN.width) / 2;
  const topH = (bodyH - SCREEN.height) / 2;
  box(sideW, bodyH, bezelD, beige, { x: -bodyW / 2 + sideW / 2, y: cy, z: frontZ - bezelD / 2, ...mp });
  box(sideW, bodyH, bezelD, beige, { x: bodyW / 2 - sideW / 2, y: cy, z: frontZ - bezelD / 2, ...mp });
  box(SCREEN.width, topH, bezelD, beige, { y: cy + SCREEN.height / 2 + topH / 2, z: frontZ - bezelD / 2, ...mp });
  box(SCREEN.width, topH, bezelD, beige, { y: cy - SCREEN.height / 2 - topH / 2, z: frontZ - bezelD / 2, ...mp });
  // screen backing (behind the CSS plane)
  box(SCREEN.width, SCREEN.height, 0.01, black, { y: cy, z: 0.185 - 0.006, cast: false, ...mp });
  // tube (tapered rear)
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.33, 0.32, 4, 1), beige);
  tube.rotation.x = Math.PI / 2;
  tube.rotation.y = Math.PI / 4;
  tube.position.set(0, cy, frontZ - bezelD - 0.16);
  tube.castShadow = true;
  monitor.add(tube);
  // vents on top
  for (let i = 0; i < 5; i++) box(0.012, 0.004, 0.16, beigeDark, { x: -0.06 + i * 0.03, y: cy + bodyH / 2 - 0.03, z: frontZ - bezelD - 0.14, cast: false, ...mp });
  // brand label + power button + LED
  const brand = new THREE.Mesh(new THREE.PlaneGeometry(0.11, 0.02), new THREE.MeshBasicMaterial({ map: labelTexture('RICKY SYSTEMS', { w: 352, h: 64, bg: '#d9d1bd', fg: '#4a4640', font: "bold 24px 'Silkscreen', monospace" }) }));
  brand.position.set(-0.13, cy - SCREEN.height / 2 - topH / 2, frontZ + 0.001);
  monitor.add(brand);
  const powerBtn = cylinder(0.012, 0.012, 0.012, beigeDark, { x: 0.18, y: cy - SCREEN.height / 2 - topH / 2, z: frontZ + 0.004, segments: 16, name: 'monitorPower', ...mp });
  powerBtn.rotation.x = Math.PI / 2;
  const monitorLedMat = new THREE.MeshStandardMaterial({ color: '#2bff6a', emissive: '#2bff6a', emissiveIntensity: 1.5 });
  const monitorLed = box(0.012, 0.006, 0.004, monitorLedMat, { x: 0.15, y: cy - SCREEN.height / 2 - topH / 2, z: frontZ + 0.002, cast: false, ...mp });
  // sticky notes on the bezel
  const sticky1 = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.06), new THREE.MeshStandardMaterial({ map: stickyTexture(['TODO:', 'finish', 'portfolio']), roughness: 0.9 }));
  sticky1.position.set(bodyW / 2 - sideW / 2 + 0.005, cy + 0.09, frontZ + 0.002);
  sticky1.rotation.z = -0.08;
  monitor.add(sticky1);
  const sticky2 = new THREE.Mesh(new THREE.PlaneGeometry(0.055, 0.055), new THREE.MeshStandardMaterial({ map: stickyTexture(['call', 'mom'], '#b9e6ff'), roughness: 0.9 }));
  sticky2.position.set(-bodyW / 2 + sideW / 2 - 0.003, cy - 0.11, frontZ + 0.002);
  sticky2.rotation.z = 0.12;
  monitor.add(sticky2);
  interactive([powerBtn], { name: 'monitorPower', label: 'Monitor power', action: () => bus.emit('monitor:power') });

  /* ---------------- keyboard + mouse ---------------- */
  const kb = new THREE.Group();
  kb.position.set(-0.02, DESK.height, 0.02);
  kb.rotation.y = 0.03;
  group.add(kb);
  box(0.45, 0.022, 0.16, beigeDark, { y: 0.011, parent: kb });
  const keyGeo = new THREE.BoxGeometry(0.0155, 0.009, 0.0155);
  const keyMat = std('#e4dccb', { roughness: 0.6 });
  const rows = [14, 14, 13, 12];
  const keyCount = rows.reduce((a, b) => a + b, 0);
  const keys = new THREE.InstancedMesh(keyGeo, keyMat, keyCount);
  keys.castShadow = true;
  const m4 = new THREE.Matrix4();
  let k = 0;
  rows.forEach((count, r) => {
    const offset = r * 0.006;
    for (let i = 0; i < count; i++) {
      m4.makeTranslation(-0.2 + offset + i * 0.0185, 0.027, -0.05 + r * 0.019);
      keys.setMatrixAt(k++, m4);
    }
  });
  kb.add(keys);
  box(0.11, 0.009, 0.0155, keyMat, { x: -0.03, y: 0.027, z: 0.03, parent: kb });
  box(0.05, 0.009, 0.0155, keyMat, { x: 0.15, y: 0.027, z: 0.03, parent: kb });
  box(0.05, 0.009, 0.0155, keyMat, { x: -0.16, y: 0.027, z: 0.03, parent: kb });
  const escKey = box(0.0155, 0.009, 0.0155, std('#ff6b4a'), { x: -0.2, y: 0.028, z: -0.05, parent: kb });
  escKey.castShadow = false;

  box(0.24, 0.004, 0.2, std('#243b44', { roughness: 0.95 }), { x: 0.36, y: DESK.height + 0.002, z: 0.02, cast: false });
  const mouse = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), beige);
  mouse.scale.set(0.03, 0.02, 0.048);
  mouse.position.set(0.36, DESK.height + 0.02, 0.0);
  mouse.rotation.y = -0.2;
  mouse.castShadow = true;
  group.add(mouse);
  box(0.002, 0.012, 0.03, beigeDark, { x: 0.36, y: DESK.height + 0.028, z: -0.02, cast: false });

  /* ---------------- coffee ---------------- */
  const mug = new THREE.Group();
  mug.position.set(-0.45, DESK.height, 0.03);
  group.add(mug);
  const mugMat = std('#ff6b4a', { roughness: 0.5 });
  cylinder(0.042, 0.038, 0.095, mugMat, { y: 0.0475, parent: mug });
  cylinder(0.036, 0.036, 0.004, std('#2a1a12', { roughness: 0.3 }), { y: 0.088, cast: false, parent: mug });
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.026, 0.008, 10, 24, Math.PI), mugMat);
  handle.position.set(-0.04, 0.05, 0);
  handle.rotation.z = Math.PI / 2;
  handle.rotation.y = Math.PI / 2;
  handle.castShadow = true;
  mug.add(handle);
  const steam = createSteam();
  steam.mesh.position.set(0, 0.22, 0);
  mug.add(steam.mesh);
  let mugWobble = 0;
  interactive(mug, { name: 'mug', label: 'Coffee (still hot)', action: () => { mugWobble = 1; sound.tick(); } });
  updaters.push((dt, t) => {
    steam.update(t);
    steam.mesh.rotation.y = Math.atan2(camera.position.x - mug.position.x, camera.position.z - mug.position.z);
    if (mugWobble > 0) {
      mugWobble = Math.max(0, mugWobble - dt * 1.4);
      mug.rotation.z = Math.sin(t * 28) * 0.12 * mugWobble;
      mug.rotation.x = Math.cos(t * 23) * 0.08 * mugWobble;
    }
  });

  /* ---------------- photo frame ---------------- */
  const frame = new THREE.Group();
  frame.position.set(-0.75, DESK.height, -0.42);
  frame.rotation.y = 0.5;
  group.add(frame);
  box(0.11, 0.13, 0.012, black, { y: 0.065, parent: frame });
  const photo = new THREE.Mesh(new THREE.PlaneGeometry(0.09, 0.09), new THREE.MeshStandardMaterial({ map: photoTexture(), roughness: 0.8 }));
  photo.position.set(0, 0.07, 0.0065);
  frame.add(photo);
  const kick = box(0.02, 0.1, 0.012, black, { y: 0.05, z: -0.03, parent: frame, cast: false });
  kick.rotation.x = -0.4;

  /* ---------------- desk lamp ---------------- */
  const lamp = new THREE.Group();
  lamp.position.set(0.72, DESK.height, -0.4);
  group.add(lamp);
  const lampMat = std('#2e5e4e', { roughness: 0.45, metalness: 0.2 });
  cylinder(0.075, 0.085, 0.025, lampMat, { y: 0.0125, parent: lamp });
  const arm1 = cylinder(0.011, 0.011, 0.36, lampMat, { y: 0.19, parent: lamp });
  arm1.rotation.z = 0.35;
  arm1.position.x = -0.06;
  cylinder(0.02, 0.02, 0.03, lampMat, { x: -0.125, y: 0.36, parent: lamp, segments: 12 });
  const arm2 = cylinder(0.011, 0.011, 0.34, lampMat, { x: -0.25, y: 0.42, parent: lamp });
  arm2.rotation.z = 1.25;
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.13, 24, 1, true), new THREE.MeshStandardMaterial({ color: '#2e5e4e', roughness: 0.5, metalness: 0.2, side: THREE.DoubleSide }));
  shade.position.set(-0.4, 0.44, 0);
  shade.rotation.z = -0.35;
  shade.castShadow = true;
  lamp.add(shade);
  const bulbMat = new THREE.MeshStandardMaterial({ color: '#fff1c9', emissive: '#ffd27a', emissiveIntensity: 2.2 });
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.03, 14, 10), bulbMat);
  bulb.position.set(-0.4, 0.41, 0);
  lamp.add(bulb);
  const lampLight = new THREE.SpotLight('#ffd9a3', 18, 4.5, 0.75, 0.6, 2);
  lampLight.position.set(-0.4, 0.4, 0);
  lampLight.target.position.set(-0.9, -0.74, 0.35);
  lampLight.castShadow = true;
  lampLight.shadow.mapSize.set(1024, 1024);
  lampLight.shadow.bias = -0.0008;
  lampLight.shadow.normalBias = 0.01;
  lamp.add(lampLight, lampLight.target);
  const lampState = { on: true };
  const setLamp = (on) => {
    lampState.on = on;
    lampLight.visible = on;
    bulbMat.emissiveIntensity = on ? 2.2 : 0;
    bulbMat.color.set(on ? '#fff1c9' : '#6c6355');
    bus.emit('lamp', on);
  };
  interactive(lamp, { name: 'lamp', label: 'Desk lamp', action: () => { setLamp(!lampState.on); sound.click(!lampState.on); } });

  /* ---------------- tower PC ---------------- */
  const tower = new THREE.Group();
  tower.position.set(-0.62, 0, DESK.centerZ - 0.02);
  group.add(tower);
  box(0.2, 0.44, 0.46, beige, { y: 0.22, parent: tower });
  box(0.16, 0.02, 0.012, black, { x: 0, y: 0.36, z: 0.235, cast: false, parent: tower });
  box(0.16, 0.02, 0.012, black, { x: 0, y: 0.32, z: 0.235, cast: false, parent: tower });
  box(0.05, 0.006, 0.006, black, { x: -0.04, y: 0.26, z: 0.233, cast: false, parent: tower });
  const towerBtn = cylinder(0.014, 0.014, 0.012, beigeDark, { x: 0.05, y: 0.12, z: 0.235, segments: 16, name: 'towerPower', parent: tower });
  towerBtn.rotation.x = Math.PI / 2;
  const towerLedMat = new THREE.MeshStandardMaterial({ color: '#2bff6a', emissive: '#2bff6a', emissiveIntensity: 1.5 });
  const towerLed = box(0.008, 0.008, 0.004, towerLedMat, { x: -0.05, y: 0.12, z: 0.232, cast: false, parent: tower });
  const hddLedMat = new THREE.MeshStandardMaterial({ color: '#ffb347', emissive: '#ffb347', emissiveIntensity: 0 });
  box(0.008, 0.008, 0.004, hddLedMat, { x: -0.03, y: 0.12, z: 0.232, cast: false, parent: tower });
  for (let i = 0; i < 6; i++) box(0.12, 0.004, 0.004, beigeDark, { y: 0.04 + i * 0.012, z: 0.232, cast: false, parent: tower });
  interactive([towerBtn], { name: 'towerPower', label: 'Reset button', action: () => bus.emit('tower:power') });
  let hddTimer = 0;
  updaters.push((dt) => {
    hddTimer -= dt;
    if (hddTimer <= 0) {
      hddLedMat.emissiveIntensity = hddLedMat.emissiveIntensity > 0 ? 0 : 1.6;
      hddTimer = hddLedMat.emissiveIntensity > 0 ? 0.05 + Math.random() * 0.15 : Math.random() * 1.8;
    }
  });

  // cable from monitor to tower
  const cable = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0.05, 0.95, -0.5), new THREE.Vector3(0.02, 0.8, -0.56), new THREE.Vector3(-0.3, 0.55, -0.5), new THREE.Vector3(-0.55, 0.3, -0.45)]), 24, 0.005, 6),
    dark
  );
  group.add(cable);

  /* ---------------- radio ---------------- */
  const radio = new THREE.Group();
  radio.position.set(-0.62, DESK.height, -0.45);
  radio.rotation.y = 0.35;
  group.add(radio);
  box(0.22, 0.12, 0.09, std('#4a3628', { roughness: 0.6 }), { y: 0.06, parent: radio });
  box(0.2, 0.1, 0.008, std('#d2c6a8', { roughness: 0.5 }), { y: 0.06, z: 0.046, cast: false, parent: radio });
  const grille = cylinder(0.035, 0.035, 0.01, black, { x: -0.06, y: 0.06, z: 0.05, segments: 20, cast: false, parent: radio });
  grille.rotation.x = Math.PI / 2;
  const dial = cylinder(0.018, 0.018, 0.012, std('#e9e3d3'), { x: 0.05, y: 0.07, z: 0.05, segments: 16, cast: false, parent: radio });
  dial.rotation.x = Math.PI / 2;
  box(0.06, 0.012, 0.004, std('#ff6b4a'), { x: 0.05, y: 0.028, z: 0.052, cast: false, parent: radio });
  const antenna = cylinder(0.003, 0.003, 0.3, metal, { x: 0.09, y: 0.25, z: -0.02, segments: 8, parent: radio });
  antenna.rotation.z = -0.35;
  const radioLedMat = new THREE.MeshStandardMaterial({ color: '#ff6b4a', emissive: '#ff6b4a', emissiveIntensity: 0 });
  box(0.008, 0.008, 0.004, radioLedMat, { x: 0.085, y: 0.09, z: 0.051, cast: false, parent: radio });
  interactive(radio, {
    name: 'radio',
    label: 'Radio',
    action: () => {
      sound.unlock();
      bus.emit('radio:toggle');
    },
  });
  updaters.push((dt, t) => {
    const playing = sound.chip.playing;
    radioLedMat.emissiveIntensity = playing ? 1.2 + Math.sin(t * 12) * 0.5 : 0;
  });

  /* ---------------- fern ---------------- */
  const plant = new THREE.Group();
  plant.position.set(1.35, 0, 0.55);
  group.add(plant);
  cylinder(0.13, 0.1, 0.28, std('#b5613f', { roughness: 0.8 }), { y: 0.14, parent: plant });
  cylinder(0.14, 0.14, 0.03, std('#b5613f'), { y: 0.28, parent: plant });
  cylinder(0.12, 0.12, 0.01, std('#3a2a1c'), { y: 0.29, cast: false, parent: plant });
  const leafMat = std('#3f8f4a', { roughness: 0.7, side: THREE.DoubleSide });
  const leaves = [];
  for (let i = 0; i < 9; i++) {
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.5, 5), i % 2 ? leafMat : std('#4fa85a', { roughness: 0.7 }));
    leaf.scale.set(0.6, 1, 0.25);
    const a = (i / 9) * Math.PI * 2;
    leaf.position.set(Math.cos(a) * 0.05, 0.5, Math.sin(a) * 0.05);
    leaf.rotation.z = Math.cos(a) * 0.75;
    leaf.rotation.x = -Math.sin(a) * 0.75;
    leaf.castShadow = true;
    plant.add(leaf);
    leaves.push({ mesh: leaf, base: { x: leaf.rotation.x, z: leaf.rotation.z }, phase: a });
  }
  let plantJiggle = 0;
  interactive(plant, { name: 'plant', label: 'The fern', action: () => { plantJiggle = 1; sound.tick(); } });
  updaters.push((dt, t) => {
    if (plantJiggle > 0) plantJiggle = Math.max(0, plantJiggle - dt * 0.9);
    for (const l of leaves) {
      l.mesh.rotation.x = l.base.x + Math.sin(t * 1.3 + l.phase) * 0.02 + Math.sin(t * 22 + l.phase) * 0.12 * plantJiggle;
      l.mesh.rotation.z = l.base.z + Math.cos(t * 1.1 + l.phase) * 0.02;
    }
  });

  /* ---------------- chair ---------------- */
  const chair = new THREE.Group();
  chair.position.set(0.28, 0, 0.78);
  chair.rotation.y = 0.55;
  group.add(chair);
  const chairMat = std('#33404f', { roughness: 0.8 });
  cylinder(0.02, 0.02, 0.4, metal, { y: 0.2, parent: chair });
  for (let i = 0; i < 5; i++) {
    const leg = box(0.3, 0.025, 0.035, metal, { y: 0.02, parent: chair });
    leg.rotation.y = (i / 5) * Math.PI * 2;
    leg.position.set(Math.cos((i / 5) * Math.PI * 2) * 0.15, 0.02, Math.sin((i / 5) * Math.PI * 2) * 0.15);
    const wheel = cylinder(0.025, 0.025, 0.02, black, { x: Math.cos((i / 5) * Math.PI * 2) * 0.3, y: 0.025, z: Math.sin((i / 5) * Math.PI * 2) * 0.3, segments: 12, parent: chair });
    wheel.rotation.z = Math.PI / 2;
    wheel.rotation.y = (i / 5) * Math.PI * 2;
  }
  box(0.48, 0.07, 0.46, chairMat, { y: 0.45, parent: chair });
  box(0.46, 0.42, 0.06, chairMat, { y: 0.74, z: 0.22, parent: chair });
  box(0.03, 0.12, 0.08, metal, { y: 0.52, z: 0.22, parent: chair, cast: false });
  let chairSpin = 0;
  interactive(chair, { name: 'chair', label: 'Office chair', action: () => { chairSpin = 6; sound.click(); } });
  updaters.push((dt) => {
    if (chairSpin > 0.001) {
      chair.rotation.y += chairSpin * dt;
      chairSpin *= Math.pow(0.35, dt);
    }
  });

  /* ---------------- rug ---------------- */
  const rug = new THREE.Mesh(new THREE.CircleGeometry(1.0, 40), std('#7a4a3a', { roughness: 1 }));
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(0.1, 0.004, 0.9);
  rug.receiveShadow = true;
  group.add(rug);
  const rugInner = new THREE.Mesh(new THREE.CircleGeometry(0.7, 40), std('#a86a4a', { roughness: 1 }));
  rugInner.rotation.x = -Math.PI / 2;
  rugInner.position.set(0.1, 0.006, 0.9);
  rugInner.receiveShadow = true;
  group.add(rugInner);

  /* ---------------- bookshelf ---------------- */
  const shelf = new THREE.Group();
  shelf.position.set(-ROOM.halfWidth + 0.16, 0, 1.4);
  group.add(shelf);
  const shelfMat = std('#5a3d24', { roughness: 0.75 });
  box(0.02, 1.9, 0.9, shelfMat, { x: -0.14, y: 0.95, parent: shelf });
  box(0.3, 1.9, 0.02, shelfMat, { y: 0.95, z: -0.45, parent: shelf });
  box(0.3, 1.9, 0.02, shelfMat, { y: 0.95, z: 0.45, parent: shelf });
  const bookColors = ['#ff6b4a', '#3aa0a8', '#e4b33c', '#4caf7d', '#7a4bd6', '#fbf8f0', '#c9432a', '#1e1b18', '#8ad0ff'];
  for (let s = 0; s < 5; s++) {
    const y = 0.05 + s * 0.45;
    box(0.3, 0.025, 0.9, shelfMat, { y, parent: shelf });
    if (s === 4) continue;
    let z = -0.42;
    while (z < 0.36) {
      const w = 0.025 + rnd() * 0.04;
      const h = 0.17 + rnd() * 0.12;
      const b = box(0.2, h, w, std(bookColors[Math.floor(rnd() * bookColors.length)], { roughness: 0.8 }), { x: 0.01, y: y + 0.0125 + h / 2, z: z + w / 2, parent: shelf, cast: false });
      if (rnd() > 0.85) {
        b.rotation.x = 0.18;
        z += 0.02;
      }
      z += w + 0.004;
      if (rnd() > 0.9) z += 0.08;
    }
  }
  // a small cactus on top
  cylinder(0.05, 0.04, 0.06, std('#b5613f'), { x: 0, y: 1.9 + 0.03, z: 0.25, parent: shelf });
  cylinder(0.025, 0.03, 0.12, std('#4fa85a'), { x: 0, y: 1.9 + 0.12, z: 0.25, parent: shelf, segments: 10 });
  // cardboard boxes in the corner
  const cardboard = std('#c19a6b', { roughness: 0.95 });
  box(0.5, 0.36, 0.42, cardboard, { x: 2.2, y: 0.18, z: 2.7 });
  box(0.36, 0.3, 0.32, cardboard, { x: 2.15, y: 0.51, z: 2.72 });
  // door on the right wall
  box(0.05, 2.1, 0.9, std('#ded5c2', { roughness: 0.8 }), { x: ROOM.halfWidth - 0.03, y: 1.05, z: 1.7, cast: false });
  box(0.04, 2.2, 1.0, white, { x: ROOM.halfWidth - 0.01, y: 1.1, z: 1.7, cast: false });
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 10), metal);
  knob.position.set(ROOM.halfWidth - 0.08, 1.0, 1.35);
  group.add(knob);

  /* ---------------- lights ---------------- */
  const hemi = new THREE.HemisphereLight('#bcd3ea', '#5c4a3b', 0.3);
  scene.add(hemi);
  const ambient = new THREE.AmbientLight('#ffffff', 0.12);
  scene.add(ambient);
  const sun = new THREE.DirectionalLight('#fff0d2', 2.6);
  sun.position.set(1.9, 2.5, -1.6);
  sun.target.position.set(-0.2, 0.6, 1.1);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -2.6;
  sun.shadow.camera.right = 2.6;
  sun.shadow.camera.top = 2.6;
  sun.shadow.camera.bottom = -2.6;
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 9;
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 0.02;
  scene.add(sun, sun.target);
  const moon = new THREE.DirectionalLight('#9fb6ff', 0.45);
  moon.position.copy(sun.position);
  moon.target = sun.target;
  scene.add(moon);
  const screenGlow = new THREE.PointLight('#8fd7ff', 1.6, 1.8, 2);
  screenGlow.position.set(0, SCREEN.center.y, SCREEN.center.z + 0.12);
  scene.add(screenGlow);
  const nightState = { night: true };
  const setNight = (night) => {
    nightState.night = night;
    sun.visible = !night;
    moon.visible = night;
    hemi.intensity = night ? 0.3 : 0.55;
    ambient.intensity = night ? 0.12 : 0.2;
    skyMat.map = night ? skyNight : skyDay;
    skyMat.needsUpdate = true;
    glassMat.opacity = night ? 0.1 : 0.18;
    scene.background = new THREE.Color(night ? '#06080a' : '#0d1216');
    bus.emit('night', night);
  };
  interactive([switchPlate, switchNub], {
    name: 'switch',
    label: 'Light switch',
    action: () => {
      setNight(!nightState.night);
      switchNub.position.y = nightState.night ? 1.3 - 0.015 : 1.3 + 0.015;
      sound.click(!nightState.night);
    },
  });
  setNight(true);
  switchNub.position.y = 1.3 - 0.015;

  const glowState = { on: true };
  updaters.push((dt, t) => {
    const target = glowState.on ? 1.6 + Math.sin(t * 9.1) * 0.08 + Math.sin(t * 23.7) * 0.05 : 0;
    screenGlow.intensity += (target - screenGlow.intensity) * Math.min(1, dt * 8);
    monitorLedMat.emissiveIntensity = glowState.on ? 1.5 : 0.15;
  });

  let camera = null;

  return {
    group,
    interactives,
    lamp: { get on() { return lampState.on; }, set: setLamp, toggle: () => setLamp(!lampState.on) },
    night: { get value() { return nightState.night; }, set: setNight },
    setScreenPower(on) {
      glowState.on = on;
    },
    setCamera(cam) {
      camera = cam;
    },
    update(dt, elapsed) {
      if (!camera) return;
      for (const fn of updaters) fn(dt, elapsed);
    },
  };
}
