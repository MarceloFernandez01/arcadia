/* Rana Frogger — hoja de sprites 64x16 (4 cuadros de 16x16, fondo transparente)
   Cuadros: 0 idle · 1 crouch (carga) · 2 jump (en el aire) · 3 land (aterrizaje)
   Vista frontal (la rana mira a camara), avanza hacia arriba de la pantalla.
   Pivote recomendado: x=8, y=14 (centro-abajo, sobre la linea de sombra). */

const FROG_SPRITE = {
  image: 'rana-frogger.png',
  imageHiDpi: 'rana-frogger-4x.png',
  sheetWidth: 64,
  sheetHeight: 16,
  frameWidth: 16,
  frameHeight: 16,
  pivot: { x: 8, y: 14 },
  palette: {"O":"#16365e","d":"#1a7a3f","g":"#28a94b","l":"#5cd86a","W":"#ffffff","K":"#111a2b","P":"#e8407f","U":"#7f3fb0"},
  frames: [
    { name: 'idle', index: 0, x: 0, y: 0, w: 16, h: 16 },
    { name: 'crouch', index: 1, x: 16, y: 0, w: 16, h: 16 },
    { name: 'jump', index: 2, x: 32, y: 0, w: 16, h: 16 },
    { name: 'land', index: 3, x: 48, y: 0, w: 16, h: 16 }
  ],
  animations: {
    idle: { frames: [0],          frameDuration: 0,   loop: true },
    hop:  { frames: [1, 2, 3, 0], frameDuration: 140, loop: false }
  }
};

/* Dibuja un cuadro. ctx: CanvasRenderingContext2D, img: HTMLImageElement ya cargada.
   x, y son la posicion del PIVOTE en pantalla; scale es el zoom entero (3 = 48px). */
function drawFrogFrame(ctx, img, frameIndex, x, y, scale) {
  scale = scale || 1;
  const f = FROG_SPRITE.frames[frameIndex];
  const p = FROG_SPRITE.pivot;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, f.x, f.y, f.w, f.h,
    Math.round(x - p.x * scale), Math.round(y - p.y * scale),
    f.w * scale, f.h * scale);
}

/* Reproductor minimo del salto: devuelve el indice de cuadro segun el tiempo (ms)
   transcurrido desde que empezo el salto; null cuando la animacion termino. */
function frogHopFrame(elapsedMs) {
  const a = FROG_SPRITE.animations.hop;
  const i = Math.floor(elapsedMs / a.frameDuration);
  return i >= a.frames.length ? null : a.frames[i];
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FROG_SPRITE, drawFrogFrame, frogHopFrame };
}
if (typeof window !== 'undefined') {
  window.FROG_SPRITE = FROG_SPRITE;
  window.drawFrogFrame = drawFrogFrame;
  window.frogHopFrame = frogHopFrame;
}
