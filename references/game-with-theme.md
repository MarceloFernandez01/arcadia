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
| 2026-08-01 | frogger | clasico, retro, neon | clasico | paleta en código | Primer skin del juego. Paleta en `lib/games/frogger/skins.ts` (20 campos: fondo, carretera + línea, río, acera/mediana, seto, casilla de llegada + borde, rana + ojo, tronco + borde, tortuga/caparazón/aviso/sumergida, `vehicles: string[]`, pista/relleno/alerta de la barra de tiempo, `glow`). Los vehículos se resuelven con `ROAD_COLOR_INDEX` (filas 7–11 → índices 0,1,2,0,1), preservando el ciclo magenta/amarillo/cian del original. El glow se aplica con `applyGlow()/clearGlow()` sobre vehículos, troncos, tortugas, rana, borde de casilla y barra de tiempo (`glow: 0` lo deja inerte). En `retro`/`neon` el ojo de la rana pasa a tono oscuro porque el amarillo del clásico sobre verde queda en 1.19:1; `clasico` lo conserva tal cual por regla de fidelidad. |
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
| frogger | clasico | rana `#22c55e` | acera `#12321f` | 6.14:1 |
| frogger | clasico | rana `#22c55e` | `--bg` `#0a0a0f` | 8.67:1 |
| frogger | clasico | vehículo magenta `#ff006e` | carretera `#1c1c26` | 4.40:1 |
| frogger | clasico | vehículo amarillo `#f5ff00` | carretera `#1c1c26` | 15.43:1 |
| frogger | clasico | vehículo cian `#00f5ff` | carretera `#1c1c26` | 12.47:1 |
| frogger | clasico | tortuga `#2f9e44` | río `#0b2e52` | 3.99:1 |
| frogger | clasico | borde de casilla `#4ade80` | acera `#12321f` | 8.02:1 |
| frogger | clasico | barra de tiempo `#00f5ff` | pista `#0a2015` | 12.60:1 |
| frogger | clasico | tronco `#6b4a35` | río `#0b2e52` | 1.74:1 (heredado del original; no se ajusta para no alterar el skin por defecto) |
| frogger | clasico | tortuga sumergida `#0e4a63` | río `#0b2e52` | 1.43:1 (heredado; contorno tenue intencional al sumergirse) |
| frogger | retro | rana `#9bbc63` | acera `#1d3324` | 6.30:1 |
| frogger | retro | rana `#9bbc63` | `--bg` `#0a0a0f` | 9.19:1 |
| frogger | retro | tronco `#b08050` | río `#16324a` | 3.81:1 |
| frogger | retro | borde de tronco `#a07a4a` | río `#16324a` | 3.38:1 |
| frogger | retro | tortuga `#7ca85c` | río `#16324a` | 4.79:1 |
| frogger | retro | caparazón `#5f8f48` | río `#16324a` | 3.47:1 |
| frogger | retro | tortuga sumergida `#6a90a8` | río `#16324a` | 3.88:1 |
| frogger | retro | vehículo rojo `#c85c5c` | carretera `#1a1e22` | 4.10:1 |
| frogger | retro | vehículo azul `#7ea8c8` | carretera `#1a1e22` | 6.64:1 |
| frogger | retro | línea de carril `#7a8288` | carretera `#1a1e22` | 4.29:1 |
| frogger | retro | casilla `#3f8a58` | seto `#12261a` | 3.78:1 |
| frogger | retro | borde de casilla `#a8d8a0` | acera `#1d3324` | 8.38:1 |
| frogger | retro | barra de tiempo `#8cc0c8` | pista `#12261a` | 7.96:1 |
| frogger | retro | barra en alerta `#d07070` | pista `#12261a` | 4.73:1 |
| frogger | neon | rana `#39ff14` | acera `#0a2418` | 12.11:1 |
| frogger | neon | tronco `#ff9e2f` | río `#071a33` | 8.45:1 |
| frogger | neon | tortuga `#00f5ff` | río `#071a33` | 12.87:1 |
| frogger | neon | caparazón `#0aa8c0` | río `#071a33` | 6.12:1 |
| frogger | neon | tortuga sumergida `#4f8bff` | río `#071a33` | 5.37:1 |
| frogger | neon | vehículo magenta `#ff2fd0` | carretera `#0d0d16` | 6.05:1 |
| frogger | neon | línea de carril `#6a6ad0` | carretera `#0d0d16` | 4.22:1 |
| frogger | neon | casilla `#1a7a52` | seto `#060f0a` | 3.66:1 |
| frogger | neon | borde de casilla `#39ff14` | casilla `#1a7a52` | 3.92:1 |
| frogger | neon | barra en alerta `#ff2fd0` | pista `#10102a` | 5.82:1 |
| snake | clasico | serpiente `#ffd54f` | `--bg` `#0a0a0f`  | 14.0:1  |
| snake | retro   | cabeza `#d8e8b8`    | canvas `#0d1410`  | 14.5:1  |
| snake | retro   | cuerpo `#9bbc63`    | canvas `#0d1410`  | 8.8:1   |
| snake | retro   | cuerpo `#9bbc63`    | `--bg` `#0a0a0f`  | 9.2:1   |
| snake | neon    | cabeza `#f6ff00`    | canvas `#05050a`  | 18.6:1  |
| snake | neon    | cuerpo `#39ff14`    | canvas `#05050a`  | 15.0:1  |

