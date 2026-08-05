# Rendimiento de motores por juego

Memoria del agente `game-performance` (`.claude/agents/game-performance.md`). Referencia canónica:
`specs/12-optimizacion-performance-frogger.md`, que dejó `lib/games/frogger/engine.ts` como la
implementación de referencia (fondo estático cacheado en canvas offscreen, sprites con glow horneado,
glow agrupado por lote de color, lookup precalculado, notificación al HUD condicional a un cambio real y
derivados cacheados por tick). El agente trabaja un solo juego por invocación, y siempre el que se le
indique explícitamente: nunca elige el juego por su cuenta. Esta lista **no es una whitelist**: es solo
el estado conocido a la fecha; el agente acepta cualquier juego que se le indique aunque no figure aquí,
analizándolo desde cero antes de optimizarlo. Al terminar un juego, su fila se mueve de `## Pendientes` a
`## Optimizado`. Nunca se reescribe el archivo entero: solo se agregan filas o se mueven entre secciones.

## Optimizado

| Fecha      | Juego (id) | Optimizaciones aplicadas                                                                                                                                                                                                                    | Referencia                                          | Verificado por el usuario |
| ---------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | -------------------------- |
| 2026-08-02 | frogger    | Fondo estático cacheado en canvas offscreen (`staticBoardCanvas`); glow agrupado por lote de color en tortugas y casillas home; sprites pre-renderizados con glow horneado para vehículos/troncos/tortugas; `Set` precalculado de columnas home (`homeSlotColSet`); notificación al HUD condicional a valores crudos; valores derivados por carril cacheados por tick. | `specs/12-optimizacion-performance-frogger.md`       | Pendiente en dispositivo real |

## Pendientes

| Juego (id) | Ruta del motor            | Anti-patrón dominante                                                                                                         | Impacto estimado                          |
| ---------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| asteroids  | `lib/games/asteroids/engine.ts` | `save()`/`shadowBlur` por objeto en loop (`Particle.draw` `:316-328`, `Bullet.draw` `:55-63`, `Asteroid.draw` `:115-129`, `PowerUp.draw` `:158-177`); sin sprites pre-renderizados para asteroides (`:122-127`, vértices retrazados por frame); `notifyStateChange` construye el objeto antes de comparar (`:451-466`) | Medio — glow por partícula en explosiones grandes |
| tetris     | `lib/games/tetris/engine.ts`    | Grid estático redibujado por frame: 28 `stroke()` individuales (`drawGrid`, `:417-433`); `shadowBlur` seteado/limpiado por bloque, ~200 celdas/frame (`drawBlock`, `:405-411`); `ghostY()` recalculado en cada `draw()` (`:443`); `notifyStateChange` construye antes de comparar y se llama en cada tecla y en cada drop tick (`:248-265`) | Alto — 28 strokes + 200 toggles de shadow por frame |
| arkanoid   | `lib/games/arkanoid/engine.ts`  | `applyGlow` por bloque dentro del loop, hasta ~50 bloques/frame (`:341-345`), repetido en explosiones y vidas del HUD; `every()` sobre `this.blocks` en cada rotura (`:299`); `getSheet(this.skin)` llamado en cada `draw()` (`:335`); `notifyStateChange` construye antes de comparar y se llama **en cada frame** desde `update()` (`:226-243`, `:324`) | Alto — notificación al HUD sin debounce en cada frame |
| snake      | `lib/games/snake/engine.ts`     | Grid estático redibujado por frame: 48 `stroke()` (`drawGrid`, `:207-223`), aunque el estado lógico solo cambia por tick; `shadowBlur` reasignado por segmento en el loop del cuerpo (`:225-236`), solo 2 colores en juego; `.some()` sobre el cuerpo × 625 celdas en `spawnFruit()` (`:137-148`); `scale`/`getFruitSheetForSkin()` recalculados por frame (`:238-248`) | Alto — 48 strokes/frame pese a lógica a 60→150ms de tick |

## Hallazgos abiertos

| Juego   | Hallazgo                                                                                                                              | Motivo por el que no se corrigió                                                                                                          |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| frogger | `checkRiverSupport(lane, dt)` sigue recalculando `LEVEL_SPEED_MULT(this.level)` por su cuenta en vez de recibirlo cacheado (`lib/games/frogger/engine.ts:410`), como también hace `updateLanes` por separado (`:318`). | La SPEC 12 (paso 6) pedía pasarlo explícitamente a `checkRiverSupport`; quedó fuera al cerrar la spec. Bajo impacto: es un multiplicador escalar, no una estructura. |
| frogger | El `Map` de `ringLengths` se realoja en cada frame del loop (`lib/games/frogger/engine.ts:744`) pese a que `laneRingLength` depende solo de `LANES` y `laneObjects.length`, inmutables tras `initGame`. | Evita el recálculo duplicado dentro del mismo tick (el problema que la spec atacaba), pero paga una alocación de `Map` por frame; podría ser un cache de vida larga en `initGame`. |
