// ============================================================
// PLACEHOLDER CONTENT
// Everything about "Ricky" in this file is invented. Swap in real details
// here and the Notebook, Terminal, Notes, and Contact pages update.
// ============================================================

export const PROFILE = {
  name: 'Ricky',
  title: 'Software Tinkerer',
  tagline: 'I build small, strange, useful things: web tools, tiny games, and the occasional appliance that did not ask for firmware.',
  status: 'Open to interesting problems',
  location: 'A workbench with too many jars',
  email: 'ricky@example.com',
  year: new Date().getFullYear(),
  links: [
    { label: 'GitHub', url: 'https://example.com/ricky', hint: 'github.example/ricky' },
    { label: 'LinkedIn', url: 'https://example.com/in/ricky', hint: 'linkedin.example/in/ricky' },
    { label: 'Bluesky', url: 'https://example.com/@ricky', hint: '@ricky.example' },
  ],
};

export const ABOUT = {
  intro: [
    "I'm Ricky. I like the parts of software most people scroll past: the boot screens, the status LEDs, the little animations nobody asked for but everyone notices.",
    'By day I build interfaces at a small research lab. By night I build things like this: a workshop inside your browser, with a homemade computer on the bench that runs its own operating system.',
  ],
  story: [
    'My first "program" was a batch file that beeped every time someone opened the family PC. It was uninstalled within the hour. The reviews were mixed-to-positive.',
    'Since then I have collected a stack of half-finished side projects, a fully finished appreciation for CRT monitors, and a habit of over-engineering things that did not need engineering at all.',
    'When I am not typing I am probably re-soldering something that was working fine, tuning a chiptune, or trying to get a toaster to send push notifications. It can. It should not.',
  ],
  figure1: 'Fig. 1: An artist\'s rendition of me building this website. The artist was also me.',
  figure2: 'Fig. 2: Me, according to a 16x16 grid.',
  spec: [
    ['Type', 'General-purpose tinkerer'],
    ['Inputs', 'Coffee, curiosity, one more tab'],
    ['Outputs', 'Web tools, tiny games, blinking lights'],
    ['Operating temp', 'Late evening to very late evening'],
    ['Known issues', 'Starts new projects before finishing old ones'],
  ],
  outro: 'If any of this sounds like your kind of nonsense, say hello through the contact page or email',
};

export const WORK = [
  {
    company: 'Moonbase Labs',
    url: 'www.moonbaselabs.example',
    role: 'Frontend Engineer',
    period: 'Spring 2024 - Present',
    summary: 'A tiny research lab that builds visualisation tools for people who study clouds (the sky kind, not the server kind).',
    bullets: [
      'Own the interface for a real-time weather-balloon dashboard used by three field teams and one very patient intern.',
      'Rebuilt the charting layer on WebGL, taking a 40,000-point scatter plot from "please wait" to "oh, that was fast".',
      'Introduced a design token system so the team could argue about colours in one file instead of forty.',
      'Wrote the internal guide "How To Name Things", which is longer than it should be and shorter than it needs to be.',
    ],
    tags: ['TypeScript', 'WebGL', 'React', 'Design systems'],
  },
  {
    company: 'Quantum Toast Co.',
    url: 'www.quantumtoast.example',
    role: 'Team Lead & Engineer',
    period: 'Fall 2022 - Spring 2024',
    summary: 'A four-person startup convinced the world needed smarter breakfast appliances. The world was undecided.',
    bullets: [
      'Led a team of four through two hardware revisions and one memorable firmware rollback.',
      'Built the companion app that let a toaster receive push notifications, a sentence I still cannot say with a straight face.',
      'Designed the crumb-tray telemetry pipeline with an on-device ring buffer and a tiny sync protocol.',
      'Shipped an accessibility pass that made every screen usable with a single physical dial.',
    ],
    tags: ['Embedded C', 'Bluetooth LE', 'React Native', 'Leadership'],
  },
  {
    company: 'Pixel & Pine Studio',
    url: 'www.pixelandpine.example',
    role: 'Junior Developer',
    period: 'Summer 2020 - Fall 2022',
    summary: 'A boutique web studio above a bakery. The Wi-Fi was slow and the croissants were not.',
    bullets: [
      'Built marketing sites, small games, and one interactive annual report shaped like a tree.',
      'Maintained the studio\'s in-house sprite tool and added onion-skinning after months of begging.',
      'Learned that "can you make it pop" has at least fourteen distinct meanings.',
    ],
    tags: ['JavaScript', 'Canvas', 'CSS', 'Pixel art'],
  },
];

export const BUILD_CATEGORIES = [
  { id: 'software', label: 'Software' },
  { id: 'hardware', label: 'Hardware' },
  { id: 'music', label: 'Music' },
];

export const BUILDS = [
  {
    title: 'This Website',
    category: 'software',
    year: '2026',
    seed: 11,
    description: 'A workshop rendered with three.js whose homemade computer runs RickyOS: draggable windows, a terminal, a scope, and games. No frameworks, no build step, no audio files: every sound is synthesized in the browser.',
    bom: ['three.js', 'Web Audio', 'Vanilla JS'],
  },
  {
    title: 'Lintcat',
    category: 'software',
    year: '2025',
    seed: 23,
    description: 'A command-line tool that reads your linter output aloud in the voice of a disappointed cat. Surprisingly effective at getting people to fix warnings.',
    bom: ['Node.js', 'CLI', 'Speech synthesis'],
  },
  {
    title: 'Orbit Garden',
    category: 'software',
    year: '2024',
    seed: 37,
    description: 'A tiny idle game where planets are plants. Water them with comets, harvest moons, and try not to think too hard about the physics.',
    bom: ['Canvas', 'Game design', 'PWA'],
  },
  {
    title: 'Pocket Modem',
    category: 'software',
    year: '2023',
    seed: 52,
    description: 'A browser extension that plays authentic dial-up noises while pages load, with a slider from "1997" to "please stop".',
    bom: ['Browser extension', 'Web Audio'],
  },
  {
    title: 'Toast Notifications',
    category: 'hardware',
    year: '2023',
    seed: 71,
    description: 'A toaster that posts to a group chat when the toast is done. Includes a "burnt" detection model trained on 340 photos of breakfast.',
    bom: ['ESP32', 'MicroPython', 'Regret'],
  },
  {
    title: 'Desk Weather',
    category: 'hardware',
    year: '2024',
    seed: 84,
    description: 'A palm-sized e-ink display that shows tomorrow\'s weather as a pixel-art scene. Sun, rain, snow, and a rare "unknown" state that draws a shrug.',
    bom: ['E-ink', 'Rust', 'Pixel art'],
  },
  {
    title: 'Split Keyboard v3',
    category: 'hardware',
    year: '2025',
    seed: 96,
    description: 'A hand-wired split keyboard with a rotary encoder that adjusts exactly one thing: the brightness of the keyboard itself.',
    bom: ['QMK', 'Hand-wired', 'CAD'],
  },
  {
    title: 'Boot Jam',
    category: 'music',
    year: '2026',
    seed: 101,
    songId: 'boot-jam',
    description: 'An upbeat loop for the imaginary console that boots RickyOS. Square-wave lead, triangle bass, and a hi-hat made from filtered noise.',
    bom: ['Chiptune', '152 BPM'],
  },
  {
    title: 'Late Night Lo-Fi',
    category: 'music',
    year: '2025',
    seed: 118,
    songId: 'late-night',
    description: 'Four slow chords and a melody that cannot decide whether to go to bed. Best enjoyed with the bench lamp on and the rain outside.',
    bom: ['Lo-fi', '82 BPM'],
  },
  {
    title: 'Modem Dreams',
    category: 'music',
    year: '2025',
    seed: 130,
    songId: 'modem-dreams',
    description: 'Arpeggios that sound like a modem finally connecting after the third try.',
    bom: ['Arpeggio', '128 BPM'],
  },
];

export const CONTACT = {
  intro: 'Want to build something odd together, or just say hi? Leave a message below. This form is a demo and does not send anything anywhere, so email is the reliable option.',
  sent: 'Message "sent" (into the void, gently). For a real reply, email ',
};

export const FILES = {
  'README.txt': `RICKY'S BENCH - README
======================

Welcome to the workshop.

This is a portfolio website disguised as a workbench.
The person, the jobs, the projects, and the toaster are
all invented placeholder content. The computer, the
window manager, the games, and the synthesized sounds
are real.

THINGS TO TRY
-------------
 * Open the Notebook to read about Ricky.
 * Type "help" in the Terminal.
 * Play Wire Up, Solder, or the Bench Quiz.
 * Put a record on in the Jukebox, then look at the
   oscilloscope on the bench.
 * Leave the computer alone for a while.
 * Flip the power switch on the RK-1 (the box with
   the blinking lights) and boot it again.

Built with three.js, the Web Audio API, and a
questionable amount of free time.
`,
  'datasheet.txt': `RICKY                                        Rev. C
General-Purpose Software Tinkerer
-----------------------------------------------------

FEATURES
  - Builds web tools, tiny games, and blinking things
  - Ships small, iterates often, documents eventually
  - Single-package design (one person, no cloud)

ABSOLUTE MAXIMUM RATINGS
  Coffee ................. 4 cups/day
  Browser tabs ........... 60 (thermal shutdown above)
  Unfinished projects .... 12 (typ.), 30 (max.)

ELECTRICAL CHARACTERISTICS
  Curiosity .............. 5 V (nominal), 12 V (peak)
  Patience ............... 3.3 V, derates after 11 pm
  Output drive ........... strong, sinks and sources

EXPERIENCE (see Notebook for full pinout)
  Moonbase Labs .......... Frontend Engineer (2024 - now)
  Quantum Toast Co. ...... Team Lead & Engineer (2022 - 2024)
  Pixel & Pine Studio .... Junior Developer (2020 - 2022)

NOTE
  This datasheet is placeholder text. Every line is
  fictional, including this one. Email: ricky@example.com
`,
  'todo.txt': `TODO
[x] build fake computer
[x] build fake operating system
[x] write fake datasheet
[ ] finish portfolio
[ ] fix the rain leak above the window
[ ] find out what is in jar #4
[ ] stop "quickly testing" the solder game
[ ] call mom
`,
};

export const BIN_ITEMS = [
  { name: 'old_portfolio_final_v2_FINAL.zip', size: '14.2 MB', type: 'zip' },
  { name: 'definitely_not_a_virus.exe', size: '666 KB', type: 'file' },
  { name: 'toaster_firmware_v0.1_DO_NOT_FLASH.bin', size: '512 KB', type: 'file' },
  { name: 'selfie_but_blurry.jpg', size: '2.1 MB', type: 'image' },
];

export const CREDITS = [
  ['Engineering & design', 'Ricky'],
  ['Room, bench, and cat', 'Procedural boxes'],
  ['Sounds', 'Web Audio, no samples'],
  ['Chiptunes', 'Ricky'],
  ['Fonts', 'Pixelify Sans, IBM Plex, VT323 (OFL)'],
  ['3D', 'three.js'],
  ['Frameworks', 'None'],
];
