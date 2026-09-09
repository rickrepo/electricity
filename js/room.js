// The room: a den for someone born in 1989, in millimetres. A desk against
// the back wall with the phone on it, the poster above, two 1200s and a
// mixer along the left wall by the bed, a CRT with the N64 on the right,
// a nitro buggy on the rug and another on the shelf. Everything is boxes,
// cylinders, and canvas-drawn textures.
import * as THREE from '../vendor/three.min.js';
import { dunkWallpaper } from './os/art.js';

export const DESK = { top: 760, x: 0, z: -650, width: 1400, depth: 700 };
export const ROOM = { halfW: 2000, back: -1000, front: 2600, height: 2600 };

let seed = 1989;
const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const tex = (c, { repeat = [1, 1], srgb = true } = {}) => {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat[0], repeat[1]);
  t.anisotropy = 8;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
};

/* ---------------- textures ---------------- */
function woodTexture({ base = '#9a6a3e', dark = '#5e3a1e', light = '#b98552', planks = 6, size = 512 } = {}) {
  const c = canvas(size, size), ctx = c.getContext('2d');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);
  const ph = size / planks;
  for (let p = 0; p < planks; p++) {
    const y0 = p * ph;
    ctx.fillStyle = rnd() > 0.5 ? light : dark;
    ctx.globalAlpha = rnd() * 0.35;
    ctx.fillRect(0, y0, size, ph);
    ctx.globalAlpha = 1;
    for (let i = 0; i < 30; i++) {
      ctx.strokeStyle = `rgba(60,35,15,${0.06 + rnd() * 0.14})`;
      ctx.lineWidth = 1 + rnd() * 2.5;
      ctx.beginPath();
      const y = y0 + rnd() * ph, wob = rnd() * 6, amp = rnd() * 3;
      ctx.moveTo(0, y);
      for (let x = 0; x <= size; x += 24) ctx.lineTo(x, y + Math.sin(x * 0.015 + wob) * amp);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(0, y0, size, 2);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(rnd() * size, y0, 2, ph);
  }
  return c;
}

function paintTexture(color = '#d9d0bd', size = 256) {
  const c = canvas(size, size), ctx = c.getContext('2d');
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 2600; i++) {
    ctx.fillStyle = `rgba(${rnd() > 0.5 ? '255,255,255' : '0,0,0'},${0.02 + rnd() * 0.05})`;
    ctx.fillRect(rnd() * size, rnd() * size, 1 + rnd() * 2, 1 + rnd() * 2);
  }
  return c;
}

function rugTexture() {
  const c = canvas(768, 512), ctx = c.getContext('2d');
  ctx.fillStyle = '#7a2a2c';
  ctx.fillRect(0, 0, 768, 512);
  ctx.fillStyle = '#c9a25a';
  ctx.fillRect(28, 28, 712, 456);
  ctx.fillStyle = '#7a2a2c';
  ctx.fillRect(44, 44, 680, 424);
  ctx.fillStyle = '#2f3a5a';
  ctx.fillRect(84, 84, 600, 344);
  ctx.strokeStyle = '#c9a25a';
  ctx.lineWidth = 3;
  ctx.strokeRect(100, 100, 568, 312);
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 5; j++) {
      ctx.fillStyle = (i + j) % 2 ? '#b8432f' : '#c9a25a';
      ctx.save();
      ctx.translate(140 + i * 61, 140 + j * 58);
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-9, -9, 18, 18);
      ctx.restore();
    }
  }
  for (let i = 0; i < 6000; i++) {
    ctx.fillStyle = `rgba(0,0,0,${rnd() * 0.12})`;
    ctx.fillRect(rnd() * 768, rnd() * 512, 2, 2);
  }
  return c;
}

function skyTexture() {
  const c = canvas(256, 320), ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, 320);
  g.addColorStop(0, '#6fb0ea');
  g.addColorStop(0.7, '#cfe5f7');
  g.addColorStop(1, '#f2ead8');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 320);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  for (const [x, y, r] of [[60, 80, 26], [90, 70, 34], [125, 84, 24], [190, 150, 20], [215, 142, 28], [240, 156, 18]]) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
  ctx.fillStyle = '#5c7a4a';
  ctx.fillRect(0, 262, 256, 58);
  ctx.fillStyle = '#4a6a3c';
  for (let x = 0; x < 256; x += 22) { ctx.beginPath(); ctx.moveTo(x, 262); ctx.lineTo(x + 11, 232 + rnd() * 16); ctx.lineTo(x + 22, 262); ctx.closePath(); ctx.fill(); }
  return c;
}

function gameTexture() {
  const c = canvas(320, 240), ctx = c.getContext('2d');
  const sky = ctx.createLinearGradient(0, 0, 0, 120);
  sky.addColorStop(0, '#3f8fe0'); sky.addColorStop(1, '#a9d6ff');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 320, 120);
  ctx.fillStyle = '#5da33c';
  ctx.fillRect(0, 120, 320, 120);
  ctx.fillStyle = '#6b6b70';
  ctx.beginPath(); ctx.moveTo(60, 240); ctx.lineTo(140, 120); ctx.lineTo(180, 120); ctx.lineTo(300, 240); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#f2e14b';
  for (let i = 0; i < 6; i++) { const t = i / 6; ctx.fillRect(160 - 3 * (1 + t * 3), 120 + t * 120, 6 * (1 + t * 3), 10 + t * 8); }
  ctx.fillStyle = '#e03a2f';
  ctx.fillRect(120, 172, 50, 30);
  ctx.fillStyle = '#111';
  ctx.fillRect(114, 190, 14, 16); ctx.fillRect(162, 190, 14, 16);
  ctx.fillStyle = '#2f6fd0';
  ctx.fillRect(196, 148, 26, 16);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 14px Helvetica, Arial';
  ctx.fillText('LAP 2/3', 10, 22);
  ctx.fillText("1'02\"89", 236, 22);
  return c;
}

/* ---------------- builders ---------------- */
export function createRoom({ scene }) {
  const group = new THREE.Group();
  scene.add(group);
  const mats = {
    floor: new THREE.MeshStandardMaterial({ map: tex(woodTexture(), { repeat: [4, 3] }), roughness: 0.75, metalness: 0.05 }),
    wall: new THREE.MeshStandardMaterial({ map: tex(paintTexture('#d9d0bd'), { repeat: [6, 4] }), roughness: 0.95 }),
    ceiling: new THREE.MeshStandardMaterial({ color: 0xf1ede4, roughness: 1 }),
    trim: new THREE.MeshStandardMaterial({ color: 0xf3efe6, roughness: 0.7 }),
    desk: new THREE.MeshStandardMaterial({ map: tex(woodTexture({ base: '#7a4a2a', dark: '#4a2a14', light: '#96603a', planks: 3 }), { repeat: [2, 1] }), roughness: 0.55 }),
    darkWood: new THREE.MeshStandardMaterial({ color: 0x4a3324, roughness: 0.7 }),
    black: new THREE.MeshStandardMaterial({ color: 0x1a1a1c, roughness: 0.6 }),
    charcoal: new THREE.MeshStandardMaterial({ color: 0x3a3733, roughness: 0.7 }),
    silver: new THREE.MeshStandardMaterial({ color: 0xc9cbce, roughness: 0.4, metalness: 0.7 }),
    grey: new THREE.MeshStandardMaterial({ color: 0x8f9296, roughness: 0.6, metalness: 0.1 }),
    red: new THREE.MeshStandardMaterial({ color: 0xd63a2f, roughness: 0.45 }),
    blue: new THREE.MeshStandardMaterial({ color: 0x2f6fd0, roughness: 0.45 }),
    white: new THREE.MeshStandardMaterial({ color: 0xf4f1ea, roughness: 0.9 }),
    blanket: new THREE.MeshStandardMaterial({ color: 0x7a2a2c, roughness: 1 }),
    crate: new THREE.MeshStandardMaterial({ color: 0x2b4f9a, roughness: 0.6 }),
  };
  const box = (w, h, d, mat, { x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, cast = true, receive = true, parent = group } = {}) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    m.rotation.set(rx, ry, rz);
    m.castShadow = cast;
    m.receiveShadow = receive;
    parent.add(m);
    return m;
  };
  const cyl = (r, h, mat, { x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, seg = 32, cast = true, parent = group, rt = r } = {}) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, r, h, seg), mat);
    m.position.set(x, y, z);
    m.rotation.set(rx, ry, rz);
    m.castShadow = cast;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  };

  /* room shell */
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(ROOM.halfW * 2, ROOM.front - ROOM.back), mats.floor);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0, (ROOM.front + ROOM.back) / 2);
  floor.receiveShadow = true;
  group.add(floor);
  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(ROOM.halfW * 2, ROOM.front - ROOM.back), mats.ceiling);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(0, ROOM.height, (ROOM.front + ROOM.back) / 2);
  group.add(ceiling);
  const wall = (w, x, z, ry) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, ROOM.height), mats.wall); m.position.set(x, ROOM.height / 2, z); m.rotation.y = ry; m.receiveShadow = true; group.add(m); return m; };
  wall(ROOM.halfW * 2, 0, ROOM.back, 0);
  wall(ROOM.halfW * 2, 0, ROOM.front, Math.PI);
  wall(ROOM.front - ROOM.back, -ROOM.halfW, (ROOM.front + ROOM.back) / 2, Math.PI / 2);
  wall(ROOM.front - ROOM.back, ROOM.halfW, (ROOM.front + ROOM.back) / 2, -Math.PI / 2);
  box(ROOM.halfW * 2, 100, 18, mats.trim, { y: 50, z: ROOM.back + 9, cast: false });
  box(18, 100, ROOM.front - ROOM.back, mats.trim, { x: -ROOM.halfW + 9, y: 50, z: (ROOM.front + ROOM.back) / 2, cast: false });
  box(18, 100, ROOM.front - ROOM.back, mats.trim, { x: ROOM.halfW - 9, y: 50, z: (ROOM.front + ROOM.back) / 2, cast: false });

  /* window on the right wall, with a view */
  const winZ = 1500, winY = 1500;
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(1000, 1200), new THREE.MeshBasicMaterial({ map: tex(skyTexture()) }));
  sky.position.set(ROOM.halfW - 12, winY, winZ);
  sky.rotation.y = -Math.PI / 2;
  group.add(sky);
  for (const [w, h, dy, dz] of [[1060, 40, 620, 0], [1060, 40, -620, 0], [40, 1240, 0, 530], [40, 1240, 0, -530], [1000, 22, 0, 0], [22, 1200, 0, 0]]) box(30, h, w, mats.trim, { x: ROOM.halfW - 20, y: winY + dy, z: winZ + dz, cast: false });
  box(120, 30, 1120, mats.trim, { x: ROOM.halfW - 60, y: winY - 650, z: winZ, cast: false });

  /* rug */
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(1800, 1200), new THREE.MeshStandardMaterial({ map: tex(rugTexture()), roughness: 1 }));
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(100, 2, 900);
  rug.receiveShadow = true;
  group.add(rug);

  /* the desk, with the phone's place on it */
  box(DESK.width, 40, DESK.depth, mats.desk, { x: DESK.x, y: DESK.top - 20, z: DESK.z });
  for (const sx of [-1, 1]) box(40, DESK.top - 40, DESK.depth - 40, mats.desk, { x: DESK.x + sx * (DESK.width / 2 - 20), y: (DESK.top - 40) / 2, z: DESK.z });
  box(DESK.width - 80, 300, 30, mats.desk, { x: DESK.x, y: DESK.top - 200, z: DESK.z - DESK.depth / 2 + 15 });
  // a drawer unit on the right
  box(400, 500, 600, mats.darkWood, { x: DESK.x + 480, y: 250, z: DESK.z + 20 });
  for (let i = 0; i < 2; i++) box(80, 14, 20, mats.silver, { x: DESK.x + 480, y: 130 + i * 240, z: DESK.z + 330 });
  // desk lamp
  cyl(80, 22, mats.black, { x: -520, y: DESK.top + 11, z: DESK.z - 200 });
  const arm1 = cyl(9, 380, mats.black, { x: -520, y: DESK.top + 22 + 180, z: DESK.z - 200, rx: 0.35 });
  arm1.position.z += 60;
  const arm2 = cyl(9, 300, mats.black, { x: -520, y: DESK.top + 380, z: DESK.z - 40, rx: 1.1 });
  const shade = new THREE.Mesh(new THREE.ConeGeometry(110, 150, 32, 1, true), new THREE.MeshStandardMaterial({ color: 0x1a1a1c, roughness: 0.6, side: THREE.DoubleSide }));
  shade.position.set(-520, DESK.top + 330, DESK.z + 70);
  shade.rotation.x = 2.6;
  shade.castShadow = true;
  group.add(shade);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(30, 16, 12), new THREE.MeshBasicMaterial({ color: 0xfff1c8 }));
  bulb.position.set(-520, DESK.top + 300, DESK.z + 110);
  group.add(bulb);
  const lampLight = new THREE.PointLight(0xffe0b0, 3.5, 0, 0);
  lampLight.position.copy(bulb.position);
  group.add(lampLight);
  // a stack of CD cases and a mug
  for (let i = 0; i < 5; i++) box(142, 10, 125, i % 2 ? mats.black : mats.white, { x: 420, y: DESK.top + 5 + i * 10, z: DESK.z - 180, ry: (i - 2) * 0.08 });
  cyl(40, 95, mats.white, { x: 300, y: DESK.top + 47, z: DESK.z + 80 });

  /* the poster over the desk: a real photograph if assets/poster.jpg exists
     (or the page provides one), the drawn silhouette until then */
  const frame = box(640, 940, 16, mats.black, { x: 0, y: 1720, z: ROOM.back + 8, cast: false });
  const posterTex = tex(dunkWallpaper());
  posterTex.wrapS = posterTex.wrapT = THREE.ClampToEdgeWrapping;
  const posterMat = new THREE.MeshStandardMaterial({ map: posterTex, roughness: 0.6 });
  const poster = new THREE.Mesh(new THREE.PlaneGeometry(600, 900), posterMat);
  poster.position.set(0, 1720, ROOM.back + 17);
  group.add(poster);
  const photoSrc = (typeof window !== 'undefined' && window.POSTER_PHOTO) || 'assets/poster.jpg';
  new THREE.TextureLoader().load(photoSrc, (t) => {
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    const w = 600, h = Math.min(1100, Math.max(500, w * (t.image.height / t.image.width)));
    poster.geometry.dispose();
    poster.geometry = new THREE.PlaneGeometry(w, h);
    frame.geometry.dispose();
    frame.geometry = new THREE.BoxGeometry(w + 40, h + 40, 16);
    posterMat.map = t;
    posterMat.needsUpdate = true;
  }, undefined, () => { /* no photo on disk: the drawing stays */ });

  /* the bed, back-left corner */
  const bedX = -ROOM.halfW + 520, bedZ = ROOM.front - 1040;
  box(1040, 180, 2040, mats.darkWood, { x: bedX, y: 190, z: bedZ });
  box(1000, 240, 2000, mats.white, { x: bedX, y: 400, z: bedZ });
  box(1010, 70, 1300, mats.blanket, { x: bedX, y: 555, z: bedZ - 330 });
  box(520, 130, 340, mats.white, { x: bedX, y: 585, z: ROOM.front - 250, ry: 0.06 });
  box(1040, 620, 60, mats.darkWood, { x: bedX, y: 500, z: ROOM.front - 50 });

  /* the decks along the left wall */
  const decks = [];
  const djX = -ROOM.halfW + 300, djZ = -150;
  box(560, 40, 1300, mats.black, { x: djX, y: 730, z: djZ });
  for (const dz of [-600, 600]) box(500, 710, 40, mats.black, { x: djX, y: 355, z: djZ + dz });
  const makeDeck = (z, angle) => {
    const g = new THREE.Group();
    g.position.set(djX, 750, z);
    g.rotation.y = Math.PI / 2;
    group.add(g);
    box(450, 90, 360, mats.silver, { y: 45, parent: g });
    const platter = new THREE.Group();
    platter.position.set(-40, 92, 0);
    g.add(platter);
    cyl(150, 8, mats.black, { y: 4, parent: platter, cast: false });
    cyl(146, 3, new THREE.MeshStandardMaterial({ color: 0x0f0f11, roughness: 0.35 }), { y: 9.5, parent: platter, cast: false });
    cyl(50, 3.5, mats.red, { y: 10.5, parent: platter, cast: false });
    box(40, 4.5, 8, mats.black, { x: -30, y: 11, parent: platter, cast: false });
    cyl(5, 14, mats.silver, { y: 14, parent: platter, cast: false });
    platter.rotation.y = angle;
    cyl(26, 24, mats.grey, { x: 165, y: 102, z: -120, parent: g });
    const arm = cyl(4, 230, mats.silver, { x: 90, y: 118, z: -40, rx: Math.PI / 2, parent: g });
    arm.rotation.set(Math.PI / 2, 0, 0.35);
    box(26, 8, 14, mats.black, { x: 20, y: 114, z: 40, parent: g, ry: 0.6 });
    box(14, 6, 110, mats.black, { x: 195, y: 93, z: 60, parent: g, cast: false });
    box(30, 8, 16, mats.grey, { x: 195, y: 97, z: 50, parent: g, cast: false });
    box(44, 10, 32, mats.charcoal, { x: -190, y: 95, z: 130, parent: g, cast: false });
    const lamp = box(10, 10, 10, new THREE.MeshStandardMaterial({ color: 0x5a2b23, emissive: 0xff3a1a, emissiveIntensity: 0 }), { x: -190, y: 95, z: -110, parent: g, cast: false });
    return { group: g, platter, lamp, playing: false, meshes: [] };
  };
  const deckA = makeDeck(djZ - 420, 0.3), deckB = makeDeck(djZ + 420, 2.1);
  for (const d of [deckA, deckB]) d.group.traverse((m) => { if (m.isMesh) d.meshes.push(m); });
  decks.push(deckA, deckB);
  // the mixer between them
  box(360, 80, 260, mats.charcoal, { x: djX, y: 790, z: djZ });
  for (let r = 0; r < 3; r++) for (let c = 0; c < 2; c++) cyl(10, 12, mats.grey, { x: djX - 60 + c * 120, y: 836, z: djZ - 70 + r * 50, cast: false });
  box(120, 3, 10, mats.black, { x: djX + 120, y: 831, z: djZ, cast: false });
  box(14, 10, 22, mats.silver, { x: djX + 120, y: 836, z: djZ - 10, cast: false });
  // milk crate of records under the table
  box(330, 280, 330, mats.crate, { x: djX + 60, y: 140, z: djZ + 200 });
  for (let i = 0; i < 9; i++) box(4, 310, 310, new THREE.MeshStandardMaterial({ color: [0x1a1a1c, 0xd94a2b, 0xf5e6c8, 0x2f6fd0, 0x3aa64a][i % 5], roughness: 0.8 }), { x: djX + 60 - 110 + i * 26, y: 300, z: djZ + 200, rz: 0.12 });
  // the shelf above with the second buggy and a fuel bottle
  box(240, 30, 900, mats.desk, { x: -ROOM.halfW + 120, y: 1650, z: djZ });
  for (const dz of [-380, 380]) box(20, 200, 20, mats.black, { x: -ROOM.halfW + 40, y: 1540, z: djZ + dz, cast: false });
  cyl(45, 200, mats.white, { x: -ROOM.halfW + 120, y: 1765, z: djZ + 320 });
  cyl(24, 40, mats.red, { x: -ROOM.halfW + 120, y: 1885, z: djZ + 320 });

  /* buggies */
  const makeBuggy = (bodyMat, { x, y, z, ry }) => {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    g.rotation.y = ry;
    group.add(g);
    box(300, 12, 130, mats.charcoal, { y: 45, parent: g });
    for (const [wx, wz] of [[-110, 85], [-110, -85], [118, 85], [118, -85]]) {
      cyl(42, 40, mats.black, { x: wx, y: 42, z: wz, rx: Math.PI / 2, parent: g });
      cyl(20, 42, mats.silver, { x: wx, y: 42, z: wz, rx: Math.PI / 2, parent: g, cast: false });
    }
    box(150, 52, 132, bodyMat, { x: -30, y: 84, parent: g });
    box(130, 30, 122, bodyMat, { x: 105, y: 72, parent: g });
    box(150, 30, 120, new THREE.MeshStandardMaterial({ color: 0x1b2733, roughness: 0.2 }), { x: 10, y: 118, parent: g, rx: 0 });
    box(150, 6, 70, mats.black, { x: -150, y: 150, parent: g });
    for (const wz of [-28, 28]) box(6, 50, 6, mats.black, { x: -140, y: 122, z: wz, parent: g, cast: false });
    cyl(14, 120, mats.silver, { x: -70, y: 62, z: 82, rz: Math.PI / 2, parent: g });
    cyl(1.5, 220, mats.black, { x: 40, y: 220, z: -40, parent: g, cast: false });
    box(40, 44, 40, mats.grey, { x: 20, y: 130, z: 30, parent: g });
    return g;
  };
  makeBuggy(mats.red, { x: 700, y: 0, z: 1050, ry: -0.7 });
  makeBuggy(mats.blue, { x: -ROOM.halfW + 120, y: 1665, z: djZ - 200, ry: Math.PI / 2 });

  /* the CRT with the N64, right wall */
  const tvX = ROOM.halfW - 420, tvZ = 150;
  box(700, 480, 460, mats.darkWood, { x: tvX, y: 240, z: tvZ });
  box(660, 20, 420, mats.darkWood, { x: tvX, y: 260, z: tvZ });
  const tv = new THREE.Group();
  tv.position.set(tvX, 480, tvZ);
  tv.rotation.y = -Math.PI / 2;
  group.add(tv);
  box(600, 460, 480, mats.charcoal, { y: 230, parent: tv });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(500, 380), new THREE.MeshBasicMaterial({ map: tex(gameTexture()) }));
  screen.position.set(0, 250, 241);
  tv.add(screen);
  box(600, 60, 12, mats.black, { y: 30, z: 240, parent: tv, cast: false });
  cyl(10, 8, mats.grey, { x: 240, y: 30, z: 246, rx: Math.PI / 2, parent: tv, cast: false });
  // the console on the lower shelf, cable to the controller on the rug
  const n64 = new THREE.Group();
  n64.position.set(tvX - 60, 40, tvZ + 60);
  n64.rotation.y = -Math.PI / 2 + 0.2;
  group.add(n64);
  box(260, 70, 190, mats.charcoal, { y: 35, parent: n64 });
  box(120, 12, 60, mats.black, { y: 76, z: 10, parent: n64, cast: false });
  box(100, 70, 30, mats.grey, { y: 100, z: 10, parent: n64 });
  box(10, 6, 10, new THREE.MeshStandardMaterial({ color: 0xd63a2f, emissive: 0xff2a1a, emissiveIntensity: 1.2 }), { x: -100, y: 72, z: 70, parent: n64, cast: false });
  const pad = new THREE.Group();
  pad.position.set(560, 0, 1350);
  pad.rotation.y = -0.6;
  group.add(pad);
  box(40, 30, 110, mats.grey, { y: 15, z: 30, parent: pad });
  box(180, 30, 50, mats.grey, { y: 15, z: -20, parent: pad });
  box(34, 30, 100, mats.grey, { x: -70, y: 15, z: 24, ry: 0.35, parent: pad });
  box(34, 30, 100, mats.grey, { x: 70, y: 15, z: 24, ry: -0.35, parent: pad });
  cyl(9, 8, mats.red, { x: 0, y: 34, z: -22, parent: pad, cast: false });
  cyl(12, 8, mats.blue, { x: 48, y: 34, z: -10, parent: pad, cast: false });
  cyl(9, 8, new THREE.MeshStandardMaterial({ color: 0x35a24a }), { x: 34, y: 34, z: -28, parent: pad, cast: false });
  for (const [dx, dz] of [[72, -34], [62, -22], [82, -22], [72, -10]]) cyl(5, 6, new THREE.MeshStandardMaterial({ color: 0xf2c230 }), { x: dx, y: 33, z: dz, parent: pad, cast: false });
  cyl(14, 14, mats.black, { y: 37, z: 40, parent: pad, cast: false });
  cyl(8, 10, mats.grey, { y: 48, z: 40, parent: pad, cast: false });
  const cable = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(560, 12, 1300), new THREE.Vector3(760, 6, 1150), new THREE.Vector3(1100, 6, 700), new THREE.Vector3(1450, 8, 330), new THREE.Vector3(tvX - 200, 30, tvZ + 60)]), 40, 3, 6, false), mats.charcoal);
  group.add(cable);

  /* a couple of things on the floor that say 1989 */
  box(600, 60, 40, mats.charcoal, { x: -ROOM.halfW + 1250, y: 30, z: 1450, ry: 0.3 });

  /* interactives: which meshes do what */
  const interactives = [];
  for (const d of decks) interactives.push({ meshes: d.meshes, action: () => { d.playing = !d.playing; d.lamp.material.emissiveIntensity = d.playing ? 1.4 : 0; } });

  let elapsed = 0;
  return {
    group, decks, interactives, lampLight,
    phoneSpot: new THREE.Vector3(0, DESK.top, DESK.z + 230),
    update(dt) {
      elapsed += dt;
      for (const d of decks) if (d.playing) d.platter.rotation.y += dt * Math.PI * 2 * (33.33 / 60);
      screen.material.map.offset.x = Math.sin(elapsed * 6) * 0.002;
    },
  };
}
