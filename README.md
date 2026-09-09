# Ricky's Bench

A personal website disguised as a late-night electronics workshop. Visitors
flip the MAIN breaker, the fluorescent tube flickers awake, and a homemade
computer on the bench (the RK-1) boots **RickyOS**: a small operating system
whose interface is built from bench equipment, with a lab notebook for the
portfolio, a terminal, an oscilloscope, a schematic doodler, a chiptune
jukebox, and three original games.

On a desktop you lean in to the CRT. On a phone you pick up the phone lying
on the bench: it takes the exact shape of your own screen, so when you lift it
RickyOS fills the display edge to edge like a real phone (home screen,
full-screen apps, bottom sheets, and a bench button in the nav bar to put it
back down).

Everything is plain HTML, CSS, and JavaScript. No framework, no build step,
no image or audio assets: the room is built from three.js primitives with
canvas-drawn textures, and every sound (rain, the fan, the tube, the cat, the
phone buzzing) is synthesized with the Web Audio API.

## Running it locally

```bash
npx serve .            # or: python3 -m http.server 3000
```

Then open <http://localhost:3000>. Opening `index.html` straight from the
filesystem does not work because the site uses ES modules. WebGL is required.

Deep links open an app after boot: `#notebook/builds`, `#terminal`, `#scope`.

## Around the bench

- **Click anywhere** to walk up, **click the screen** (or tap the phone, on mobile) to lean in, **Esc** or the tape in the corner to step back.
- The **breaker panel** powers the bench. The **power switch** on the RK-1 really cuts the power; flip it again to boot.
- The **light switch**, **ring lamp**, **cat**, **soldering iron**, **multimeter**, **oscilloscope**, **jars**, **stool**, **fire extinguisher**, and **phone** all react.
- Typing while leaned in presses the keys on the bench keyboard. Music in the Jukebox drives the RK-1's LEDs and the oscilloscope.
- The window shows the real time of day (always raining, though). Leave the computer alone for two minutes.
- In the Terminal: `help`, `led morse`, `storm`, `meow`.

## Project layout

```
index.html             page shell (stage, OS root, HUD, breaker panel)
css/                   tokens, gate/HUD, OS chrome, app styles, phone layout
js/main.js             device detection (CRT vs phone), runs the gate
js/boot.js             the breaker panel
js/sound.js            Web Audio engine (UI, ambience, signal generator, chiptune player)
js/songs.js            the three chiptune loops
js/scene/              three.js workshop: world, screens (CSS3D + canvas), camera rig, HUD, effects
js/os/                 RickyOS: window manager, phone layout, desktop, power strip, screensaver, apps/
js/os/content.js       ALL placeholder text lives here
vendor/three.min.js    three.js + OrbitControls + CSS3DRenderer, bundled
assets/fonts/          Pixelify Sans, IBM Plex Sans/Mono, VT323 (OFL)
```

## Making it yours

Every word about "Ricky" is placeholder text: the jobs, the builds, the
toaster. It all lives in `js/os/content.js`. Edit `PROFILE`, `ABOUT`, `WORK`,
`BUILDS`, `CONTACT`, and `FILES` and the Notebook, Terminal, Notes, and
Contact pages update automatically.

- `js/os/apps/index.js` controls which apps appear.
- `js/scene/world.js` is the room. Objects are grouped and commented.
- `css/base.css` holds the colour tokens for the HUD and RickyOS.

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

- Fonts: Pixelify Sans (Stefie Justprince), IBM Plex (IBM), VT323 (Peter Hull), all OFL.
- three.js (MIT).
- The idea of a portfolio you explore as a place owes a nod to the retro-OS
  portfolios that came before it; everything here was built from scratch.
