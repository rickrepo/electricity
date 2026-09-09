// The room: a den for someone born in 1989, at dusk, in millimetres.
// A desk against the back wall with the phone on it and the poster above,
// a bed, two direct-drive turntables and a mixer with a crate of records,
// a CRT running a racing game with the N64 under it, a nitro buggy on the
// rug and another on the shelf, curtains, a chair, a clock, a door.
// Boxes, cylinders, and canvas-drawn textures; the light does the rest.
import * as THREE from '../vendor/three.min.js';
import { RoundedBoxGeometry, RectAreaLightUniformsLib, mergeGeometries } from '../vendor/three.min.js';
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
  t.anisotropy = 4;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
};

/* ---------------- textures ---------------- */
// Oak planks: colour, a height map for the bump, and a roughness map for the varnish.
function woodMaps({ base = '#9a6a3e', dark = '#5e3a1e', light = '#b98552', planks = 6, size = 512 } = {}) {
  const c = canvas(size, size), ctx = c.getContext('2d');
  const h = canvas(size, size), hctx = h.getContext('2d');
  const r = canvas(size, size), rctx = r.getContext('2d');
  ctx.fillStyle = base; ctx.fillRect(0, 0, size, size);
  hctx.fillStyle = '#808080'; hctx.fillRect(0, 0, size, size);
  rctx.fillStyle = '#7a7a7a'; rctx.fillRect(0, 0, size, size);
  const ph = size / planks;
  for (let p = 0; p < planks; p++) {
    const y0 = p * ph;
    ctx.fillStyle = rnd() > 0.5 ? light : dark;
    ctx.globalAlpha = rnd() * 0.35;
    ctx.fillRect(0, y0, size, ph);
    ctx.globalAlpha = 1;
    for (let i = 0; i < 34; i++) {
      const y = y0 + rnd() * ph, wob = rnd() * 6, amp = rnd() * 3, a = 0.06 + rnd() * 0.14, lw = 1 + rnd() * 2.5;
      for (const [cx, style] of [[ctx, `rgba(60,35,15,${a})`], [hctx, `rgba(60,60,60,${a * 0.8})`], [rctx, `rgba(200,200,200,${a * 0.5})`]]) {
        cx.strokeStyle = style; cx.lineWidth = lw; cx.beginPath(); cx.moveTo(0, y);
        for (let x = 0; x <= size; x += 24) cx.lineTo(x, y + Math.sin(x * 0.015 + wob) * amp);
        cx.stroke();
      }
    }
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(0, y0, size, 2);
    hctx.fillStyle = '#202020'; hctx.fillRect(0, y0, size, 3);
    rctx.fillStyle = '#c0c0c0'; rctx.fillRect(0, y0, size, 3);
    const gx = rnd() * size;
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(gx, y0, 2, ph);
    hctx.fillStyle = '#202020'; hctx.fillRect(gx, y0, 3, ph);
  }
  // wear and dust
  for (let i = 0; i < 1600; i++) {
    ctx.fillStyle = `rgba(${rnd() > 0.5 ? '255,240,220' : '20,10,0'},${rnd() * 0.08})`;
    ctx.fillRect(rnd() * size, rnd() * size, 1 + rnd() * 3, 1 + rnd() * 2);
    rctx.fillStyle = `rgba(255,255,255,${rnd() * 0.25})`;
    rctx.fillRect(rnd() * size, rnd() * size, 2 + rnd() * 6, 1 + rnd() * 2);
  }
  return { map: c, bump: h, rough: r };
}

function paintTexture(color = '#d9d0bd', size = 256) {
  const c = canvas(size, size), ctx = c.getContext('2d');
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 3200; i++) {
    ctx.fillStyle = `rgba(${rnd() > 0.5 ? '255,255,255' : '0,0,0'},${0.02 + rnd() * 0.05})`;
    ctx.fillRect(rnd() * size, rnd() * size, 1 + rnd() * 2, 1 + rnd() * 2);
  }
  return c;
}

function fabricMaps(color, size = 256, weave = 3) {
  const c = canvas(size, size), ctx = c.getContext('2d');
  const b = canvas(size, size), bctx = b.getContext('2d');
  ctx.fillStyle = color; ctx.fillRect(0, 0, size, size);
  bctx.fillStyle = '#808080'; bctx.fillRect(0, 0, size, size);
  for (let y = 0; y < size; y += weave) for (let x = 0; x < size; x += weave) {
    const v = ((x / weave + y / weave) % 2) * 22 - 11 + (rnd() - 0.5) * 14;
    ctx.fillStyle = `rgba(${v > 0 ? '255,255,255' : '0,0,0'},${Math.abs(v) / 120})`;
    ctx.fillRect(x, y, weave, weave);
    bctx.fillStyle = `rgb(${128 + v},${128 + v},${128 + v})`;
    bctx.fillRect(x, y, weave, weave);
  }
  return { map: c, bump: b };
}

function plaidTexture() {
  const size = 256, c = canvas(size, size), ctx = c.getContext('2d');
  ctx.fillStyle = '#2f3a5a';
  ctx.fillRect(0, 0, size, size);
  const bands = [[0, 40, '#7a2a2c', 0.9], [40, 14, '#c9a25a', 0.6], [96, 40, '#7a2a2c', 0.9], [136, 14, '#c9a25a', 0.6], [180, 26, '#1d2440', 0.8]];
  for (const [o, w, col, a] of bands) { ctx.globalAlpha = a; ctx.fillStyle = col; ctx.fillRect(o, 0, w, size); ctx.fillRect(0, o, size, w); }
  ctx.globalAlpha = 1;
  for (let i = 0; i < 5000; i++) { ctx.fillStyle = `rgba(0,0,0,${rnd() * 0.1})`; ctx.fillRect(rnd() * size, rnd() * size, 2, 2); }
  return c;
}

function rugMaps() {
  const c = canvas(768, 512), ctx = c.getContext('2d');
  ctx.fillStyle = '#6e2426'; ctx.fillRect(0, 0, 768, 512);
  ctx.fillStyle = '#c9a25a'; ctx.fillRect(28, 28, 712, 456);
  ctx.fillStyle = '#6e2426'; ctx.fillRect(44, 44, 680, 424);
  ctx.fillStyle = '#2a3452'; ctx.fillRect(84, 84, 600, 344);
  ctx.strokeStyle = '#c9a25a'; ctx.lineWidth = 3; ctx.strokeRect(100, 100, 568, 312);
  for (let i = 0; i < 9; i++) for (let j = 0; j < 5; j++) {
    ctx.fillStyle = (i + j) % 2 ? '#b8432f' : '#c9a25a';
    ctx.save(); ctx.translate(140 + i * 61, 140 + j * 58); ctx.rotate(Math.PI / 4); ctx.fillRect(-9, -9, 18, 18); ctx.restore();
  }
  for (let i = 0; i < 14000; i++) { ctx.fillStyle = `rgba(${rnd() > 0.5 ? '0,0,0' : '255,240,220'},${rnd() * 0.14})`; ctx.fillRect(rnd() * 768, rnd() * 512, 2, 2); }
  const b = canvas(256, 256), bctx = b.getContext('2d');
  bctx.fillStyle = '#808080'; bctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 9000; i++) { const v = 100 + rnd() * 56; bctx.fillStyle = `rgb(${v},${v},${v})`; bctx.fillRect(rnd() * 256, rnd() * 256, 2, 2); }
  return { map: c, bump: b };
}

function duskTexture() {
  const c = canvas(256, 320), ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, 320);
  g.addColorStop(0, '#1b2750');
  g.addColorStop(0.45, '#5a4a7a');
  g.addColorStop(0.72, '#e08a4a');
  g.addColorStop(0.88, '#ffc47a');
  g.addColorStop(1, '#3a2a30');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 320);
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  for (let i = 0; i < 40; i++) { ctx.beginPath(); ctx.arc(rnd() * 256, rnd() * 120, rnd() * 1.2, 0, Math.PI * 2); ctx.fill(); }
  ctx.fillStyle = 'rgba(255,200,140,0.35)';
  ctx.beginPath(); ctx.ellipse(70, 210, 90, 12, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#1d1a26';
  ctx.fillRect(0, 262, 256, 58);
  for (let x = 0; x < 256; x += 30) { const hh = 20 + rnd() * 30; ctx.fillRect(x, 262 - hh, 24, hh); if (rnd() > 0.5) { ctx.fillStyle = '#f2c86b'; ctx.fillRect(x + 8, 262 - hh + 8, 5, 6); ctx.fillStyle = '#1d1a26'; } }
  for (let x = 10; x < 256; x += 44) { ctx.beginPath(); ctx.arc(x, 250, 18, 0, Math.PI * 2); ctx.fill(); }
  return c;
}

function gameTexture() {
  const c = canvas(320, 240), ctx = c.getContext('2d');
  const sky = ctx.createLinearGradient(0, 0, 0, 120);
  sky.addColorStop(0, '#3f8fe0'); sky.addColorStop(1, '#a9d6ff');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, 320, 120);
  ctx.fillStyle = '#5da33c'; ctx.fillRect(0, 120, 320, 120);
  ctx.fillStyle = '#6b6b70';
  ctx.beginPath(); ctx.moveTo(60, 240); ctx.lineTo(140, 120); ctx.lineTo(180, 120); ctx.lineTo(300, 240); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#f2e14b';
  for (let i = 0; i < 6; i++) { const t = i / 6; ctx.fillRect(160 - 3 * (1 + t * 3), 120 + t * 120, 6 * (1 + t * 3), 10 + t * 8); }
  ctx.fillStyle = '#e03a2f'; ctx.fillRect(120, 172, 50, 30);
  ctx.fillStyle = '#111'; ctx.fillRect(114, 190, 14, 16); ctx.fillRect(162, 190, 14, 16);
  ctx.fillStyle = '#2f6fd0'; ctx.fillRect(196, 148, 26, 16);
  // scanlines
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  for (let y = 0; y < 240; y += 3) ctx.fillRect(0, y, 320, 1);
  return c;
}

function clockFace() {
  const c = canvas(256, 256), ctx = c.getContext('2d');
  const draw = () => {
    ctx.fillStyle = '#f4efe4'; ctx.beginPath(); ctx.arc(128, 128, 128, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#222'; ctx.lineCap = 'round';
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * Math.PI * 2, big = i % 5 === 0;
      ctx.lineWidth = big ? 4 : 1.5;
      ctx.beginPath(); ctx.moveTo(128 + Math.cos(a) * 116, 128 + Math.sin(a) * 116); ctx.lineTo(128 + Math.cos(a) * (116 - (big ? 16 : 8)), 128 + Math.sin(a) * (116 - (big ? 16 : 8))); ctx.stroke();
    }
    const d = new Date();
    const h = ((d.getHours() % 12) + d.getMinutes() / 60) / 12 * Math.PI * 2 - Math.PI / 2;
    const m = (d.getMinutes() / 60) * Math.PI * 2 - Math.PI / 2;
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(128, 128); ctx.lineTo(128 + Math.cos(h) * 62, 128 + Math.sin(h) * 62); ctx.stroke();
    ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(128, 128); ctx.lineTo(128 + Math.cos(m) * 96, 128 + Math.sin(m) * 96); ctx.stroke();
    ctx.fillStyle = '#c8322b'; ctx.beginPath(); ctx.arc(128, 128, 6, 0, Math.PI * 2); ctx.fill();
  };
  draw();
  return { canvas: c, draw };
}

// The platter's rim: satin aluminium with the four rows of strobe dots.
function strobeTexture() {
  const c = canvas(1024, 64), ctx = c.getContext('2d');
  ctx.fillStyle = '#c4c7cb';
  ctx.fillRect(0, 0, 1024, 64);
  ctx.fillStyle = 'rgba(0,0,0,0.05)';
  for (let x = 0; x < 1024; x += 3) ctx.fillRect(x, 0, 1, 64);
  ctx.fillStyle = '#2a2b2e';
  for (const [y, n] of [[20, 128], [30, 136], [40, 144], [50, 152]]) for (let i = 0; i < n; i++) ctx.fillRect(Math.round(((i + 0.5) * 1024) / n) - 1, y - 1, 2, 2);
  return c;
}

// A soft dark blob to sit under furniture: cheap contact shadow.
function blobTexture() {
  const c = canvas(256, 256), ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(128, 128, 20, 128, 128, 128);
  g.addColorStop(0, 'rgba(0,0,0,0.75)');
  g.addColorStop(0.55, 'rgba(0,0,0,0.35)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  return c;
}

// Darkens a plane's vertices toward its edges: baked ambient occlusion for
// the corners of the room.
function shadePlane(geo, { edge = 0.42, reach = 0.16, bottom = 0 } = {}) {
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  geo.computeBoundingBox();
  const bb = geo.boundingBox;
  const w = bb.max.x - bb.min.x, h = bb.max.y - bb.min.y;
  for (let i = 0; i < pos.count; i++) {
    const x = (pos.getX(i) - bb.min.x) / w, y = (pos.getY(i) - bb.min.y) / h;
    const dx = Math.min(x, 1 - x), dy = Math.min(y, 1 - y);
    let v = 1 - edge * Math.exp(-dx / reach) * 0.9 - edge * Math.exp(-dy / reach) * 0.9;
    if (bottom) v -= bottom * Math.exp(-y / 0.12);
    v = Math.max(0.25, v);
    colors[i * 3] = colors[i * 3 + 1] = colors[i * 3 + 2] = v;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return geo;
}

/* ---------------- the room ---------------- */
export function createRoom({ scene }) {
  RectAreaLightUniformsLib.init();
  const group = new THREE.Group();
  scene.add(group);
  let shadowsDirty = false;

  const wood = woodMaps();
  const deskWood = woodMaps({ base: '#7a4a2a', dark: '#4a2a14', light: '#96603a', planks: 3 });
  const rug = rugMaps();
  const sheet = fabricMaps('#efe9dd', 256, 2);
  const chairCloth = fabricMaps('#2b2d33', 256, 3);
  const curtain = fabricMaps('#7a6a55', 256, 2);
  const mats = {
    floor: new THREE.MeshStandardMaterial({ map: tex(wood.map, { repeat: [4, 3] }), bumpMap: tex(wood.bump, { repeat: [4, 3], srgb: false }), bumpScale: 1.4, roughnessMap: tex(wood.rough, { repeat: [4, 3], srgb: false }), roughness: 0.9, metalness: 0.02, vertexColors: true }),
    wall: new THREE.MeshStandardMaterial({ map: tex(paintTexture('#d3c9b4'), { repeat: [6, 4] }), roughness: 0.95, vertexColors: true }),
    ceiling: new THREE.MeshStandardMaterial({ color: 0xe8e2d6, roughness: 1, vertexColors: true }),
    trim: new THREE.MeshStandardMaterial({ color: 0xece6da, roughness: 0.55 }),
    desk: new THREE.MeshStandardMaterial({ map: tex(deskWood.map, { repeat: [2, 1] }), bumpMap: tex(deskWood.bump, { repeat: [2, 1], srgb: false }), bumpScale: 0.8, roughnessMap: tex(deskWood.rough, { repeat: [2, 1], srgb: false }), roughness: 0.8, metalness: 0.02 }),
    darkWood: new THREE.MeshStandardMaterial({ map: tex(deskWood.map, { repeat: [1, 1] }), color: 0x6a5040, roughness: 0.7 }),
    black: new THREE.MeshStandardMaterial({ color: 0x141416, roughness: 0.5, metalness: 0.1 }),
    charcoal: new THREE.MeshStandardMaterial({ color: 0x33302c, roughness: 0.65 }),
    silver: new THREE.MeshStandardMaterial({ color: 0xc4c6c9, roughness: 0.38, metalness: 0.8 }),
    grey: new THREE.MeshStandardMaterial({ color: 0x8a8d92, roughness: 0.6, metalness: 0.1 }),
    red: new THREE.MeshStandardMaterial({ color: 0xc8362b, roughness: 0.4, metalness: 0.05 }),
    blue: new THREE.MeshStandardMaterial({ color: 0x2b64c2, roughness: 0.4, metalness: 0.05 }),
    sheet: new THREE.MeshStandardMaterial({ map: tex(sheet.map, { repeat: [4, 6] }), bumpMap: tex(sheet.bump, { repeat: [4, 6], srgb: false }), bumpScale: 0.6, roughness: 1 }),
    plaid: new THREE.MeshStandardMaterial({ map: tex(plaidTexture(), { repeat: [3, 4] }), roughness: 1 }),
    chair: new THREE.MeshStandardMaterial({ map: tex(chairCloth.map, { repeat: [3, 3] }), bumpMap: tex(chairCloth.bump, { repeat: [3, 3], srgb: false }), bumpScale: 0.5, roughness: 0.95 }),
    curtain: new THREE.MeshStandardMaterial({ map: tex(curtain.map, { repeat: [2, 8] }), bumpMap: tex(curtain.bump, { repeat: [2, 8], srgb: false }), bumpScale: 0.6, roughness: 1, side: THREE.DoubleSide }),
    crate: new THREE.MeshStandardMaterial({ color: 0x24479a, roughness: 0.55 }),
    brass: new THREE.MeshStandardMaterial({ color: 0xc9a25a, roughness: 0.35, metalness: 0.9 }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0x0a0c12, roughness: 0.08, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.06, transparent: true, opacity: 0.35 }),
  };
  const blob = new THREE.MeshBasicMaterial({ map: tex(blobTexture()), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
  blob.map.wrapS = blob.map.wrapT = THREE.ClampToEdgeWrapping;

  const place = (m, { x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, cast = true, receive = true, parent = group } = {}) => {
    m.position.set(x, y, z);
    m.rotation.set(rx, ry, rz);
    m.castShadow = cast;
    m.receiveShadow = receive;
    parent.add(m);
    return m;
  };
  const box = (w, h, d, mat, o = {}) => place(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat), o);
  const rbox = (w, h, d, r, mat, o = {}) => place(new THREE.Mesh(new THREE.RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2, h / 2, d / 2)), mat), o);
  const cyl = (r, h, mat, o = {}) => place(new THREE.Mesh(new THREE.CylinderGeometry(o.rt ?? r, r, h, o.seg || 32), mat), o);
  const shadowBlob = (w, d, x, y, z, ry = 0) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), blob);
    m.rotation.set(-Math.PI / 2, 0, ry);
    m.position.set(x, y + 1.5, z);
    group.add(m);
    return m;
  };

  /* room shell, corners darkened */
  const floorGeo = shadePlane(new THREE.PlaneGeometry(ROOM.halfW * 2, ROOM.front - ROOM.back, 48, 44), { edge: 0.5, reach: 0.12 });
  const floor = new THREE.Mesh(floorGeo, mats.floor);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0, (ROOM.front + ROOM.back) / 2);
  floor.receiveShadow = true;
  group.add(floor);
  const ceilGeo = shadePlane(new THREE.PlaneGeometry(ROOM.halfW * 2, ROOM.front - ROOM.back, 24, 22), { edge: 0.55, reach: 0.14 });
  const ceiling = new THREE.Mesh(ceilGeo, mats.ceiling);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(0, ROOM.height, (ROOM.front + ROOM.back) / 2);
  group.add(ceiling);
  const wall = (w, x, z, ry) => {
    const g = shadePlane(new THREE.PlaneGeometry(w, ROOM.height, 40, 26), { edge: 0.42, reach: 0.1, bottom: 0.25 });
    const m = new THREE.Mesh(g, mats.wall);
    m.position.set(x, ROOM.height / 2, z);
    m.rotation.y = ry;
    m.receiveShadow = true;
    group.add(m);
    return m;
  };
  wall(ROOM.halfW * 2, 0, ROOM.back, 0);
  wall(ROOM.halfW * 2, 0, ROOM.front, Math.PI);
  wall(ROOM.front - ROOM.back, -ROOM.halfW, (ROOM.front + ROOM.back) / 2, Math.PI / 2);
  wall(ROOM.front - ROOM.back, ROOM.halfW, (ROOM.front + ROOM.back) / 2, -Math.PI / 2);
  // baseboards and a crown line
  for (const [w, x, z, ry] of [[ROOM.halfW * 2, 0, ROOM.back + 9, 0], [ROOM.halfW * 2, 0, ROOM.front - 9, 0], [ROOM.front - ROOM.back, -ROOM.halfW + 9, (ROOM.front + ROOM.back) / 2, Math.PI / 2], [ROOM.front - ROOM.back, ROOM.halfW - 9, (ROOM.front + ROOM.back) / 2, Math.PI / 2]]) {
    box(w, 110, 18, mats.trim, { x, y: 55, z, ry, cast: false });
    box(w, 60, 24, mats.trim, { x, y: ROOM.height - 30, z: z + (ry ? 0 : (z < 0 ? 3 : -3)), ry, cast: false });
  }

  /* the window at dusk, with curtains */
  const winZ = 1500, winY = 1500;
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(1000, 1200), new THREE.MeshBasicMaterial({ map: tex(duskTexture()) }));
  sky.position.set(ROOM.halfW - 14, winY, winZ);
  sky.rotation.y = -Math.PI / 2;
  group.add(sky);
  for (const [w, h, dy, dz] of [[1080, 50, 625, 0], [1080, 50, -625, 0], [50, 1250, 0, 540], [50, 1250, 0, -540], [1000, 24, 0, 0], [24, 1200, 0, 0]]) box(34, h, w, mats.trim, { x: ROOM.halfW - 22, y: winY + dy, z: winZ + dz, cast: false });
  box(140, 34, 1160, mats.trim, { x: ROOM.halfW - 70, y: winY - 660, z: winZ, cast: false });
  cyl(12, 1500, mats.brass, { x: ROOM.halfW - 110, y: winY + 720, z: winZ, rx: Math.PI / 2 });
  for (const dz of [-640, 640]) {
    const c = rbox(90, 2000, 230, 30, mats.curtain, { x: ROOM.halfW - 110, y: winY - 250, z: winZ + dz, cast: true });
    c.material = mats.curtain;
  }
  // window light: a soft panel plus a low sun for the shadows
  const panel = new THREE.RectAreaLight(0xffc596, 5.5, 1000, 1200);
  panel.position.set(ROOM.halfW - 30, winY, winZ);
  panel.lookAt(0, 900, 300);
  group.add(panel);
  const sun = new THREE.DirectionalLight(0xffb27a, 1.6);
  sun.position.set(2600, 1900, 2000);
  sun.target.position.set(0, 700, 200);
  group.add(sun.target);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = sun.shadow.camera.bottom = -2300;
  sun.shadow.camera.right = sun.shadow.camera.top = 2300;
  sun.shadow.camera.near = 300;
  sun.shadow.camera.far = 9000;
  sun.shadow.bias = -0.0005;
  sun.shadow.normalBias = 2.5;
  sun.shadow.radius = 4;
  group.add(sun);
  group.add(new THREE.HemisphereLight(0x5a6688, 0x3a2a1e, 0.55));

  /* ceiling light, off but there */
  const dome = new THREE.Mesh(new THREE.SphereGeometry(180, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xf1e9d6, emissive: 0xffe6c0, emissiveIntensity: 0.25, roughness: 0.6, side: THREE.DoubleSide }));
  dome.position.set(200, ROOM.height - 2, 700);
  group.add(dome);

  /* rug */
  const rugMesh = new THREE.Mesh(new THREE.PlaneGeometry(1800, 1200), new THREE.MeshStandardMaterial({ map: tex(rug.map), bumpMap: tex(rug.bump, { repeat: [6, 4], srgb: false }), bumpScale: 1.2, roughness: 1 }));
  rugMesh.material.map.wrapS = rugMesh.material.map.wrapT = THREE.ClampToEdgeWrapping;
  rugMesh.rotation.x = -Math.PI / 2;
  rugMesh.position.set(100, 6, 900);
  rugMesh.receiveShadow = true;
  group.add(rugMesh);
  box(1800, 6, 1200, new THREE.MeshStandardMaterial({ color: 0x5a1c1e, roughness: 1 }), { x: 100, y: 1.5, z: 900, cast: false });

  /* the desk */
  rbox(DESK.width, 40, DESK.depth, 6, mats.desk, { x: DESK.x, y: DESK.top - 20, z: DESK.z });
  for (const sx of [-1, 1]) rbox(40, DESK.top - 40, DESK.depth - 40, 4, mats.desk, { x: DESK.x + sx * (DESK.width / 2 - 20), y: (DESK.top - 40) / 2, z: DESK.z });
  box(DESK.width - 80, 300, 30, mats.desk, { x: DESK.x, y: DESK.top - 200, z: DESK.z - DESK.depth / 2 + 15 });
  rbox(400, 500, 600, 8, mats.darkWood, { x: DESK.x + 480, y: 250, z: DESK.z + 20 });
  for (let i = 0; i < 2; i++) rbox(90, 16, 22, 6, mats.silver, { x: DESK.x + 480, y: 130 + i * 240, z: DESK.z + 330 });
  shadowBlob(1700, 1000, DESK.x, 0, DESK.z + 60);
  // desk lamp, the key light of the room
  cyl(82, 24, mats.black, { x: -520, y: DESK.top + 12, z: DESK.z - 200 });
  const arm1 = cyl(9, 380, mats.black, { x: -520, y: DESK.top + 22 + 180, z: DESK.z - 140, rx: 0.35 });
  cyl(9, 300, mats.black, { x: -520, y: DESK.top + 380, z: DESK.z - 40, rx: 1.1 });
  cyl(14, 30, mats.black, { x: -520, y: DESK.top + 395, z: DESK.z - 60 });
  const shade = new THREE.Mesh(new THREE.ConeGeometry(110, 150, 40, 1, true), new THREE.MeshStandardMaterial({ color: 0x1a1a1c, roughness: 0.55, metalness: 0.2, side: THREE.DoubleSide }));
  shade.position.set(-520, DESK.top + 330, DESK.z + 70);
  shade.rotation.x = 2.6;
  shade.castShadow = true;
  group.add(shade);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(30, 16, 12), new THREE.MeshBasicMaterial({ color: 0xfff3d2 }));
  bulb.position.set(-520, DESK.top + 300, DESK.z + 110);
  group.add(bulb);
  const lamp = new THREE.SpotLight(0xffd6a0, 6, 2600, 0.78, 0.55, 0);
  lamp.position.copy(bulb.position);
  lamp.target.position.set(-150, DESK.top, DESK.z + 300);
  lamp.castShadow = true;
  lamp.shadow.mapSize.set(1024, 1024);
  lamp.shadow.camera.near = 60;
  lamp.shadow.camera.far = 3000;
  lamp.shadow.bias = -0.0008;
  lamp.shadow.normalBias = 2;
  lamp.shadow.radius = 5;
  group.add(lamp, lamp.target);
  // things on the desk
  for (let i = 0; i < 5; i++) rbox(142, 10, 125, 2, i % 2 ? mats.black : mats.trim, { x: 420, y: DESK.top + 5 + i * 10, z: DESK.z - 180, ry: (i - 2) * 0.08 });
  cyl(40, 95, mats.trim, { x: 300, y: DESK.top + 47, z: DESK.z + 80 });
  cyl(34, 90, new THREE.MeshStandardMaterial({ color: 0x3a2a1a, roughness: 0.6 }), { x: 300, y: DESK.top + 48, z: DESK.z + 80, rt: 34 });
  for (let i = 0; i < 4; i++) rbox(220, 14, 290, 2, new THREE.MeshStandardMaterial({ color: [0xd9d2c2, 0x2b3a5a, 0xc8362b, 0xe8e2d6][i], roughness: 0.8 }), { x: -220, y: DESK.top + 7 + i * 14, z: DESK.z - 140, ry: (rnd() - 0.5) * 0.2 });

  /* the poster over the desk: a real photograph if assets/poster.jpg exists */
  const frame = rbox(650, 950, 22, 4, mats.black, { x: 0, y: 1720, z: ROOM.back + 11, cast: false });
  const posterTex = tex(dunkWallpaper());
  posterTex.wrapS = posterTex.wrapT = THREE.ClampToEdgeWrapping;
  const posterMat = new THREE.MeshStandardMaterial({ map: posterTex, roughness: 0.55 });
  const poster = new THREE.Mesh(new THREE.PlaneGeometry(600, 900), posterMat);
  poster.position.set(0, 1720, ROOM.back + 23);
  group.add(poster);
  const gloss = new THREE.Mesh(new THREE.PlaneGeometry(600, 900), mats.glass);
  gloss.position.set(0, 1720, ROOM.back + 24);
  gloss.material = new THREE.MeshPhysicalMaterial({ color: 0x000000, roughness: 0.15, transparent: true, opacity: 0.12, clearcoat: 1 });
  group.add(gloss);
  const photoSrc = (typeof window !== 'undefined' && window.POSTER_PHOTO) || 'assets/poster.jpg';
  new THREE.TextureLoader().load(photoSrc, (t) => {
    shadowsDirty = true;
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    const w = 600, h = Math.min(1100, Math.max(500, w * (t.image.height / t.image.width)));
    poster.geometry.dispose(); poster.geometry = new THREE.PlaneGeometry(w, h);
    gloss.geometry.dispose(); gloss.geometry = new THREE.PlaneGeometry(w, h);
    frame.geometry.dispose(); frame.geometry = new THREE.RoundedBoxGeometry(w + 50, h + 50, 22, 3, 4);
    posterMat.map = t;
    posterMat.needsUpdate = true;
  }, undefined, () => {});

  /* a wall clock, keeping real time */
  const face = clockFace();
  const clockTex = tex(face.canvas);
  clockTex.wrapS = clockTex.wrapT = THREE.ClampToEdgeWrapping;
  const clock = new THREE.Mesh(new THREE.CylinderGeometry(150, 150, 30, 48), [mats.black, new THREE.MeshStandardMaterial({ map: clockTex, roughness: 0.5 }), mats.black]);
  clock.rotation.x = Math.PI / 2;
  clock.position.set(-950, 1900, ROOM.back + 16);
  group.add(clock);
  const clockRing = new THREE.Mesh(new THREE.TorusGeometry(150, 12, 12, 48), mats.black);
  clockRing.position.set(-950, 1900, ROOM.back + 30);
  group.add(clockRing);
  let clockMinute = -1;

  /* the bed, front-left, with sneakers beside it */
  const bedX = -ROOM.halfW + 520, bedZ = ROOM.front - 1040;
  rbox(1040, 180, 2040, 10, mats.darkWood, { x: bedX, y: 190, z: bedZ });
  rbox(1000, 260, 2000, 70, mats.sheet, { x: bedX, y: 410, z: bedZ });
  rbox(1020, 90, 1300, 40, mats.plaid, { x: bedX, y: 575, z: bedZ - 330 });
  rbox(520, 150, 340, 60, mats.sheet, { x: bedX, y: 600, z: ROOM.front - 250, ry: 0.06 });
  rbox(1040, 620, 60, 12, mats.darkWood, { x: bedX, y: 500, z: ROOM.front - 50 });
  shadowBlob(1400, 2400, bedX, 0, bedZ);
  for (const [dx, dz, ry, col] of [[620, 260, 0.2, 0xe8e2d6], [640, 120, -0.1, 0xe8e2d6]]) {
    rbox(280, 30, 110, 10, new THREE.MeshStandardMaterial({ color: col, roughness: 0.7 }), { x: bedX + dx, y: 15, z: bedZ + dz, ry });
    rbox(240, 90, 100, 35, mats.red, { x: bedX + dx + 10, y: 70, z: bedZ + dz, ry });
  }

  /* the decks along the left wall: two 1200s and a mixer on a slim stand */
  const decks = [];
  const djX = -ROOM.halfW + 300, djZ = -150;
  const alu = new THREE.MeshStandardMaterial({ color: 0xb6b9bd, roughness: 0.42, metalness: 0.62 });
  const rubber = new THREE.MeshStandardMaterial({ color: 0x141416, roughness: 0.85 });
  const vinyl = new THREE.MeshStandardMaterial({ color: 0x0b0b0d, roughness: 0.3, metalness: 0.05 });
  const rim = new THREE.MeshStandardMaterial({ map: tex(strobeTexture()), roughness: 0.32, metalness: 0.75 });
  const knob = new THREE.MeshStandardMaterial({ color: 0x2a2a2d, roughness: 0.55 });
  const plate = new THREE.MeshStandardMaterial({ color: 0x3a3c40, roughness: 0.5, metalness: 0.5 });
  const leds = [0x36d14a, 0xf2b731, 0xe3322b].map((c) => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.9, roughness: 0.4 }));
  rbox(560, 30, 1300, 5, mats.black, { x: djX, y: 735, z: djZ });
  for (const dz of [-600, 600]) rbox(500, 720, 30, 4, mats.black, { x: djX, y: 360, z: djZ + dz });
  shadowBlob(800, 1500, djX, 0, djZ);
  const Y = new THREE.Vector3(0, 1, 0);
  // In the deck's own frame x runs to the DJ's right and z toward the DJ.
  const makeDeck = (z, angle, onRecord) => {
    const g = new THREE.Group();
    g.position.set(djX, 750, z);
    g.rotation.y = Math.PI / 2;
    group.add(g);
    // a rubber base under the die-cast top: 453 x 353 mm, the top 80 mm up
    rbox(432, 26, 332, 5, rubber, { y: 13, parent: g });
    rbox(453, 54, 353, 5, alu, { y: 53, parent: g });
    // the platter: aluminium with strobe dots round the rim, a rubber mat, a record
    const platter = new THREE.Group();
    platter.position.set(-45, 80, 0);
    g.add(platter);
    place(new THREE.Mesh(new THREE.CylinderGeometry(166, 166, 14, 96), [rim, alu, alu]), { y: 7, parent: platter, cast: false });
    cyl(160, 3, rubber, { y: 15.5, parent: platter, cast: false, seg: 96 });
    cyl(150, 2, vinyl, { y: 18, parent: platter, cast: false, seg: 96 });
    cyl(50, 0.6, mats.red, { y: 19.3, parent: platter, cast: false, seg: 48 });
    cyl(3.6, 12, mats.silver, { y: 23, parent: platter, cast: false, seg: 16 });
    platter.rotation.y = angle;
    // the tonearm: pivot at the back right, an S-shaped arm, the counterweight behind it
    const P = { x: 165, z: -118 }, L = 250;
    cyl(34, 6, alu, { x: P.x, y: 83, z: P.z, parent: g, cast: false, seg: 48 });
    cyl(23, 22, mats.black, { x: P.x, y: 97, z: P.z, parent: g, seg: 32 });
    cyl(26, 4, alu, { x: P.x, y: 110, z: P.z, parent: g, cast: false, seg: 48 });
    let end;
    if (onRecord) {
      // the stylus sits on the record at radius r, where the arm's arc crosses it
      const dx = P.x + 45, dz = P.z, D = Math.hypot(dx, dz), r = 118;
      const a = Math.atan2(dz, dx) + Math.acos((D * D + r * r - L * L) / (2 * D * r));
      end = { x: -45 + r * Math.cos(a), z: r * Math.sin(a) };
    } else end = { x: P.x - 27, z: P.z + 248 };
    const dir = new THREE.Vector3(end.x - P.x, 0, end.z - P.z).normalize();
    const side = new THREE.Vector3(-dir.z, 0, dir.x);
    if (side.dot(new THREE.Vector3(-45 - P.x, 0, -P.z)) < 0) side.negate();
    const at = (t, off, y) => new THREE.Vector3(P.x, y, P.z).addScaledVector(dir, t * L).addScaledVector(side, off);
    const path = new THREE.CatmullRomCurve3([at(-0.24, 0, 112), at(0, 0, 112), at(0.45, 0, 111.5), at(0.72, -9, 111), at(0.9, 2, 110.5), at(1, 6, 110)], false, 'centripetal');
    place(new THREE.Mesh(new THREE.TubeGeometry(path, 40, 4.2, 10, false), mats.silver), { parent: g });
    const weight = place(new THREE.Mesh(new THREE.CylinderGeometry(15, 15, 28, 32), mats.black), { parent: g });
    weight.quaternion.setFromUnitVectors(Y, dir);
    weight.position.copy(at(-0.18, 0, 112));
    let hs = dir.clone().applyAxisAngle(Y, 0.35);
    if (hs.dot(side) < 0) hs = dir.clone().applyAxisAngle(Y, -0.35);
    const ry = Math.atan2(hs.x, hs.z);
    const shell = at(1, 6, 109).addScaledVector(hs, 12);
    box(15, 7, 30, mats.black, { x: shell.x, y: shell.y, z: shell.z, ry, parent: g, cast: false });
    const cart = shell.clone().addScaledVector(hs, 8);
    box(9, 8, 12, mats.charcoal, { x: cart.x, y: 104, z: cart.z, ry, parent: g, cast: false });
    // the arm rest to the right of the platter
    cyl(3.5, 22, alu, { x: 150, y: 91, z: 21, parent: g, cast: false, seg: 12 });
    box(12, 6, 8, mats.black, { x: 150, y: 103.5, z: 21, parent: g, cast: false });
    // start/stop, the speed buttons, the pop-up strobe light, the pitch fader, power, hinges
    cyl(17, 1.5, alu, { x: -186, y: 80.7, z: 132, parent: g, cast: false, seg: 32 });
    cyl(15, 5, mats.black, { x: -186, y: 83, z: 132, parent: g, cast: false, seg: 32 });
    for (const x of [-196, -170]) rbox(20, 5, 12, 1.5, knob, { x, y: 82, z: 96, parent: g, cast: false });
    cyl(11, 16, mats.charcoal, { x: -150, y: 88, z: 122, parent: g, cast: false, seg: 24 });
    const lamp = box(7, 7, 7, new THREE.MeshStandardMaterial({ color: 0x5a2b23, emissive: 0xff3a1a, emissiveIntensity: 0 }), { x: -143, y: 92, z: 114, parent: g, cast: false });
    box(7, 1, 104, mats.black, { x: 196, y: 80.5, z: 70, parent: g, cast: false });
    rbox(26, 7, 14, 2, knob, { x: 196, y: 84, z: 70, parent: g, cast: false });
    box(1.5, 0.6, 14, mats.trim, { x: 196, y: 87.6, z: 70, parent: g, cast: false });
    cyl(13, 5, mats.black, { x: -190, y: 82.5, z: -140, parent: g, cast: false, seg: 24 });
    cyl(6, 9, alu, { x: -190, y: 88, z: -140, parent: g, cast: false, seg: 16 });
    for (const x of [-150, 150]) box(24, 10, 8, mats.black, { x, y: 85, z: -172, parent: g, cast: false });
    return { group: g, platter, lamp, playing: false, meshes: [] };
  };
  const deckA = makeDeck(djZ - 420, 0.3, true), deckB = makeDeck(djZ + 420, 2.1, false);
  for (const d of [deckA, deckB]) {
    d.group.updateWorldMatrix(true, true);
    const parts = [];
    d.group.traverse((m) => { if (m.isMesh && m !== d.lamp && !d.platter.getObjectById(m.id)) parts.push(m); });
    const geos = parts.map((m) => { let g = m.geometry.clone().applyMatrix4(m.matrixWorld); if (g.index) g = g.toNonIndexed(); for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k); return { g, mat: m.material }; });
    // the deck's parts share a handful of materials: one mesh per material
    const byMat = new Map();
    for (const { g, mat } of geos) { (byMat.get(mat) || byMat.set(mat, []).get(mat)).push(g); }
    for (const m of parts) { m.parent.remove(m); m.geometry.dispose(); }
    for (const [mat, gs] of byMat) { const mesh = new THREE.Mesh(mergeGeometries(gs, false), mat); mesh.castShadow = mesh.receiveShadow = true; mesh.matrixAutoUpdate = false; group.add(mesh); d.meshes.push(mesh); }
    d.platter.traverse((m) => { if (m.isMesh) d.meshes.push(m); });
    d.meshes.push(d.lamp);
  }
  decks.push(deckA, deckB);
  /* the mixer between them: two channel faders, a crossfader, knobs, meters */
  const mixer = new THREE.Group();
  mixer.position.set(djX, 750, djZ);
  mixer.rotation.y = Math.PI / 2;
  group.add(mixer);
  rbox(250, 20, 330, 4, rubber, { y: 10, parent: mixer });
  rbox(250, 50, 330, 4, mats.charcoal, { y: 45, parent: mixer });
  box(238, 1.2, 318, plate, { y: 70.6, parent: mixer, cast: false });
  for (const x of [-56, 56]) {
    box(5, 1.2, 96, mats.black, { x, y: 71.3, z: 40, parent: mixer, cast: false });
    rbox(22, 6, 12, 2, mats.black, { x, y: 74, z: x < 0 ? 62 : 22, parent: mixer, cast: false });
    for (let i = 0; i < 4; i++) cyl(7.5, 9, knob, { x, y: 75, z: -128 + i * 32, parent: mixer, cast: false, seg: 20 });
  }
  box(90, 1.2, 5, mats.black, { y: 71.3, z: 142, parent: mixer, cast: false });
  rbox(14, 6, 20, 2, mats.black, { x: 6, y: 74, z: 142, parent: mixer, cast: false });
  for (const x of [-9, 9]) for (let j = 0; j < 8; j++) box(5, 0.8, 4, leds[j < 5 ? 0 : j < 7 ? 1 : 2], { x, y: 71.6, z: -30 - j * 11, parent: mixer, cast: false });
  for (const x of [-18, 0, 18]) cyl(6, 7, knob, { x, y: 74, z: 90, parent: mixer, cast: false, seg: 16 });
  rbox(330, 280, 330, 6, mats.crate, { x: djX + 60, y: 140, z: djZ + 200 });
  for (let i = 0; i < 9; i++) box(4, 310, 310, new THREE.MeshStandardMaterial({ color: [0x1a1a1c, 0xd94a2b, 0xf5e6c8, 0x2f6fd0, 0x3aa64a][i % 5], roughness: 0.8 }), { x: djX + 60 - 110 + i * 26, y: 300, z: djZ + 200, rz: 0.12 });
  rbox(240, 30, 900, 4, mats.desk, { x: -ROOM.halfW + 120, y: 1650, z: djZ });
  for (const dz of [-380, 380]) box(20, 200, 20, mats.black, { x: -ROOM.halfW + 40, y: 1540, z: djZ + dz, cast: false });
  cyl(45, 200, mats.trim, { x: -ROOM.halfW + 120, y: 1765, z: djZ + 320 });
  cyl(24, 40, mats.red, { x: -ROOM.halfW + 120, y: 1885, z: djZ + 320 });

  /* buggies */
  const makeBuggy = (bodyMat, { x, y, z, ry }) => {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    g.rotation.y = ry;
    group.add(g);
    rbox(300, 12, 130, 4, mats.charcoal, { y: 45, parent: g });
    for (const [wx, wz] of [[-110, 85], [-110, -85], [118, 85], [118, -85]]) {
      cyl(42, 40, mats.black, { x: wx, y: 42, z: wz, rx: Math.PI / 2, parent: g });
      cyl(20, 42, mats.silver, { x: wx, y: 42, z: wz, rx: Math.PI / 2, parent: g, cast: false });
    }
    rbox(150, 52, 132, 16, bodyMat, { x: -30, y: 84, parent: g });
    rbox(130, 30, 122, 12, bodyMat, { x: 105, y: 72, parent: g });
    rbox(150, 30, 120, 10, new THREE.MeshStandardMaterial({ color: 0x1b2733, roughness: 0.15, metalness: 0.2 }), { x: 10, y: 118, parent: g });
    rbox(150, 6, 70, 2, mats.black, { x: -150, y: 150, parent: g });
    for (const wz of [-28, 28]) box(6, 50, 6, mats.black, { x: -140, y: 122, z: wz, parent: g, cast: false });
    cyl(14, 120, mats.silver, { x: -70, y: 62, z: 82, rz: Math.PI / 2, parent: g });
    cyl(1.5, 220, mats.black, { x: 40, y: 220, z: -40, parent: g, cast: false });
    rbox(40, 44, 40, 4, mats.grey, { x: 20, y: 130, z: 30, parent: g });
    return g;
  };
  makeBuggy(mats.red, { x: 700, y: 0, z: 1050, ry: -0.7 });
  shadowBlob(460, 300, 700, 3, 1050, -0.7);
  makeBuggy(mats.blue, { x: -ROOM.halfW + 120, y: 1665, z: djZ - 200, ry: Math.PI / 2 });

  /* the CRT with the N64, right wall */
  const tvX = ROOM.halfW - 420, tvZ = 150;
  rbox(700, 480, 460, 8, mats.darkWood, { x: tvX, y: 240, z: tvZ });
  box(660, 20, 420, mats.darkWood, { x: tvX, y: 260, z: tvZ });
  shadowBlob(1000, 800, tvX, 0, tvZ);
  const tv = new THREE.Group();
  tv.position.set(tvX, 480, tvZ);
  tv.rotation.y = -Math.PI / 2;
  group.add(tv);
  rbox(600, 460, 480, 40, mats.charcoal, { y: 230, parent: tv });
  const screenMat = new THREE.MeshBasicMaterial({ map: tex(gameTexture()) });
  screenMat.map.wrapS = screenMat.map.wrapT = THREE.ClampToEdgeWrapping;
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(500, 380), screenMat);
  screen.position.set(0, 250, 242);
  tv.add(screen);
  const tvGlass = new THREE.Mesh(new THREE.PlaneGeometry(520, 400), new THREE.MeshPhysicalMaterial({ color: 0x000000, roughness: 0.1, transparent: true, opacity: 0.18, clearcoat: 1 }));
  tvGlass.position.set(0, 250, 243);
  tv.add(tvGlass);
  rbox(600, 60, 12, 3, mats.black, { y: 30, z: 240, parent: tv, cast: false });
  cyl(10, 8, mats.grey, { x: 240, y: 30, z: 246, rx: Math.PI / 2, parent: tv, cast: false });
  const tvGlow = new THREE.PointLight(0x8fb4ff, 0.9, 1600, 0);
  tvGlow.position.set(tvX - 300, 700, tvZ);
  group.add(tvGlow);
  const n64 = new THREE.Group();
  n64.position.set(tvX - 60, 40, tvZ + 60);
  n64.rotation.y = -Math.PI / 2 + 0.2;
  group.add(n64);
  rbox(260, 70, 190, 14, mats.charcoal, { y: 35, parent: n64 });
  box(120, 12, 60, mats.black, { y: 76, z: 10, parent: n64, cast: false });
  rbox(100, 70, 30, 4, mats.grey, { y: 100, z: 10, parent: n64 });
  box(10, 6, 10, new THREE.MeshStandardMaterial({ color: 0xd63a2f, emissive: 0xff2a1a, emissiveIntensity: 1.2 }), { x: -100, y: 72, z: 70, parent: n64, cast: false });
  const pad = new THREE.Group();
  pad.position.set(560, 0, 1350);
  pad.rotation.y = -0.6;
  group.add(pad);
  rbox(40, 30, 110, 12, mats.grey, { y: 15, z: 30, parent: pad });
  rbox(180, 30, 50, 14, mats.grey, { y: 15, z: -20, parent: pad });
  rbox(34, 30, 100, 12, mats.grey, { x: -70, y: 15, z: 24, ry: 0.35, parent: pad });
  rbox(34, 30, 100, 12, mats.grey, { x: 70, y: 15, z: 24, ry: -0.35, parent: pad });
  cyl(9, 8, mats.red, { x: 0, y: 34, z: -22, parent: pad, cast: false });
  cyl(12, 8, mats.blue, { x: 48, y: 34, z: -10, parent: pad, cast: false });
  cyl(9, 8, new THREE.MeshStandardMaterial({ color: 0x35a24a }), { x: 34, y: 34, z: -28, parent: pad, cast: false });
  for (const [dx, dz] of [[72, -34], [62, -22], [82, -22], [72, -10]]) cyl(5, 6, new THREE.MeshStandardMaterial({ color: 0xf2c230 }), { x: dx, y: 33, z: dz, parent: pad, cast: false });
  cyl(14, 14, mats.black, { y: 37, z: 40, parent: pad, cast: false });
  cyl(8, 10, mats.grey, { y: 48, z: 40, parent: pad, cast: false });
  group.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(560, 12, 1300), new THREE.Vector3(760, 6, 1150), new THREE.Vector3(1100, 6, 700), new THREE.Vector3(1450, 8, 330), new THREE.Vector3(tvX - 200, 30, tvZ + 60)]), 40, 3, 6, false), mats.charcoal));

  /* a desk chair, pulled out */
  const chair = new THREE.Group();
  chair.position.set(560, 0, DESK.z + 700);
  chair.rotation.y = -0.55;
  group.add(chair);
  rbox(480, 80, 460, 34, mats.chair, { y: 470, parent: chair });
  rbox(440, 440, 70, 34, mats.chair, { y: 740, z: -230, rx: -0.12, parent: chair });
  cyl(26, 240, mats.silver, { y: 310, parent: chair });
  cyl(60, 30, mats.black, { y: 190, parent: chair });
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const leg = rbox(300, 24, 34, 8, mats.black, { x: Math.cos(a) * 150, y: 40, z: Math.sin(a) * 150, ry: -a, parent: chair });
    leg.position.y = 40;
    place(new THREE.Mesh(new THREE.SphereGeometry(26, 16, 12), mats.black), { x: Math.cos(a) * 300, y: 26, z: Math.sin(a) * 300, parent: chair });
  }
  shadowBlob(700, 700, 560, 0, DESK.z + 700);

  /* the door, front wall */
  const doorX = 900;
  for (const [w, h, dx, dy] of [[1000, 60, 0, 2080], [60, 2110, -500, 1055], [60, 2110, 500, 1055]]) box(w, h, 70, mats.trim, { x: doorX + dx, y: dy, z: ROOM.front - 35, cast: false });
  rbox(900, 2050, 44, 4, mats.trim, { x: doorX, y: 1025, z: ROOM.front - 32, cast: false });
  for (const [dy, dh] of [[1450, 700], [600, 700]]) box(640, dh, 12, new THREE.MeshStandardMaterial({ color: 0xdcd5c6, roughness: 0.6 }), { x: doorX, y: dy, z: ROOM.front - 56, cast: false });
  place(new THREE.Mesh(new THREE.SphereGeometry(32, 20, 14), mats.brass), { x: doorX - 360, y: 1000, z: ROOM.front - 80 });

  /* Everything that never moves becomes one mesh per material: a few dozen
     draw calls instead of a few hundred. The decks stay separate (they spin
     and answer clicks), as do the shaded room planes, the poster (its
     geometry changes when the photo arrives), and the screens. */
  const keep = new Set([poster, gloss, frame, clock, clockRing, screen, tvGlass, sky, bulb, dome, floor, ceiling, rugMesh]);
  for (const d of decks) { d.group.traverse((m) => keep.add(m)); for (const m of d.meshes) keep.add(m); }
  group.updateWorldMatrix(true, true);
  const buckets = new Map();
  const merged = [];
  group.traverse((m) => {
    if (!m.isMesh || keep.has(m) || Array.isArray(m.material) || m.geometry.attributes.color || !m.geometry.attributes.uv) return;
    let g = m.geometry.clone().applyMatrix4(m.matrixWorld);
    if (g.index) g = g.toNonIndexed();
    for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
    const b = buckets.get(m.material) || { geos: [], cast: false, receive: false };
    b.geos.push(g);
    b.cast ||= m.castShadow;
    b.receive ||= m.receiveShadow;
    buckets.set(m.material, b);
    merged.push(m);
  });
  for (const m of merged) { m.parent.remove(m); m.geometry.dispose(); }
  for (const [mat, b] of buckets) {
    const geo = mergeGeometries(b.geos, false);
    if (!geo) continue;
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = b.cast;
    mesh.receiveShadow = b.receive;
    mesh.matrixAutoUpdate = false;
    group.add(mesh);
  }

  /* interactives */
  const interactives = [];
  for (const d of decks) interactives.push({ meshes: d.meshes, action: () => { d.playing = !d.playing; d.lamp.material.emissiveIntensity = d.playing ? 1.4 : 0; } });

  let elapsed = 0;
  return {
    group, decks, interactives, lamp, sun, panel,
    get shadowsDirty() { return shadowsDirty; },
    set shadowsDirty(v) { shadowsDirty = v; },
    phoneSpot: new THREE.Vector3(0, DESK.top, DESK.z + 230),
    update(dt) {
      elapsed += dt;
      for (const d of decks) if (d.playing) d.platter.rotation.y += dt * Math.PI * 2 * (33.33 / 60);
      screenMat.map.offset.x = Math.sin(elapsed * 6) * 0.002;
      tvGlow.intensity = 0.8 + Math.sin(elapsed * 9) * 0.08 + Math.sin(elapsed * 23) * 0.05;
      const minute = Math.floor(Date.now() / 60000);
      if (minute !== clockMinute) { clockMinute = minute; face.draw(); clockTex.needsUpdate = true; }
    },
  };
}
