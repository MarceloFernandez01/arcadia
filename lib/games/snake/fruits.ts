import type { FruitTint } from "@/lib/games/snake/skins";

export interface FruitSprite {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const FRUITS: Record<string, FruitSprite> = {
  banana: { x: 34, y: 136, w: 110, h: 160 },
  orange: { x: 186, y: 136, w: 150, h: 160 },
  grape: { x: 378, y: 136, w: 110, h: 160 },
  garlic: { x: 540, y: 136, w: 130, h: 160 },
  eggplant: { x: 712, y: 136, w: 130, h: 160 },
  strawberry: { x: 894, y: 136, w: 110, h: 160 },
  cherry: { x: 1066, y: 136, w: 110, h: 160 },
  carrot: { x: 1228, y: 136, w: 130, h: 160 },
  mushroom: { x: 1400, y: 136, w: 130, h: 160 },
  broccoli: { x: 1582, y: 136, w: 110, h: 160 },
  watermelon: { x: 1734, y: 136, w: 150, h: 160 },
  pepper: { x: 1906, y: 136, w: 150, h: 160 },
  kiwi: { x: 2068, y: 136, w: 170, h: 160 },
  lemon: { x: 2250, y: 136, w: 140, h: 160 },
  peach: { x: 2432, y: 136, w: 130, h: 160 },
  peanut: { x: 2604, y: 136, w: 130, h: 160 },
  apple: { x: 2786, y: 136, w: 110, h: 160 },
  tomato: { x: 2948, y: 136, w: 130, h: 160 },
  berries: { x: 3110, y: 136, w: 150, h: 160 },
  grapes2: { x: 3302, y: 136, w: 110, h: 160 },
  pineapple: { x: 3454, y: 136, w: 150, h: 160 },
  melon: { x: 3637, y: 136, w: 130, h: 160 },
};

let fruitSheet: HTMLImageElement | null = null;
let fruitSheetLoaded = false;
const fruitSheetCallbacks: Array<() => void> = [];

export function loadFruitSheet(cb: () => void): void {
  if (fruitSheetLoaded) {
    cb();
    return;
  }
  fruitSheetCallbacks.push(cb);
  if (fruitSheet) return;

  const img = new Image();
  img.onload = () => {
    fruitSheetLoaded = true;
    fruitSheetCallbacks.forEach((f) => f());
  };
  img.onerror = () => console.error("Failed to load fruit sheet");
  img.src = "/games/snake/fruits.png";
  fruitSheet = img;
}

export function getFruitSheet(): HTMLImageElement | null {
  return fruitSheetLoaded ? fruitSheet : null;
}

const tintedSheets: Record<string, HTMLCanvasElement> = {};

/**
 * Devuelve el atlas teñido para un skin, generándolo una sola vez en un canvas offscreen.
 * Si el skin no define tratamiento de color, se reutiliza la imagen original.
 */
export function getFruitSheetForSkin(skin: string, tint: FruitTint): CanvasImageSource | null {
  const sheet = getFruitSheet();
  if (!sheet) return null;
  if (!tint.filter && !tint.overlay) return sheet;
  if (tintedSheets[skin]) return tintedSheets[skin];

  const offscreen = document.createElement("canvas");
  offscreen.width = sheet.naturalWidth;
  offscreen.height = sheet.naturalHeight;
  const octx = offscreen.getContext("2d");
  if (!octx) return sheet;

  if (tint.filter) octx.filter = tint.filter;
  octx.drawImage(sheet, 0, 0);
  octx.filter = "none";

  if (tint.overlay) {
    octx.globalCompositeOperation = "source-atop";
    octx.fillStyle = tint.overlay;
    octx.fillRect(0, 0, offscreen.width, offscreen.height);
    octx.globalCompositeOperation = "source-over";
  }

  tintedSheets[skin] = offscreen;
  return offscreen;
}
