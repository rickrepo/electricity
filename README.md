# Ricky's Phone

2007. The den of someone born in 1989, with a first-generation iPhone on the
desk. Everything is built from three.js primitives and canvas-drawn
surfaces: no 3D models, no build step, and no image files except the one
photo you choose for the poster.

You walk in at dusk and the phone is already on. Drag to look around the
room: the poster over the desk, two 1200s and a mixer along the wall with
two crates of records in front of them, the N64 on a low cabinet with its
controller on the rug, a gas buggy on the floor and three plywood ramps to
jump it off, another buggy on the shelf, the window with the curtains, a
clock that keeps real time, a door, an architect's lamp on the desk. Click
anywhere and the phone comes straight into your hand (the camera rolls to
the phone's own up vector and fits it to your viewport); click the bezel or
press Esc to put it back and you are in the room again. Click a turntable
to start and stop it. There are no buttons or words on the page: the room
is the interface.

While the phone sits on the desk, texts arrive: the phone rattles on its
stand (and again every few seconds while the text sits unread), the screen
shows who and what, and the slider says "slide to view". Slide, and the
thread opens. Over the home screen or an app the text comes as a blue alert
with Close and Reply. A call comes in too, the way the first iPhone showed
one: the caller's picture fills the screen, the name sits in a dark band,
the slider turns green and says "slide to answer", and the phone rings and
rattles until you pick it up, at which point it is a missed call on the
lock screen and you unlock as usual. Red badges sit on Messages and Mail
for what is unread, on Phone for the missed call, and on Safari until it
has been opened.

Click the buggy to drive it: the arrow keys or WASD steer and throttle, or
drag anywhere (up for throttle, sideways to steer) on a touch screen. The
buggy stops at the walls and the furniture, and flies off the lip of any
ramp it takes at speed; on the run-up to a ramp it is drawn toward the
ramp's centre line, so a near miss becomes a hit. Tap, click, or press Esc
to stop driving.

The light is the desk lamp (a spotlight with soft shadows) and the window
(an area light and a low sun). Corners are darkened in
the geometry, furniture sits on contact shadows, the wood has grain, bump,
and varnish, the fabrics have a weave, and the edges are rounded.

## Performance

A loading screen covers the first second or two: the room is built, every
shader is compiled, every texture and every mesh is sent to the GPU, and a
frame is drawn from each place the camera can go (the room, the desk, the
phone in hand, the decks, behind the buggy) before the room fades in, so
nothing is built on first sight and the first walk-in is as smooth as the
last. The room is built to run at whatever your display refreshes at. Nothing
that casts a shadow ever moves, so the two shadow maps are rendered at the
start and then frozen. Everything static is merged into one mesh per
material at load, which brings the scene from about 350 draw calls a frame
to under 100. Rendering starts at full resolution (up to 2x) and steps down
a notch whenever the display's refresh rate is missed for a few seconds, so
motion stays smooth on any GPU. The phone's screen is redrawn only when
something on it changes, at a scale chosen so that one canvas pixel lands
on about one device pixel when the phone is in hand: crisp icons, no
shimmer. Add `?fps` to the address to see frame rate, draw calls,
triangles, and the current resolution in the corner.

## The poster

The frame over the desk shows a drawn silhouette until you give it a real
photograph. Drop a portrait image at `assets/poster.jpg` (any size; it is
fitted to a 600 mm wide frame) and the room picks it up on the next load.
Make sure you have the right to use the photo you choose.

The phone runs software drawn in the manner of the first iPhone OS:

- a lock screen with the clock and "slide to unlock" over the planet
  (Settings > Wallpaper swaps in ripples);
- a home screen of fifteen glossy icons over a reflective dock: Messages,
  Calendar, Photos, Camera, Stocks, Maps, Weather, Clock, Calculator, Notes,
  Settings, and Phone, Mail, Safari, iPod;
- every app does something. Safari is a real browser for the pages listed
  in its code and nothing else (the address field takes no typing): "I'm
  Ricky. I designed this website" with a link, and autismwaitlist.com, the
  actual site, shown in a frame laid over the screen while the phone is in
  hand; the page is laid out at a desktop's width and scaled down to fit,
  so it looks like a small copy of the site, the way the first iPhone
  shrank pages to the screen, and the magnifier in the toolbar steps it
  through desktop, tablet and phone widths. The toolbar's middle button opens the current site in a tab of its
  own, for hosts that will not show it in a frame. Two things can keep the
  frame blank: the site's own headers may forbid being shown inside another
  page, and the claude.ai preview of this room forbids frames to other
  sites entirely, so judge it on your own hosting. Messages and Mail have threads and an inbox. Photos has a
  camera roll and Camera adds to it (it looks at the room). Maps and Weather
  are Toronto. Stocks charts, iPod plays, Calculator calculates, Phone
  dials, Settings toggles airplane mode, brightness, and the wallpaper.

The personal things live in the room, not on the phone.

The physical buttons work: the home button goes home (or wakes the phone),
the sleep button on the top edge puts it to sleep. Keyboard: **H** and **S**
press them, **Esc** steps back.

## Deploying

`.github/workflows/deploy.yml` publishes the repository to GitHub Pages on
every push to `main` or to any `claude/**` branch. Two settings on the
repository make it work: under Settings > Pages the source must be "GitHub
Actions", and under Settings > Environments > github-pages the deployment
branch rules must allow the branch that is pushing (add `claude/**`, or
make that branch the default branch). A run that fails within a few seconds
with no log is the environment refusing the branch.

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
