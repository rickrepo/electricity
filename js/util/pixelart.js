// Tiny pixel-art assets shared by the Showcase (About page) and the 3D room
// (the photo frame on the desk). Characters map to colours.

export const AVATAR = [
  '....hhhhhhhh....',
  '...hhhhhhhhhh...',
  '..hhhhhhhhhhhh..',
  '..hhssssssssshh.',
  '..hssssssssssh..',
  '..sssssssssss...',
  '..sgggsssgggs...',
  '..sgbgsssgbgs...',
  '..sgggsssgggs...',
  '..ssssssnssss...',
  '..sssssssssss...',
  '...ssmmmmmss....',
  '....sssssss.....',
  '..ttttttttttt...',
  '.ttttttttttttt..',
  '.tttttaaatttttt.',
];
export const AVATAR_COLORS = { h: '#3b2a22', s: '#f2c6a0', g: '#1e1b18', b: '#ffffff', n: '#d9a27c', m: '#b5533c', t: '#3aa0a8', a: '#ff6b4a' };

export const DESK_SCENE = [
  '........................',
  '..wwwwwwwwwwwwwwwwwwww..',
  '..w..................w..',
  '..w....mmmmmmmm......w..',
  '..w....mccccccm..hh..w..',
  '..w....mccccccm.hhhh.w..',
  '..w....mccccccm.hssh.w..',
  '..w....mmmmmmmm..ss..w..',
  '..w......mm.....tttt.w..',
  '..ddddddddddddddddddddd.',
  '..dkkkkkkkkd.ttttttt.d..',
  '..dddddddddd.ttttttt.d..',
  '..l......l...tt...tt.l..',
  '..l......l...tt...tt.l..',
  '..ffffffffffffffffffff..',
  '........................',
];
export const DESK_COLORS = { w: '#c9c2b2', m: '#e0d8c3', c: '#3aa0a8', h: '#3b2a22', s: '#f2c6a0', t: '#ff6b4a', d: '#8a5a33', k: '#4a4a52', l: '#5c3d22', f: '#2f2f38' };

/** Draws a pixel map onto a 2D context. */
export function drawPixels(ctx, rows, colors, scale = 8, ox = 0, oy = 0) {
  rows.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      if (colors[ch]) {
        ctx.fillStyle = colors[ch];
        ctx.fillRect(ox + x * scale, oy + y * scale, scale, scale);
      }
    });
  });
}

/** Returns a canvas element containing the pixel map. */
export function pixelCanvas(rows, colors, scale = 8) {
  const canvas = document.createElement('canvas');
  canvas.width = rows[0].length * scale;
  canvas.height = rows.length * scale;
  drawPixels(canvas.getContext('2d'), rows, colors, scale);
  return canvas;
}
