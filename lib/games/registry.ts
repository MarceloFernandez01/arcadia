import { AsteroidsEngine } from "@/lib/games/asteroids/engine";
import type { ArcadeGameEngine, ArcadeGameEngineOptions, EngineState } from "@/lib/games/types";

export interface GameRegistryEntry {
  width: number;
  height: number;
  secondaryCanvas?: { width: number; height: number; label: string };
  initialState: EngineState;
  create(
    canvas: HTMLCanvasElement,
    options: ArcadeGameEngineOptions,
    secondaryCanvas?: HTMLCanvasElement,
  ): ArcadeGameEngine;
}

export const GAME_REGISTRY: Record<string, GameRegistryEntry> = {
  asteroides: {
    width: 800,
    height: 600,
    initialState: {
      score: 0,
      stats: [
        { key: "lives", label: "Vidas", value: "♥ ♥ ♥" },
        { key: "level", label: "Nivel", value: "01" },
      ],
    },
    create(canvas, options) {
      return new AsteroidsEngine(canvas, {
        onStateChange: (state) => {
          options.onStateChange({
            score: state.score,
            stats: [
              { key: "lives", label: "Vidas", value: Array(state.lives).fill("♥").join(" ") },
              { key: "level", label: "Nivel", value: state.level.toString().padStart(2, "0") },
            ],
          });
        },
        onGameOver: options.onGameOver,
      });
    },
  },
};
