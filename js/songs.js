// Original chiptune loops for the RickyOS music player and the radio in the
// 3D room. Patterns are space-separated steps: a note name plays, "." rests,
// "_" sustains the previous note. Drum tracks use K (kick), S (snare), H (hat).

const bar = (s, times = 1) => Array(times).fill(s.trim()).join(' ');

export const SONGS = [
  {
    id: 'boot-jam',
    title: 'Boot Jam',
    artist: 'Ricky',
    bpm: 152,
    stepsPerBeat: 4,
    tracks: [
      {
        name: 'lead',
        wave: 'square',
        gain: 0.085,
        len: 0.8,
        pattern: [
          'A4 . C5 . E5 . C5 . A4 . . . E5 . D5 .',
          'F4 . A4 . C5 . A4 . F4 . . . C5 . A4 .',
          'C5 . E5 . G5 . E5 . C5 . . . G5 . E5 .',
          'G4 . B4 . D5 . B4 . G4 . . . D5 _ _ .',
          'A4 . C5 . E5 . A5 . G5 . E5 . D5 . C5 .',
          'F4 . A4 . C5 . F5 . E5 . C5 . A4 . F4 .',
          'C5 . E5 . G5 . C6 . B5 . G5 . E5 . C5 .',
          'D5 . B4 . G4 . B4 . D5 _ _ _ . . . .',
        ].join(' '),
      },
      {
        name: 'arp',
        wave: 'square',
        gain: 0.035,
        len: 0.5,
        pattern: [
          bar('A3 C4 E4 A4 A3 C4 E4 A4 A3 C4 E4 A4 A3 C4 E4 A4'),
          bar('F3 A3 C4 F4 F3 A3 C4 F4 F3 A3 C4 F4 F3 A3 C4 F4'),
          bar('C4 E4 G4 C5 C4 E4 G4 C5 C4 E4 G4 C5 C4 E4 G4 C5'),
          bar('G3 B3 D4 G4 G3 B3 D4 G4 G3 B3 D4 G4 G3 B3 D4 G4'),
        ].join(' '),
        repeat: 2,
      },
      {
        name: 'bass',
        wave: 'triangle',
        gain: 0.24,
        len: 0.9,
        pattern: [
          bar('A2 . A2 . A2 . A2 . A2 . A2 . E2 . G2 .'),
          bar('F2 . F2 . F2 . F2 . F2 . F2 . C3 . F2 .'),
          bar('C3 . C3 . C3 . C3 . C3 . C3 . G2 . C3 .'),
          bar('G2 . G2 . G2 . G2 . G2 . B2 . D3 . D3 .'),
        ].join(' '),
        repeat: 2,
      },
      {
        name: 'drums',
        wave: 'noise',
        gain: 0.16,
        pattern: bar('K . H . S . H . K . H K S . H H', 8),
      },
    ],
  },
  {
    id: 'late-night',
    title: 'Late Night Lo-Fi',
    artist: 'Ricky',
    bpm: 82,
    stepsPerBeat: 4,
    tracks: [
      {
        name: 'melody',
        wave: 'triangle',
        gain: 0.16,
        len: 0.95,
        pattern: [
          'A4 _ _ _ . . F4 _ _ . E4 _ _ _ . .',
          'D4 _ _ _ _ _ . . F4 _ G4 _ A4 _ _ _',
          'C5 _ _ _ . . A4 _ _ . G4 _ _ _ . .',
          'E4 _ _ _ _ _ . . D4 _ _ _ _ _ . .',
        ].join(' '),
      },
      { name: 'pad1', wave: 'sine', gain: 0.1, len: 1, pattern: 'D3 _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ G2 _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ C3 _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ A2 _ _ _ _ _ _ _ _ _ _ _ _ _ _ _' },
      { name: 'pad2', wave: 'sine', gain: 0.08, len: 1, pattern: 'F3 _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ B2 _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ E3 _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ C3 _ _ _ _ _ _ _ _ _ _ _ _ _ _ _' },
      { name: 'pad3', wave: 'sine', gain: 0.08, len: 1, pattern: 'A3 _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ D3 _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ G3 _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ E3 _ _ _ _ _ _ _ _ _ _ _ _ _ _ _' },
      { name: 'pad4', wave: 'sine', gain: 0.07, len: 1, pattern: 'C4 _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ F3 _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ B3 _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ G3 _ _ _ _ _ _ _ _ _ _ _ _ _ _ _' },
      {
        name: 'bass',
        wave: 'triangle',
        gain: 0.22,
        len: 0.9,
        pattern: 'D2 _ _ _ . . D2 _ . . A2 _ . . . . G2 _ _ _ . . G2 _ . . D2 _ . . . . C2 _ _ _ . . C2 _ . . G2 _ . . . . A2 _ _ _ . . A2 _ . . E2 _ . . . .',
      },
      {
        name: 'drums',
        wave: 'noise',
        gain: 0.09,
        pattern: bar('K . . H . . H . S . . H . H . H', 4),
      },
    ],
  },
  {
    id: 'modem-dreams',
    title: 'Modem Dreams',
    artist: 'Ricky',
    bpm: 128,
    stepsPerBeat: 4,
    tracks: [
      {
        name: 'arp',
        wave: 'square',
        gain: 0.06,
        len: 0.55,
        pattern: [
          bar('E4 G4 B4 E5 B4 G4 E4 G4 B4 E5 G5 E5 B4 G4 E4 G4'),
          bar('C4 E4 G4 C5 G4 E4 C4 E4 G4 C5 E5 C5 G4 E4 C4 E4'),
          bar('G3 B3 D4 G4 D4 B3 G3 B3 D4 G4 B4 G4 D4 B3 G3 B3'),
          bar('D4 F#4 A4 D5 A4 F#4 D4 F#4 A4 D5 F#5 D5 A4 F#4 D4 F#4'),
        ].join(' '),
        repeat: 2,
      },
      {
        name: 'lead',
        wave: 'sawtooth',
        gain: 0.05,
        len: 0.9,
        pattern: [
          '. . . . . . . . . . . . . . . .',
          '. . . . . . . . . . . . . . . .',
          '. . . . . . . . . . . . . . . .',
          '. . . . . . . . . . . . . . . .',
          'B4 _ _ _ G4 _ _ _ E4 _ _ _ _ _ _ _',
          'G4 _ _ _ E4 _ _ _ C4 _ _ _ _ _ _ _',
          'D4 _ _ _ G4 _ _ _ B4 _ _ _ _ _ _ _',
          'A4 _ _ _ F#4 _ _ _ D4 _ _ _ _ _ _ _',
        ].join(' '),
      },
      {
        name: 'bass',
        wave: 'triangle',
        gain: 0.24,
        len: 0.8,
        pattern: [
          bar('E2 . E2 . E3 . E2 . E2 . E2 . E3 . D3 .'),
          bar('C2 . C2 . C3 . C2 . C2 . C2 . C3 . B2 .'),
          bar('G2 . G2 . G3 . G2 . G2 . G2 . G3 . F#2 .'),
          bar('D2 . D2 . D3 . D2 . D2 . D2 . D3 . D2 .'),
        ].join(' '),
        repeat: 2,
      },
      {
        name: 'drums',
        wave: 'noise',
        gain: 0.15,
        pattern: bar('K . H H S . H . K . H H S . H H', 8),
      },
    ],
  },
];

/** Expands a track pattern (string + optional repeat) into an array of steps. */
export function trackSteps(track) {
  const steps = track.pattern.split(/\s+/).filter(Boolean);
  const repeat = track.repeat || 1;
  const out = [];
  for (let i = 0; i < repeat; i++) out.push(...steps);
  return out;
}

export function songLength(song) {
  return Math.max(...song.tracks.map((t) => trackSteps(t).length));
}

export function songDurationSeconds(song) {
  const stepDur = 60 / song.bpm / song.stepsPerBeat;
  return songLength(song) * stepDur;
}
