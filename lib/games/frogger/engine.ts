import {
  CELL_SIZE,
  GRID_COLS,
  GRID_ROWS,
  LANES,
  LEVEL_SPEED_MULT,
  LEVEL_TIME_MS,
  type LaneDef,
} from "@/lib/games/frogger/lanes";
import { FROGGER_SKINS, type FroggerPalette } from "@/lib/games/frogger/skins";
import { resolveSkin, type SkinId } from "@/lib/games/skins";
import type { ArcadeGameEngine, ArcadeGameEngineOptions, EngineState } from "@/lib/games/types";

const GAME_ID = "frogger";
const CANVAS_WIDTH = GRID_COLS * CELL_SIZE;
const CANVAS_HEIGHT = GRID_ROWS * CELL_SIZE;
const START_COL = Math.floor(GRID_COLS / 2);
const SIDEWALK_ROW = 12;
const TIMER_ROW = 13;
const TOTAL_LIVES = 3;
const TOTAL_HOMES = 5;
const HOME_SLOT_COLS = [0, 3, 6, 9, 12];

/** Índice dentro de `palette.vehicles` para cada carril de vehículos. */
const ROAD_COLOR_INDEX: Record<number, number> = { 7: 0, 8: 1, 9: 2, 10: 0, 11: 1 };

const HOP_DURATION_MS = 100;

const TURTLE_CYCLE_BASE_MS = 4000;
const TURTLE_CYCLE_MIN_MS = 2600;
const TURTLE_WARN_RATIO = 0.2;
// En los primeros niveles las tortugas pasan menos tiempo sumergidas (12% del ciclo
// en vez de 20%); a partir del nivel 6 vuelve al 20% original.
const TURTLE_SUBMERGED_RATIO_MIN = 0.08;
const TURTLE_SUBMERGED_RATIO_MAX = 0.2;
const TURTLE_SUBMERGED_RATIO_LEVEL_STEP = 0.024;

interface HopDirection {
  dCol: number;
  dRow: number;
}

const KEY_DIRECTIONS: Record<string, HopDirection> = {
  ArrowUp: { dCol: 0, dRow: -1 },
  ArrowDown: { dCol: 0, dRow: 1 },
  ArrowLeft: { dCol: -1, dRow: 0 },
  ArrowRight: { dCol: 1, dRow: 0 },
  KeyW: { dCol: 0, dRow: -1 },
  KeyS: { dCol: 0, dRow: 1 },
  KeyA: { dCol: -1, dRow: 0 },
  KeyD: { dCol: 1, dRow: 0 },
};

interface LaneObject {
  x: number;
  width: number;
  submerged?: boolean;
  phaseMs?: number;
}

interface Frog {
  col: number;
  row: number;
  offsetX: number;
  hopFromMs: number;
  hopFromCol: number;
  hopFromRow: number;
}

export class FroggerEngine implements ArcadeGameEngine {
  private ctx: CanvasRenderingContext2D;
  private staticBoardCanvas: HTMLCanvasElement;
  private staticBoardCtx: CanvasRenderingContext2D;
  private options: ArcadeGameEngineOptions;
  private skin: SkinId;
  private palette: FroggerPalette;

  private frog!: Frog;
  private laneObjects!: LaneObject[][];
  private queuedHop: HopDirection | null = null;
  private homesOccupied!: boolean[];
  private homeSlotColSet!: Set<number>;
  private minRowReached = SIDEWALK_ROW;
  private score = 0;
  private lives = TOTAL_LIVES;
  private level = 1;
  private homes = 0;
  private timeLeftMs = 0;
  private gameOver = false;
  private lastNotified: EngineState | null = null;

  private lastTime: number | null = null;
  private rafId: number | null = null;
  private running = false;

  private onKeyDown = (e: KeyboardEvent) => {
    if (!this.running) return;
    const dir = KEY_DIRECTIONS[e.code];
    if (!dir) return;
    e.preventDefault();
    if (this.frog.hopFromMs > 0) {
      this.queuedHop = dir;
    } else {
      this.tryHop(dir, performance.now());
    }
  };

  constructor(canvas: HTMLCanvasElement, options: ArcadeGameEngineOptions) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No se pudo obtener el contexto 2D del canvas");
    this.ctx = ctx;
    this.staticBoardCanvas = document.createElement("canvas");
    this.staticBoardCanvas.width = CANVAS_WIDTH;
    this.staticBoardCanvas.height = CANVAS_HEIGHT;
    const staticCtx = this.staticBoardCanvas.getContext("2d");
    if (!staticCtx) throw new Error("No se pudo obtener el contexto 2D del canvas offscreen");
    this.staticBoardCtx = staticCtx;
    this.options = options;
    this.skin = resolveSkin(options.initialColorScheme, GAME_ID);
    this.palette = FROGGER_SKINS[this.skin];

    window.addEventListener("keydown", this.onKeyDown);

    this.initGame();
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = null;
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
    if (this.running) return;
    this.running = true;
    this.lastTime = null;
    this.rafId = requestAnimationFrame(this.loop);
  }

  restart() {
    this.pause();
    this.initGame();
  }

  setColorScheme(scheme: string) {
    this.skin = resolveSkin(scheme, GAME_ID);
    this.palette = FROGGER_SKINS[this.skin];
    this.renderStaticBoard();
    // Redibuja de inmediato para que el cambio se vea también con el juego en pausa.
    this.draw();
  }

  destroy() {
    this.pause();
    window.removeEventListener("keydown", this.onKeyDown);
  }

  private initGame() {
    this.laneObjects = LANES.map((lane) => this.initLaneObjects(lane));
    this.homesOccupied = Array(TOTAL_HOMES).fill(false);
    this.homeSlotColSet = new Set(HOME_SLOT_COLS);
    this.score = 0;
    this.lives = TOTAL_LIVES;
    this.level = 1;
    this.homes = 0;
    this.gameOver = false;
    this.lastNotified = null;
    this.respawnFrog();
    this.renderStaticBoard();
    this.notifyStateChange();
    this.draw();
  }

  private respawnFrog() {
    this.frog = {
      col: START_COL,
      row: SIDEWALK_ROW,
      offsetX: 0,
      hopFromMs: 0,
      hopFromCol: START_COL,
      hopFromRow: SIDEWALK_ROW,
    };
    this.queuedHop = null;
    this.minRowReached = SIDEWALK_ROW;
    this.timeLeftMs = LEVEL_TIME_MS(this.level);
  }

  private killFrog() {
    if (this.gameOver) return;
    this.lives -= 1;
    if (this.lives <= 0) {
      this.lives = 0;
      this.notifyStateChange();
      this.endGame();
      return;
    }
    this.respawnFrog();
    this.notifyStateChange();
  }

  private endGame() {
    if (this.gameOver) return;
    this.gameOver = true;
    this.pause();
    this.options.onGameOver(this.score);
  }

  private tryHop(dir: HopDirection, now: number) {
    // Recalibra la celda de origen desde la posición real en píxeles antes de saltar,
    // para no arrastrar un desalineamiento acumulado por el offset de la plataforma.
    const realCx = (this.frog.col + 0.5) * CELL_SIZE + this.frog.offsetX;
    const originCol = Math.min(GRID_COLS - 1, Math.max(0, Math.round(realCx / CELL_SIZE - 0.5)));
    const targetCol = originCol + dir.dCol;
    const targetRow = this.frog.row + dir.dRow;
    if (targetCol < 0 || targetCol >= GRID_COLS || targetRow < 0 || targetRow > SIDEWALK_ROW) {
      return;
    }
    this.frog.hopFromCol = originCol;
    this.frog.hopFromRow = this.frog.row;
    this.frog.col = targetCol;
    this.frog.row = targetRow;
    this.frog.offsetX = 0;
    this.frog.hopFromMs = now;

    if (targetRow < this.minRowReached) {
      this.minRowReached = targetRow;
      this.score += 10;
    }
  }

  private settleHop(now: number) {
    if (this.frog.hopFromMs === 0) return;
    const elapsed = now - this.frog.hopFromMs;
    if (elapsed < HOP_DURATION_MS) return;
    this.frog.hopFromMs = 0;
  }

  private consumeQueuedHop(now: number) {
    if (this.frog.hopFromMs !== 0 || !this.queuedHop) return;
    const dir = this.queuedHop;
    this.queuedHop = null;
    this.tryHop(dir, now);
  }

  private frogDrawPosition(): { cx: number; cy: number } {
    const baseX = (this.frog.col + 0.5) * CELL_SIZE;
    const baseY = (this.frog.row + 0.5) * CELL_SIZE;
    if (this.frog.hopFromMs === 0) {
      return { cx: baseX + this.frog.offsetX, cy: baseY };
    }
    const now = this.lastTime ?? performance.now();
    const progress = Math.min(1, (now - this.frog.hopFromMs) / HOP_DURATION_MS);
    const fromX = (this.frog.hopFromCol + 0.5) * CELL_SIZE;
    const fromY = (this.frog.hopFromRow + 0.5) * CELL_SIZE;
    return { cx: fromX + (baseX - fromX) * progress, cy: fromY + (baseY - fromY) * progress };
  }

  private initLaneObjects(lane: LaneDef): LaneObject[] {
    if (lane.kind !== "road" && lane.kind !== "log" && lane.kind !== "turtle") return [];
    const width = lane.objectCells * CELL_SIZE;
    const period = (lane.objectCells + lane.gapCells) * CELL_SIZE;
    const count = Math.ceil(CANVAS_WIDTH / period) + 2;
    return Array.from({ length: count }, (_, i) => ({
      x: i * period,
      width,
      ...(lane.kind === "turtle"
        ? { phaseMs: (i * TURTLE_CYCLE_BASE_MS) / count, submerged: false }
        : {}),
    }));
  }

  private laneRingLength(lane: LaneDef): number {
    const period = (lane.objectCells + lane.gapCells) * CELL_SIZE;
    const count = this.laneObjects[lane.row]?.length ?? 0;
    return period * count;
  }

  private turtleCycleMs(): number {
    return Math.max(TURTLE_CYCLE_BASE_MS * Math.pow(0.95, this.level - 1), TURTLE_CYCLE_MIN_MS);
  }

  private turtleSubmergedRatio(): number {
    return Math.min(
      TURTLE_SUBMERGED_RATIO_MAX,
      TURTLE_SUBMERGED_RATIO_MIN + TURTLE_SUBMERGED_RATIO_LEVEL_STEP * (this.level - 1),
    );
  }

  private updateLanes(dt: number) {
    const mult = LEVEL_SPEED_MULT(this.level);
    const turtleCycle = this.turtleCycleMs();
    const submergedStart = turtleCycle * (1 - this.turtleSubmergedRatio());
    for (const lane of LANES) {
      if (lane.kind !== "road" && lane.kind !== "log" && lane.kind !== "turtle") continue;
      const objects = this.laneObjects[lane.row];
      const ringLength = this.laneRingLength(lane);
      const dx = lane.direction * lane.speed * mult * (dt / 1000);
      for (const obj of objects) {
        obj.x += dx;
        if (lane.direction === 1 && obj.x > CANVAS_WIDTH) {
          obj.x -= ringLength;
        } else if (lane.direction === -1 && obj.x + obj.width < 0) {
          obj.x += ringLength;
        }
        if (lane.kind === "turtle") {
          obj.phaseMs = ((obj.phaseMs ?? 0) + dt) % turtleCycle;
          obj.submerged = obj.phaseMs >= submergedStart;
        }
      }
    }
  }

  private updateFrogSupport(dt: number) {
    const lane = LANES[this.frog.row];
    if (!lane) return;
    if (lane.kind === "road") {
      this.checkVehicleCollision(lane);
    } else if (lane.kind === "log" || lane.kind === "turtle") {
      this.checkRiverSupport(lane, dt);
    } else if (lane.kind === "home") {
      this.checkHomeArrival();
    }
  }

  private checkHomeArrival() {
    if (this.frog.hopFromMs > 0) return;
    const slotIndex = HOME_SLOT_COLS.indexOf(this.frog.col);
    if (slotIndex === -1 || this.homesOccupied[slotIndex]) {
      this.killFrog();
      return;
    }
    this.homesOccupied[slotIndex] = true;
    this.homes += 1;
    this.score += 50 + 10 * Math.floor(this.timeLeftMs / 500);
    if (this.homes >= TOTAL_HOMES) {
      this.score += 1000;
      this.level += 1;
      this.homesOccupied = Array(TOTAL_HOMES).fill(false);
      this.homes = 0;
    }
    this.renderStaticBoard();
    this.respawnFrog();
  }

  private updateTimer(dt: number) {
    if (this.timeLeftMs <= 0) return;
    this.timeLeftMs = Math.max(0, this.timeLeftMs - dt);
    if (this.timeLeftMs === 0) {
      this.killFrog();
    }
  }

  private checkVehicleCollision(lane: LaneDef) {
    const { cx } = this.frogDrawPosition();
    const frogLeft = cx - 14;
    const frogRight = cx + 14;
    const margin = 4;
    for (const obj of this.laneObjects[lane.row]) {
      const vehicleLeft = obj.x + margin;
      const vehicleRight = obj.x + obj.width - margin;
      if (frogRight > vehicleLeft && frogLeft < vehicleRight) {
        this.killFrog();
        return;
      }
    }
  }

  private checkRiverSupport(lane: LaneDef, dt: number) {
    if (this.frog.hopFromMs > 0) return;
    const cx = (this.frog.col + 0.5) * CELL_SIZE + this.frog.offsetX;
    const frogLeft = cx - 14;
    const frogRight = cx + 14;
    // Solapamiento con la hitbox completa (no solo el centro): aterrizar cerca del
    // borde de un tronco/tortuga sigue contando como soporte, igual que la fila de
    // vehículos ya usa solapamiento en vez de un único punto.
    const support = this.laneObjects[lane.row].find(
      (obj) => !obj.submerged && frogRight > obj.x && frogLeft < obj.x + obj.width,
    );
    if (!support) {
      this.killFrog();
      return;
    }
    const mult = LEVEL_SPEED_MULT(this.level);
    this.frog.offsetX += lane.direction * lane.speed * mult * (dt / 1000);
    const newCx = (this.frog.col + 0.5) * CELL_SIZE + this.frog.offsetX;
    if (newCx < 0 || newCx > CANVAS_WIDTH) {
      this.killFrog();
    }
  }

  private notifyStateChange() {
    const current: EngineState = {
      score: this.score,
      stats: [
        { key: "lives", label: "Vidas", value: "♥ ".repeat(this.lives).trim() },
        { key: "level", label: "Nivel", value: this.level.toString().padStart(2, "0") },
        { key: "time", label: "Tiempo", value: Math.ceil(this.timeLeftMs / 1000).toString() },
        { key: "homes", label: "Casillas", value: `${this.homes}/${TOTAL_HOMES}` },
      ],
    };
    const prev = this.lastNotified;
    if (
      !prev ||
      prev.score !== current.score ||
      current.stats.some((stat, i) => prev.stats[i].value !== stat.value)
    ) {
      this.lastNotified = current;
      this.options.onStateChange(current);
    }
  }

  /** Activa el resplandor del skin; con `glow: 0` no altera el trazo. */
  private applyGlow(color: string) {
    this.ctx.shadowBlur = this.palette.glow;
    this.ctx.shadowColor = color;
  }

  private clearGlow() {
    this.ctx.shadowBlur = 0;
  }

  private drawBoard() {
    const ctx = this.ctx;
    const palette = this.palette;
    ctx.fillStyle = palette.background;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    for (const lane of LANES) {
      const y = lane.row * CELL_SIZE;
      if (lane.kind === "home") {
        ctx.fillStyle = palette.safe;
        ctx.fillRect(0, y, CANVAS_WIDTH, CELL_SIZE);
      } else if (lane.kind === "log" || lane.kind === "turtle") {
        ctx.fillStyle = palette.river;
        ctx.fillRect(0, y, CANVAS_WIDTH, CELL_SIZE);
      } else if (lane.kind === "safe") {
        ctx.fillStyle = palette.safe;
        ctx.fillRect(0, y, CANVAS_WIDTH, CELL_SIZE);
      } else if (lane.kind === "road") {
        ctx.fillStyle = palette.road;
        ctx.fillRect(0, y, CANVAS_WIDTH, CELL_SIZE);
        ctx.strokeStyle = palette.roadLine;
        ctx.setLineDash([12, 10]);
        ctx.beginPath();
        ctx.moveTo(0, y + CELL_SIZE);
        ctx.lineTo(CANVAS_WIDTH, y + CELL_SIZE);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    this.drawHomeSlots();
  }

  private drawHomeSlots() {
    const ctx = this.ctx;
    const palette = this.palette;
    const y = 0;
    for (let col = 0; col < GRID_COLS; col++) {
      if (this.homeSlotColSet.has(col)) continue;
      ctx.fillStyle = palette.hedge;
      ctx.fillRect(col * CELL_SIZE, y, CELL_SIZE, CELL_SIZE);
    }
    HOME_SLOT_COLS.forEach((col, i) => {
      const x = col * CELL_SIZE;
      ctx.fillStyle = palette.homeOpen;
      ctx.fillRect(x + 3, y + 3, CELL_SIZE - 6, CELL_SIZE - 6);
      ctx.strokeStyle = palette.homeOpenBorder;
      ctx.lineWidth = 2;
      this.applyGlow(palette.homeOpenBorder);
      ctx.strokeRect(x + 3, y + 3, CELL_SIZE - 6, CELL_SIZE - 6);
      this.clearGlow();
      if (this.homesOccupied[i]) {
        const cx = x + CELL_SIZE / 2;
        const cy = y + CELL_SIZE / 2;
        ctx.fillStyle = palette.frog;
        this.applyGlow(palette.frog);
        ctx.fillRect(cx - 11, cy - 11, 22, 22);
        this.clearGlow();
        ctx.fillStyle = palette.frogEye;
        ctx.fillRect(cx - 8, cy - 8, 4, 4);
        ctx.fillRect(cx + 4, cy - 8, 4, 4);
      }
    });
  }

  private drawTimerBar() {
    const ctx = this.ctx;
    const totalMs = LEVEL_TIME_MS(this.level);
    const ratio = totalMs > 0 ? Math.max(0, Math.min(1, this.timeLeftMs / totalMs)) : 0;
    const y = TIMER_ROW * CELL_SIZE;
    const trackHeight = CELL_SIZE - 16;
    const trackY = y + 8;
    ctx.fillStyle = this.palette.timerTrack;
    ctx.fillRect(8, trackY, CANVAS_WIDTH - 16, trackHeight);
    // La barra se acorta de derecha a izquierda: el extremo izquierdo queda fijo
    // y el ancho visible se reduce a medida que se consume el tiempo restante.
    const barWidth = (CANVAS_WIDTH - 16) * ratio;
    const barColor = ratio < 0.25 ? this.palette.timerLow : this.palette.timerFull;
    ctx.fillStyle = barColor;
    this.applyGlow(barColor);
    ctx.fillRect(8, trackY, barWidth, trackHeight);
    this.clearGlow();
  }

  private drawFrog() {
    const ctx = this.ctx;
    const palette = this.palette;
    const { cx, cy } = this.frogDrawPosition();
    ctx.fillStyle = palette.frog;
    this.applyGlow(palette.frog);
    ctx.fillRect(cx - 14, cy - 14, 28, 28);
    this.clearGlow();
    ctx.fillStyle = palette.frogEye;
    ctx.fillRect(cx - 10, cy - 10, 5, 5);
    ctx.fillRect(cx + 5, cy - 10, 5, 5);
  }

  private drawLaneObjects() {
    const ctx = this.ctx;
    const palette = this.palette;
    for (const lane of LANES) {
      const objects = this.laneObjects[lane.row];
      if (objects.length === 0) continue;
      const y = lane.row * CELL_SIZE;
      const height = CELL_SIZE - 8;
      if (lane.kind === "road") {
        const vehicleColor =
          palette.vehicles[(ROAD_COLOR_INDEX[lane.row] ?? 0) % palette.vehicles.length];
        ctx.fillStyle = vehicleColor;
        this.applyGlow(vehicleColor);
        for (const obj of objects) {
          ctx.fillRect(obj.x, y + 4, obj.width, height);
        }
        this.clearGlow();
      } else if (lane.kind === "log") {
        ctx.fillStyle = palette.log;
        ctx.strokeStyle = palette.logBorder;
        ctx.lineWidth = 2;
        this.applyGlow(palette.log);
        for (const obj of objects) {
          ctx.fillRect(obj.x, y + 4, obj.width, height);
          ctx.strokeRect(obj.x, y + 4, obj.width, height);
        }
        this.clearGlow();
      } else if (lane.kind === "turtle") {
        const inset = 6;
        const turtleHeight = height - 8;
        const cycle = this.turtleCycleMs();
        const floatEnd = cycle * (1 - TURTLE_WARN_RATIO - this.turtleSubmergedRatio());
        for (const obj of objects) {
          const phase = obj.phaseMs ?? 0;
          const warning = !obj.submerged && phase >= floatEnd;
          if (obj.submerged) {
            ctx.strokeStyle = palette.turtleSubmerged;
            ctx.lineWidth = 1;
            this.applyGlow(palette.turtleSubmerged);
            ctx.strokeRect(obj.x + inset, y + 8, obj.width - inset * 2, turtleHeight);
            this.clearGlow();
            continue;
          }
          const blinkOn = Math.floor(phase / 150) % 2 === 0;
          const bodyColor = warning && !blinkOn ? palette.turtleWarn : palette.turtle;
          ctx.fillStyle = bodyColor;
          this.applyGlow(bodyColor);
          ctx.fillRect(obj.x + inset, y + 8, obj.width - inset * 2, turtleHeight);
          this.clearGlow();
          ctx.fillStyle = palette.turtleShell;
          ctx.fillRect(obj.x + inset + 3, y + 11, obj.width - inset * 2 - 6, turtleHeight - 6);
        }
      }
    }
  }

  private renderStaticBoard() {
    const mainCtx = this.ctx;
    this.ctx = this.staticBoardCtx;
    this.drawBoard();
    this.ctx = mainCtx;
  }

  private draw() {
    this.ctx.drawImage(this.staticBoardCanvas, 0, 0);
    this.drawLaneObjects();
    this.drawTimerBar();
    this.drawFrog();
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

    this.updateLanes(dt);
    this.settleHop(ts);
    this.updateFrogSupport(dt);
    this.updateTimer(dt);
    this.consumeQueuedHop(ts);
    this.notifyStateChange();

    this.draw();
    if (this.running) this.rafId = requestAnimationFrame(this.loop);
  };
}
