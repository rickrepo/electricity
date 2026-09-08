// The shutdown sequence. It has never once succeeded.
import { el, sleep, formatClock, prefersReducedMotion } from '../util/dom.js';
import { sound } from '../sound.js';

const F = 200;
const S = 700;
const M = 1600;
const L = 3200;

// Script items: string (typed), number (pause ms), { text, cls, instant } objects, '\n' newlines.
function normalScript() {
  const t = () => formatClock(new Date(), { seconds: true });
  return [
    'Beginning pre-shutdown sequence...', F, '\n',
    'Saving desktop layout .......... ', { text: 'done', cls: 'sd-good' }, '\n',
    'Closing open programs .......... ', { text: 'done', cls: 'sd-good' }, '\n',
    'Flushing coffee buffer ......... ', { text: 'done', cls: 'sd-good' }, F, '\n',
    `Connecting to RICKYNET-01 to upload session report`, '.', F, '.', F, '.', S, '\n',
    { text: `[${t()}] Connection established. Transferring 3 files...`, instant: true }, '\n',
    '.', F, '.', F, '.', S, '.', F, '.', F, '.', S, { text: '  [Transfer failed]', cls: 'sd-bad' }, '\n',
    { text: `[${t()}] (RICKYNET-01:60099) [SOCKET_TIMEOUT] Connection refused: reconnecting...`, instant: true, cls: 'sd-warn' }, '\n',
    S,
    { text: `[${t()}] (RICKYNET-01:60099) [SOCKET_TIMEOUT] Connection refused: reconnecting...`, instant: true, cls: 'sd-warn' }, '\n',
    S,
    { text: `[${t()}] (RICKYNET-01:60099) [SOCKET_TIMEOUT] Connection refused: reconnecting...`, instant: true, cls: 'sd-warn' }, '\n',
    M,
    { text: `FATAL: 'ricky.exe' is not responding and refuses to close.`, cls: 'sd-bad' }, '\n',
    { text: 'Unable to shut down the computer.', cls: 'sd-bad' }, '\n', S, '\n',
    'Aborting shutdown sequence and rebooting', S, '.', S, '.', S, '.', S,
  ];
}

const SCRIPTS = [
  normalScript,
  normalScript,
  () => [
    'Again?', S, ' Okay. Let me try harder this time.', M, '\n\n',
    'Shutting down', S, '.', S, '.', S, '.', M, '\n',
    { text: 'Nope.', cls: 'sd-bad' }, S, ' Still rebooting', S, '.', S, '.', S, '.', S,
  ],
  () => [
    'Between you and me:', M, ' the shutdown button has never worked.', M, '\n',
    "It's decorative.", S, ' Like the fern.', L, '\n\n',
    'Rebooting', S, '.', S, '.', S, '.', S,
  ],
  () => [
    'Seriously though.', M, ' There are games on this thing.', M, '\n',
    'Minesweeper!', S, ' Snake!', S, ' A word game with a pun for a name!', M, '\n',
    'A paint program!', S, ' Three whole chiptunes!', L, '\n\n',
    'And yet here we are.', M, '\n',
    'Rebooting', S, '.', S, '.', S, '.', S,
  ],
  () => [M, ':', S, '(', L, '\n\n', 'Rebooting', S, '.', S, '.', S, '.', S],
  () => [
    'Lucky number seven!', M, " Here's a secret for your persistence:", M, '\n',
    'open the Terminal and type ', { text: 'sudo shutdown', cls: 'sd-good' }, '.', M, '\n',
    "(It won't work either, but the message is nicer.)", L, '\n\n',
    'Rebooting', S, '.', S, '.', S, '.', S,
  ],
  () => [
    'You are very persistent.', M, ' I respect that.', M, '\n',
    'I am also very persistent.', M, ' I have to be. I am a fake operating system.', L, '\n\n',
    'Rebooting', S, '.', S, '.', S, '.', S,
  ],
  () => [
    'Almost there.', M, ' Apparently.', M, '\n',
    'One more and I promise something happens.', L, '\n\n',
    'Rebooting', S, '.', S, '.', S, '.', S,
  ],
  () => [
    'Okay.', M, ' You win.', M, ' Fair and square.', M, '\n\n',
    "I can't keep writing these messages, and if the world you want to live in", '\n',
    'is a world without a small fake computer in it,', S, ' so be it.', L, '\n\n',
    "I won't forget you.", L, '\n\n',
    'Shutting', M, ' down', M, '.', M, '.', M, '.', M,
  ],
];

/**
 * Runs the shutdown sequence for the given attempt count (1-based).
 * Resolves with 'reboot' or 'off'.
 */
export async function runShutdown(os, count) {
  const fast = prefersReducedMotion();
  const overlay = el('div', { class: 'os-shutdown', 'aria-live': 'polite' });
  os.root.append(overlay);
  sound.powerDown();

  const idx = Math.min(count - 1, SCRIPTS.length - 1);
  const script = SCRIPTS[idx]();
  const finalAttempt = idx === SCRIPTS.length - 1;

  let lineEl = el('span');
  overlay.append(lineEl);
  const wait = (ms) => sleep(fast ? Math.min(ms, 120) : ms);

  for (const item of script) {
    if (typeof item === 'number') {
      await wait(item);
    } else if (item === '\n' || item === '\n\n') {
      overlay.append(document.createTextNode(item));
      lineEl = el('span');
      overlay.append(lineEl);
    } else if (typeof item === 'string') {
      for (const ch of item) {
        lineEl.append(ch);
        if (ch !== ' ') sound.key();
        await wait(14 + Math.random() * 22);
      }
    } else {
      const span = el('span', { class: item.cls || '' });
      overlay.append(span);
      if (item.instant) span.textContent = item.text;
      else {
        for (const ch of item.text) {
          span.append(ch);
          await wait(14 + Math.random() * 22);
        }
      }
      lineEl = el('span');
      overlay.append(lineEl);
    }
    overlay.scrollTop = overlay.scrollHeight;
  }

  await wait(400);
  overlay.remove();
  return finalAttempt ? 'off' : 'reboot';
}
