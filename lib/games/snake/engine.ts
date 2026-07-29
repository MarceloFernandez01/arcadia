import { FRUITS, getFruitSheet, loadFruitSheet } from "@/lib/games/snake/fruits";
import type { ArcadeGameEngine, ArcadeGameEngineOptions, EngineState } from "@/lib/games/types";

const COLS = 25;
const ROWS = 25;
const CELL = 24;

const FRUIT_KEYS = Object.keys(FRUITS);
const FRUIT_POINTS = 10;
const BASE_TICK_INTERVAL = 150;
const MIN_TICK_INTERVAL = 60;
const TICK_INTERVAL_STEP = 4;

interface Segment {
  x: number;
  y: number;
}

interface Direction {
  x: number;
  y: number;
}

export class SnakeEngine implements ArcadeGameEngine {
  private ctx: CanvasRenderingContext2D;
  private options: ArcadeGameEngineOptions;

  private snakeBody!: Segment[];
  private direction!: Direction;
  private nextDirection: Direction | null = null;
  private fruitCell!: Segment;
  private fruitKey!: string;
  private score = 0;
  private gameOver = false;
  private tickAccum = 0;
  private tickInterval = BASE_TICK_INTERVAL;
  private lastNotified: EngineState | null = null;

  private lastTime: number | null = null;
  private rafId: number | null = null;
  private running = false;

  private static readonly KEY_DIRECTIONS: Record<string, Direction> = {
    ArrowUp: { x: 0, y: -1 },
    ArrowDown: { x: 0, y: 1 },
    ArrowLeft: { x: -1, y: 0 },
    ArrowRight: { x: 1, y: 0 },
    KeyW: { x: 0, y: -1 },
    KeyS: { x: 0, y: 1 },
    KeyA: { x: -1, y: 0 },
    KeyD: { x: 1, y: 0 },
  };

  private onKeyDown = (e: KeyboardEvent) => {
    if (!this.running) return;
    const candidate = SnakeEngine.KEY_DIRECTIONS[e.code];
    if (!candidate) return;
    e.preventDefault();
    if (candidate.x === -this.direction.x && candidate.y === -this.direction.y) return;
    this.nextDirection = candidate;
  };

  constructor(canvas: HTMLCanvasElement, options: ArcadeGameEngineOptions) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No se pudo obtener el contexto 2D del canvas");
    this.ctx = ctx;
    this.options = options;

    window.addEventListener("keydown", this.onKeyDown);

    this.initGame();
    loadFruitSheet(() => this.draw());
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = null;
    this.tickAccum = 0;
    this.rafId = requestAnimationFrame(this.loop);
  }

  pause() {
    this.running = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  resume() {
    if (this.running || this.gameOver) return;
    this.running = true;
    this.lastTime = null;
    this.rafId = requestAnimationFrame(this.loop);
  }

  restart() {
    this.pause();
    this.initGame();
  }

  destroy() {
    this.pause();
    window.removeEventListener("keydown", this.onKeyDown);
  }

  private initGame() {
    const startX = Math.floor(COLS / 2);
    const startY = Math.floor(ROWS / 2);
    this.snakeBody = [{ x: startX, y: startY }];
    this.direction = { x: 1, y: 0 };
    this.nextDirection = null;
    this.score = 0;
    this.gameOver = false;
    this.tickAccum = 0;
    this.tickInterval = BASE_TICK_INTERVAL;
    this.lastNotified = null;
    this.spawnFruit();
    this.notifyStateChange();
    this.draw();
  }

  private spawnFruit() {
    const freeCells: Segment[] = [];
    for (let x = 0; x < COLS; x++) {
      for (let y = 0; y < ROWS; y++) {
        if (!this.snakeBody.some((s) => s.x === x && s.y === y)) {
          freeCells.push({ x, y });
        }
      }
    }
    this.fruitCell = freeCells[Math.floor(Math.random() * freeCells.length)];
    this.fruitKey = FRUIT_KEYS[Math.floor(Math.random() * FRUIT_KEYS.length)];
  }

  private notifyStateChange() {
    const current: EngineState = {
      score: this.score,
      stats: [{ key: "length", label: "Longitud", value: this.snakeBody.length.toString() }],
    };
    if (
      !this.lastNotified ||
      this.lastNotified.score !== current.score ||
      this.lastNotified.stats[0].value !== current.stats[0].value
    ) {
      this.lastNotified = current;
      this.options.onStateChange(current);
    }
  }

  private step() {
    if (this.nextDirection) {
      const candidate = this.nextDirection;
      this.nextDirection = null;
      if (candidate.x !== -this.direction.x || candidate.y !== -this.direction.y) {
        this.direction = candidate;
      }
    }

    const head = this.snakeBody[0];
    const newHead: Segment = {
      x: (head.x + this.direction.x + COLS) % COLS,
      y: (head.y + this.direction.y + ROWS) % ROWS,
    };

    const bodyWithoutTail = this.snakeBody.slice(0, -1);
    if (bodyWithoutTail.some((s) => s.x === newHead.x && s.y === newHead.y)) {
      this.endGame();
      return;
    }

    const ateFruit = newHead.x === this.fruitCell.x && newHead.y === this.fruitCell.y;
    this.snakeBody.unshift(newHead);
    if (ateFruit) {
      this.score += FRUIT_POINTS;
      this.tickInterval = Math.max(
        MIN_TICK_INTERVAL,
        BASE_TICK_INTERVAL - (this.snakeBody.length - 1) * TICK_INTERVAL_STEP,
      );
      this.spawnFruit();
    } else {
      this.snakeBody.pop();
    }
  }

  private endGame() {
    this.gameOver = true;
    this.pause();
    this.notifyStateChange();
    this.options.onGameOver(this.score);
  }

  private drawGrid() {
    const ctx = this.ctx;
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 0.5;
    for (let c = 1; c < COLS; c++) {
      ctx.beginPath();
      ctx.moveTo(c * CELL, 0);
      ctx.lineTo(c * CELL, ROWS * CELL);
      ctx.stroke();
    }
    for (let r = 1; r < ROWS; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * CELL);
      ctx.lineTo(COLS * CELL, r * CELL);
      ctx.stroke();
    }
  }

  private drawSnake() {
    const ctx = this.ctx;
    for (const segment of this.snakeBody) {
      ctx.fillStyle = "#ffd54f";
      ctx.fillRect(segment.x * CELL + 1, segment.y * CELL + 1, CELL - 2, CELL - 2);
    }
  }

  private drawFruit() {
    const sheet = getFruitSheet();
    if (!sheet) return;
    const sprite = FRUITS[this.fruitKey];
    const scale = Math.min(CELL / sprite.w, CELL / sprite.h);
    const dw = sprite.w * scale;
    const dh = sprite.h * scale;
    const cellX = this.fruitCell.x * CELL;
    const cellY = this.fruitCell.y * CELL;
    this.ctx.drawImage(
      sheet,
      sprite.x,
      sprite.y,
      sprite.w,
      sprite.h,
      cellX + (CELL - dw) / 2,
      cellY + (CELL - dh) / 2,
      dw,
      dh,
    );
  }

  private draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, COLS * CELL, ROWS * CELL);
    this.drawGrid();
    this.drawFruit();
    this.drawSnake();
  }

  private loop = (ts: number) => {
    if (this.lastTime === null) {
      this.lastTime = ts;
      this.draw();
      if (this.running) this.rafId = requestAnimationFrame(this.loop);
      return;
    }

    const dt = ts - this.lastTime;
    this.lastTime = ts;

    this.tickAccum += dt;
    if (this.tickAccum >= this.tickInterval) {
      this.tickAccum = 0;
      this.step();
      this.notifyStateChange();
    }

    this.draw();
    if (this.running) this.rafId = requestAnimationFrame(this.loop);
  };
}
