import type { ArcadeGameEngine, ArcadeGameEngineOptions, EngineState } from "@/lib/games/types";
import { LEVELS } from "@/lib/games/arkanoid/levels";
import {
  loadSpritesheet,
  drawSprite,
  drawFrame,
  EXPLOSION_FRAMES,
  EXPLOSION_DURATION,
} from "@/lib/games/arkanoid/spritesheet";

const PADDLE_SPEED = 400;
const BLOCK_COLS = 10;
const BLOCK_W = 64;
const BLOCK_H = 24;
const BLOCKS_ORIGIN_Y = 80;
const BASE_BALL_VX = 200;
const BASE_BALL_VY = -300;

interface Block {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  alive: boolean;
}

interface Explosion {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  elapsed: number;
}

export class ArkanoidEngine implements ArcadeGameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private options: ArcadeGameEngineOptions;

  private paddle = { x: 0, y: 560, w: 81, h: 14 };
  private ball = { x: 0, y: 0, w: 16, h: 16, vx: BASE_BALL_VX, vy: BASE_BALL_VY };
  private blocks: Block[] = [];
  private explosions: Explosion[] = [];
  private lives = 3;
  private score = 0;
  private currentLevel = 1;
  private finished = false;
  private lastNotified: EngineState | null = null;

  private keys: Record<string, boolean> = { ArrowLeft: false, ArrowRight: false };

  private bounceSound = new Audio("/games/arkanoid/sounds/ball-bounce.mp3");
  private breakSound = new Audio("/games/arkanoid/sounds/break-sound.mp3");
  private static readonly BREAK_SOUND_VOLUME = 0.4;
  private playingSounds = new Set<HTMLAudioElement>();

  private lastTime: number | null = null;
  private rafId: number | null = null;
  private running = false;

  private onKeyDown = (e: KeyboardEvent) => {
    if (e.key in this.keys) this.keys[e.key] = true;
  };

  private onKeyUp = (e: KeyboardEvent) => {
    if (e.key in this.keys) this.keys[e.key] = false;
  };

  private onMouseMove = (e: MouseEvent) => {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const mouseX = (e.clientX - rect.left) * scaleX;
    this.paddle.x = Math.max(
      0,
      Math.min(this.canvas.width - this.paddle.w, mouseX - this.paddle.w / 2),
    );
  };

  constructor(canvas: HTMLCanvasElement, options: ArcadeGameEngineOptions) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No se pudo obtener el contexto 2D del canvas");
    this.canvas = canvas;
    this.ctx = ctx;
    this.options = options;
    this.breakSound.volume = ArkanoidEngine.BREAK_SOUND_VOLUME;

    canvas.addEventListener("mousemove", this.onMouseMove);
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);

    this.initGame();
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = null;
    loadSpritesheet(() => {
      if (this.running) this.rafId = requestAnimationFrame(this.loop);
    });
  }

  pause() {
    this.running = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  resume() {
    if (this.running || this.finished) return;
    this.running = true;
    this.lastTime = null;
    loadSpritesheet(() => {
      if (this.running) this.rafId = requestAnimationFrame(this.loop);
    });
  }

  restart() {
    this.pause();
    this.stopSounds();
    this.initGame();
  }

  destroy() {
    this.pause();
    this.stopSounds();
    this.canvas.removeEventListener("mousemove", this.onMouseMove);
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
  }

  private stopSounds() {
    for (const audio of this.playingSounds) audio.pause();
    this.playingSounds.clear();
  }

  private playSound(base: HTMLAudioElement) {
    const clone = base.cloneNode() as HTMLAudioElement;
    clone.volume = base.volume;
    this.playingSounds.add(clone);
    clone.addEventListener("ended", () => this.playingSounds.delete(clone));
    clone.play().catch(() => {});
  }

  private initGame() {
    this.score = 0;
    this.lives = 3;
    this.finished = false;
    this.lastNotified = null;
    this.paddle.w = 81;
    this.paddle.h = 14;
    this.paddle.y = 560;
    this.initPaddle();
    this.loadLevel(1);
    this.notifyStateChange();
  }

  private initPaddle() {
    this.paddle.x = (this.canvas.width - this.paddle.w) / 2;
  }

  private initBall() {
    const speed = LEVELS[this.currentLevel - 1].speed;
    this.ball.x = this.paddle.x + (this.paddle.w - this.ball.w) / 2;
    this.ball.y = this.paddle.y - this.ball.h;
    this.ball.vx = BASE_BALL_VX * speed;
    this.ball.vy = BASE_BALL_VY * speed;
  }

  private loadLevel(n: number) {
    this.currentLevel = n;
    const level = LEVELS[n - 1];
    const blocksOriginX = (this.canvas.width - BLOCK_COLS * BLOCK_W) / 2;
    this.blocks = level.blocks.map((b) => ({
      x: blocksOriginX + b.col * BLOCK_W,
      y: BLOCKS_ORIGIN_Y + b.row * BLOCK_H,
      w: BLOCK_W,
      h: BLOCK_H,
      color: b.color,
      alive: true,
    }));
    this.explosions = [];
    this.initBall();
  }

  private collideAABB(block: Block): boolean {
    return (
      this.ball.x < block.x + block.w &&
      this.ball.x + this.ball.w > block.x &&
      this.ball.y < block.y + block.h &&
      this.ball.y + this.ball.h > block.y
    );
  }

  private endGame() {
    this.finished = true;
    this.pause();
    this.notifyStateChange();
    this.options.onGameOver(this.score);
  }

  private notifyStateChange() {
    const current: EngineState = {
      score: this.score,
      stats: [
        { key: "lives", label: "Vidas", value: Array(this.lives).fill("♥").join(" ") },
        { key: "level", label: "Nivel", value: this.currentLevel.toString().padStart(2, "0") },
      ],
    };
    if (
      !this.lastNotified ||
      this.lastNotified.score !== current.score ||
      this.lastNotified.stats[0].value !== current.stats[0].value ||
      this.lastNotified.stats[1].value !== current.stats[1].value
    ) {
      this.lastNotified = current;
      this.options.onStateChange(current);
    }
  }

  private update(dt: number) {
    if (this.keys.ArrowLeft) this.paddle.x = Math.max(0, this.paddle.x - PADDLE_SPEED * dt);
    if (this.keys.ArrowRight)
      this.paddle.x = Math.min(
        this.canvas.width - this.paddle.w,
        this.paddle.x + PADDLE_SPEED * dt,
      );

    this.ball.x += this.ball.vx * dt;
    this.ball.y += this.ball.vy * dt;

    if (this.ball.x <= 0) {
      this.ball.x = 0;
      this.ball.vx = Math.abs(this.ball.vx);
      this.playSound(this.bounceSound);
    }
    if (this.ball.x + this.ball.w >= this.canvas.width) {
      this.ball.x = this.canvas.width - this.ball.w;
      this.ball.vx = -Math.abs(this.ball.vx);
      this.playSound(this.bounceSound);
    }
    if (this.ball.y <= 0) {
      this.ball.y = 0;
      this.ball.vy = Math.abs(this.ball.vy);
      this.playSound(this.bounceSound);
    }

    if (
      this.ball.vy > 0 &&
      this.ball.x + this.ball.w > this.paddle.x &&
      this.ball.x < this.paddle.x + this.paddle.w &&
      this.ball.y + this.ball.h >= this.paddle.y &&
      this.ball.y + this.ball.h <= this.paddle.y + this.paddle.h + 8
    ) {
      this.ball.y = this.paddle.y - this.ball.h;
      this.ball.vy = -Math.abs(this.ball.vy);
      this.playSound(this.bounceSound);
    }

    for (const block of this.blocks) {
      if (!block.alive) continue;
      if (this.collideAABB(block)) {
        block.alive = false;
        this.explosions.push({
          x: block.x,
          y: block.y,
          w: block.w,
          h: block.h,
          color: block.color,
          elapsed: 0,
        });
        this.score += 10;
        this.ball.vy = -this.ball.vy;
        this.playSound(this.breakSound);
        if (this.blocks.every((b) => !b.alive)) {
          if (this.currentLevel < 5) {
            this.loadLevel(this.currentLevel + 1);
          } else {
            this.endGame();
            return;
          }
        }
        break;
      }
    }

    for (const exp of this.explosions) exp.elapsed += dt * 1000;
    this.explosions = this.explosions.filter((exp) => exp.elapsed < EXPLOSION_DURATION);

    if (this.ball.y > this.canvas.height) {
      this.lives--;
      if (this.lives <= 0) {
        this.lives = 0;
        this.endGame();
        return;
      }
      this.initBall();
    }

    this.notifyStateChange();
  }

  private draw() {
    const ctx = this.ctx;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    for (const block of this.blocks) {
      if (block.alive) drawSprite(ctx, "block_" + block.color, block.x, block.y, block.w, block.h);
    }

    for (const exp of this.explosions) {
      const frameIndex = Math.min(Math.floor((exp.elapsed / EXPLOSION_DURATION) * 4), 3);
      drawFrame(ctx, EXPLOSION_FRAMES[exp.color][frameIndex], exp.x, exp.y, exp.w, exp.h);
    }

    drawSprite(ctx, "paddle", this.paddle.x, this.paddle.y, this.paddle.w, this.paddle.h);
    drawSprite(ctx, "ball", this.ball.x, this.ball.y, this.ball.w, this.ball.h);

    ctx.fillStyle = "#fff";
    ctx.font = "bold 18px monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("Score: " + this.score, 10, 10);
    ctx.textAlign = "center";
    ctx.fillText("Nivel: " + this.currentLevel, this.canvas.width / 2, 10);

    const ballSize = 16;
    const ballSpacing = 4;
    for (let i = 0; i < this.lives; i++) {
      const bx = this.canvas.width - 10 - (this.lives - i) * (ballSize + ballSpacing);
      drawSprite(ctx, "ball", bx, 10, ballSize, ballSize);
    }
  }

  private loop = (ts: number) => {
    if (this.lastTime === null) {
      this.lastTime = ts;
      this.draw();
      if (this.running) this.rafId = requestAnimationFrame(this.loop);
      return;
    }

    const dt = (ts - this.lastTime) / 1000;
    this.lastTime = ts;

    this.update(dt);
    this.draw();

    if (this.running) this.rafId = requestAnimationFrame(this.loop);
  };
}
