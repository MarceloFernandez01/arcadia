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
  private nextDirection: Direction | null = null;
  private score = 0;
  private gameOver = false;
  private tickAccum = 0;
  private tickInterval = 150;
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
    const candidate = SnakeEngine.KEY_DIRECTIONS[e.code];
    if (!candidate) return;
    e.preventDefault();
    if (this.gameOver) return;
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

    this.snakeBody.unshift(newHead);
    this.snakeBody.pop();
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
