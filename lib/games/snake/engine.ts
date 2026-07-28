import type { ArcadeGameEngine, ArcadeGameEngineOptions, EngineState } from "@/lib/games/types";

const COLS = 20;
const ROWS = 20;
const CELL = 30;

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
  private score = 0;
  private gameOver = false;
  private tickAccum = 0;
  private tickInterval = 150;
  private lastNotified: EngineState | null = null;

  private lastTime: number | null = null;
  private rafId: number | null = null;
  private running = false;

  constructor(canvas: HTMLCanvasElement, options: ArcadeGameEngineOptions) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No se pudo obtener el contexto 2D del canvas");
    this.ctx = ctx;
    this.options = options;

    this.initGame();
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
  }

  private initGame() {
    const startX = Math.floor(COLS / 2);
    const startY = Math.floor(ROWS / 2);
    this.snakeBody = [{ x: startX, y: startY }];
    this.direction = { x: 1, y: 0 };
    this.score = 0;
    this.gameOver = false;
    this.tickAccum = 0;
    this.tickInterval = 150;
    this.lastNotified = null;
    this.notifyStateChange();
    this.draw();
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
    const head = this.snakeBody[0];
    const newHead: Segment = { x: head.x + this.direction.x, y: head.y + this.direction.y };
    this.snakeBody.unshift(newHead);
    this.snakeBody.pop();
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

  private draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, COLS * CELL, ROWS * CELL);
    this.drawGrid();
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
