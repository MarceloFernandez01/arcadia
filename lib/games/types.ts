export interface EngineHudStat {
  key: string;
  label: string;
  value: string;
}

export interface EngineState {
  score: number;
  stats: EngineHudStat[];
}

export interface ArcadeGameEngineOptions {
  onStateChange: (state: EngineState) => void;
  onGameOver: (finalScore: number) => void;
  initialColorScheme?: string;
}

export interface ArcadeGameEngine {
  start(): void;
  pause(): void;
  resume(): void;
  restart(): void;
  destroy(): void;
  setColorScheme?(scheme: string): void;
}

export interface TouchButton {
  code: string;
  key: string;
  label: string;
  repeat?: boolean;
}

export interface TouchControlsConfig {
  dpadEnabled: ("up" | "down" | "left" | "right")[];
  dpadRepeat?: boolean;
  actions: TouchButton[];
}
