// ============================================================
// PLACEHOLDER CONTENT
// Everything in this file is made up. Swap in real details here and the
// Showcase, Terminal, Notepad, and Contact apps update automatically.
// ============================================================

export const PROFILE = {
  name: 'Ricky',
  title: 'Software Tinkerer',
  tagline: 'I build small, strange, delightful things for the web (and occasionally for my toaster).',
  location: 'A desk with a good lamp',
  email: 'ricky@example.com',
  year: new Date().getFullYear(),
  showcaseLabel: `Showcase '${String(new Date().getFullYear()).slice(-2)}`,
  links: [
    { label: 'GitHub', url: 'https://example.com/ricky', hint: 'github.example/ricky' },
    { label: 'LinkedIn', url: 'https://example.com/in/ricky', hint: 'linkedin.example/in/ricky' },
    { label: 'Bluesky', url: 'https://example.com/@ricky', hint: '@ricky.example' },
  ],
};

export const ABOUT = {
  intro: [
    "I'm Ricky, a software tinkerer who likes the parts of the web most people scroll past: the loading screens, the boot chimes, and the little animations nobody asked for.",
    'Right now I spend my days building interfaces at a small research lab, and my evenings building things like this website: a fake computer inside a real computer inside your browser.',
  ],
  story: [
    'My first "program" was a batch file that played a beep every time someone opened the family PC. It was uninstalled within the hour, but the reviews were mixed-to-positive.',
    'Since then I have collected a stack of half-finished side projects, a fully finished appreciation for CRT monitors, and a habit of over-engineering things that did not need engineering at all.',
    'When I am not typing, I am probably re-soldering something that was working fine, brewing a pour-over that takes eleven minutes, or losing at Minesweeper on the very same desktop you are looking at.',
  ],
  figure1: 'Figure 1: An artist\'s rendition of me developing this website (the artist was also me).',
  figure2: 'Figure 2: Me, according to a 16x16 grid.',
  hobbies: [
    { label: 'Chiptune', page: 'projects/music', text: 'I write tiny loops for imaginary game consoles. Three of them are playable in the Music app on this desktop.' },
    { label: 'Hardware', page: 'projects/hardware', text: 'Mostly microcontrollers, blinking lights, and at least one appliance that now has a Wi-Fi chip against its will.' },
  ],
  outro: 'Thanks for stopping by. If any of this sounds like your kind of nonsense, say hello through the contact page or shoot me an email at',
};

export const EXPERIENCE = [
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
      'Designed the crumb-tray telemetry pipeline (yes) with an on-device ring buffer and a tiny sync protocol.',
      'Shipped an accessibility pass that made every screen usable with a single physical dial.',
    ],
    tags: ['Embedded C', 'Bluetooth LE', 'React Native', 'Leadership'],
  },
  {
    company: 'Pixel & Pine Studio',
    url: 'www.pixelandpine.example',
    role: 'Junior Developer & Resident Pixel Pusher',
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

export const PROJECT_CATEGORIES = [
  { id: 'software', title: 'Software', subtitle: 'Projects', icon: 'code', blurb: 'Web experiments, tools, and games that started as "just a quick idea".' },
  { id: 'hardware', title: 'Hardware', subtitle: 'Tinkering', icon: 'chip', blurb: 'Microcontrollers, blinking lights, and appliances that did nothing wrong.' },
  { id: 'music', title: 'Music', subtitle: 'Chiptune', icon: 'note', blurb: 'Short loops written for a game console that does not exist.' },
];

export const PROJECTS = {
  software: [
    {
      title: 'This Website',
      year: '2026',
      seed: 11,
      description: 'A 3D desk rendered with three.js whose CRT monitor runs RickyOS, a small operating system with draggable windows, a terminal, and games. No frameworks, no build step, no audio files: every sound is synthesized in the browser.',
      tags: ['three.js', 'Web Audio', 'Vanilla JS'],
    },
    {
      title: 'Lintcat',
      year: '2025',
      seed: 23,
      description: 'A command-line tool that reads your linter output aloud in the voice of a disappointed cat. Surprisingly effective at getting people to fix warnings.',
      tags: ['Node.js', 'CLI', 'Speech synthesis'],
    },
    {
      title: 'Orbit Garden',
      year: '2024',
      seed: 37,
      description: 'A tiny idle game where planets are plants. Water them with comets, harvest moons, and try not to think too hard about the physics.',
      tags: ['Canvas', 'Game design', 'PWA'],
    },
    {
      title: 'Pocket Modem',
      year: '2023',
      seed: 52,
      description: 'A browser extension that plays authentic dial-up noises while pages load, with a slider from "1997" to "please stop".',
      tags: ['Browser extension', 'Web Audio'],
    },
  ],
  hardware: [
    {
      title: 'Toast Notifications',
      year: '2023',
      seed: 71,
      description: 'A toaster that posts to a group chat when the toast is done. Includes a "burnt" detection model trained on 340 photos of breakfast.',
      tags: ['ESP32', 'MicroPython', 'Regret'],
    },
    {
      title: 'Desk Weather',
      year: '2024',
      seed: 84,
      description: 'A palm-sized e-ink display that shows tomorrow\'s weather as a pixel-art scene. Sun, rain, snow, and a rare "unknown" state that draws a shrug.',
      tags: ['E-ink', 'Rust', 'Pixel art'],
    },
    {
      title: 'Split Keyboard v3',
      year: '2025',
      seed: 96,
      description: 'A hand-wired split keyboard with a rotary encoder that adjusts exactly one thing: the brightness of the keyboard itself.',
      tags: ['QMK', 'Hand-wired', 'CAD'],
    },
  ],
  music: [
    {
      title: 'Boot Jam',
      year: '2026',
      seed: 101,
      songId: 'boot-jam',
      description: 'An upbeat loop for the imaginary console that boots RickyOS. Square-wave lead, triangle bass, and a hi-hat made from filtered noise.',
      tags: ['Chiptune', '152 BPM'],
    },
    {
      title: 'Late Night Lo-Fi',
      year: '2025',
      seed: 118,
      songId: 'late-night',
      description: 'Four slow chords and a melody that cannot decide whether to go to bed. Best enjoyed with the desk lamp on.',
      tags: ['Lo-fi', '82 BPM'],
    },
    {
      title: 'Modem Dreams',
      year: '2025',
      seed: 130,
      songId: 'modem-dreams',
      description: 'Arpeggios that sound like a modem finally connecting after the third try.',
      tags: ['Arpeggio', '128 BPM'],
    },
  ],
};

export const CONTACT = {
  intro: 'Want to build something odd together, or just say hi? Drop a message below. This form is a demo and does not send anything anywhere, so email is the reliable option.',
  sent: 'Message "sent" (into the void, gently). For a real reply, email ',
};

export const FILES = {
  'README.txt': `RICKYOS README
==============

Welcome to Ricky's desk.

This is a portfolio website disguised as an old computer.
Everything you see is placeholder content: the jobs, the
projects, and the toaster are all invented. The window
manager, the games, and the synthesized sounds are real.

THINGS TO TRY
-------------
 * Double-click "Showcase" to read about Ricky.
 * Open the Terminal and type "help".
 * Play Minesweeper, Snake, or Rickle.
 * Put on some music and turn the desk lamp on.
 * Shut the computer down. Try it more than once.

Made with three.js, the Web Audio API, and a
questionable amount of free time.
`,
  'resume.txt': `RICKY
Software Tinkerer
ricky@example.com

EXPERIENCE
  Moonbase Labs .......... Frontend Engineer (2024 - now)
  Quantum Toast Co. ...... Team Lead & Engineer (2022 - 2024)
  Pixel & Pine Studio .... Junior Developer (2020 - 2022)

SKILLS
  TypeScript, WebGL, React, Embedded C, Rust (beginner),
  Pixel art, Chiptune, Naming things (aspirational)

EDUCATION
  B.Sc. Computer Science, University of Somewhere Nice
  Minor in Not Reading The Manual

NOTE
  This resume is placeholder text. Every line is fictional,
  including this one.
`,
  'todo.txt': `TODO
[x] build fake computer
[x] build fake operating system
[x] write fake resume
[ ] finish portfolio
[ ] water the fern
[ ] stop opening minesweeper "just for one game"
[ ] call mom
`,
};

export const TRASH_ITEMS = [
  { name: 'old_portfolio_final_v2_FINAL.zip', size: '14.2 MB', type: 'zip' },
  { name: 'definitely_not_a_virus.exe', size: '666 KB', type: 'file' },
  { name: 'selfie_but_blurry.jpg', size: '2.1 MB', type: 'image' },
  { name: 'ideas.txt', size: '1 KB', type: 'file' },
];

export const CREDITS = [
  { title: 'Engineering & Design', rows: [['Everything', 'Ricky']] },
  { title: 'Scene', rows: [['Furniture', 'Procedural boxes'], ['Coffee steam', 'One shader'], ['Fern', 'Seven cones']] },
  { title: 'Sound', rows: [['Startup chime', 'Web Audio'], ['Keyboard clacks', 'Filtered noise'], ['Chiptunes', 'Ricky']] },
  { title: 'Fonts', rows: [['VT323', 'Peter Hull'], ['Silkscreen', 'Jason Kottke'], ['Space Grotesk', 'Florian Karsten']] },
  { title: 'Built With', rows: [['3D', 'three.js'], ['Frameworks', 'none'], ['Build step', 'also none']] },
  { title: 'Inspiration', rows: [['Retro OS portfolios', 'Henry Heffernan'], ['Beige computers', 'The 1990s'], ['Patience', 'You, for reading this']] },
];
