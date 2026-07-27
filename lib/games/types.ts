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
}

export interface ArcadeGameEngine {
  start(): void;
  pause(): void;
  resume(): void;
  restart(): void;
  destroy(): void;
}
