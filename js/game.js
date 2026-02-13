// ================================================================
// CIRCUIT WARS - A Connectivity & Sabotage Strategy Game
// ================================================================

(function () {
  'use strict';

  // ============================================================
  // CONSTANTS
  // ============================================================

  const GRID_SIZE = 5;
  const INITIAL_AP = 3;
  const ROTATE_COST = 1;
  const SABOTAGE_COST = 2;
  const POWER_START = 50;
  const POWER_MAX = 100;
  const POWER_MIN = 0;
  const POWER_PER_CIRCUIT = 8;
  const TURN_TIME = 20;
  const AI_ACTION_DELAY = 500;

  // Directions: TOP=0, RIGHT=1, BOTTOM=2, LEFT=3
  const DIR = { TOP: 0, RIGHT: 1, BOTTOM: 2, LEFT: 3 };
  const OPPOSITE = [2, 3, 0, 1];
  const D_ROW = [-1, 0, 1, 0];
  const D_COL = [0, 1, 0, -1];

  // Tile types and their base connections (before rotation)
  const TYPES = {
    STRAIGHT: 'straight',
    CORNER: 'corner',
    TEE: 'tee',
    CROSS: 'cross',
    DEAD_END: 'dead_end',
    EMPTY: 'empty',
  };

  const BASE_CONN = {
    straight: [DIR.TOP, DIR.BOTTOM],
    corner: [DIR.TOP, DIR.RIGHT],
    tee: [DIR.TOP, DIR.RIGHT, DIR.BOTTOM],
    cross: [DIR.TOP, DIR.RIGHT, DIR.BOTTOM, DIR.LEFT],
    dead_end: [DIR.TOP],
    empty: [],
  };

  // Weights for random tile generation (non-path cells)
  const RANDOM_WEIGHTS = [
    { type: TYPES.STRAIGHT, weight: 30 },
    { type: TYPES.CORNER, weight: 30 },
    { type: TYPES.TEE, weight: 15 },
    { type: TYPES.CROSS, weight: 3 },
    { type: TYPES.DEAD_END, weight: 12 },
    { type: TYPES.EMPTY, weight: 10 },
  ];
  const TOTAL_WEIGHT = RANDOM_WEIGHTS.reduce((s, w) => s + w.weight, 0);

  // ============================================================
  // TILE
  // ============================================================

  class Tile {
    constructor(type, rotation) {
      this.type = type;
      this.rotation = rotation || 0;
      this.powered = false;
    }

    getConnections() {
      const base = BASE_CONN[this.type];
      return base.map((d) => (d + this.rotation) % 4);
    }

    hasConnection(dir) {
      return this.getConnections().indexOf(dir) !== -1;
    }

    rotate() {
      this.rotation = (this.rotation + 1) % 4;
    }
  }

  // ============================================================
  // GRID (board with path generation + pathfinding)
  // ============================================================

  class Grid {
    constructor() {
      this.tiles = [];
      this.poweredSet = new Set();
      this.circuitComplete = false;
    }

    generate() {
      // Init empty grid
      this.tiles = [];
      for (let r = 0; r < GRID_SIZE; r++) {
        this.tiles[r] = [];
        for (let c = 0; c < GRID_SIZE; c++) {
          this.tiles[r][c] = new Tile(TYPES.EMPTY, 0);
        }
      }

      // Build a guaranteed path from top to bottom
      this._buildPath();

      // Fill remaining cells with random tiles
      this._fillRandom();

      // Scramble all tile rotations
      this._scramble();

      // Compute initial power state
      this.updatePowered();
    }

    // Generate a random walk from row 0 to row GRID_SIZE-1
    _buildPath() {
      let col = Math.floor(Math.random() * GRID_SIZE);
      let row = 0;
      const path = [{ r: row, c: col }];
      const visited = new Set();
      visited.add(row * GRID_SIZE + col);

      let hStreak = 0;

      while (row < GRID_SIZE - 1) {
        const opts = [];

        // Prefer going down
        if (!visited.has((row + 1) * GRID_SIZE + col)) {
          opts.push({ r: row + 1, c: col, w: 5 });
        }
        // Left
        if (col > 0 && !visited.has(row * GRID_SIZE + col - 1) && hStreak < 2) {
          opts.push({ r: row, c: col - 1, w: 2 });
        }
        // Right
        if (col < GRID_SIZE - 1 && !visited.has(row * GRID_SIZE + col + 1) && hStreak < 2) {
          opts.push({ r: row, c: col + 1, w: 2 });
        }

        if (opts.length === 0) {
          // Stuck — force down
          row++;
          if (row < GRID_SIZE) {
            path.push({ r: row, c: col });
            visited.add(row * GRID_SIZE + col);
          }
          hStreak = 0;
          continue;
        }

        const tw = opts.reduce((s, o) => s + o.w, 0);
        let rand = Math.random() * tw;
        let chosen = opts[0];
        for (const o of opts) {
          rand -= o.w;
          if (rand <= 0) {
            chosen = o;
            break;
          }
        }

        const prevRow = row;
        row = chosen.r;
        col = chosen.c;
        hStreak = row === prevRow ? hStreak + 1 : 0;
        path.push({ r: row, c: col });
        visited.add(row * GRID_SIZE + col);
      }

      // Place correct tiles along path
      for (let i = 0; i < path.length; i++) {
        const { r, c } = path[i];
        const conns = [];

        if (i === 0) {
          conns.push(DIR.TOP); // connects to power source
        } else {
          const prev = path[i - 1];
          if (prev.r < r) conns.push(DIR.TOP);
          if (prev.r > r) conns.push(DIR.BOTTOM);
          if (prev.c < c) conns.push(DIR.LEFT);
          if (prev.c > c) conns.push(DIR.RIGHT);
        }

        if (i === path.length - 1) {
          conns.push(DIR.BOTTOM); // connects to battery
        } else {
          const next = path[i + 1];
          if (next.r < r) conns.push(DIR.TOP);
          if (next.r > r) conns.push(DIR.BOTTOM);
          if (next.c < c) conns.push(DIR.LEFT);
          if (next.c > c) conns.push(DIR.RIGHT);
        }

        this.tiles[r][c] = this._tileForConnections(conns);
      }
    }

    _tileForConnections(needed) {
      const unique = [...new Set(needed)];
      const typeList = [TYPES.STRAIGHT, TYPES.CORNER, TYPES.TEE, TYPES.CROSS, TYPES.DEAD_END];
      for (const type of typeList) {
        const base = BASE_CONN[type];
        if (base.length !== unique.length) continue;
        for (let rot = 0; rot < 4; rot++) {
          const rotated = base.map((d) => (d + rot) % 4);
          if (
            unique.every((d) => rotated.indexOf(d) !== -1) &&
            rotated.every((d) => unique.indexOf(d) !== -1)
          ) {
            return new Tile(type, rot);
          }
        }
      }
      return new Tile(TYPES.CROSS, 0);
    }

    _fillRandom() {
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          if (this.tiles[r][c].type !== TYPES.EMPTY) continue;

          let rand = Math.random() * TOTAL_WEIGHT;
          let type = TYPES.STRAIGHT;
          for (const w of RANDOM_WEIGHTS) {
            rand -= w.weight;
            if (rand <= 0) {
              type = w.type;
              break;
            }
          }
          this.tiles[r][c] = new Tile(type, Math.floor(Math.random() * 4));
        }
      }
    }

    _scramble() {
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          const tile = this.tiles[r][c];
          if (tile.type === TYPES.EMPTY || tile.type === TYPES.CROSS) continue;
          // Rotate 1-3 times so it's never already solved
          const n = 1 + Math.floor(Math.random() * 3);
          for (let i = 0; i < n; i++) tile.rotate();
        }
      }
    }

    // BFS from power source (top edge) to find all powered tiles
    updatePowered() {
      this.poweredSet = new Set();
      this.circuitComplete = false;

      const queue = [];
      for (let c = 0; c < GRID_SIZE; c++) {
        if (this.tiles[0][c].hasConnection(DIR.TOP)) {
          const key = c; // row 0
          this.poweredSet.add(key);
          queue.push({ r: 0, c: c });
        }
      }

      while (queue.length > 0) {
        const cur = queue.shift();
        const tile = this.tiles[cur.r][cur.c];

        for (const dir of tile.getConnections()) {
          const nr = cur.r + D_ROW[dir];
          const nc = cur.c + D_COL[dir];
          if (nr < 0 || nr >= GRID_SIZE || nc < 0 || nc >= GRID_SIZE) continue;

          const key = nr * GRID_SIZE + nc;
          if (this.poweredSet.has(key)) continue;

          const neighbor = this.tiles[nr][nc];
          if (neighbor.hasConnection(OPPOSITE[dir])) {
            this.poweredSet.add(key);
            queue.push({ r: nr, c: nc });
          }
        }
      }

      // Update tile powered states & check circuit
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          this.tiles[r][c].powered = this.poweredSet.has(r * GRID_SIZE + c);
        }
      }

      for (let c = 0; c < GRID_SIZE; c++) {
        if (
          this.poweredSet.has((GRID_SIZE - 1) * GRID_SIZE + c) &&
          this.tiles[GRID_SIZE - 1][c].hasConnection(DIR.BOTTOM)
        ) {
          this.circuitComplete = true;
          break;
        }
      }
    }

    // Save/restore for AI planning
    saveRotations() {
      const saved = [];
      for (let r = 0; r < GRID_SIZE; r++) {
        saved[r] = [];
        for (let c = 0; c < GRID_SIZE; c++) {
          saved[r][c] = this.tiles[r][c].rotation;
        }
      }
      return saved;
    }

    restoreRotations(saved) {
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          this.tiles[r][c].rotation = saved[r][c];
        }
      }
      this.updatePowered();
    }
  }

  // ============================================================
  // AI OPPONENT
  // ============================================================

  class AI {
    takeTurn(ownGrid, opponentGrid, ap) {
      const actions = [];
      let remaining = ap;

      // Save state for planning
      const ownSaved = ownGrid.saveRotations();
      const oppSaved = opponentGrid.saveRotations();

      const ownComplete = ownGrid.circuitComplete;
      const oppComplete = opponentGrid.circuitComplete;

      while (remaining > 0) {
        // Strategy decisions
        if (ownComplete && remaining >= SABOTAGE_COST) {
          // Own circuit done — focus on breaking opponent
          const t = this._findSabotageTarget(opponentGrid);
          if (t) {
            actions.push({ type: 'sabotage', row: t.row, col: t.col });
            opponentGrid.tiles[t.row][t.col].rotate();
            opponentGrid.updatePowered();
            remaining -= SABOTAGE_COST;
            continue;
          }
        }

        if (oppComplete && remaining >= SABOTAGE_COST && Math.random() < 0.65) {
          // Opponent has circuit — high priority sabotage
          const t = this._findSabotageTarget(opponentGrid);
          if (t) {
            actions.push({ type: 'sabotage', row: t.row, col: t.col });
            opponentGrid.tiles[t.row][t.col].rotate();
            opponentGrid.updatePowered();
            remaining -= SABOTAGE_COST;
            continue;
          }
        }

        if (remaining >= ROTATE_COST) {
          const move = this._findBestRotation(ownGrid);
          if (move) {
            actions.push({ type: 'rotate', row: move.row, col: move.col });
            ownGrid.tiles[move.row][move.col].rotate();
            ownGrid.updatePowered();
            remaining -= ROTATE_COST;
            continue;
          }
        }

        // Fallback sabotage if nothing else to do
        if (remaining >= SABOTAGE_COST) {
          const t = this._findSabotageTarget(opponentGrid);
          if (t) {
            actions.push({ type: 'sabotage', row: t.row, col: t.col });
            opponentGrid.tiles[t.row][t.col].rotate();
            opponentGrid.updatePowered();
            remaining -= SABOTAGE_COST;
            continue;
          }
        }

        break;
      }

      // Restore grids (actions will be replayed with animation)
      ownGrid.restoreRotations(ownSaved);
      opponentGrid.restoreRotations(oppSaved);

      return actions;
    }

    _findBestRotation(grid) {
      const currentScore = grid.poweredSet.size;
      let bestScore = -Infinity;
      let bestMove = null;

      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          const tile = grid.tiles[r][c];
          if (tile.type === TYPES.EMPTY || tile.type === TYPES.CROSS) continue;

          const origRot = tile.rotation;
          for (let n = 1; n <= 3; n++) {
            tile.rotation = (origRot + n) % 4;
            grid.updatePowered();

            let score = grid.poweredSet.size;
            if (grid.circuitComplete) score += 50;

            if (score > bestScore) {
              bestScore = score;
              bestMove = { row: r, col: c, rotations: n };
            }
          }
          tile.rotation = origRot;
        }
      }
      grid.updatePowered();

      if (bestScore <= currentScore) return null;

      // Return move that only does 1 rotation (the game rotates once per action)
      // But pick the tile where 1 rotation gives the best improvement
      let bestSingleScore = -Infinity;
      let bestSingle = null;

      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          const tile = grid.tiles[r][c];
          if (tile.type === TYPES.EMPTY || tile.type === TYPES.CROSS) continue;

          const origRot = tile.rotation;
          tile.rotation = (origRot + 1) % 4;
          grid.updatePowered();

          let score = grid.poweredSet.size;
          if (grid.circuitComplete) score += 50;

          if (score > bestSingleScore) {
            bestSingleScore = score;
            bestSingle = { row: r, col: c };
          }

          tile.rotation = origRot;
        }
      }
      grid.updatePowered();

      return bestSingleScore > currentScore ? bestSingle : bestMove ? { row: bestMove.row, col: bestMove.col } : null;
    }

    _findSabotageTarget(opponentGrid) {
      const powered = [];
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          const tile = opponentGrid.tiles[r][c];
          if (tile.powered && tile.type !== TYPES.CROSS && tile.type !== TYPES.EMPTY) {
            powered.push({ row: r, col: c });
          }
        }
      }

      if (powered.length === 0) {
        // No powered tiles, pick a random non-trivial tile
        const all = [];
        for (let r = 0; r < GRID_SIZE; r++) {
          for (let c = 0; c < GRID_SIZE; c++) {
            const tile = opponentGrid.tiles[r][c];
            if (tile.type !== TYPES.CROSS && tile.type !== TYPES.EMPTY) {
              all.push({ row: r, col: c });
            }
          }
        }
        if (all.length === 0) return null;
        return all[Math.floor(Math.random() * all.length)];
      }

      // Pick the powered tile whose rotation causes the most damage
      let bestDamage = -1;
      let bestTarget = powered[0];

      for (const p of powered) {
        const tile = opponentGrid.tiles[p.row][p.col];
        const origRot = tile.rotation;
        tile.rotation = (origRot + 1) % 4;
        opponentGrid.updatePowered();
        const newPowered = opponentGrid.poweredSet.size;
        const damage = powered.length - newPowered;
        if (damage > bestDamage) {
          bestDamage = damage;
          bestTarget = p;
        }
        tile.rotation = origRot;
      }
      opponentGrid.updatePowered();

      return bestTarget;
    }
  }

  // ============================================================
  // RENDERER (Canvas)
  // ============================================================

  class Renderer {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.particles = [];
      this.shakeEnd = 0;
      this.shakeX = 0;
      this.shakeY = 0;
      this.rotationAnims = []; // { grid, row, col, startTime, duration }
      this.flashTiles = []; // { grid, row, col, startTime, color }

      // Layout values (set by resize)
      this.playerTileSize = 0;
      this.opponentTileSize = 0;
      this.playerBoardX = 0;
      this.playerBoardY = 0;
      this.opponentBoardX = 0;
      this.opponentBoardY = 0;
      this.logicalWidth = 0;
      this.logicalHeight = 0;
    }

    resize() {
      const dpr = window.devicePixelRatio || 1;
      const maxWidth = Math.min(window.innerWidth - 16, 420);

      this.playerTileSize = Math.floor(maxWidth / GRID_SIZE);
      this.opponentTileSize = Math.floor(this.playerTileSize * 0.56);

      const playerBoardW = this.playerTileSize * GRID_SIZE;
      const opponentBoardW = this.opponentTileSize * GRID_SIZE;

      const sourceH = 22;
      const batteryH = 18;
      const labelH = 16;
      const gapH = 6;

      const totalH =
        sourceH +
        this.opponentTileSize * GRID_SIZE +
        batteryH +
        gapH +
        labelH +
        sourceH +
        this.playerTileSize * GRID_SIZE +
        batteryH;

      this.logicalWidth = maxWidth;
      this.logicalHeight = totalH;

      this.canvas.width = maxWidth * dpr;
      this.canvas.height = totalH * dpr;
      this.canvas.style.width = maxWidth + 'px';
      this.canvas.style.height = totalH + 'px';
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Layout positions
      let y = 0;
      this.oppSourceY = y;
      y += sourceH;
      this.opponentBoardX = (maxWidth - opponentBoardW) / 2;
      this.opponentBoardY = y;
      y += this.opponentTileSize * GRID_SIZE;
      this.oppBatteryY = y;
      y += batteryH + gapH;
      this.labelY = y;
      y += labelH;
      this.playerSourceY = y;
      y += sourceH;
      this.playerBoardX = (maxWidth - playerBoardW) / 2;
      this.playerBoardY = y;
      y += this.playerTileSize * GRID_SIZE;
      this.playerBatteryY = y;
    }

    getTileAt(x, y) {
      // Check player board
      const pr = Math.floor((y - this.playerBoardY) / this.playerTileSize);
      const pc = Math.floor((x - this.playerBoardX) / this.playerTileSize);
      if (pr >= 0 && pr < GRID_SIZE && pc >= 0 && pc < GRID_SIZE) {
        return { board: 'player', row: pr, col: pc };
      }

      // Check opponent board
      const or2 = Math.floor((y - this.opponentBoardY) / this.opponentTileSize);
      const oc = Math.floor((x - this.opponentBoardX) / this.opponentTileSize);
      if (or2 >= 0 && or2 < GRID_SIZE && oc >= 0 && oc < GRID_SIZE) {
        return { board: 'opponent', row: or2, col: oc };
      }

      return null;
    }

    shake(durationMs) {
      this.shakeEnd = performance.now() + durationMs;
    }

    addRotationAnim(gridName, row, col) {
      this.rotationAnims.push({
        grid: gridName,
        row: row,
        col: col,
        startTime: performance.now(),
        duration: 180,
      });
    }

    addFlash(gridName, row, col, color) {
      this.flashTiles.push({
        grid: gridName,
        row: row,
        col: col,
        startTime: performance.now(),
        color: color,
      });
    }

    draw(game) {
      const ctx = this.ctx;
      const now = performance.now();

      // Shake
      if (now < this.shakeEnd) {
        this.shakeX = (Math.random() - 0.5) * 8;
        this.shakeY = (Math.random() - 0.5) * 8;
      } else {
        this.shakeX = 0;
        this.shakeY = 0;
      }

      ctx.save();
      ctx.translate(this.shakeX, this.shakeY);

      // Clear
      ctx.fillStyle = '#0a0a1a';
      ctx.fillRect(-10, -10, this.logicalWidth + 20, this.logicalHeight + 20);

      // Opponent section
      this._drawLabel(ctx, 'OPPONENT', this.oppSourceY + 8, '#ff6600', 10);
      this._drawSourceBar(
        ctx,
        this.opponentBoardX,
        this.oppSourceY,
        this.opponentTileSize * GRID_SIZE,
        18,
        game.aiGrid,
        '#ff6600'
      );
      this._drawBoard(
        ctx,
        game.aiGrid,
        this.opponentBoardX,
        this.opponentBoardY,
        this.opponentTileSize,
        '#ff6600',
        '#ff8844',
        game.mode === 'sabotage' && game.isPlayerTurn,
        'ai',
        now
      );
      this._drawBatteryBar(
        ctx,
        this.opponentBoardX,
        this.oppBatteryY,
        this.opponentTileSize * GRID_SIZE,
        14,
        game.aiGrid,
        '#ff6600'
      );

      // Player section
      this._drawLabel(ctx, 'YOUR BOARD', this.labelY, '#00e5ff', 12);
      this._drawSourceBar(
        ctx,
        this.playerBoardX,
        this.playerSourceY,
        this.playerTileSize * GRID_SIZE,
        20,
        game.playerGrid,
        '#00e5ff'
      );
      this._drawBoard(
        ctx,
        game.playerGrid,
        this.playerBoardX,
        this.playerBoardY,
        this.playerTileSize,
        '#00e5ff',
        '#00ffcc',
        game.mode === 'rotate' && game.isPlayerTurn,
        'player',
        now
      );
      this._drawBatteryBar(
        ctx,
        this.playerBoardX,
        this.playerBatteryY,
        this.playerTileSize * GRID_SIZE,
        20,
        game.playerGrid,
        '#00e5ff'
      );

      // Particles
      this._updateParticles(ctx, game, now);

      // Clean up old anims
      this.rotationAnims = this.rotationAnims.filter((a) => now - a.startTime < a.duration);
      this.flashTiles = this.flashTiles.filter((f) => now - f.startTime < 400);

      ctx.restore();
    }

    _drawLabel(ctx, text, y, color, fontSize) {
      ctx.fillStyle = color;
      ctx.font = `bold ${fontSize}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(text, this.logicalWidth / 2, y);
    }

    _drawSourceBar(ctx, bx, by, bw, bh, grid, color) {
      // Power source indicator
      ctx.fillStyle = grid.circuitComplete ? color : '#222';
      ctx.font = `${Math.min(bh, 16)}px system-ui`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Connection indicators
      const tileW = bw / GRID_SIZE;
      for (let c = 0; c < GRID_SIZE; c++) {
        const tile = grid.tiles[0][c];
        const cx = bx + c * tileW + tileW / 2;
        if (tile.hasConnection(DIR.TOP)) {
          ctx.fillStyle = tile.powered ? color : '#334';
          ctx.fillRect(cx - 3, by + bh - 6, 6, 6);
        }
      }
    }

    _drawBatteryBar(ctx, bx, by, bw, bh, grid, color) {
      const tileW = bw / GRID_SIZE;
      for (let c = 0; c < GRID_SIZE; c++) {
        const tile = grid.tiles[GRID_SIZE - 1][c];
        const cx = bx + c * tileW + tileW / 2;
        if (tile.hasConnection(DIR.BOTTOM)) {
          ctx.fillStyle =
            tile.powered && grid.circuitComplete ? color : '#334';
          ctx.fillRect(cx - 3, by, 6, 6);
        }
      }

      // Battery label
      ctx.fillStyle = grid.circuitComplete ? color : '#444';
      ctx.font = `${Math.min(bh - 2, 12)}px system-ui`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        grid.circuitComplete ? 'CONNECTED' : 'BATTERY',
        bx + bw / 2,
        by + bh / 2 + 2
      );
    }

    _drawBoard(ctx, grid, bx, by, tileSize, color, poweredColor, interactive, gridName, now) {
      // Board background
      ctx.fillStyle = '#0c0c20';
      ctx.fillRect(bx - 1, by - 1, tileSize * GRID_SIZE + 2, tileSize * GRID_SIZE + 2);

      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          const x = bx + c * tileSize;
          const y = by + r * tileSize;
          const tile = grid.tiles[r][c];

          // Check for rotation animation
          const anim = this.rotationAnims.find(
            (a) => a.grid === gridName && a.row === r && a.col === c
          );
          const animProgress = anim ? Math.min(1, (now - anim.startTime) / anim.duration) : 1;

          // Check for flash
          const flash = this.flashTiles.find(
            (f) => f.grid === gridName && f.row === r && f.col === c
          );

          this._drawTile(
            ctx,
            tile,
            x,
            y,
            tileSize,
            color,
            poweredColor,
            interactive,
            animProgress,
            flash ? flash.color : null,
            flash ? (now - flash.startTime) / 400 : 0
          );
        }
      }

      // Interactive border
      if (interactive) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.5 + Math.sin(now / 400) * 0.2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(bx - 3, by - 3, tileSize * GRID_SIZE + 6, tileSize * GRID_SIZE + 6);
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
      }
    }

    _drawTile(ctx, tile, x, y, size, color, poweredColor, interactive, animProg, flashColor, flashProg) {
      const pad = 1;
      const ix = x + pad;
      const iy = y + pad;
      const is = size - pad * 2;

      // Background
      ctx.fillStyle = interactive ? '#1e1e3a' : '#16162c';
      ctx.fillRect(ix, iy, is, is);

      // Flash overlay
      if (flashColor && flashProg < 1) {
        ctx.fillStyle = flashColor;
        ctx.globalAlpha = 0.4 * (1 - flashProg);
        ctx.fillRect(ix, iy, is, is);
        ctx.globalAlpha = 1;
      }

      // Border
      ctx.strokeStyle = '#2a2a4a';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(ix, iy, is, is);

      if (tile.type === TYPES.EMPTY) return;

      const cx = x + size / 2;
      const cy = y + size / 2;
      const connections = tile.getConnections();
      const pipeColor = tile.powered ? poweredColor : color;
      const pipeWidth = size * 0.2;

      // Glow for powered
      if (tile.powered) {
        ctx.shadowColor = poweredColor;
        ctx.shadowBlur = 6;
      }

      // Rotation animation effect
      if (animProg < 1) {
        ctx.save();
        ctx.translate(cx, cy);
        const angle = (1 - animProg) * (-Math.PI / 2);
        ctx.rotate(angle);
        ctx.translate(-cx, -cy);
      }

      ctx.strokeStyle = pipeColor;
      ctx.lineWidth = pipeWidth;
      ctx.lineCap = 'round';

      for (const dir of connections) {
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        switch (dir) {
          case DIR.TOP:
            ctx.lineTo(cx, y + pad);
            break;
          case DIR.RIGHT:
            ctx.lineTo(x + size - pad, cy);
            break;
          case DIR.BOTTOM:
            ctx.lineTo(cx, y + size - pad);
            break;
          case DIR.LEFT:
            ctx.lineTo(x + pad, cy);
            break;
        }
        ctx.stroke();
      }

      // Center node
      ctx.fillStyle = pipeColor;
      ctx.beginPath();
      ctx.arc(cx, cy, pipeWidth * 0.55, 0, Math.PI * 2);
      ctx.fill();

      if (animProg < 1) {
        ctx.restore();
      }

      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
    }

    _updateParticles(ctx, game, now) {
      // Spawn particles on powered paths
      if (game.playerGrid.circuitComplete && Math.random() < 0.4) {
        this._spawnParticle(
          game.playerGrid,
          this.playerBoardX,
          this.playerBoardY,
          this.playerTileSize,
          '#00e5ff'
        );
      }
      if (game.aiGrid.circuitComplete && Math.random() < 0.4) {
        this._spawnParticle(
          game.aiGrid,
          this.opponentBoardX,
          this.opponentBoardY,
          this.opponentTileSize,
          '#ff6600'
        );
      }

      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.life -= 0.018;
        p.x += p.vx;
        p.y += p.vy;

        if (p.life <= 0) {
          this.particles.splice(i, 1);
          continue;
        }

        ctx.globalAlpha = p.life * 0.8;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Cap particles
      if (this.particles.length > 100) {
        this.particles.splice(0, this.particles.length - 100);
      }
    }

    _spawnParticle(grid, bx, by, tileSize, color) {
      const powered = [];
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          if (grid.tiles[r][c].powered) powered.push({ r, c });
        }
      }
      if (powered.length === 0) return;

      const cell = powered[Math.floor(Math.random() * powered.length)];
      this.particles.push({
        x: bx + cell.c * tileSize + tileSize / 2 + (Math.random() - 0.5) * tileSize * 0.4,
        y: by + cell.r * tileSize + tileSize / 2,
        vx: (Math.random() - 0.5) * 0.5,
        vy: 0.5 + Math.random() * 1.2,
        life: 1,
        color: color,
      });
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

      this.mode = 'rotate';
      this.ap = INITIAL_AP;
      this.power = POWER_START;
      this.turn = 1;
      this.turnTimer = TURN_TIME;
      this.isPlayerTurn = true;
      this.gameOver = false;

      this.aiActions = [];
      this.aiNextActionTime = 0;

      this.lastFrameTime = 0;
      this.animFrameId = null;

      this._setupInput();
    }

    start() {
      this.playerGrid.generate();
      this.aiGrid.generate();

      this.mode = 'rotate';
      this.ap = INITIAL_AP;
      this.power = POWER_START;
      this.turn = 1;
      this.turnTimer = TURN_TIME;
      this.isPlayerTurn = true;
      this.gameOver = false;
      this.aiActions = [];
      this.renderer.particles = [];
      this.renderer.rotationAnims = [];
      this.renderer.flashTiles = [];

      this._showScreen('screen-game');
      this.renderer.resize();
      this._updateUI();

      this.lastFrameTime = performance.now();

      if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
      this._loop();
    }

    _setupInput() {
      // Canvas touch/click
      const handleTap = (e) => {
        e.preventDefault();
        if (!this.isPlayerTurn || this.gameOver) return;

        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.renderer.logicalWidth / rect.width;
        const scaleY = this.renderer.logicalHeight / rect.height;

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

        const x = (cx - rect.left) * scaleX;
        const y = (cy - rect.top) * scaleY;

        const hit = this.renderer.getTileAt(x, y);
        if (!hit) return;

        this._handleTileInteraction(hit);
      };

      this.canvas.addEventListener('touchstart', handleTap, { passive: false });
      this.canvas.addEventListener('click', handleTap);

      // Prevent scrolling on canvas
      this.canvas.addEventListener('touchmove', (e) => e.preventDefault(), {
        passive: false,
      });

      // Action buttons
      document.getElementById('btn-rotate').addEventListener('click', () => {
        if (!this.isPlayerTurn || this.gameOver) return;
        this.mode = 'rotate';
        this._updateUI();
      });

      document.getElementById('btn-sabotage').addEventListener('click', () => {
        if (!this.isPlayerTurn || this.gameOver) return;
        if (this.ap < SABOTAGE_COST) return;
        this.mode = 'sabotage';
        this._updateUI();
      });

      document.getElementById('btn-end-turn').addEventListener('click', () => {
        if (!this.isPlayerTurn || this.gameOver) return;
        this._endPlayerTurn();
      });

      // Start/restart
      document.getElementById('btn-start').addEventListener('click', () => this.start());
      document.getElementById('btn-restart').addEventListener('click', () => this.start());

      // Window resize
      window.addEventListener('resize', () => {
        if (!this.gameOver) {
          this.renderer.resize();
        }
      });
    }

    _handleTileInteraction(hit) {
      if (this.mode === 'rotate' && hit.board === 'player') {
        if (this.ap < ROTATE_COST) return;

        const tile = this.playerGrid.tiles[hit.row][hit.col];
        if (tile.type === TYPES.EMPTY) return;

        tile.rotate();
        this.playerGrid.updatePowered();
        this.ap -= ROTATE_COST;

        this.renderer.addRotationAnim('player', hit.row, hit.col);
        this._updateUI();

        if (this.ap <= 0) this._endPlayerTurn();
      } else if (this.mode === 'sabotage' && hit.board === 'opponent') {
        if (this.ap < SABOTAGE_COST) return;

        const tile = this.aiGrid.tiles[hit.row][hit.col];
        if (tile.type === TYPES.EMPTY) return;

        tile.rotate();
        this.aiGrid.updatePowered();
        this.ap -= SABOTAGE_COST;

        this.renderer.addRotationAnim('ai', hit.row, hit.col);
        this.renderer.addFlash('ai', hit.row, hit.col, 'rgba(255,0,68,0.6)');
        this.renderer.shake(280);

        // Switch back to rotate if not enough AP for another sabotage
        if (this.ap < SABOTAGE_COST) {
          this.mode = 'rotate';
        }
        this._updateUI();

        if (this.ap < ROTATE_COST) this._endPlayerTurn();
      }
    }

    _endPlayerTurn() {
      this.isPlayerTurn = false;

      // Update power based on circuit state
      this._updatePower();

      if (this._checkGameOver()) return;

      // AI plans actions
      this.aiActions = this.ai.takeTurn(this.aiGrid, this.playerGrid, INITIAL_AP);
      this.aiNextActionTime = performance.now() + AI_ACTION_DELAY;

      this._updateUI();
    }

    _processAIAction() {
      if (this.aiActions.length === 0) {
        // AI turn complete
        this._updatePower();
        if (this._checkGameOver()) return;

        this.turn++;
        this.isPlayerTurn = true;
        this.ap = INITIAL_AP;
        this.turnTimer = TURN_TIME;
        this.mode = 'rotate';
        this._updateUI();
        return;
      }

      const action = this.aiActions.shift();

      if (action.type === 'rotate') {
        this.aiGrid.tiles[action.row][action.col].rotate();
        this.aiGrid.updatePowered();
        this.renderer.addRotationAnim('ai', action.row, action.col);
      } else if (action.type === 'sabotage') {
        this.playerGrid.tiles[action.row][action.col].rotate();
        this.playerGrid.updatePowered();
        this.renderer.addRotationAnim('player', action.row, action.col);
        this.renderer.addFlash('player', action.row, action.col, 'rgba(255,0,68,0.6)');
        this.renderer.shake(280);
      }

      this.aiNextActionTime = performance.now() + AI_ACTION_DELAY;
      this._updateUI();
    }

    _updatePower() {
      if (this.playerGrid.circuitComplete) {
        this.power += POWER_PER_CIRCUIT;
      }
      if (this.aiGrid.circuitComplete) {
        this.power -= POWER_PER_CIRCUIT;
      }
      this.power = Math.max(POWER_MIN, Math.min(POWER_MAX, this.power));
    }

    _checkGameOver() {
      if (this.power >= POWER_MAX) {
        this._endGame(true, 'You fully charged your battery!');
        return true;
      }
      if (this.power <= POWER_MIN) {
        this._endGame(false, 'The AI drained all your power!');
        return true;
      }
      return false;
    }

    _endGame(playerWon, detail) {
      this.gameOver = true;

      const resultEl = document.getElementById('result-text');
      resultEl.textContent = playerWon ? 'VICTORY' : 'DEFEAT';
      resultEl.style.color = playerWon ? '#00e5ff' : '#ff4444';

      document.getElementById('result-detail').textContent = detail;
      document.getElementById('result-stats').innerHTML =
        '<span>Turns played: ' +
        this.turn +
        '</span><span>Final power: ' +
        this.power +
        '%</span>';

      setTimeout(() => this._showScreen('screen-gameover'), 1200);
    }

    _updateUI() {
      document.getElementById('turn-info').textContent = 'Turn ' + this.turn;
      document.getElementById('ap-display').textContent =
        'AP: ' + this.ap + '/' + INITIAL_AP;

      // Power meter
      const pct = (this.power / POWER_MAX) * 100;
      document.getElementById('power-fill').style.width = pct + '%';

      // Circuit status
      const statusEl = document.getElementById('circuit-status');
      if (this.playerGrid.circuitComplete && this.aiGrid.circuitComplete) {
        statusEl.textContent = 'BOTH CONNECTED';
        statusEl.style.color = '#ffee00';
      } else if (this.playerGrid.circuitComplete) {
        statusEl.textContent = 'YOUR CIRCUIT ON';
        statusEl.style.color = '#00e5ff';
      } else if (this.aiGrid.circuitComplete) {
        statusEl.textContent = 'AI CIRCUIT ON';
        statusEl.style.color = '#ff6600';
      } else {
        statusEl.textContent = '';
      }

      // Mode buttons
      const btnRotate = document.getElementById('btn-rotate');
      const btnSabotage = document.getElementById('btn-sabotage');
      const btnEnd = document.getElementById('btn-end-turn');

      btnRotate.classList.toggle('active', this.mode === 'rotate');
      btnSabotage.classList.toggle('active', this.mode === 'sabotage');

      btnRotate.disabled = !this.isPlayerTurn;
      btnSabotage.disabled = !this.isPlayerTurn || this.ap < SABOTAGE_COST;
      btnEnd.disabled = !this.isPlayerTurn;

      // Status text
      let status = '';
      if (this.gameOver) {
        status = '';
      } else if (!this.isPlayerTurn) {
        status = 'AI is thinking...';
      } else if (this.mode === 'rotate') {
        status = 'Tap your tiles to rotate';
      } else if (this.mode === 'sabotage') {
        status = 'Tap opponent tile to disrupt';
      }
      document.getElementById('status-text').textContent = status;
    }

    _showScreen(id) {
      document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
      document.getElementById(id).classList.add('active');
    }

    _loop() {
      const now = performance.now();
      const dt = Math.min((now - this.lastFrameTime) / 1000, 0.1);
      this.lastFrameTime = now;

      if (this.gameOver) {
        // Still render for effects
        this.renderer.draw(this);
        return;
      }

      // Turn timer
      if (this.isPlayerTurn) {
        this.turnTimer -= dt;
        const timerEl = document.getElementById('turn-timer');
        timerEl.textContent = Math.max(0, Math.ceil(this.turnTimer));

        if (this.turnTimer <= 5) {
          timerEl.classList.add('urgent');
        } else {
          timerEl.classList.remove('urgent');
        }

        if (this.turnTimer <= 0) {
          this._endPlayerTurn();
        }
      } else {
        document.getElementById('turn-timer').textContent = 'AI';
        document.getElementById('turn-timer').classList.remove('urgent');
      }

      // AI action processing
      if (!this.isPlayerTurn && now >= this.aiNextActionTime) {
        this._processAIAction();
      }

      // Render
      this.renderer.draw(this);

      this.animFrameId = requestAnimationFrame(() => this._loop());
    }
  }

  // ============================================================
  // INIT
  // ============================================================

  window.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
  });
})();
