// Application registry. Order here = order of desktop shortcuts and the menu.
import notebook from './notebook.js';
import terminal from './terminal.js';
import notes from './notes.js';
import sketch from './sketch.js';
import jukebox from './jukebox.js';
import scope from './scope.js';
import wireup from './wireup.js';
import solder from './solder.js';
import quiz from './quiz.js';
import settings from './settings.js';
import bin from './bin.js';

export const APPS = [notebook, terminal, notes, sketch, jukebox, scope, wireup, solder, quiz, settings, bin];
export const getApp = (id) => APPS.find((a) => a.id === id) || null;
