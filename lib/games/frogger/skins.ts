import type { SkinId } from "@/lib/games/skins";

export interface FroggerPalette {
  background: string;
  road: string;
  roadLine: string;
  river: string;
  safe: string;
  hedge: string;
  homeOpen: string;
  homeOpenBorder: string;
  frog: string;
  frogEye: string;
  log: string;
  logBorder: string;
  turtle: string;
  turtleShell: string;
  turtleWarn: string;
  turtleSubmerged: string;
  /** Un color por carril de vehículos, recorrido cíclicamente de arriba hacia abajo. */
  vehicles: string[];
  timerTrack: string;
  timerFull: string;
  timerLow: string;
  /** Radio de `shadowBlur` aplicado a los elementos de primer plano; 0 desactiva el resplandor. */
  glow: number;
}

export const FROGGER_SKINS: Record<SkinId, FroggerPalette> = {
  clasico: {
    background: "#0a0a18",
    road: "#1c1c26",
    roadLine: "#3a3a46",
    river: "#0b2e52",
    safe: "#12321f",
    hedge: "#0a2015",
    homeOpen: "#1f8a4c",
    homeOpenBorder: "#4ade80",
    frog: "#22c55e",
    frogEye: "#eab308",
    log: "#6b4a35",
    logBorder: "#2e1c10",
    turtle: "#2f9e44",
    turtleShell: "#1f6e2e",
    turtleWarn: "#8a5a1f",
    turtleSubmerged: "#0e4a63",
    vehicles: ["#ff006e", "#f5ff00", "#00f5ff"],
    timerTrack: "#0a2015",
    timerFull: "#00f5ff",
    timerLow: "#ff006e",
    glow: 0,
  },
  retro: {
    background: "#101418",
    road: "#1a1e22",
    roadLine: "#7a8288",
    river: "#16324a",
    safe: "#1d3324",
    hedge: "#12261a",
    homeOpen: "#3f8a58",
    homeOpenBorder: "#a8d8a0",
    frog: "#9bbc63",
    frogEye: "#2a3418",
    log: "#b08050",
    logBorder: "#a07a4a",
    turtle: "#7ca85c",
    turtleShell: "#5f8f48",
    turtleWarn: "#c08a48",
    turtleSubmerged: "#6a90a8",
    vehicles: ["#c85c5c", "#d8c86c", "#7ea8c8"],
    timerTrack: "#12261a",
    timerFull: "#8cc0c8",
    timerLow: "#d07070",
    glow: 0,
  },
  neon: {
    background: "#05050a",
    road: "#0d0d16",
    roadLine: "#6a6ad0",
    river: "#071a33",
    safe: "#0a2418",
    hedge: "#060f0a",
    homeOpen: "#1a7a52",
    homeOpenBorder: "#39ff14",
    frog: "#39ff14",
    frogEye: "#05140a",
    log: "#ff9e2f",
    logBorder: "#ffd8a0",
    turtle: "#00f5ff",
    turtleShell: "#0aa8c0",
    turtleWarn: "#ff9e2f",
    turtleSubmerged: "#4f8bff",
    vehicles: ["#ff2fd0", "#f6ff00", "#00f5ff"],
    timerTrack: "#10102a",
    timerFull: "#00f5ff",
    timerLow: "#ff2fd0",
    glow: 12,
  },
};
