import { ArkanoidEngine } from "@/lib/games/arkanoid/engine";
import { AsteroidsEngine } from "@/lib/games/asteroids/engine";
import { TetrisEngine } from "@/lib/games/tetris/engine";
import type { ArcadeGameEngine, ArcadeGameEngineOptions, EngineState } from "@/lib/games/types";

export interface GameRegistryEntry {
  width: number;
  height: number;
  secondaryCanvas?: { width: number; height: number; label: string };
  colorSchemes?: { id: string; label: string }[];
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
  tetris: {
    width: 300,
    height: 600,
    secondaryCanvas: { width: 120, height: 120, label: "Siguiente" },
    colorSchemes: [
      { id: "retro", label: "Retro" },
      { id: "normal", label: "Normal" },
      { id: "pastel", label: "Pastel" },
      { id: "neon", label: "Neón" },
    ],
    initialState: {
      score: 0,
      stats: [
        { key: "lines", label: "Líneas", value: "0" },
        { key: "level", label: "Nivel", value: "01" },
      ],
    },
    create(canvas, options, secondaryCanvas) {
      if (!secondaryCanvas) {
        throw new Error("Tetris requiere un canvas secundario para la pieza siguiente");
      }
      return new TetrisEngine(canvas, secondaryCanvas, options);
    },
  },
  arkanoid: {
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
      return new ArkanoidEngine(canvas, options);
    },
  },
};
