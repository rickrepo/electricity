// A fake shell with just enough commands to be fun.
import { el, formatClock } from '../../util/dom.js';
import { PROFILE, EXPERIENCE, PROJECTS, PROJECT_CATEGORIES, FILES } from '../content.js';
import { store } from '../../util/storage.js';
import { sound } from '../../sound.js';

const LOGO = [
  ' ____  _      _          ___  ____',
  '|  _ \\(_) ___| | ___   _/ _ \\/ ___|',
  '| |_) | |/ __| |/ / | | | | | \\___ \\',
  '|  _ <| | (__|   <| |_| | |_| |___) |',
  '|_| \\_\\_|\\___|_|\\_\\\\__, |\\___/|____/',
  '                   |___/',
];

const CAT = [
  ' /\\_/\\ ',
  '( o.o )  < lint passed. suspicious.',
  ' > ^ <',
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
      title: 'Terminal - ricky@desk',
      icon: 'terminal',
      width: Math.min(720, W - 120),
      height: Math.min(460, H - 120),
      minWidth: 320,
      minHeight: 200,
      bodyClass: 'flush no-scroll',
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
  const prompt = el('span', { class: 'term-prompt' }, 'ricky@desk:~$ ');
  const inputRow = el('div', { class: 'term-input-row' }, prompt, input);
  body.append(term);
  const history = [];
  let historyIndex = -1;
  let cwd = '~';

  term.append(inputRow);
  const print = (text = '', cls = '') => {
    const lines = String(text).split('\n');
    for (const line of lines) term.insertBefore(el('div', { class: `term-line ${cls}` }, line), inputRow);
  };
  const scroll = () => { term.scrollTop = term.scrollHeight; };

  print(LOGO.join('\n'), 'term-ascii');
  print(`RickyOS Terminal v1.0 -- ${new Date().toDateString()}`, 'dim');
  print(`Type "help" to see what this thing can do.`, 'dim');
  print('');

  const COMMANDS = {
    help: () => {
      print('Available commands:', 'hl');
      const rows = [
        ['help', 'this list'],
        ['about', 'who is ricky?'],
        ['experience', 'where ricky has worked'],
        ['projects [category]', 'software | hardware | music'],
        ['contact', 'how to reach ricky'],
        ['ls', 'list files'],
        ['cat <file>', 'print a file'],
        ['open <app>', 'launch an app (showcase, mines, snake, ...)'],
        ['neofetch', 'system info, but make it pretty'],
        ['date', 'current date and time'],
        ['echo <text>', 'repeat after me'],
        ['cowsay <text>', 'a cat, technically'],
        ['matrix', 'wake up'],
        ['clear', 'clear the screen'],
        ['exit', 'close the terminal'],
      ];
      for (const [cmd, desc] of rows) print(`  ${cmd.padEnd(22)} ${desc}`);
    },
    about: () => {
      print(`${PROFILE.name} - ${PROFILE.title}`, 'hl');
      print(PROFILE.tagline);
      print(`Location: ${PROFILE.location}`);
      print(`Email:    ${PROFILE.email}`);
    },
    whoami: () => print('ricky'),
    experience: () => {
      for (const job of EXPERIENCE) {
        print(`${job.company} -- ${job.role}`, 'hl');
        print(`  ${job.period}`, 'dim');
        print(`  ${job.summary}`);
      }
    },
    projects: (args) => {
      const cat = args[0];
      const cats = cat ? PROJECT_CATEGORIES.filter((c) => c.id === cat) : PROJECT_CATEGORIES;
      if (!cats.length) return print(`unknown category "${cat}". try: software, hardware, music`, 'err');
      for (const c of cats) {
        print(`${c.title.toUpperCase()}`, 'hl');
        for (const p of PROJECTS[c.id]) print(`  ${p.title.padEnd(20)} ${p.year}  ${p.tags.join(', ')}`);
      }
    },
    contact: () => {
      print(`email: ${PROFILE.email}`, 'hl');
      for (const l of PROFILE.links) print(`${l.label.toLowerCase().padEnd(9)} ${l.hint}`);
      print('(all placeholder, of course)', 'dim');
    },
    ls: () => {
      const names = Object.keys(FILES).concat(Object.keys(store.get('files', {}) || {}));
      print([...new Set(names)].join('   '));
    },
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
      const map = { showcase: 'showcase', mines: 'minesweeper', minesweeper: 'minesweeper', snake: 'snake', rickle: 'rickle', paint: 'paint', music: 'music', notepad: 'notepad', settings: 'settings', credits: 'credits', trash: 'trash', terminal: 'terminal' };
      const id = map[(args[0] || '').toLowerCase()];
      if (!id) return print(`open: unknown app "${args[0] || ''}". try: ${Object.keys(map).join(', ')}`, 'err');
      os.open(id);
      print(`launching ${id}...`, 'dim');
    },
    neofetch: () => {
      const info = [
        `ricky@desk`,
        `-----------`,
        `OS:       RickyOS 98 (build ${new Date().getFullYear()})`,
        `Host:     Ricky Systems Beige Tower`,
        `Kernel:   vanilla-js 1.0`,
        `Uptime:   ${Math.floor(performance.now() / 60000)} min`,
        `Shell:    fakesh`,
        `Display:  CRT 1280x960 @ 60Hz`,
        `CPU:      RICKY-1 @ 133MHz (1 core)`,
        `Memory:   ${Math.floor(Math.random() * 20000 + 12000)}K / 65536K`,
        `Theme:    ${os.settings.wallpaper} / ${os.settings.accent}`,
      ];
      const art = [
        ' .-------. ',
        ' | RICKY | ',
        ' |  OS   | ',
        " '-------' ",
        '   |   |   ',
        '  [=====]  ',
      ];
      for (let i = 0; i < Math.max(art.length, info.length); i++) {
        print(`${(art[i] || '').padEnd(12)}  ${info[i] || ''}`, i < 2 ? 'hl' : '');
      }
    },
    date: () => print(`${new Date().toDateString()} ${formatClock(new Date(), { seconds: true })}`),
    echo: (args) => print(args.join(' ')),
    cowsay: (args) => {
      const text = args.join(' ') || 'meow';
      print(` ${'_'.repeat(text.length + 2)}`);
      print(`< ${text} >`);
      print(` ${'-'.repeat(text.length + 2)}`);
      print('   \\  /\\_/\\ ');
      print('    \\( o.o )');
      print('      > ^ < ');
    },
    lintcat: () => print(CAT.join('\n'), 'hl'),
    matrix: async () => {
      const chars = 'ｱｲｳｴｵｶｷｸｹｺ0123456789ABCDEF';
      const cols = Math.max(20, Math.floor(term.clientWidth / 11));
      for (let i = 0; i < 18; i++) {
        let line = '';
        for (let c = 0; c < cols; c++) line += Math.random() > 0.5 ? chars[Math.floor(Math.random() * chars.length)] : ' ';
        print(line);
        scroll();
        await new Promise((r) => setTimeout(r, 70));
      }
      print('follow the white rabbit.', 'hl');
    },
    clear: () => {
      for (const line of [...term.querySelectorAll('.term-line')]) line.remove();
    },
    cls: () => COMMANDS.clear(),
    sudo: (args) => {
      if (args.join(' ').includes('shutdown')) {
        print('ricky is not in the sudoers file. this incident will be reported.', 'err');
        print("(nice try. the shutdown button doesn't work either.)", 'dim');
      } else print('ricky is not in the sudoers file. this incident will be reported.', 'err');
    },
    rm: (args) => {
      if (args.includes('-rf') && args.includes('/')) {
        print('rm: refusing to remove the entire portfolio. it took ages.', 'err');
        sound.error();
      } else print(`rm: cannot remove '${args.join(' ') || ''}': files here are load-bearing`, 'err');
    },
    pwd: () => print(cwd === '~' ? '/home/ricky' : cwd),
    cd: (args) => {
      const target = args[0] || '~';
      if (target === '~' || target === '/home/ricky') cwd = '~';
      else print(`cd: ${target}: No such directory (there is only one directory and you are in it)`, 'err');
    },
    history: () => history.forEach((h, i) => print(`  ${String(i + 1).padStart(3)}  ${h}`)),
    shutdown: () => {
      print('shutdown: use the Start menu like a normal person.', 'err');
    },
    reboot: () => {
      print('rebooting...', 'dim');
      setTimeout(() => os.reboot(), 500);
    },
    exit: () => win.close(),
    hello: () => print('hi there!'),
    hi: () => print('hello!'),
    coffee: () => print('brewing... your coffee is on the desk, next to the lamp.'),
    ping: (args) => print(`PING ${args[0] || 'rickynet'}: 64 bytes, time=${(Math.random() * 20 + 1).toFixed(1)} ms (probably)`),
  };

  const run = async (raw) => {
    const line = raw.trim();
    print(`ricky@desk:${cwd}$ ${line}`);
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
