# Juegos con skin aplicado

Memoria del agente `skin-designer` (`.claude/agents/skin-designer.md`). Los skins canónicos de la
plataforma son `clasico` (default), `retro` y `neon`. El agente trabaja un solo juego por invocación:
antes de tocar código lee este archivo para saber qué juegos ya tienen los skins aplicados y cuáles
siguen pendientes; al terminar un juego mueve su fila de `## Pendientes` a `## Con skin` y agrega sus
mediciones a `## Contraste verificado`. Nunca se reescribe el archivo entero: solo se agregan filas o
se mueven entre secciones.

## Con skin

| Fecha      | Juego (id) | Skins                      | Default | Origen de color  | Notas                                                                                                        |
| ---------- | ---------- | --------------------------- | ------- | ----------------- | ------------------------------------------------------------------------------------------------------------- |
| 2026-07-30 | tetris     | retro, normal, pastel, neon | retro   | paleta en código  | Preexistente al agente. `normal` debe renombrarse a `clasico` y quedar como default al pasar por el agente.    |
| 2026-07-30 | asteroides | clasico, retro, neon        | clasico | paleta en código  | Primer juego con el módulo compartido `lib/games/skins.ts`. Paleta en `lib/games/asteroids/skins.ts` (`glow` como dato para `shadowBlur`). Se corrigió `create()` en `registry.ts`, que descartaba `initialColorScheme`. |
| 2026-07-30 | snake      | clasico, retro, neon        | clasico | paleta en código + sprite teñido | Paleta en `lib/games/snake/skins.ts` (fondo, grid, cabeza, cuerpo, `glow`). La fruta se tiñe en canvas offscreen desde `fruits.png` vía `getFruitSheetForSkin()` en `fruits.ts` (`ctx.filter` + overlay `source-atop`, cacheado por skin); `clasico` reutiliza la imagen original. `background: null` en `clasico` conserva el canvas transparente original. Cabeza y cuerpo son campos distintos, iguales en `clasico` (`#ffd54f`). |
| 2026-07-30 | arkanoid | clasico, retro, neon | clasico | sprite teñido | Colores derivados de `public/games/arkanoid/spritesheet-breakout.png`. Paleta en `lib/games/arkanoid/skins.ts` (7 colores de bloque + pala + bola + HUD + `glow` + `tintStrength`). `spritesheet.ts` genera una hoja teñida por skin en canvas offscreen (`source-atop` con `globalAlpha = tintStrength`, recortes deduplicados por rectángulo porque `gray` comparte frames de explosión con `red`), cacheada en `Record<SkinId, HTMLCanvasElement>`; `clasico` usa `tintStrength: 0`, es decir la hoja original. `drawSprite`/`drawFrame` ahora reciben la hoja como parámetro. |

## Pendientes

| Fecha      | Juego (id) | Skins | Default | Origen de color | Notas |
| ---------- | ---------- | ----- | ------- | --------------- | ----- |
| 2026-07-30 | tetris     | retro, normal, pastel, neon | retro | paleta en código | Único juego sin migrar al módulo compartido: falta renombrar `normal` → `clasico`, dejarlo como default y conservar `pastel` como skin extra. |

## Contraste verificado

| Juego | Skin    | Color               | Fondo             | Razón   |
| ----- | ------- | ------------------- | ----------------- | ------- |
| arkanoid | clasico | bloque red `#d94a4a` | canvas `#000000` | 5.0:1 |
| arkanoid | clasico | bloque magenta `#c04ae8` | canvas `#000000` | 5.4:1 |
| arkanoid | clasico | pala `#d0d6de` | canvas `#000000` | 14.4:1 |
| arkanoid | clasico | bola/HUD `#ffffff` | `--bg` `#0a0a0f` | 19.8:1 |
| arkanoid | retro   | bloque red `#c85c5c` | canvas `#0d1014` | 4.7:1 |
| arkanoid | retro   | bloque magenta `#a878c0` | canvas `#0d1014` | 5.6:1 |
| arkanoid | retro   | bloque green `#7cb45c` | canvas `#0d1014` | 7.8:1 |
| arkanoid | retro   | pala `#c8d0c0` | canvas `#0d1014` | 12.0:1 |
| arkanoid | retro   | HUD `#d0d8c0` | `--bg` `#0a0a0f` | 13.4:1 |
| arkanoid | neon    | bloque red `#ff3b5c` | canvas `#05050a` | 5.8:1 |
| arkanoid | neon    | bloque magenta `#ff2fd0` | canvas `#05050a` | 6.4:1 |
| arkanoid | neon    | bloque cyan / pala `#00f5ff` | canvas `#05050a` | 15.0:1 |
| arkanoid | neon    | bloque green `#39ff14` | canvas `#05050a` | 15.0:1 |
| arkanoid | neon    | HUD `#e6e9ff` | `--bg` `#0a0a0f` | 16.4:1 |
| snake | clasico | serpiente `#ffd54f` | `--bg` `#0a0a0f`  | 14.0:1  |
| snake | retro   | cabeza `#d8e8b8`    | canvas `#0d1410`  | 14.5:1  |
| snake | retro   | cuerpo `#9bbc63`    | canvas `#0d1410`  | 8.8:1   |
| snake | retro   | cuerpo `#9bbc63`    | `--bg` `#0a0a0f`  | 9.2:1   |
| snake | neon    | cabeza `#f6ff00`    | canvas `#05050a`  | 18.6:1  |
| snake | neon    | cuerpo `#39ff14`    | canvas `#05050a`  | 15.0:1  |

