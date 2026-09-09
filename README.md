# Ricky's Phone

A replica of a 2007-era iPhone, built entirely from three.js primitives and
canvas-drawn surfaces. No 3D models, no image files, no build step.

The phone sits on a stand in a small studio and boots when the page opens:
black screen, the logo, then the lock screen. Drag to look around, scroll or
pinch to zoom, use **Flip it over** for the back. Click or tap the phone to
pick it up: the camera rolls to the phone's own up vector and fits the screen
to your viewport, so on a phone it reads like a phone.

The software is drawn in the manner of the first iPhone OS, on a canvas:

- a lock screen with the clock, the planet wallpaper, and a working
  "slide to unlock" (the text shimmers, the knob springs back);
- a black home screen of sixteen glossy icons over a reflective dock,
  laid out on the original 4 x 4 grid, with a live calendar and clock icon;
- app screens with the blue-grey bar and pinstripes. Notes has a to-do list
  and Clock has a real clock; the rest say so honestly.

The physical buttons work: the home button goes home (or wakes the phone),
the sleep button on the top edge puts it to sleep. Keyboard: **H** and
**S** press them, **F** flips, **Esc** puts the phone down.

## Running it locally

```bash
npx serve .            # or: python3 -m http.server 3000
```

Then open <http://localhost:3000>. Opening `index.html` straight from the
filesystem does not work because the site uses ES modules. WebGL is required.

## What is modelled

Measurements are the real ones, in millimetres: a 115 x 61 x 11.6 mm body
with 9 mm corners, a 3.5" 2:3 screen (320 x 480) set 15 mm below the top
edge, a chrome bezel around black glass, a brushed aluminium back with the
black plastic band across the bottom, and the details around the edge:
earpiece, home button with its rounded-square icon, volume rocker, ring/silent
switch, sleep button, headphone jack, SIM tray, 30-pin dock connector,
speaker and microphone grilles, and the camera on the back.

## Project layout

```
index.html          the page: stage, two buttons, a hint
css/style.css       the studio
js/main.js          renderer, stand, lights, camera moves, pointer handling
js/phone.js         the phone (geometry and materials), SPEC has the measurements
js/os.js            the software: boot, lock screen, home screen, app screens
js/textures.js      canvas-drawn surfaces: brushed back, grilles, mesh, home icon
vendor/three.min.js three.js + OrbitControls + RoomEnvironment, bundled
scripts/            npm run vendor rebuilds the bundle
```

## Updating three.js

```bash
npm install
npm run vendor
```

## Deployment

`.github/workflows/deploy.yml` publishes the repository as-is to GitHub Pages
on every push. Pages must be enabled with "GitHub Actions" as the source (and
the repository public, or on a plan that allows Pages on private repositories).

## Credits

- three.js (MIT).
- The phone it is modelled on was designed in Cupertino. Nothing here is
  affiliated with or endorsed by Apple; the back carries an "R", not a fruit.
