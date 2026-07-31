import type { SkinId } from "@/lib/games/skins";

export interface AsteroidsPalette {
  background: string;
  ship: string;
  /** Llama del propulsor; incluye su propio alfa. */
  thrust: string;
  asteroid: string;
  bullet: string;
  /** Componentes `r,g,b` de la partícula: el alfa lo calcula el motor según la vida restante. */
  particleRgb: string;
  powerUp: string;
  hud: string;
  hudAccent: string;
  /** Radio de `shadowBlur` aplicado al trazo; 0 desactiva el resplandor. */
  glow: number;
}

export const ASTEROIDS_SKINS: Record<SkinId, AsteroidsPalette> = {
  clasico: {
    background: "#000000",
    ship: "#ffffff",
    thrust: "rgba(255, 130, 0, 0.85)",
    asteroid: "#ffffff",
    bullet: "#ffffff",
    particleRgb: "255,255,255",
    powerUp: "#00ffff",
    hud: "#ffffff",
    hudAccent: "#00ffff",
    glow: 0,
  },
  retro: {
    background: "#0d1410",
    ship: "#9bbc63",
    thrust: "rgba(214, 150, 60, 0.9)",
    asteroid: "#8ca06a",
    bullet: "#d8e8b8",
    particleRgb: "168,180,140",
    powerUp: "#d0a040",
    hud: "#c8d8a0",
    hudAccent: "#d0a040",
    glow: 0,
  },
  neon: {
    background: "#05050a",
    ship: "#00f5ff",
    thrust: "rgba(255, 90, 0, 0.95)",
    asteroid: "#ff2fd0",
    bullet: "#f6ff00",
    particleRgb: "0,245,255",
    powerUp: "#39ff14",
    hud: "#e6e9ff",
    hudAccent: "#39ff14",
    glow: 12,
  },
};
