import { ArkanoidEngine } from "@/lib/games/arkanoid/engine";
import { AsteroidsEngine } from "@/lib/games/asteroids/engine";
import { FroggerEngine } from "@/lib/games/frogger/engine";
import { SnakeEngine } from "@/lib/games/snake/engine";
import { CANONICAL_SKINS } from "@/lib/games/skins";
import { TetrisEngine } from "@/lib/games/tetris/engine";
import type {
  ArcadeGameEngine,
  ArcadeGameEngineOptions,
  EngineState,
  TouchControlsConfig,
} from "@/lib/games/types";

export interface GameRegistryEntry {
  width: number;
  height: number;
  secondaryCanvas?: { width: number; height: number; label: string };
  colorSchemes?: { id: string; label: string }[];
  touchControls?: TouchControlsConfig;
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
    colorSchemes: CANONICAL_SKINS,
    touchControls: {
      dpadEnabled: ["left", "right"],
      actions: [
        { code: "Space", key: " ", label: "DISPARAR", repeat: true },
        { code: "ArrowUp", key: "ArrowUp", label: "AVANZAR" },
      ],
    },
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
        initialColorScheme: options.initialColorScheme,
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
    touchControls: {
      dpadEnabled: ["left", "right", "down"],
      dpadRepeat: true,
      actions: [
        { code: "ArrowUp", key: "ArrowUp", label: "ROTAR" },
        { code: "Space", key: " ", label: "CAÍDA DURA" },
      ],
    },
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
    colorSchemes: CANONICAL_SKINS,
    touchControls: {
      dpadEnabled: ["left", "right"],
      actions: [],
    },
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
  snake: {
    width: 600,
    height: 600,
    colorSchemes: CANONICAL_SKINS,
    touchControls: {
      dpadEnabled: ["up", "down", "left", "right"],
      actions: [],
    },
    initialState: {
      score: 0,
      stats: [{ key: "length", label: "Longitud", value: "1" }],
    },
    create(canvas, options) {
      return new SnakeEngine(canvas, options);
    },
  },
  frogger: {
    width: 520,
    height: 560,
    initialState: {
      score: 0,
      stats: [
        { key: "lives", label: "Vidas", value: "♥ ♥ ♥" },
        { key: "level", label: "Nivel", value: "01" },
        { key: "time", label: "Tiempo", value: "30" },
        { key: "homes", label: "Casillas", value: "0/5" },
      ],
    },
    create(canvas, options) {
      return new FroggerEngine(canvas, options);
    },
  },
};
