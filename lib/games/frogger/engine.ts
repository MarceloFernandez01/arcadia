import {
  CELL_SIZE,
  GRID_COLS,
  GRID_ROWS,
  LANES,
  LEVEL_SPEED_MULT,
  type LaneDef,
} from "@/lib/games/frogger/lanes";
import type { ArcadeGameEngine, ArcadeGameEngineOptions, EngineState } from "@/lib/games/types";

const CANVAS_WIDTH = GRID_COLS * CELL_SIZE;
const CANVAS_HEIGHT = GRID_ROWS * CELL_SIZE;
const START_COL = Math.floor(GRID_COLS / 2);
const SIDEWALK_ROW = 12;
const TOTAL_LIVES = 3;
const TOTAL_HOMES = 5;

const PALETTE = {
  background: "#0a0a18",
  road: "#1c1c26",
  roadLine: "#3a3a46",
  river: "#0b2e52",
  riverGlow: "#0ea5c9",
  safe: "#12321f",
  hedge: "#0a2015",
  frog: "#22c55e",
  frogEye: "#eab308",
  frogHome: "#1f8a4c",
  log: "#6b4a35",
  logBorder: "#2e1c10",
  turtle: "#2f9e44",
  turtleShell: "#1f6e2e",
  cyan: "#00f5ff",
  magenta: "#ff006e",
  yellow: "#f5ff00",
};

const ROAD_COLORS: Record<number, string> = {
  7: PALETTE.magenta,
  8: PALETTE.yellow,
  9: PALETTE.cyan,
  10: PALETTE.magenta,
  11: PALETTE.yellow,
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
}

export class FroggerEngine implements ArcadeGameEngine {
  private ctx: CanvasRenderingContext2D;
  private options: ArcadeGameEngineOptions;

  private frog!: Frog;
  private laneObjects!: LaneObject[][];
  private score = 0;
  private lives = TOTAL_LIVES;
  private level = 1;
  private homes = 0;
  private timeLeftMs = 0;
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

  destroy() {
    this.pause();
  }

  private initGame() {
    this.frog = { col: START_COL, row: SIDEWALK_ROW, offsetX: 0, hopFromMs: 0 };
    this.laneObjects = LANES.map((lane) => this.initLaneObjects(lane));
    this.score = 0;
    this.lives = TOTAL_LIVES;
    this.level = 1;
    this.homes = 0;
    this.timeLeftMs = 0;
    this.lastNotified = null;
    this.notifyStateChange();
    this.draw();
  }

  private initLaneObjects(lane: LaneDef): LaneObject[] {
    if (lane.kind !== "road" && lane.kind !== "log" && lane.kind !== "turtle") return [];
    const width = lane.objectCells * CELL_SIZE;
    const period = (lane.objectCells + lane.gapCells) * CELL_SIZE;
    const count = Math.ceil(CANVAS_WIDTH / period) + 2;
    return Array.from({ length: count }, (_, i) => ({ x: i * period, width }));
  }

  private laneRingLength(lane: LaneDef): number {
    const period = (lane.objectCells + lane.gapCells) * CELL_SIZE;
    const count = this.laneObjects[lane.row]?.length ?? 0;
    return period * count;
  }

  private updateLanes(dt: number) {
    const mult = LEVEL_SPEED_MULT(this.level);
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
      }
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

  private drawBoard() {
    const ctx = this.ctx;
    ctx.fillStyle = PALETTE.background;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    for (const lane of LANES) {
      const y = lane.row * CELL_SIZE;
      if (lane.kind === "home") {
        ctx.fillStyle = PALETTE.safe;
        ctx.fillRect(0, y, CANVAS_WIDTH, CELL_SIZE);
      } else if (lane.kind === "log" || lane.kind === "turtle") {
        ctx.fillStyle = PALETTE.river;
        ctx.fillRect(0, y, CANVAS_WIDTH, CELL_SIZE);
      } else if (lane.kind === "safe") {
        ctx.fillStyle = PALETTE.safe;
        ctx.fillRect(0, y, CANVAS_WIDTH, CELL_SIZE);
      } else if (lane.kind === "road") {
        ctx.fillStyle = PALETTE.road;
        ctx.fillRect(0, y, CANVAS_WIDTH, CELL_SIZE);
        ctx.strokeStyle = PALETTE.roadLine;
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
    const y = 0;
    for (let i = 0; i < TOTAL_HOMES; i++) {
      const slotCol = 1 + i * 2.5;
      const x = slotCol * CELL_SIZE;
      ctx.fillStyle = PALETTE.hedge;
      ctx.fillRect(x - CELL_SIZE / 2, y, CELL_SIZE, CELL_SIZE);
    }
  }

  private drawFrog() {
    const ctx = this.ctx;
    const cx = (this.frog.col + 0.5) * CELL_SIZE + this.frog.offsetX;
    const cy = (this.frog.row + 0.5) * CELL_SIZE;
    ctx.fillStyle = PALETTE.frog;
    ctx.fillRect(cx - 14, cy - 14, 28, 28);
    ctx.fillStyle = PALETTE.frogEye;
    ctx.fillRect(cx - 10, cy - 10, 5, 5);
    ctx.fillRect(cx + 5, cy - 10, 5, 5);
  }

  private drawLaneObjects() {
    const ctx = this.ctx;
    for (const lane of LANES) {
      const objects = this.laneObjects[lane.row];
      if (objects.length === 0) continue;
      const y = lane.row * CELL_SIZE;
      const height = CELL_SIZE - 8;
      if (lane.kind === "road") {
        ctx.fillStyle = ROAD_COLORS[lane.row] ?? PALETTE.cyan;
        for (const obj of objects) {
          ctx.fillRect(obj.x, y + 4, obj.width, height);
        }
      } else if (lane.kind === "log") {
        ctx.fillStyle = PALETTE.log;
        ctx.strokeStyle = PALETTE.logBorder;
        ctx.lineWidth = 2;
        for (const obj of objects) {
          ctx.fillRect(obj.x, y + 4, obj.width, height);
          ctx.strokeRect(obj.x, y + 4, obj.width, height);
        }
      } else if (lane.kind === "turtle") {
        const inset = 6;
        const turtleHeight = height - 8;
        ctx.fillStyle = PALETTE.turtle;
        for (const obj of objects) {
          ctx.fillRect(obj.x + inset, y + 8, obj.width - inset * 2, turtleHeight);
        }
        ctx.fillStyle = PALETTE.turtleShell;
        for (const obj of objects) {
          ctx.fillRect(obj.x + inset + 3, y + 11, obj.width - inset * 2 - 6, turtleHeight - 6);
        }
      }
    }
  }

  private draw() {
    this.drawBoard();
    this.drawLaneObjects();
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

    this.draw();
    if (this.running) this.rafId = requestAnimationFrame(this.loop);
  };
}
