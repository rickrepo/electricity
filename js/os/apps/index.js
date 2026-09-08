// Application registry. Order here = order of desktop shortcuts and the
// start menu.
import showcase from './showcase.js';
import terminal from './terminal.js';
import notepad from './notepad.js';
import minesweeper from './minesweeper.js';
import rickle from './rickle.js';
import snake from './snake.js';
import paint from './paint.js';
import music from './music.js';
import settings from './settings.js';
import credits from './credits.js';
import trash from './trash.js';

export const APPS = [showcase, terminal, notepad, minesweeper, rickle, snake, paint, music, settings, credits, trash];

export const getApp = (id) => APPS.find((a) => a.id === id) || null;
