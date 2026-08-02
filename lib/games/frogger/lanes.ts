export type LaneKind = "road" | "log" | "turtle" | "safe" | "home";

export interface LaneDef {
  row: number;
  kind: LaneKind;
  direction: 1 | -1;
  speed: number;
  objectCells: number;
  gapCells: number;
  style: string;
}

export const CELL_SIZE = 40;
export const GRID_COLS = 13;
export const GRID_ROWS = 14;

export const LANES: LaneDef[] = [
  { row: 0, kind: "home", direction: 1, speed: 0, objectCells: 0, gapCells: 0, style: "home" },
  { row: 1, kind: "log", direction: 1, speed: 55, objectCells: 3, gapCells: 5, style: "log" },
  {
    row: 2,
    kind: "turtle",
    direction: -1,
    speed: 70,
    objectCells: 3,
    gapCells: 4,
    style: "turtle",
  },
  { row: 3, kind: "log", direction: 1, speed: 85, objectCells: 4, gapCells: 4, style: "log" },
  { row: 4, kind: "log", direction: 1, speed: 110, objectCells: 2, gapCells: 6, style: "log" },
  {
    row: 5,
    kind: "turtle",
    direction: -1,
    speed: 65,
    objectCells: 2,
    gapCells: 4,
    style: "turtle",
  },
  { row: 6, kind: "safe", direction: 1, speed: 0, objectCells: 0, gapCells: 0, style: "median" },
  { row: 7, kind: "road", direction: 1, speed: 130, objectCells: 1, gapCells: 7, style: "buggy" },
  { row: 8, kind: "road", direction: -1, speed: 55, objectCells: 2, gapCells: 5, style: "truck" },
  { row: 9, kind: "road", direction: 1, speed: 75, objectCells: 1, gapCells: 5, style: "car" },
  {
    row: 10,
    kind: "road",
    direction: -1,
    speed: 90,
    objectCells: 1,
    gapCells: 6,
    style: "bulldozer",
  },
  { row: 11, kind: "road", direction: 1, speed: 60, objectCells: 1, gapCells: 4, style: "car" },
  { row: 12, kind: "safe", direction: 1, speed: 0, objectCells: 0, gapCells: 0, style: "sidewalk" },
  {
    row: 13,
    kind: "safe",
    direction: 1,
    speed: 0,
    objectCells: 0,
    gapCells: 0,
    style: "timer-strip",
  },
];

// Arranca más lento en los primeros niveles (0.7x) y alcanza el mismo techo (2.2x)
// en el nivel 9 que la curva original, para no romper el balance ya definido en niveles altos.
export const LEVEL_SPEED_MULT = (level: number): number =>
  Math.min(0.7 + 0.1875 * (level - 1), 2.2);

export const LEVEL_TIME_MS = (level: number): number => Math.max(40 - (level - 1), 20) * 1000;
