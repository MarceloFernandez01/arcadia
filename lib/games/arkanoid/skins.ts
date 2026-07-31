import type { SkinId } from "@/lib/games/skins";

/** Claves de color de bloque que usan `levels.ts` y el atlas de explosiones. */
export type ArkanoidBlockColor =
  "gray" | "red" | "yellow" | "cyan" | "magenta" | "hotpink" | "green";

export interface ArkanoidPalette {
  background: string;
  blocks: Record<ArkanoidBlockColor, string>;
  paddle: string;
  ball: string;
  hud: string;
  /** Radio de `shadowBlur` aplicado a sprites y HUD; 0 desactiva el resplandor. */
  glow: number;
  /**
   * Opacidad del teñido sobre el spritesheet (0 = sprite original, 1 = color plano).
   * Un valor menor a 1 conserva el bisel del pixel art original.
   */
  tintStrength: number;
}

export const ARKANOID_SKINS: Record<SkinId, ArkanoidPalette> = {
  clasico: {
    background: "#000000",
    blocks: {
      gray: "#9aa0a8",
      red: "#d94a4a",
      yellow: "#e8d44a",
      cyan: "#4ad6e8",
      magenta: "#c04ae8",
      hotpink: "#ff69b4",
      green: "#5ad24a",
    },
    paddle: "#d0d6de",
    ball: "#ffffff",
    hud: "#ffffff",
    glow: 0,
    // El skin por defecto usa el spritesheet sin teñir: se ve igual que antes.
    tintStrength: 0,
  },
  retro: {
    background: "#0d1014",
    blocks: {
      gray: "#a8b0b8",
      red: "#c85c5c",
      yellow: "#d8c46c",
      cyan: "#6cb4c0",
      magenta: "#a878c0",
      hotpink: "#d08ca8",
      green: "#7cb45c",
    },
    paddle: "#c8d0c0",
    ball: "#e8e0c8",
    hud: "#d0d8c0",
    glow: 0,
    tintStrength: 0.85,
  },
  neon: {
    background: "#05050a",
    blocks: {
      gray: "#9fb8ff",
      red: "#ff3b5c",
      yellow: "#f6ff3b",
      cyan: "#00f5ff",
      magenta: "#ff2fd0",
      hotpink: "#ff6fb0",
      green: "#39ff14",
    },
    paddle: "#00f5ff",
    ball: "#ffffff",
    hud: "#e6e9ff",
    glow: 12,
    tintStrength: 0.9,
  },
};
