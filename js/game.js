// ================================================================
// OHM ZONE - Ohm's Law Quiz Race
// ================================================================

(function () {
  'use strict';

  // ============================================================
  // CONFIG
  // ============================================================

  const TOTAL_ROUNDS = 10;
  const TIMER_SEC = { easy: 15, medium: 10, hard: 7 };
  const BASE_POINTS = 100;
  const TIME_BONUS_MAX = 150;

  // ============================================================
  // NICE VALUES for generating problems
  // ============================================================

  const VOLTAGES = [1.5, 3, 5, 6, 9, 12, 24, 48, 120];
  const RESISTANCES = [10, 22, 47, 100, 220, 330, 470, 1000, 2200, 4700, 10000];
  const CURRENTS_MA = [1, 2, 5, 10, 20, 50, 100, 200, 500]; // milliamps

  // Device names and their safe power ranges (watts)
  const DEVICES = [
    { name: 'LED', maxW: 0.1, icon: 'led' },
    { name: 'Small Motor', maxW: 5, icon: 'motor' },
    { name: 'Buzzer', maxW: 0.5, icon: 'buzzer' },
    { name: 'Relay', maxW: 2, icon: 'relay' },
    { name: 'Sensor', maxW: 0.25, icon: 'sensor' },
    { name: 'Fan', maxW: 12, icon: 'motor' },
    { name: 'Light Bulb', maxW: 60, icon: 'bulb' },
    { name: 'Heater', maxW: 100, icon: 'bulb' },
  ];

  // ============================================================
  // HELPERS
  // ============================================================

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function fmtV(v) {
    if (v >= 1000) return (v / 1000).toFixed(1).replace(/\.0$/, '') + ' kV';
    if (v < 1) return (v * 1000).toFixed(0) + ' mV';
    return Number.isInteger(v) ? v + ' V' : v.toFixed(1) + ' V';
  }

  function fmtI(amps) {
    if (amps >= 1) return amps.toFixed(2).replace(/\.?0+$/, '') + ' A';
    if (amps >= 0.001) return (amps * 1000).toFixed(1).replace(/\.?0+$/, '') + ' mA';
    return (amps * 1000000).toFixed(0) + ' uA';
  }

  function fmtR(ohms) {
    if (ohms >= 1000000) return (ohms / 1000000).toFixed(1).replace(/\.0$/, '') + ' M\u2126';
    if (ohms >= 1000) return (ohms / 1000).toFixed(1).replace(/\.0$/, '') + ' k\u2126';
    return ohms.toFixed(0) + ' \u2126';
  }

  function fmtW(watts) {
    if (watts >= 1000) return (watts / 1000).toFixed(1).replace(/\.0$/, '') + ' kW';
    if (watts >= 1) return watts.toFixed(1).replace(/\.?0+$/, '') + ' W';
    return (watts * 1000).toFixed(1).replace(/\.?0+$/, '') + ' mW';
  }

  // Generate wrong answers near the correct value
  function distractors(correct, fmt, count) {
    const wrong = new Set();
    const strategies = [
      () => correct * 2,
      () => correct / 2,
      () => correct * 10,
      () => correct / 10,
      () => correct * 1.5,
      () => correct * 0.75,
      () => correct + correct * 0.3,
      () => correct - correct * 0.25,
      () => correct * 3,
      () => correct / 3,
    ];

    shuffle(strategies);

    for (const fn of strategies) {
      if (wrong.size >= count) break;
      const v = fn();
      if (v > 0 && v !== correct && Math.abs(v - correct) / correct > 0.05) {
        const formatted = fmt(v);
        if (formatted !== fmt(correct)) {
          wrong.add(formatted);
        }
      }
    }

    // Fallback: random multipliers
    while (wrong.size < count) {
      const mult = 0.2 + Math.random() * 4;
      const v = correct * mult;
      if (v > 0 && Math.abs(v - correct) / correct > 0.05) {
        const formatted = fmt(v);
        if (formatted !== fmt(correct)) {
          wrong.add(formatted);
        }
      }
    }

    return [...wrong].slice(0, count);
  }

  // ============================================================
  // QUESTION GENERATOR
  // ============================================================

  // Each question type returns { question, answer, choices, circuit }
  // circuit = { V, R, I, P, unknown, device }

  const QUESTION_TYPES = {
    findCurrent(diff) {
      const V = pick(VOLTAGES);
      const R = pick(RESISTANCES);
      const I = V / R;
      const P = V * I;
      const device = pickDevice(P);
      return {
        question: `${fmtV(V)} across ${fmtR(R)}. What is the current?`,
        answer: fmtI(I),
        choices: shuffle([fmtI(I), ...distractors(I, fmtI, 3)]),
        circuit: { V, R, I, P, unknown: 'I', device },
      };
    },

    findVoltage(diff) {
      const R = pick(RESISTANCES);
      const I_mA = pick(CURRENTS_MA);
      const I = I_mA / 1000;
      const V = I * R;
      if (V > 500 || V < 0.1) return QUESTION_TYPES.findVoltage(diff);
      const P = V * I;
      const device = pickDevice(P);
      return {
        question: `${fmtI(I)} through ${fmtR(R)}. What voltage is needed?`,
        answer: fmtV(V),
        choices: shuffle([fmtV(V), ...distractors(V, fmtV, 3)]),
        circuit: { V, R, I, P, unknown: 'V', device },
      };
    },

    findResistance(diff) {
      const V = pick(VOLTAGES);
      const I_mA = pick(CURRENTS_MA);
      const I = I_mA / 1000;
      const R = V / I;
      if (R < 1 || R > 1000000) return QUESTION_TYPES.findResistance(diff);
      const P = V * I;
      const device = pickDevice(P);
      return {
        question: `${fmtV(V)} supply, need ${fmtI(I)}. What resistor?`,
        answer: fmtR(R),
        choices: shuffle([fmtR(R), ...distractors(R, fmtR, 3)]),
        circuit: { V, R, I, P, unknown: 'R', device },
      };
    },

    findPower(diff) {
      const V = pick(VOLTAGES);
      const R = pick(RESISTANCES);
      const I = V / R;
      const P = V * I;
      if (P < 0.0001 || P > 10000) return QUESTION_TYPES.findPower(diff);
      const device = pickDevice(P);
      return {
        question: `${fmtV(V)} across ${fmtR(R)}. How much power?`,
        answer: fmtW(P),
        choices: shuffle([fmtW(P), ...distractors(P, fmtW, 3)]),
        circuit: { V, R, I, P, unknown: 'P', device },
      };
    },

    safetyCheck(diff) {
      const device = pick(DEVICES);
      const V = pick(VOLTAGES);
      const R = pick(RESISTANCES);
      const I = V / R;
      const P = V * I;
      const safe = P <= device.maxW;
      return {
        question: `${fmtV(V)} + ${fmtR(R)} powering a ${device.name} (max ${fmtW(device.maxW)}). Safe?`,
        answer: safe ? 'SAFE' : 'OVERLOAD!',
        choices: shuffle([
          'SAFE',
          'OVERLOAD!',
          fmtW(P) + ' (safe)',
          fmtW(P) + ' (too much)',
        ].filter((_, i) => {
          // Keep the correct full answer and the wrong simple one
          if (safe) return i === 0 || i === 1 || i === 3;
          return i === 0 || i === 1 || i === 2;
        })),
        circuit: { V, R, I, P, unknown: 'safe', device, safe },
      };
    },
  };

  function pickDevice(power) {
    // Find a device whose max power is close to the actual power
    const sorted = [...DEVICES].sort(
      (a, b) => Math.abs(Math.log(a.maxW) - Math.log(power)) -
                Math.abs(Math.log(b.maxW) - Math.log(power))
    );
    return sorted[0];
  }

  function generateQuestion(diff) {
    const types = Object.keys(QUESTION_TYPES);
    const type = pick(types);
    const q = QUESTION_TYPES[type](diff);
    // Ensure exactly 4 choices
    while (q.choices.length < 4) {
      q.choices.push('---');
    }
    q.choices = q.choices.slice(0, 4);
    return q;
  }

  // ============================================================
  // CIRCUIT RENDERER
  // ============================================================

  class CircuitRenderer {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.w = 0;
      this.h = 0;
      this.glow = 0;
      this.explode = 0;
      this.sparks = [];
    }

    resize() {
      const dpr = window.devicePixelRatio || 1;
      const maxW = Math.min(window.innerWidth - 24, 420);
      this.w = maxW;
      this.h = 140;
      this.canvas.width = this.w * dpr;
      this.canvas.height = this.h * dpr;
      this.canvas.style.width = this.w + 'px';
      this.canvas.style.height = this.h + 'px';
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    draw(circuit, state) {
      const ctx = this.ctx;
      const w = this.w;
      const h = this.h;

      ctx.clearRect(0, 0, w, h);

      // Layout points
      const pad = 30;
      const battL = pad;
      const battR = pad + 40;
      const resL = w * 0.35;
      const resR = w * 0.58;
      const devX = w - pad - 20;
      const wireY1 = 35;
      const wireY2 = h - 25;
      const midY = h / 2;

      const wireColor = '#3a4a70';
      const activeColor = state === 'correct' ? '#00e676' :
                          state === 'wrong' ? '#ff3d5a' : '#ffd600';

      // Glow animation
      if (state === 'correct') this.glow = Math.min(1, this.glow + 0.08);
      else if (state === 'wrong') this.glow = Math.min(1, this.glow + 0.08);
      else this.glow *= 0.92;

      // ---- Wires ----
      ctx.strokeStyle = wireColor;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';

      // Top wire: battery+ -> resistor -> device
      ctx.beginPath();
      ctx.moveTo(battR, wireY1);
      ctx.lineTo(resL, wireY1);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(resR, wireY1);
      ctx.lineTo(devX, wireY1);
      ctx.stroke();

      // Right wire: device down
      ctx.beginPath();
      ctx.moveTo(devX, wireY1);
      ctx.lineTo(devX, wireY2);
      ctx.stroke();

      // Bottom wire: device -> battery-
      ctx.beginPath();
      ctx.moveTo(devX, wireY2);
      ctx.lineTo(battL + 20, wireY2);
      ctx.stroke();

      // Left wire: battery down
      ctx.beginPath();
      ctx.moveTo(battL + 20, wireY1 + 22);
      ctx.lineTo(battL + 20, wireY2);
      ctx.stroke();

      // ---- Battery ----
      this._drawBattery(ctx, battL, wireY1 - 10, circuit);

      // ---- Resistor ----
      this._drawResistor(ctx, resL, wireY1, resR - resL, circuit);

      // ---- Device ----
      this._drawDevice(ctx, devX, wireY1, wireY2, circuit, state);

      // ---- Labels ----
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.textAlign = 'center';

      // Voltage label
      if (circuit.unknown === 'V') {
        ctx.fillStyle = '#ffd600';
        ctx.fillText('V = ?', battL + 20, wireY1 + 48);
      } else {
        ctx.fillStyle = '#6a7590';
        ctx.fillText(fmtV(circuit.V), battL + 20, wireY1 + 48);
      }

      // Resistance label
      if (circuit.unknown === 'R') {
        ctx.fillStyle = '#ffd600';
        ctx.fillText('R = ?', (resL + resR) / 2, wireY1 + 24);
      } else {
        ctx.fillStyle = '#6a7590';
        ctx.fillText(fmtR(circuit.R), (resL + resR) / 2, wireY1 + 24);
      }

      // Current label (on bottom wire)
      if (circuit.unknown === 'I') {
        ctx.fillStyle = '#ffd600';
        ctx.fillText('I = ?', w / 2, wireY2 - 6);
      } else {
        ctx.fillStyle = '#3d5580';
        ctx.fillText('I = ' + fmtI(circuit.I), w / 2, wireY2 - 6);
      }

      // Power label (near device)
      if (circuit.unknown === 'P' || circuit.unknown === 'safe') {
        ctx.fillStyle = '#ffd600';
        const label = circuit.unknown === 'safe'
          ? 'P = ? (max ' + fmtW(circuit.device.maxW) + ')'
          : 'P = ?';
        ctx.fillText(label, devX, wireY2 + 14);
      }

      // Current arrow on bottom wire
      this._drawArrow(ctx, w * 0.7, wireY2, -1);

      // Sparks for wrong answer
      if (state === 'wrong') {
        if (this.sparks.length === 0) this._spawnSparks(devX, (wireY1 + wireY2) / 2);
      }
      this._drawSparks(ctx);
    }

    _drawBattery(ctx, x, y, circuit) {
      const cx = x + 20;
      // Body
      ctx.fillStyle = '#1a2035';
      ctx.strokeStyle = '#3a4a70';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(cx - 10, y, 20, 32, 3);
      ctx.fill();
      ctx.stroke();

      // Terminal nub
      ctx.fillStyle = '#3a4a70';
      ctx.fillRect(cx - 4, y - 3, 8, 4);

      // Plus/Minus
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ff5252';
      ctx.fillText('+', cx, y + 12);
      ctx.fillStyle = '#448aff';
      ctx.fillText('\u2013', cx, y + 26);
    }

    _drawResistor(ctx, x, y, w, circuit) {
      const zigW = w;
      const zigH = 7;
      const steps = 6;
      const stepW = zigW / steps;

      ctx.strokeStyle = circuit.unknown === 'R' ? '#ffd600' : '#7c6cff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(x, y);
      for (let i = 0; i < steps; i++) {
        const dir = i % 2 === 0 ? -1 : 1;
        ctx.lineTo(x + stepW * (i + 0.5), y + zigH * dir);
        ctx.lineTo(x + stepW * (i + 1), y);
      }
      ctx.stroke();
    }

    _drawDevice(ctx, x, y1, y2, circuit, state) {
      const cy = (y1 + y2) / 2;
      const r = 16;

      // Glow
      if (this.glow > 0.05) {
        const color = state === 'correct' ? 'rgba(0,230,118,' : 'rgba(255,61,90,';
        ctx.beginPath();
        ctx.arc(x, cy, r + 8, 0, Math.PI * 2);
        ctx.fillStyle = color + (this.glow * 0.3) + ')';
        ctx.fill();
      }

      // Circle
      ctx.beginPath();
      ctx.arc(x, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = '#1a2035';
      ctx.strokeStyle = state === 'correct' ? '#00e676' :
                        state === 'wrong' ? '#ff3d5a' : '#3a4a70';
      ctx.lineWidth = 2;
      ctx.fill();
      ctx.stroke();

      // Icon inside
      ctx.font = '14px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = state === 'correct' ? '#00e676' :
                      state === 'wrong' ? '#ff3d5a' : '#6a7590';

      const icon = circuit.device.icon;
      if (icon === 'led' || icon === 'bulb') {
        // Lightbulb shape
        ctx.beginPath();
        ctx.arc(x, cy - 3, 6, Math.PI, 0);
        ctx.lineTo(x + 4, cy + 4);
        ctx.lineTo(x - 4, cy + 4);
        ctx.closePath();
        ctx.fill();
        ctx.fillRect(x - 3, cy + 5, 6, 2);
      } else if (icon === 'motor') {
        ctx.fillText('M', x, cy + 1);
      } else if (icon === 'buzzer') {
        ctx.fillText('B', x, cy + 1);
      } else if (icon === 'relay') {
        ctx.fillText('K', x, cy + 1);
      } else {
        ctx.fillText('S', x, cy + 1);
      }

      // Device name
      ctx.font = 'bold 9px system-ui, sans-serif';
      ctx.fillStyle = '#6a7590';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(circuit.device.name, x, y1 - 4);
    }

    _drawArrow(ctx, x, y, dir) {
      ctx.fillStyle = '#3a4a70';
      ctx.beginPath();
      ctx.moveTo(x + dir * 6, y);
      ctx.lineTo(x - dir * 3, y - 3);
      ctx.lineTo(x - dir * 3, y + 3);
      ctx.closePath();
      ctx.fill();
    }

    _spawnSparks(x, y) {
      this.sparks = [];
      for (let i = 0; i < 12; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 3;
        this.sparks.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
        });
      }
    }

    _drawSparks(ctx) {
      for (let i = this.sparks.length - 1; i >= 0; i--) {
        const s = this.sparks[i];
        s.x += s.vx;
        s.y += s.vy;
        s.life -= 0.03;
        if (s.life <= 0) {
          this.sparks.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = s.life;
        ctx.fillStyle = Math.random() > 0.5 ? '#ffd600' : '#ff9100';
        ctx.fillRect(s.x - 1.5, s.y - 1.5, 3, 3);
      }
      ctx.globalAlpha = 1;
    }
  }

  // ============================================================
  // GAME
  // ============================================================

  class Game {
    constructor() {
      this.canvas = document.getElementById('circuit-canvas');
      this.circuit = new CircuitRenderer(this.canvas);

      this.difficulty = 'medium';
      this.round = 0;
      this.score = 0;
      this.streak = 0;
      this.bestStreak = 0;
      this.correct = 0;
      this.totalTime = 0;

      this.currentQ = null;
      this.answered = false;
      this.timerStart = 0;
      this.timerDuration = 0;
      this.timerRaf = null;
      this.state = 'idle'; // idle, active, feedback, done

      this._bind();
    }

    _bind() {
      // Difficulty
      document.querySelectorAll('.diff-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.diff-btn').forEach((b) => b.classList.remove('selected'));
          btn.classList.add('selected');
          this.difficulty = btn.dataset.diff;
        });
      });

      // Start / restart
      document.getElementById('btn-start').addEventListener('click', () => this._startGame());
      document.getElementById('btn-restart').addEventListener('click', () => this._startGame());

      // Answer buttons
      document.querySelectorAll('.answer-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          if (this.answered || this.state !== 'active') return;
          const idx = parseInt(btn.dataset.idx);
          this._answer(idx);
        });
      });

      window.addEventListener('resize', () => this.circuit.resize());
    }

    // ---- Flow ----

    _startGame() {
      this.round = 0;
      this.score = 0;
      this.streak = 0;
      this.bestStreak = 0;
      this.correct = 0;
      this.totalTime = 0;
      this.state = 'active';

      this._showScreen('screen-game');
      this.circuit.resize();
      this._nextRound();
    }

    _nextRound() {
      this.round++;
      if (this.round > TOTAL_ROUNDS) {
        this._endGame();
        return;
      }

      this.answered = false;
      this.currentQ = generateQuestion(this.difficulty);

      // Update UI
      document.getElementById('round-display').textContent = this.round + ' / ' + TOTAL_ROUNDS;
      document.getElementById('score-display').textContent = this.score;
      document.getElementById('streak-display').textContent =
        this.streak >= 2 ? 'x' + this.streak + ' streak' : '';
      document.getElementById('question-text').textContent = this.currentQ.question;
      document.getElementById('feedback-text').textContent = '';

      // Set answer buttons
      const btns = document.querySelectorAll('.answer-btn');
      btns.forEach((btn, i) => {
        btn.textContent = this.currentQ.choices[i];
        btn.className = 'answer-btn';
      });

      // Draw circuit
      this.circuit.glow = 0;
      this.circuit.sparks = [];
      this.circuit.draw(this.currentQ.circuit, 'idle');

      // Start timer
      this.timerDuration = TIMER_SEC[this.difficulty] || 10;
      this.timerStart = performance.now();
      this._tickTimer();
    }

    _tickTimer() {
      if (this.answered || this.state !== 'active') return;

      const elapsed = (performance.now() - this.timerStart) / 1000;
      const remaining = Math.max(0, this.timerDuration - elapsed);
      const pct = (remaining / this.timerDuration) * 100;

      const bar = document.getElementById('timer-bar');
      bar.style.width = pct + '%';
      bar.className = pct < 30 ? 'warning' : '';

      if (remaining <= 0) {
        this._timeout();
        return;
      }

      this.timerRaf = requestAnimationFrame(() => this._tickTimer());
    }

    _answer(idx) {
      this.answered = true;
      if (this.timerRaf) cancelAnimationFrame(this.timerRaf);

      const elapsed = (performance.now() - this.timerStart) / 1000;
      const chosen = this.currentQ.choices[idx];
      const isCorrect = chosen === this.currentQ.answer;

      const btns = document.querySelectorAll('.answer-btn');

      if (isCorrect) {
        // Score: base + time bonus + streak bonus
        const timeFraction = Math.max(0, 1 - elapsed / this.timerDuration);
        const timeBonus = Math.round(TIME_BONUS_MAX * timeFraction);
        const streakMult = this.streak >= 5 ? 3 : this.streak >= 3 ? 2 : 1;
        const points = (BASE_POINTS + timeBonus) * streakMult;

        this.score += points;
        this.streak++;
        this.correct++;
        this.totalTime += elapsed;
        if (this.streak > this.bestStreak) this.bestStreak = this.streak;

        btns[idx].classList.add('correct');
        document.getElementById('feedback-text').style.color = '#00e676';
        document.getElementById('feedback-text').textContent =
          '+' + points + (streakMult > 1 ? ' (x' + streakMult + ' streak!)' : '') +
          '  \u2022  ' + elapsed.toFixed(1) + 's';

        this.circuit.draw(this.currentQ.circuit, 'correct');
      } else {
        this.streak = 0;

        btns[idx].classList.add('wrong');
        // Reveal correct
        btns.forEach((btn, i) => {
          if (this.currentQ.choices[i] === this.currentQ.answer) {
            btn.classList.add('reveal');
          } else if (i !== idx) {
            btn.classList.add('disabled');
          }
        });

        document.getElementById('feedback-text').style.color = '#ff3d5a';
        document.getElementById('feedback-text').textContent =
          'Answer: ' + this.currentQ.answer;

        this.circuit.draw(this.currentQ.circuit, 'wrong');
        // Shake the question
        const box = document.getElementById('question-box');
        box.classList.add('shake');
        setTimeout(() => box.classList.remove('shake'), 400);
      }

      // Disable all buttons
      btns.forEach((b) => {
        if (!b.classList.contains('correct') && !b.classList.contains('wrong') && !b.classList.contains('reveal')) {
          b.classList.add('disabled');
        }
      });

      document.getElementById('score-display').textContent = this.score;
      document.getElementById('streak-display').textContent =
        this.streak >= 2 ? 'x' + this.streak + ' streak' : '';

      // Animate the circuit for a moment then move on
      let frames = 0;
      const animFeedback = () => {
        frames++;
        this.circuit.draw(this.currentQ.circuit, isCorrect ? 'correct' : 'wrong');
        if (frames < 40) requestAnimationFrame(animFeedback);
      };
      animFeedback();

      setTimeout(() => this._nextRound(), 1800);
    }

    _timeout() {
      this.answered = true;
      this.streak = 0;

      const btns = document.querySelectorAll('.answer-btn');
      btns.forEach((btn, i) => {
        if (this.currentQ.choices[i] === this.currentQ.answer) {
          btn.classList.add('reveal');
        } else {
          btn.classList.add('disabled');
        }
      });

      document.getElementById('feedback-text').style.color = '#ff9100';
      document.getElementById('feedback-text').textContent =
        'Time\'s up! Answer: ' + this.currentQ.answer;
      document.getElementById('streak-display').textContent = '';

      this.circuit.draw(this.currentQ.circuit, 'wrong');

      setTimeout(() => this._nextRound(), 2000);
    }

    _endGame() {
      this.state = 'done';

      const pct = Math.round((this.correct / TOTAL_ROUNDS) * 100);
      const avgTime = this.correct > 0 ? (this.totalTime / this.correct).toFixed(1) : '-';

      const title = document.getElementById('result-title');
      if (pct >= 90) {
        title.textContent = 'MASTER!';
        title.style.color = '#ffd600';
      } else if (pct >= 70) {
        title.textContent = 'NICE WORK';
        title.style.color = '#00e676';
      } else if (pct >= 50) {
        title.textContent = 'NOT BAD';
        title.style.color = '#ff9100';
      } else {
        title.textContent = 'KEEP LEARNING';
        title.style.color = '#ff3d5a';
      }

      document.getElementById('result-detail').textContent =
        'You scored ' + this.score + ' points on ' + this.difficulty + ' difficulty.';

      document.getElementById('result-stats').innerHTML = [
        stat('Correct', this.correct + ' / ' + TOTAL_ROUNDS, pct >= 70 ? 'good' : 'warn'),
        stat('Accuracy', pct + '%', pct >= 70 ? 'good' : 'warn'),
        stat('Best Streak', this.bestStreak + 'x', this.bestStreak >= 3 ? 'good' : ''),
        stat('Avg Time', avgTime + 's', ''),
        stat('Final Score', this.score.toLocaleString(), 'good'),
      ].join('');

      this._showScreen('screen-gameover');
    }

    _showScreen(id) {
      document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
      document.getElementById(id).classList.add('active');
    }
  }

  function stat(label, value, cls) {
    return '<div class="stat-row"><span class="stat-label">' + label +
      '</span><span class="stat-value ' + (cls || '') + '">' + value + '</span></div>';
  }

  // ============================================================
  // INIT
  // ============================================================

  window.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
  });
})();
