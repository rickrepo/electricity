# Ricky's portfolio

A personal website disguised as an old computer. Visitors boot into a
BIOS screen, land in a small 3D room, and find a beige CRT running
**RickyOS**: a tiny operating system with draggable windows, a showcase
of (placeholder) work, a terminal, a paint program, a chiptune player,
and a few games.

Everything is plain HTML, CSS, and JavaScript. There is no framework,
no build step, no image or audio assets: the room is built from
three.js primitives with canvas-drawn textures, and every sound is
synthesized with the Web Audio API.

## Running it locally

Any static file server works. For example:

```bash
npx serve .            # or: python3 -m http.server 3000
```

Then open <http://localhost:3000>. Opening `index.html` directly from
the filesystem will not work because the site uses ES modules.

Useful URL parameters:

| URL          | What it does                                          |
| ------------ | ----------------------------------------------------- |
| `?mode=3d`   | Force the 3D desk (default on desktops with WebGL).   |
| `?mode=os`   | Skip the room and open RickyOS full-screen (default on phones). |

## Project layout

```
index.html             page shell + boot screen container
css/                   base tokens, boot/HUD, OS shell, app styles
js/main.js             picks 3D vs 2D mode, runs the boot screen
js/boot.js             BIOS-style POST screen
js/sound.js            Web Audio engine (chime, clicks, ambience, chiptune player)
js/songs.js            the three chiptune loops
js/scene/              three.js room: world, monitor (CSS3D), camera rig, HUD, effects
js/os/                 RickyOS: window manager, desktop, taskbar, shutdown, apps/
js/os/content.js       ALL placeholder text lives here
vendor/three.min.js    three.js + OrbitControls + CSS3DRenderer, bundled
assets/fonts/          VT323, Silkscreen, Space Grotesk (OFL)
```

## Making it yours

All of the words on the site are placeholders: the jobs, the projects,
the toaster. They live in one file, `js/os/content.js`. Edit the
`PROFILE`, `ABOUT`, `EXPERIENCE`, `PROJECTS`, `CONTACT`, and `FILES`
objects and the Showcase, Terminal, Notepad, and Contact apps update
automatically.

Other knobs:

- `js/os/apps/index.js` controls which apps appear on the desktop.
- `js/scene/world.js` is the room. Objects are grouped and commented.
- `css/base.css` holds the colour tokens for both the HUD and RickyOS.

## Updating three.js

The vendored bundle is produced from npm:

```bash
npm install
npm run vendor
```

## Deployment

The GitHub Actions workflow in `.github/workflows/deploy.yml` publishes
the repository as-is to GitHub Pages on every push.

## Credits

- Inspired by Henry Heffernan's retro-OS portfolio.
- Fonts: VT323 (Peter Hull), Silkscreen (Jason Kottke), Space Grotesk
  (Florian Karsten), all under the SIL Open Font License.
- three.js (MIT).
