// A fake shell with just enough commands to be fun, plus a few that poke the
// bench in the 3D room.
import { el, formatClock } from '../../util/dom.js';
import { PROFILE, WORK, BUILDS, BUILD_CATEGORIES, FILES } from '../content.js';
import { store } from '../../util/storage.js';
import { sound } from '../../sound.js';

const LOGO = [
  ' ____  _  __     _ ',
  '|  _ \\| |/ /    / |',
  '| |_) | \' /_____| |',
  '|  _ <| . \\_____| |',
  '|_| \\_\\_|\\_\\    |_|   RickyOS terminal',
];

export default {
  id: 'terminal',
  name: 'Terminal',
  icon: 'terminal',
  desktop: true,
  startMenu: true,
  launch(os, { command } = {}) {
    const existing = os.wm.get('terminal');
    if (existing) {
      existing.restore();
      existing.focus();
      if (command) existing.app?.run(command);
      return existing;
    }
    const { width: W, height: H } = os.wm.bounds;
    return os.wm.open({
      id: 'terminal',
      title: 'Terminal',
      icon: 'terminal',
      width: Math.min(720, W - 120),
      height: Math.min(460, H - 120),
      minWidth: 320,
      minHeight: 200,
      bodyClass: 'no-scroll dark',
      render: (body, win) => {
        win.app = mountTerminal(os, body, win);
        if (command) win.app.run(command);
      },
    });
  },
};

function mountTerminal(os, body, win) {
  const term = el('div', { class: 'term', role: 'log', 'aria-live': 'polite' });
  const input = el('input', { class: 'term-input', type: 'text', spellcheck: false, autocomplete: 'off', autocapitalize: 'off', 'aria-label': 'Terminal input' });
  const prompt = el('span', { class: 'term-prompt' }, 'ricky@rk1:~$ ');
  const inputRow = el('div', { class: 'term-input-row' }, prompt, input);
  body.append(term);
  term.append(inputRow);
  const history = [];
  let historyIndex = -1;

  const print = (text = '', cls = '') => {
    for (const line of String(text).split('\n')) term.insertBefore(el('div', { class: `term-line ${cls}` }, line), inputRow);
  };
  const scroll = () => { term.scrollTop = term.scrollHeight; };

  print(LOGO.join('\n'), 'term-ascii');
  print(`RK-1 - ${new Date().toDateString()} - bench attached`, 'dim');
  print('Type "help" to see what this thing can do.', 'dim');
  print('');

  const bench = (cmd, args = []) => os.bus.emit('bench', { cmd, args });

  const COMMANDS = {
    help: () => {
      print('Available commands:', 'hl');
      const rows = [
        ['help', 'this list'],
        ['about', 'who is ricky?'],
        ['work', 'where ricky has worked'],
        ['builds [category]', 'software | hardware | music'],
        ['contact', 'how to reach ricky'],
        ['ls / cat <file>', 'list and read files'],
        ['open <app>', 'launch an app (notebook, scope, wireup, ...)'],
        ['neofetch', 'system info, but make it pretty'],
        ['lights', 'toggle the bench lights'],
        ['meow', 'wake the cat'],
        ['storm', 'call down lightning'],
        ['led <chase|blink|bounce|morse|off>', 'play with the RK-1 status LEDs'],
        ['catsay <text>', 'a cat says it for you'],
        ['date / echo / clear / history', 'the usual'],
        ['reboot / shutdown / exit', 'the dramatic ones'],
      ];
      for (const [cmd, desc] of rows) print(`  ${cmd.padEnd(26)} ${desc}`);
    },
    about: () => {
      print(`${PROFILE.name} - ${PROFILE.title}`, 'hl');
      print(PROFILE.tagline);
      print(`Location: ${PROFILE.location}`);
      print(`Email:    ${PROFILE.email}`);
    },
    whoami: () => print('ricky'),
    work: () => {
      for (const job of WORK) {
        print(`${job.company} -- ${job.role}`, 'hl');
        print(`  ${job.period}`, 'dim');
        print(`  ${job.summary}`);
      }
    },
    builds: (args) => {
      const cat = args[0];
      const cats = cat ? BUILD_CATEGORIES.filter((c) => c.id === cat) : BUILD_CATEGORIES;
      if (!cats.length) return print(`unknown category "${cat}". try: software, hardware, music`, 'err');
      for (const c of cats) {
        print(c.label.toUpperCase(), 'hl');
        for (const b of BUILDS.filter((x) => x.category === c.id)) print(`  ${b.title.padEnd(22)} ${b.year}  ${b.bom.join(', ')}`);
      }
    },
    contact: () => {
      print(`email: ${PROFILE.email}`, 'hl');
      for (const l of PROFILE.links) print(`${l.label.toLowerCase().padEnd(9)} ${l.hint}`);
      print('(all placeholder, of course)', 'dim');
    },
    ls: () => print([...new Set([...Object.keys(FILES), ...Object.keys(store.get('files', {}) || {})])].join('   ')),
    dir: (a) => COMMANDS.ls(a),
    cat: (args) => {
      const name = args[0];
      if (!name) return print('usage: cat <file>', 'err');
      const custom = store.get('files', {}) || {};
      const text = custom[name] ?? FILES[name];
      if (text === undefined) return print(`cat: ${name}: No such file`, 'err');
      print(text);
    },
    open: (args) => {
      const map = { notebook: 'notebook', notes: 'notes', sketch: 'sketch', jukebox: 'jukebox', music: 'jukebox', scope: 'scope', wireup: 'wireup', solder: 'solder', quiz: 'quiz', settings: 'settings', bin: 'bin', terminal: 'terminal' };
      const id = map[(args[0] || '').toLowerCase()];
      if (!id) return print(`open: unknown app "${args[0] || ''}". try: ${Object.keys(map).join(', ')}`, 'err');
      os.open(id);
      print(`launching ${id}...`, 'dim');
    },
    neofetch: () => {
      const info = [
        'ricky@rk1',
        '---------',
        `OS:       RickyOS 1.0 (build ${new Date().getFullYear()})`,
        'Host:     RK-1 open-frame homebrew',
        'Kernel:   vanilla-js 1.0',
        `Uptime:   ${Math.floor(performance.now() / 60000)} min`,
        'Shell:    fakesh',
        'Display:  CRT 1280x960 @ 60Hz',
        'CPU:      RK-1 @ 8MHz (1 core, 8 LEDs)',
        `Memory:   ${Math.floor(Math.random() * 20 + 30)}K / 64K`,
        `Theme:    ${os.settings.wallpaper} board / ${os.settings.accent}`,
      ];
      const art = ['  .-----.  ', '  | RK1 |  ', '  |o o o|  ', "  '-----'  ", '   |||||   ', '  [=====]  '];
      for (let i = 0; i < Math.max(art.length, info.length); i++) print(`${(art[i] || '').padEnd(12)}  ${info[i] || ''}`, i < 2 ? 'hl' : '');
    },
    date: () => print(`${new Date().toDateString()} ${formatClock(new Date(), { seconds: true })}`),
    echo: (args) => print(args.join(' ')),
    catsay: (args) => {
      const text = args.join(' ') || 'meow';
      print(` ${'_'.repeat(text.length + 2)}`);
      print(`< ${text} >`);
      print(` ${'-'.repeat(text.length + 2)}`);
      print('   \\  /\\_/\\ ');
      print('    \\( o.o )');
      print('      > ^ < ');
    },
    lights: () => { bench('lights'); print('toggling the bench lights...', 'dim'); },
    meow: () => { bench('meow'); print('the cat has been consulted.', 'dim'); },
    storm: () => { bench('storm'); print('summoning weather...', 'dim'); },
    led: (args) => { bench('led', args); print(`LED pattern: ${args[0] || 'chase'}`, 'dim'); },
    matrix: async () => {
      const chars = 'ｱｲｳｴｵｶｷｸｹｺ0123456789ABCDEF';
      const cols = Math.max(20, Math.floor(term.clientWidth / 9));
      for (let i = 0; i < 16; i++) {
        let line = '';
        for (let c = 0; c < cols; c++) line += Math.random() > 0.5 ? chars[Math.floor(Math.random() * chars.length)] : ' ';
        print(line);
        scroll();
        await new Promise((r) => setTimeout(r, 70));
      }
      print('follow the white cat.', 'hl');
    },
    clear: () => { for (const line of [...term.querySelectorAll('.term-line')]) line.remove(); },
    cls: () => COMMANDS.clear(),
    sudo: () => print('ricky is not in the sudoers file. this incident will be reported to the cat.', 'err'),
    rm: (args) => {
      if (args.includes('-rf') && args.includes('/')) {
        print('rm: refusing to remove the entire bench. it took ages.', 'err');
        sound.error();
      } else print(`rm: cannot remove '${args.join(' ') || ''}': files here are load-bearing`, 'err');
    },
    pwd: () => print('/home/ricky'),
    cd: (args) => { if (args[0] && args[0] !== '~') print(`cd: ${args[0]}: there is only one directory and you are in it`, 'err'); },
    history: () => history.forEach((h, i) => print(`  ${String(i + 1).padStart(3)}  ${h}`)),
    reboot: () => { print('rebooting...', 'dim'); setTimeout(() => os.reboot(), 500); },
    shutdown: () => { print('shutting down...', 'dim'); setTimeout(() => os.shutdown(), 500); },
    exit: () => win.close(),
    hello: () => print('hi there!'),
    hi: () => print('hello!'),
    coffee: () => print('the mug on the bench says NOT FLUX. it is coffee. probably.'),
    ping: (args) => print(`PING ${args[0] || 'rickynet'}: 64 bytes, time=${(Math.random() * 20 + 1).toFixed(1)} ms (probably)`),
  };

  const run = async (raw) => {
    const line = raw.trim();
    print(`ricky@rk1:~$ ${line}`);
    if (!line) return;
    history.push(line);
    historyIndex = history.length;
    const [cmd, ...args] = line.split(/\s+/);
    const fn = COMMANDS[cmd.toLowerCase()];
    if (fn) await fn(args);
    else {
      print(`${cmd}: command not found. type "help".`, 'err');
      sound.beep();
    }
    scroll();
  };

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const value = input.value;
      input.value = '';
      run(value);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length) {
        historyIndex = Math.max(0, historyIndex - 1);
        input.value = history[historyIndex] || '';
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      historyIndex = Math.min(history.length, historyIndex + 1);
      input.value = history[historyIndex] || '';
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const partial = input.value.toLowerCase();
      const match = Object.keys(COMMANDS).find((c) => partial && c.startsWith(partial));
      if (match) input.value = match + ' ';
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      COMMANDS.clear();
    } else if (e.key.length === 1) sound.key();
  });
  term.addEventListener('pointerup', () => {
    if (!getSelection()?.toString()) input.focus({ preventScroll: true });
  });
  body.addEventListener('focus', () => input.focus({ preventScroll: true }));
  setTimeout(() => input.focus({ preventScroll: true }), 60);
  return { run, print };
}
