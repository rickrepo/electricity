# Ricky's Phone

2007. The den of someone born in 1989, with a first-generation iPhone on the
desk. Everything is built from three.js primitives and canvas-drawn
surfaces: no 3D models, no build step, and no image files except the one
photo you choose for the poster.

You walk in at dusk and the phone boots. Drag to look around the room: the
poster over the desk, the bed, two 1200s and a mixer along the wall with a
crate of records under them, the CRT with the N64 and a controller on the
rug, a nitro buggy on the floor and another on the shelf, the window with the
curtains, a chair, a clock that keeps real time, a door. Click anywhere to
walk up to the desk, click the phone to pick it up (the camera rolls to the
phone's own up vector and fits it to your viewport), click the bezel or press
Esc to put it down, click away to step back. The turntables spin if you click
them. There are no buttons or words on the page: the room is the interface.

The light is the desk lamp (a spotlight with soft shadows), the window (an
area light and a low sun), and the glow of the CRT. Corners are darkened in
the geometry, furniture sits on contact shadows, the wood has grain, bump,
and varnish, the fabrics have a weave, and the edges are rounded.

## Performance

The room is built to run at whatever your display refreshes at. Nothing
that casts a shadow ever moves, so the two shadow maps are rendered once
and frozen. Everything static is merged into one mesh per material at load,
which brings the scene from about 350 draw calls a frame to under 100. The
pixel ratio is capped at 1.5. Add `?fps` to the address to see frame rate,
draw calls, and triangles in the corner.

## The poster

The frame over the desk shows a drawn silhouette until you give it a real
photograph. Drop a portrait image at `assets/poster.jpg` (any size; it is
fitted to a 600 mm wide frame) and the room picks it up on the next load.
Make sure you have the right to use the photo you choose.

The phone runs software drawn in the manner of the first iPhone OS:

- a lock screen with the clock and "slide to unlock" over the planet
  (Settings > Wallpaper swaps in ripples);
- a home screen of sixteen glossy icons over a reflective dock, the original
  set: Messages, Calendar, Photos, Camera, Videos, Stocks, Maps, Weather,
  Clock, Calculator, Notes, Settings, and Phone, Mail, Safari, iPod;
- every app does something. Safari opens the About page. Messages and Mail
  have threads and an inbox. Photos has a camera roll and Camera adds to it
  (it looks at the room). Stocks charts, Videos plays, iPod plays, Calculator
  calculates, Phone dials, Settings toggles airplane mode, brightness, and the
  wallpaper.

The personal things live in the room, not on the phone.

The physical buttons work: the home button goes home (or wakes the phone),
the sleep button on the top edge puts it to sleep. Keyboard: **H** and **S**
press them, **Esc** steps back.

## Running it locally

```bash
npx serve .            # or: python3 -m http.server 3000
```

Then open <http://localhost:3000>. Opening `index.html` straight from the
filesystem does not work because the site uses ES modules. WebGL is required.

## What is modelled

The phone: a 115 x 61 x 11.6 mm body with 9 mm corners, a 3.5" 2:3 screen
(320 x 480) set 15 mm below the top edge, a chrome bezel around black glass,
a brushed aluminium back with the black plastic band across the bottom, and
the details around the edge: earpiece, home button with its rounded-square
icon, volume rocker, ring/silent switch, sleep button, headphone jack, SIM
tray, 30-pin dock connector, speaker and microphone grilles, and the camera.

The room: 4 x 3.6 m, in millimetres, with the furniture placed by hand.

## Project layout

```
index.html          the page: stage, a title, a hint
css/style.css       the page chrome
js/main.js          renderer, camera moves (room, desk, in hand), pointer handling
js/room.js          the den: materials, lights, furniture, poster, decks, CRT and N64, buggies
js/phone.js         the phone (geometry and materials), SPEC has the measurements
js/os/core.js       the software: boot, lock, home, app runtime (scrolling, nav bars)
js/os/apps.js       the sixteen apps
js/os/icons.js      the home screen icons
js/os/art.js        the poster (for the wall), the planet, the ripples, the photos
js/os/ui.js         drawing helpers (bars, groups, toggles, bubbles)
js/textures.js      the phone's surfaces
vendor/three.min.js three.js + OrbitControls, RoundedBoxGeometry, RectAreaLight, bundled
scripts/            npm run vendor rebuilds the bundle
```

## Making it yours

Every word about "Ricky" is placeholder text except the year. The About page
lives at the top of `js/os/apps.js` (`ABOUT`), the messages, mail, calendar
events, notes, and specs sit beside their apps in the same file.

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
