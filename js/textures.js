// Every surface on the phone is drawn on a canvas at load time. No image files.
import * as THREE from '../vendor/three.min.js';

const make = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };
let seed = 20070629; // the day the first one went on sale
const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// The back of the phone: brushed aluminium above the seam, black plastic
// below it. The extrusion cap's UVs are the shape's own x/y, so the seam
// lands at a fixed v and the text is drawn mirrored (the cap is read from
// behind).
export function backTextures({ seamV }) {
  const W = 512, H = 1024;
  const seamY = Math.round((1 - seamV) * H);
  const [c, ctx] = make(W, H);

  ctx.fillStyle = '#c4c6c9';
  ctx.fillRect(0, 0, W, seamY);
  for (let i = 0; i < 2800; i++) {
    const a = 0.03 + rnd() * 0.08;
    ctx.fillStyle = rnd() > 0.5 ? `rgba(255,255,255,${a})` : `rgba(38,40,44,${a})`;
    ctx.fillRect(rnd() * W, 0, 0.5 + rnd() * 1.4, seamY);
  }
  const shade = ctx.createLinearGradient(0, 0, 0, seamY);
  shade.addColorStop(0, 'rgba(255,255,255,0.06)');
  shade.addColorStop(1, 'rgba(0,0,0,0.07)');
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, W, seamY);

  ctx.fillStyle = '#17181b';
  ctx.fillRect(0, seamY, W, H - seamY);
  for (let i = 0; i < 7000; i++) {
    ctx.fillStyle = `rgba(255,255,255,${rnd() * 0.04})`;
    ctx.fillRect(rnd() * W, seamY + rnd() * (H - seamY), 1, 1);
  }

  // the seam between metal and plastic
  ctx.fillStyle = '#7b7d81';
  ctx.fillRect(0, seamY - 3, W, 3);
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.fillRect(0, seamY - 4, W, 1);
  ctx.fillStyle = '#050506';
  ctx.fillRect(0, seamY, W, 2);

  ctx.save();
  ctx.translate(W, 0);
  ctx.scale(-1, 1);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // etched monogram where a fruit would normally go
  ctx.font = '600 118px Helvetica Neue, Helvetica, Arial, sans-serif';
  ctx.fillStyle = '#a4a6aa';
  ctx.fillText('R', W / 2, 372);
  // regulatory-style text on the plastic
  ctx.fillStyle = '#7c7e83';
  ctx.font = '500 16px Helvetica Neue, Helvetica, Arial, sans-serif';
  ctx.fillText('Model R1   ·   8GB   ·   Designed by Ricky', W / 2, H - 72);
  ctx.fillStyle = '#54565b';
  ctx.font = '400 12px Helvetica Neue, Helvetica, Arial, sans-serif';
  ctx.fillText('Assembled from primitives. Contains no phone.', W / 2, H - 48);
  ctx.restore();

  const map = new THREE.CanvasTexture(c);
  map.colorSpace = THREE.SRGBColorSpace;

  // Roughness lives in the green channel, metalness in blue.
  const [p, pctx] = make(W, H);
  pctx.fillStyle = 'rgb(0,100,228)';
  pctx.fillRect(0, 0, W, seamY);
  pctx.fillStyle = 'rgb(0,150,12)';
  pctx.fillRect(0, seamY, W, H - seamY);
  const props = new THREE.CanvasTexture(p);

  for (const t of [map, props]) { t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; t.anisotropy = 8; }
  return { map, props };
}

// Speaker and microphone grilles on the bottom edge.
export function grilleTexture() {
  const W = 180, H = 54;
  const [c, ctx] = make(W, H);
  ctx.fillStyle = '#1d1e21';
  ctx.fillRect(0, 0, W, H);
  for (let row = 0; row < 3; row++) {
    for (let i = 0; i < 11; i++) {
      const x = 12 + i * 15.5 + (row % 2) * 7.5;
      const y = 11 + row * 16;
      ctx.fillStyle = '#3a3c41';
      ctx.beginPath(); ctx.arc(x, y + 1.2, 3.6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#000';
      ctx.beginPath(); ctx.arc(x, y, 3.2, 0, Math.PI * 2); ctx.fill();
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// The rounded-square outline printed on the home button.
export function homeIconTexture() {
  const [c, ctx] = make(128, 128);
  ctx.strokeStyle = 'rgba(228,230,235,0.62)';
  ctx.lineWidth = 6;
  roundRect(ctx, 34, 34, 60, 60, 15);
  ctx.stroke();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// The fine mesh behind the earpiece slot.
export function meshTexture() {
  const W = 256, H = 48;
  const [c, ctx] = make(W, H);
  ctx.fillStyle = '#08080a';
  ctx.fillRect(0, 0, W, H);
  for (let y = 6; y < H; y += 8) {
    for (let x = 6 + ((y / 8) % 2) * 4; x < W; x += 8) {
      ctx.fillStyle = '#2b2c31';
      ctx.beginPath(); ctx.arc(x, y, 1.7, 0, Math.PI * 2); ctx.fill();
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Fades the table out toward the page background.
export function floorAlphaTexture() {
  const [c, ctx] = make(512, 512);
  const g = ctx.createRadialGradient(256, 256, 40, 256, 256, 256);
  g.addColorStop(0, '#fff');
  g.addColorStop(0.5, '#fff');
  g.addColorStop(1, '#000');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 512);
  return new THREE.CanvasTexture(c);
}
