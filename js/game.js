// ================================================================
// CIRCUIT WARS - Simplified Real-Time Race
// ================================================================

(function () {
  'use strict';

  // ============================================================
  // CONSTANTS
  // ============================================================

  const GRID_SIZE = 5;
  const ROUNDS_TO_WIN = 3;
  const SCRAMBLE_PENALTY = 3; // tiles scrambled on loser after a round

  // AI move interval in ms per difficulty
  const AI_SPEED = { easy: 2400, medium: 1500, hard: 800 };

  // Directions
  const DIR = { TOP: 0, RIGHT: 1, BOTTOM: 2, LEFT: 3 };
  const OPPOSITE = [2, 3, 0, 1];
  const D_ROW = [-1, 0, 1, 0];
  const D_COL = [0, 1, 0, -1];

  // Tile types
  const TYPE = {
    STRAIGHT: 'straight',
    CORNER: 'corner',
    TEE: 'tee',
    CROSS: 'cross',
    DEAD_END: 'dead_end',
    EMPTY: 'empty',
  };

  // Base connections per type (before rotation)
  const BASE = {
    straight: [0, 2],
    corner: [0, 1],
    tee: [0, 1, 2],
    cross: [0, 1, 2, 3],
    dead_end: [0],
    empty: [],
  };

  // Random fill weights
  const WEIGHTS = [
    [TYPE.STRAIGHT, 30],
    [TYPE.CORNER, 30],
    [TYPE.TEE, 15],
    [TYPE.CROSS, 3],
    [TYPE.DEAD_END, 12],
    [TYPE.EMPTY, 8],
  ];
  const W_TOTAL = WEIGHTS.reduce((s, w) => s + w[1], 0);

  // ============================================================
  // TILE
  // ============================================================

  class Tile {
    constructor(type, rotation) {
      this.type = type;
      this.rotation = rotation || 0;
      this.powered = false;
    }

    connections() {
      return BASE[this.type].map((d) => (d + this.rotation) % 4);
    }

    has(dir) {
      return this.connections().indexOf(dir) !== -1;
    }

    rotate() {
      this.rotation = (this.rotation + 1) % 4;
    }
  }

  // ============================================================
  // GRID
  // ============================================================

  class Grid {
    constructor() {
      this.tiles = [];
      this.poweredSet = new Set();
      this.complete = false;
      this.totalTiles = GRID_SIZE * GRID_SIZE;
    }

    // Progress: fraction of tiles powered (0 to 1)
    progress() {
      return this.poweredSet.size / this.totalTiles;
    }

    generate() {
      this.tiles = [];
      for (let r = 0; r < GRID_SIZE; r++) {
        this.tiles[r] = [];
        for (let c = 0; c < GRID_SIZE; c++) {
          this.tiles[r][c] = new Tile(TYPE.EMPTY, 0);
        }
      }
      this._buildPath();
      this._fill();
      this._scramble();
      this.updatePowered();
    }

    // Scramble N random non-trivial tiles
    scrambleN(n) {
      const targets = [];
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          const t = this.tiles[r][c];
          if (t.type !== TYPE.EMPTY && t.type !== TYPE.CROSS) {
            targets.push(t);
          }
        }
      }
      // Shuffle and pick n
      for (let i = targets.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [targets[i], targets[j]] = [targets[j], targets[i]];
      }
      const count = Math.min(n, targets.length);
      for (let i = 0; i < count; i++) {
        const rotations = 1 + Math.floor(Math.random() * 3);
        for (let j = 0; j < rotations; j++) targets[i].rotate();
      }
      this.updatePowered();
    }

    _buildPath() {
      let col = Math.floor(Math.random() * GRID_SIZE);
      let row = 0;
      const path = [{ r: row, c: col }];
      const vis = new Set();
      vis.add(row * GRID_SIZE + col);
      let hRun = 0;

      while (row < GRID_SIZE - 1) {
        const opts = [];
        if (!vis.has((row + 1) * GRID_SIZE + col))
          opts.push({ r: row + 1, c: col, w: 5 });
        if (col > 0 && !vis.has(row * GRID_SIZE + col - 1) && hRun < 2)
          opts.push({ r: row, c: col - 1, w: 2 });
        if (col < GRID_SIZE - 1 && !vis.has(row * GRID_SIZE + col + 1) && hRun < 2)
          opts.push({ r: row, c: col + 1, w: 2 });

        if (opts.length === 0) {
          row++;
          if (row < GRID_SIZE) {
            path.push({ r: row, c: col });
            vis.add(row * GRID_SIZE + col);
          }
          hRun = 0;
          continue;
        }

        const tw = opts.reduce((s, o) => s + o.w, 0);
        let rnd = Math.random() * tw;
        let pick = opts[0];
        for (const o of opts) {
          rnd -= o.w;
          if (rnd <= 0) { pick = o; break; }
        }

        const prevR = row;
        row = pick.r;
        col = pick.c;
        hRun = row === prevR ? hRun + 1 : 0;
        path.push({ r: row, c: col });
        vis.add(row * GRID_SIZE + col);
      }

      for (let i = 0; i < path.length; i++) {
        const { r, c } = path[i];
        const conns = [];

        if (i === 0) {
          conns.push(DIR.TOP);
        } else {
          const p = path[i - 1];
          if (p.r < r) conns.push(DIR.TOP);
          if (p.r > r) conns.push(DIR.BOTTOM);
          if (p.c < c) conns.push(DIR.LEFT);
          if (p.c > c) conns.push(DIR.RIGHT);
        }

        if (i === path.length - 1) {
          conns.push(DIR.BOTTOM);
        } else {
          const n = path[i + 1];
          if (n.r < r) conns.push(DIR.TOP);
          if (n.r > r) conns.push(DIR.BOTTOM);
          if (n.c < c) conns.push(DIR.LEFT);
          if (n.c > c) conns.push(DIR.RIGHT);
        }

        this.tiles[r][c] = this._matchTile(conns);
      }
    }

    _matchTile(needed) {
      const u = [...new Set(needed)];
      for (const type of [TYPE.STRAIGHT, TYPE.CORNER, TYPE.TEE, TYPE.CROSS, TYPE.DEAD_END]) {
        const b = BASE[type];
        if (b.length !== u.length) continue;
        for (let rot = 0; rot < 4; rot++) {
          const rotated = b.map((d) => (d + rot) % 4);
          if (u.every((d) => rotated.includes(d)) && rotated.every((d) => u.includes(d))) {
            return new Tile(type, rot);
          }
        }
      }
      return new Tile(TYPE.CROSS, 0);
    }

    _fill() {
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          if (this.tiles[r][c].type !== TYPE.EMPTY) continue;
          let rnd = Math.random() * W_TOTAL;
          let type = TYPE.STRAIGHT;
          for (const [t, w] of WEIGHTS) {
            rnd -= w;
            if (rnd <= 0) { type = t; break; }
          }
          this.tiles[r][c] = new Tile(type, Math.floor(Math.random() * 4));
        }
      }
    }

    _scramble() {
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          const t = this.tiles[r][c];
          if (t.type === TYPE.EMPTY || t.type === TYPE.CROSS) continue;
          const n = 1 + Math.floor(Math.random() * 3);
          for (let i = 0; i < n; i++) t.rotate();
        }
      }
    }

    updatePowered() {
      this.poweredSet = new Set();
      this.complete = false;

      const queue = [];
      for (let c = 0; c < GRID_SIZE; c++) {
        if (this.tiles[0][c].has(DIR.TOP)) {
          this.poweredSet.add(c);
          queue.push({ r: 0, c: c });
        }
      }

      while (queue.length > 0) {
        const cur = queue.shift();
        const tile = this.tiles[cur.r][cur.c];
        for (const dir of tile.connections()) {
          const nr = cur.r + D_ROW[dir];
          const nc = cur.c + D_COL[dir];
          if (nr < 0 || nr >= GRID_SIZE || nc < 0 || nc >= GRID_SIZE) continue;
          const key = nr * GRID_SIZE + nc;
          if (this.poweredSet.has(key)) continue;
          if (this.tiles[nr][nc].has(OPPOSITE[dir])) {
            this.poweredSet.add(key);
            queue.push({ r: nr, c: nc });
          }
        }
      }

      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          this.tiles[r][c].powered = this.poweredSet.has(r * GRID_SIZE + c);
        }
      }

      for (let c = 0; c < GRID_SIZE; c++) {
        if (
          this.poweredSet.has((GRID_SIZE - 1) * GRID_SIZE + c) &&
          this.tiles[GRID_SIZE - 1][c].has(DIR.BOTTOM)
        ) {
          this.complete = true;
          break;
        }
      }
    }

    // Save/restore for AI lookahead
    saveRots() {
      return this.tiles.map((row) => row.map((t) => t.rotation));
    }
    restoreRots(saved) {
      for (let r = 0; r < GRID_SIZE; r++)
        for (let c = 0; c < GRID_SIZE; c++)
          this.tiles[r][c].rotation = saved[r][c];
      this.updatePowered();
    }
  }

  // ============================================================
  // AI (simple: find best single rotation each tick)
  // ============================================================

  class AI {
    findBestMove(grid) {
      const curScore = grid.poweredSet.size;
      let best = { score: -1, row: -1, col: -1 };

      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          const tile = grid.tiles[r][c];
          if (tile.type === TYPE.EMPTY || tile.type === TYPE.CROSS) continue;

          const orig = tile.rotation;
          for (let n = 1; n <= 3; n++) {
            tile.rotation = (orig + n) % 4;
            grid.updatePowered();
            let score = grid.poweredSet.size;
            if (grid.complete) score += 50;
            if (score > best.score) {
              best = { score, row: r, col: c };
            }
          }
          tile.rotation = orig;
        }
      }
      grid.updatePowered();

      // Only move if it improves things
      return best.score > curScore ? best : null;
    }
  }

  // ============================================================
  // RENDERER
  // ============================================================

  class Renderer {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.particles = [];
      this.shakeEnd = 0;
      this.flashTiles = []; // {row, col, start, color}
      this.tileSize = 0;
      this.boardX = 0;
      this.boardY = 0;
      this.w = 0;
      this.h = 0;
    }

    resize() {
      const dpr = window.devicePixelRatio || 1;
      const maxW = Math.min(window.innerWidth - 16, 420);

      this.tileSize = Math.floor(maxW / GRID_SIZE);
      const boardW = this.tileSize * GRID_SIZE;

      const sourceH = 24;
      const batteryH = 24;

      this.w = maxW;
      this.h = sourceH + boardW + batteryH;

      this.canvas.width = this.w * dpr;
      this.canvas.height = this.h * dpr;
      this.canvas.style.width = this.w + 'px';
      this.canvas.style.height = this.h + 'px';
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      this.boardX = (maxW - boardW) / 2;
      this.sourceY = 0;
      this.boardY = sourceH;
      this.batteryY = sourceH + boardW;
    }

    getTileAt(x, y) {
      const r = Math.floor((y - this.boardY) / this.tileSize);
      const c = Math.floor((x - this.boardX) / this.tileSize);
      if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
        return { row: r, col: c };
      }
      return null;
    }

    shake(ms) {
      this.shakeEnd = performance.now() + ms;
    }

    flash(row, col, color) {
      this.flashTiles.push({ row, col, start: performance.now(), color });
    }

    draw(grid) {
      const ctx = this.ctx;
      const now = performance.now();

      // Shake offset
      let sx = 0, sy = 0;
      if (now < this.shakeEnd) {
        sx = (Math.random() - 0.5) * 6;
        sy = (Math.random() - 0.5) * 6;
      }

      ctx.save();
      ctx.translate(sx, sy);

      // Clear
      ctx.fillStyle = '#0a0a1a';
      ctx.fillRect(-10, -10, this.w + 20, this.h + 20);

      // Source indicators
      this._drawEdgeIndicators(ctx, grid, this.boardX, this.sourceY, true);

      // Board background
      const bw = this.tileSize * GRID_SIZE;
      ctx.fillStyle = '#0c0c20';
      ctx.fillRect(this.boardX - 1, this.boardY - 1, bw + 2, bw + 2);

      // Tiles
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          const tile = grid.tiles[r][c];
          const x = this.boardX + c * this.tileSize;
          const y = this.boardY + r * this.tileSize;

          // Flash check
          const fl = this.flashTiles.find((f) => f.row === r && f.col === c);
          const flProg = fl ? (now - fl.start) / 350 : 2;

          this._drawTile(ctx, tile, x, y, this.tileSize, flProg < 1 ? fl.color : null, flProg);
        }
      }

      // Battery indicators
      this._drawEdgeIndicators(ctx, grid, this.boardX, this.batteryY, false);

      // Particles
      this._drawParticles(ctx, grid, now);

      // Clean old flashes
      this.flashTiles = this.flashTiles.filter((f) => now - f.start < 350);

      ctx.restore();
    }

    _drawEdgeIndicators(ctx, grid, bx, y, isTop) {
      const tw = this.tileSize;
      const dir = isTop ? DIR.TOP : DIR.BOTTOM;
      const row = isTop ? 0 : GRID_SIZE - 1;
      const dotY = isTop ? y + 16 : y + 4;

      for (let c = 0; c < GRID_SIZE; c++) {
        const tile = grid.tiles[row][c];
        if (tile.has(dir)) {
          const active = isTop ? tile.powered : (tile.powered && grid.complete);
          ctx.fillStyle = active ? '#00e5ff' : '#2a2a4a';
          const cx = bx + c * tw + tw / 2;
          ctx.beginPath();
          ctx.arc(cx, dotY, 3, 0, Math.PI * 2);
          ctx.fill();

          // Small line connecting to board edge
          if (active) {
            ctx.strokeStyle = '#00e5ff';
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            ctx.moveTo(cx, dotY);
            ctx.lineTo(cx, isTop ? y + 24 : y);
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
        }
      }

      // Label
      ctx.fillStyle = grid.complete ? '#00e5ff' : '#333';
      ctx.font = 'bold 10px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const label = isTop ? 'POWER SOURCE' : (grid.complete ? 'CONNECTED!' : 'BATTERY');
      ctx.fillText(label, bx + (tw * GRID_SIZE) / 2, isTop ? y + 7 : y + 14);
    }

    _drawTile(ctx, tile, x, y, size, flashColor, flashProg) {
      const pad = 1;

      // Background
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(x + pad, y + pad, size - pad * 2, size - pad * 2);

      // Flash overlay
      if (flashColor && flashProg < 1) {
        ctx.globalAlpha = 0.5 * (1 - flashProg);
        ctx.fillStyle = flashColor;
        ctx.fillRect(x + pad, y + pad, size - pad * 2, size - pad * 2);
        ctx.globalAlpha = 1;
      }

      // Border
      ctx.strokeStyle = '#2a2a4a';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(x + pad, y + pad, size - pad * 2, size - pad * 2);

      if (tile.type === TYPE.EMPTY) return;

      const cx = x + size / 2;
      const cy = y + size / 2;
      const conns = tile.connections();

      // Colors
      const pipeColor = tile.powered ? '#00ffcc' : '#1a5a6a';
      const pw = size * 0.22;

      // Glow
      if (tile.powered) {
        ctx.shadowColor = '#00e5ff';
        ctx.shadowBlur = 8;
      }

      ctx.strokeStyle = pipeColor;
      ctx.lineWidth = pw;
      ctx.lineCap = 'round';

      for (const dir of conns) {
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        switch (dir) {
          case 0: ctx.lineTo(cx, y + pad); break;
          case 1: ctx.lineTo(x + size - pad, cy); break;
          case 2: ctx.lineTo(cx, y + size - pad); break;
          case 3: ctx.lineTo(x + pad, cy); break;
        }
        ctx.stroke();
      }

      // Center node
      ctx.fillStyle = pipeColor;
      ctx.beginPath();
      ctx.arc(cx, cy, pw * 0.55, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
    }

    _drawParticles(ctx, grid, now) {
      // Spawn on powered tiles
      if (grid.complete && Math.random() < 0.5) {
        const powered = [];
        for (let r = 0; r < GRID_SIZE; r++)
          for (let c = 0; c < GRID_SIZE; c++)
            if (grid.tiles[r][c].powered) powered.push({ r, c });
        if (powered.length > 0) {
          const cell = powered[Math.floor(Math.random() * powered.length)];
          this.particles.push({
            x: this.boardX + cell.c * this.tileSize + this.tileSize / 2 + (Math.random() - 0.5) * this.tileSize * 0.3,
            y: this.boardY + cell.r * this.tileSize + this.tileSize / 2,
            vx: (Math.random() - 0.5) * 0.4,
            vy: 0.4 + Math.random() * 1,
            life: 1,
          });
        }
      }

      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.life -= 0.02;
        p.x += p.vx;
        p.y += p.vy;
        if (p.life <= 0) {
          this.particles.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = p.life * 0.7;
        ctx.fillStyle = '#00e5ff';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      if (this.particles.length > 80) {
        this.particles.splice(0, this.particles.length - 80);
      }
    }
  }

  // ============================================================
  // GAME
  // ============================================================

  class Game {
    constructor() {
      this.canvas = document.getElementById('game-canvas');
      this.renderer = new Renderer(this.canvas);
      this.ai = new AI();

      this.playerGrid = new Grid();
      this.aiGrid = new Grid();

      this.difficulty = 'medium';
      this.scorePlayer = 0;
      this.scoreAI = 0;
      this.round = 1;
      this.roundActive = false;
      this.gameOver = false;

      this.aiTimer = 0;
      this.lastFrame = 0;
      this.animId = null;

      this._bind();
    }

    // ---- Input ----

    _bind() {
      // Canvas tap
      const tap = (e) => {
        e.preventDefault();
        if (!this.roundActive) return;

        const rect = this.canvas.getBoundingClientRect();
        const sx = this.renderer.w / rect.width;
        const sy = this.renderer.h / rect.height;

        let cx, cy;
        if (e.touches && e.touches.length > 0) {
          cx = e.touches[0].clientX;
          cy = e.touches[0].clientY;
        } else if (e.changedTouches && e.changedTouches.length > 0) {
          cx = e.changedTouches[0].clientX;
          cy = e.changedTouches[0].clientY;
        } else {
          cx = e.clientX;
          cy = e.clientY;
        }

        const x = (cx - rect.left) * sx;
        const y = (cy - rect.top) * sy;
        const hit = this.renderer.getTileAt(x, y);
        if (!hit) return;

        const tile = this.playerGrid.tiles[hit.row][hit.col];
        if (tile.type === TYPE.EMPTY) return;

        tile.rotate();
        this.playerGrid.updatePowered();
        this.renderer.flash(hit.row, hit.col, 'rgba(0,229,255,0.3)');
        this._updateProgress();

        if (this.playerGrid.complete) {
          this._roundWin('player');
        }
      };

      this.canvas.addEventListener('touchstart', tap, { passive: false });
      this.canvas.addEventListener('click', tap);
      this.canvas.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });

      // Difficulty buttons
      document.querySelectorAll('.diff-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.diff-btn').forEach((b) => b.classList.remove('selected'));
          btn.classList.add('selected');
          this.difficulty = btn.dataset.diff;
        });
      });

      // Start / restart
      document.getElementById('btn-start').addEventListener('click', () => this.startMatch());
      document.getElementById('btn-restart').addEventListener('click', () => this.startMatch());

      // Resize
      window.addEventListener('resize', () => {
        if (!this.gameOver) this.renderer.resize();
      });
    }

    // ---- Match flow ----

    startMatch() {
      this.scorePlayer = 0;
      this.scoreAI = 0;
      this.round = 1;
      this.gameOver = false;

      this._showScreen('screen-game');
      this.renderer.resize();
      this._startRound();
    }

    _startRound() {
      this.playerGrid.generate();
      this.aiGrid.generate();
      this.roundActive = true;
      this.aiTimer = 0;
      this.renderer.particles = [];
      this.renderer.flashTiles = [];

      this._updateUI();
      this._updateProgress();

      this.lastFrame = performance.now();
      if (this.animId) cancelAnimationFrame(this.animId);
      this._loop();

      document.getElementById('status-text').textContent = 'Tap tiles to rotate!';
    }

    _roundWin(winner) {
      this.roundActive = false;

      if (winner === 'player') {
        this.scorePlayer++;
        // Penalty: scramble loser's board next round (stored as flag)
        this._showRoundOverlay('ROUND WON!', 'You completed your circuit first.');
      } else {
        this.scoreAI++;
        this.renderer.shake(400);
        this._showRoundOverlay('ROUND LOST', 'The AI completed its circuit first.');
      }

      this._updateUI();

      // Check match over
      setTimeout(() => {
        this._hideRoundOverlay();

        if (this.scorePlayer >= ROUNDS_TO_WIN) {
          this._endMatch(true);
        } else if (this.scoreAI >= ROUNDS_TO_WIN) {
          this._endMatch(false);
        } else {
          this.round++;
          this._startRound();

          // Apply scramble penalty to loser of previous round
          if (winner === 'player') {
            this.aiGrid.scrambleN(SCRAMBLE_PENALTY);
          } else {
            this.playerGrid.scrambleN(SCRAMBLE_PENALTY);
            // Flash the scrambled tiles red
            for (let r = 0; r < GRID_SIZE; r++)
              for (let c = 0; c < GRID_SIZE; c++)
                this.renderer.flash(r, c, 'rgba(255,0,68,0.25)');
            this.renderer.shake(300);
          }
          this._updateProgress();
        }
      }, 1800);
    }

    _endMatch(playerWon) {
      this.gameOver = true;
      this.roundActive = false;

      const el = document.getElementById('result-text');
      el.textContent = playerWon ? 'VICTORY!' : 'DEFEAT';
      el.style.color = playerWon ? '#00e5ff' : '#ff4444';

      document.getElementById('result-detail').textContent = playerWon
        ? 'You won the match!'
        : 'The AI won the match.';
      document.getElementById('result-stats').innerHTML =
        '<span>Final score: ' + this.scorePlayer + ' - ' + this.scoreAI + '</span>' +
        '<span>Rounds played: ' + (this.round) + '</span>';

      setTimeout(() => this._showScreen('screen-gameover'), 400);
    }

    // ---- Game loop ----

    _loop() {
      const now = performance.now();
      const dt = Math.min(now - this.lastFrame, 100);
      this.lastFrame = now;

      if (this.gameOver) return;

      // AI tick
      if (this.roundActive) {
        this.aiTimer += dt;
        const interval = AI_SPEED[this.difficulty] || 1500;
        if (this.aiTimer >= interval) {
          this.aiTimer -= interval;
          this._aiMove();
        }
      }

      // Render player board
      this.renderer.draw(this.playerGrid);

      this.animId = requestAnimationFrame(() => this._loop());
    }

    _aiMove() {
      if (!this.roundActive || this.aiGrid.complete) return;

      const move = this.ai.findBestMove(this.aiGrid);
      if (move) {
        this.aiGrid.tiles[move.row][move.col].rotate();
        this.aiGrid.updatePowered();
      } else {
        // No improving move — random rotation
        const candidates = [];
        for (let r = 0; r < GRID_SIZE; r++)
          for (let c = 0; c < GRID_SIZE; c++) {
            const t = this.aiGrid.tiles[r][c];
            if (t.type !== TYPE.EMPTY && t.type !== TYPE.CROSS) candidates.push({ r, c });
          }
        if (candidates.length > 0) {
          const pick = candidates[Math.floor(Math.random() * candidates.length)];
          this.aiGrid.tiles[pick.r][pick.c].rotate();
          this.aiGrid.updatePowered();
        }
      }

      this._updateProgress();

      if (this.aiGrid.complete) {
        this._roundWin('ai');
      }
    }

    // ---- UI updates ----

    _updateUI() {
      document.getElementById('score-player').textContent = this.scorePlayer;
      document.getElementById('score-ai').textContent = this.scoreAI;
      document.getElementById('round-display').textContent = 'Round ' + this.round;
    }

    _updateProgress() {
      const pp = Math.round(this.playerGrid.progress() * 100);
      const ap = Math.round(this.aiGrid.progress() * 100);
      document.getElementById('progress-player').style.width = (this.playerGrid.complete ? 100 : pp) + '%';
      document.getElementById('progress-ai').style.width = (this.aiGrid.complete ? 100 : ap) + '%';
    }

    _showRoundOverlay(title, detail) {
      const overlay = document.getElementById('round-overlay');
      document.getElementById('round-result-text').textContent = title;
      document.getElementById('round-result-text').style.color =
        title.includes('WON') ? '#00e5ff' : '#ff4444';
      document.getElementById('round-result-detail').textContent = detail;
      overlay.classList.remove('hidden');
    }

    _hideRoundOverlay() {
      document.getElementById('round-overlay').classList.add('hidden');
    }

    _showScreen(id) {
      document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
      document.getElementById(id).classList.add('active');
    }
  }

  // ============================================================
  // INIT
  // ============================================================

  window.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
  });
})();
