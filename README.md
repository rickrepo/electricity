# Ricky's Phone

2007. A den with a first-generation iPhone on the desk. Everything is built
from three.js primitives and canvas-drawn surfaces: no 3D models, no build
step, no image files.

You walk in at dusk, the phone is already on, and a moment later it comes
straight into your hand (the camera rolls to the phone's own up vector and
fits it to your viewport). Click the bezel or press Esc to put it back and
look around the room: two 1200s and a mixer along the wall with two crates
of records in front of them, the N64 on a low cabinet with its controller
on the rug, the window with the curtains, a clock that keeps real time, a
door, an architect's lamp on the desk. Click anywhere to pick the phone up
again, and click a turntable to start and stop it. There are no buttons or
words on the page: the room is the interface.

A text from Ricky arrives ("Welcome to my site."): the phone rattles (and
again every few seconds while the text sits unread on the desk), the screen
shows who and what, and the slider says "slide to view". A moment after the
phone is unlocked a second one says to check out the browser. Slide, and the thread opens. Over the home screen or
an app the text comes as a blue alert with Close and Reply. A call comes in too, the way the first iPhone showed
one: the caller's picture fills the screen, the name sits in a dark band,
the slider turns green and says "slide to answer", and the phone rings and
rattles. Slide to answer and the Phone app takes the call; press the sleep
button to decline; leave it and it is a missed call on the lock screen. If
it rings while the phone is on the desk, picking the phone up is a missed
call too. Red badges sit on Messages and Mail for what is unread, on Phone
for the missed call, and on Safari until it has been opened.

The light is the desk lamp (a spotlight with soft shadows) and the window
(an area light and a low sun). Corners are darkened in
the geometry, furniture sits on contact shadows, the wood has grain, bump,
and varnish, the fabrics have a weave, and the edges are rounded.

## Performance

A loading screen, written like an old machine's power-on self test in amber
on black (memory counting up, the room and the lamp ticking off, shaders and
textures counted as they land), covers the first second or two: the room is
built, every shader is compiled, every texture and every mesh is sent to the
GPU, and a frame is drawn from each place the camera can go (the room and
the phone in hand) before the room fades in, so nothing is built on first
sight and the first walk-in is as smooth as the last. The room is built to run at whatever your display refreshes at. Nothing
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

The phone runs software drawn in the manner of the first iPhone OS:

- a lock screen with the clock and "slide to unlock" over the planet
  (Settings > Wallpaper swaps in ripples);
- a home screen of glossy icons in two pages you swipe between (Messages,
  Calendar, Notes, Weather; then Clock, Stocks, Calculator, Settings), with
  the page dots above a reflective dock that holds Phone, Mail and Safari;
  the home button returns to the first page;
- every app does something. Safari is a real browser for the pages listed in
  its code and nothing else (the address field takes no typing): a plain
  portfolio page (a name, twenty years of building websites for fun and now
  the new era of AI, the work, a footer) whose entries for autismwaitlist.com
  and processmaps.ai open the actual sites, shown in a frame laid over the
  screen while the phone is in hand, with the toolbar's back and forward
  buttons walking that history; the page is laid out at a desktop's width and
  scaled down to fit, so it looks like a small copy of the site, the way the
  first iPhone shrank pages to the screen, and the magnifier in the toolbar
  steps it through desktop, tablet and phone widths. The toolbar's middle
  button opens the current site in a tab of its own, for hosts that will not
  show it in a frame. Two things can keep the frame blank: the site's own
  headers may forbid being shown inside another page, and the claude.ai
  preview of this room forbids frames to other sites entirely, so judge it on
  your own hosting. Messages holds Ricky's texts and the site's own
  notifications, and Mail its inbox: letters sent, follow-ups gone out, the
  domain renewed, a deploy. Weather is Toronto. Stocks charts, Calculator
  calculates, Phone dials, Settings toggles airplane mode, brightness, and the
  wallpaper.

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
js/main.js          renderer, loading screen, camera moves (room, in hand), pointer handling
js/room.js          the den: materials, lights, furniture, decks, cabinet and N64
js/phone.js         the phone (geometry and materials), SPEC has the measurements
js/os/core.js       the software: boot, lock, home, app runtime (scrolling, nav bars)
js/os/apps.js       the eleven apps
js/os/icons.js      the home screen icons
js/os/art.js        the planet, the ripples, the caller's picture
js/os/ui.js         drawing helpers (bars, groups, toggles, bubbles)
js/textures.js      the phone's surfaces
vendor/three.min.js three.js + OrbitControls, RoundedBoxGeometry, RectAreaLight, bundled
scripts/            npm run vendor rebuilds the bundle
```

## Making it yours

The portfolio page lives at the top of `js/os/apps.js` (`ABOUT`), the sites
Safari may open are the `PAGES` list beside it, and the messages, mail,
calendar events, notes, and specs sit beside their apps in the same file.

## Updating three.js

```bash
npm install
npm run vendor
```

## Credits

- three.js (MIT).
- The phone it is modelled on was designed in Cupertino. Nothing here is
  affiliated with or endorsed by Apple; the back carries an "R", not a fruit.
