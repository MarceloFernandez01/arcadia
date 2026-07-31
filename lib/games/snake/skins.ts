import type { SkinId } from "@/lib/games/skins";

/**
 * Tratamiento aplicado al atlas de frutas al generar la variante teñida del skin.
 * `filter` usa la sintaxis de `CanvasRenderingContext2D.filter`; `overlay` se pinta con
 * `source-atop` para respetar el alfa del sprite. Ambos en `null` significa sprite original.
 */
export interface FruitTint {
  filter: string | null;
  overlay: string | null;
  /** Color del `shadowColor` al pintar la fruta; solo se nota si `glow > 0`. */
  glowColor: string;
}

export interface SnakePalette {
  /** `null` deja el canvas transparente y muestra el fondo de la plataforma. */
  background: string | null;
  grid: string;
  snakeHead: string;
  snakeBody: string;
  fruit: FruitTint;
  /** Radio de `shadowBlur`; 0 desactiva el resplandor. */
  glow: number;
}

export const SNAKE_SKINS: Record<SkinId, SnakePalette> = {
  clasico: {
    background: null,
    grid: "rgba(255,255,255,0.08)",
    snakeHead: "#ffd54f",
    snakeBody: "#ffd54f",
    fruit: { filter: null, overlay: null, glowColor: "#ffffff" },
    glow: 0,
  },
  retro: {
    background: "#0d1410",
    grid: "rgba(155,188,99,0.14)",
    snakeHead: "#d8e8b8",
    snakeBody: "#9bbc63",
    fruit: {
      filter: "saturate(0.55) brightness(1.05) contrast(1.05)",
      overlay: null,
      glowColor: "#d8e8b8",
    },
    glow: 0,
  },
  neon: {
    background: "#05050a",
    grid: "rgba(0,245,255,0.14)",
    snakeHead: "#f6ff00",
    snakeBody: "#39ff14",
    fruit: {
      filter: "saturate(1.9) brightness(1.2)",
      overlay: "rgba(255,47,208,0.12)",
      glowColor: "#ff2fd0",
    },
    glow: 12,
  },
};
