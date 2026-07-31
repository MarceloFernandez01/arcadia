import { ARKANOID_SKINS, type ArkanoidBlockColor } from "@/lib/games/arkanoid/skins";
import { SKIN_IDS, type SkinId } from "@/lib/games/skins";

export interface SpriteFrame {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

export const EXPLOSION_FRAMES: Record<string, SpriteFrame[]> = {
  red: [
    { sx: 256, sy: 176, sw: 32, sh: 16 },
    { sx: 288, sy: 176, sw: 32, sh: 16 },
    { sx: 320, sy: 176, sw: 32, sh: 16 },
    { sx: 352, sy: 176, sw: 32, sh: 16 },
  ],
  cyan: [
    { sx: 256, sy: 192, sw: 32, sh: 16 },
    { sx: 288, sy: 192, sw: 32, sh: 16 },
    { sx: 320, sy: 192, sw: 32, sh: 16 },
    { sx: 352, sy: 192, sw: 32, sh: 16 },
  ],
  green: [
    { sx: 256, sy: 208, sw: 32, sh: 16 },
    { sx: 288, sy: 208, sw: 32, sh: 16 },
    { sx: 320, sy: 208, sw: 32, sh: 16 },
    { sx: 352, sy: 208, sw: 32, sh: 16 },
  ],
  magenta: [
    { sx: 256, sy: 224, sw: 32, sh: 16 },
    { sx: 288, sy: 224, sw: 32, sh: 16 },
    { sx: 320, sy: 224, sw: 32, sh: 16 },
    { sx: 352, sy: 224, sw: 32, sh: 16 },
  ],
  yellow: [
    { sx: 256, sy: 240, sw: 32, sh: 16 },
    { sx: 288, sy: 240, sw: 32, sh: 16 },
    { sx: 320, sy: 240, sw: 32, sh: 16 },
    { sx: 352, sy: 240, sw: 32, sh: 16 },
  ],
  hotpink: [
    { sx: 256, sy: 256, sw: 32, sh: 16 },
    { sx: 288, sy: 256, sw: 32, sh: 16 },
    { sx: 320, sy: 256, sw: 32, sh: 16 },
    { sx: 352, sy: 256, sw: 32, sh: 16 },
  ],
  gray: [
    { sx: 256, sy: 176, sw: 32, sh: 16 },
    { sx: 288, sy: 176, sw: 32, sh: 16 },
    { sx: 320, sy: 176, sw: 32, sh: 16 },
    { sx: 352, sy: 176, sw: 32, sh: 16 },
  ],
};

export const EXPLOSION_DURATION = 150;

export const SPRITES: {
  paddle: SpriteFrame;
  ball: SpriteFrame;
  blocks: Record<string, SpriteFrame>;
} = {
  paddle: { sx: 32, sy: 112, sw: 162, sh: 14 },
  ball: { sx: 32, sy: 32, sw: 16, sh: 16 },
  blocks: {
    gray: { sx: 32, sy: 288, sw: 32, sh: 16 },
    red: { sx: 32, sy: 176, sw: 32, sh: 16 },
    yellow: { sx: 32, sy: 240, sw: 32, sh: 16 },
    cyan: { sx: 32, sy: 192, sw: 32, sh: 16 },
    magenta: { sx: 32, sy: 224, sw: 32, sh: 16 },
    hotpink: { sx: 32, sy: 256, sw: 32, sh: 16 },
    green: { sx: 32, sy: 208, sw: 32, sh: 16 },
  },
};

let ssImg: HTMLCanvasElement | null = null;
let ssLoaded = false;
const ssCallbacks: Array<() => void> = [];
const tintedSheets: Partial<Record<SkinId, HTMLCanvasElement>> = {};

/**
 * Recortes del atlas junto al color de la paleta que los pinta. Los frames de explosión reutilizan
 * el color del bloque que representan; `gray` comparte recortes con `red`, así que se deduplica por
 * rectángulo para no teñir dos veces la misma zona.
 */
function tintRegions(): { frame: SpriteFrame; colorKey: ArkanoidBlockColor | "paddle" | "ball" }[] {
  const regions: { frame: SpriteFrame; colorKey: ArkanoidBlockColor | "paddle" | "ball" }[] = [];
  const seen = new Set<string>();
  const push = (frame: SpriteFrame, colorKey: ArkanoidBlockColor | "paddle" | "ball") => {
    const id = `${frame.sx},${frame.sy},${frame.sw},${frame.sh}`;
    if (seen.has(id)) return;
    seen.add(id);
    regions.push({ frame, colorKey });
  };

  push(SPRITES.paddle, "paddle");
  push(SPRITES.ball, "ball");
  for (const [color, frame] of Object.entries(SPRITES.blocks)) {
    push(frame, color as ArkanoidBlockColor);
  }
  for (const [color, frames] of Object.entries(EXPLOSION_FRAMES)) {
    for (const frame of frames) push(frame, color as ArkanoidBlockColor);
  }
  return regions;
}

function buildTintedSheet(source: HTMLCanvasElement, skin: SkinId): HTMLCanvasElement {
  const palette = ARKANOID_SKINS[skin];
  const oc = document.createElement("canvas");
  oc.width = source.width;
  oc.height = source.height;
  const octx = oc.getContext("2d");
  if (!octx) return source;
  octx.drawImage(source, 0, 0);
  if (palette.tintStrength <= 0) return oc;

  for (const { frame, colorKey } of tintRegions()) {
    const color =
      colorKey === "paddle"
        ? palette.paddle
        : colorKey === "ball"
          ? palette.ball
          : palette.blocks[colorKey];
    octx.save();
    octx.beginPath();
    octx.rect(frame.sx, frame.sy, frame.sw, frame.sh);
    octx.clip();
    // `source-atop` respeta el alfa del sprite; el alfa parcial conserva el bisel del pixel art.
    octx.globalCompositeOperation = "source-atop";
    octx.globalAlpha = palette.tintStrength;
    octx.fillStyle = color;
    octx.fillRect(frame.sx, frame.sy, frame.sw, frame.sh);
    octx.restore();
  }
  return oc;
}

export function getSheet(skin: SkinId): HTMLCanvasElement | null {
  if (!ssLoaded || !ssImg) return null;
  const cached = tintedSheets[skin];
  if (cached) return cached;
  const built = buildTintedSheet(ssImg, skin);
  tintedSheets[skin] = built;
  return built;
}

export function loadSpritesheet(cb: () => void): void {
  if (ssLoaded) {
    cb();
    return;
  }
  ssCallbacks.push(cb);
  if (ssImg) return;

  const rawImg = new Image();
  rawImg.onload = () => {
    const oc = document.createElement("canvas");
    oc.width = rawImg.width;
    oc.height = rawImg.height;
    const octx = oc.getContext("2d");
    octx?.drawImage(rawImg, 0, 0);
    ssImg = oc;
    ssLoaded = true;
    for (const skin of SKIN_IDS) tintedSheets[skin] = buildTintedSheet(oc, skin);
    ssCallbacks.forEach((f) => f());
  };
  rawImg.onerror = () => console.error("Failed to load spritesheet");
  rawImg.src = "/games/arkanoid/spritesheet-breakout.png";
}

export function drawFrame(
  ctx: CanvasRenderingContext2D,
  sheet: HTMLCanvasElement | null,
  frame: SpriteFrame,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  if (!sheet) return;
  ctx.drawImage(sheet, frame.sx, frame.sy, frame.sw, frame.sh, x, y, w, h);
}

export function drawSprite(
  ctx: CanvasRenderingContext2D,
  sheet: HTMLCanvasElement | null,
  name: string,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  if (!sheet) return;
  let sp: SpriteFrame | undefined;
  if (name.startsWith("block_")) {
    sp = SPRITES.blocks[name.slice(6)];
  } else {
    sp = (SPRITES as unknown as Record<string, SpriteFrame>)[name];
  }
  if (!sp) return;
  ctx.drawImage(sheet, sp.sx, sp.sy, sp.sw, sp.sh, x, y, w, h);
}
