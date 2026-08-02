# Registro de revisión móvil

Memoria del agente `mobile-porter` (`.claude/agents/mobile-porter.md`). Convención append-only: nunca
se reescribe el archivo entero, solo se agregan filas o se mueve la fila del objetivo recién revisado
de `## Pendientes` a `## Revisado`.

## Pendientes

| Objetivo    | Ruta            | Tipo      | Riesgo conocido                                                             |
| ----------- | --------------- | --------- | ---------------------------------------------------------------------------- |
| Nav         | global          | Componente | Ya tiene tratamiento móvil (hamburguesa + panel deslizante); revisar detalles |
| Home        | `/`             | Página    | Ya es la página más trabajada en responsive; revisar detalles                |
| Library     | `/biblioteca`   | Página    | Padding lateral fijo `32px`; tilt de `GameCard` es solo `onMouseMove`, sin equivalente táctil |
| GameDetail  | `/juego/[id]`   | Página    | `.stat-strip` fija a `repeat(3,1fr)` sin colapsar en anchos angostos          |
| HallOfFame  | `/salon`        | Página    | `.hall-table` a 4 columnas (`50px 1fr 90px 90px`) apretada en 360px de ancho  |
| About       | `/about`        | Página    | Tratamiento parcial; revisar formulario y `.highlight-row`                   |
| Auth        | `/auth`         | Página    | Solo fluido (sin media queries); confirmar que basta                        |
| Footer      | `app/layout.tsx` | Componente | Padding fijo `20px 32px` inline, sin ajuste móvil                          |
| Asteroids   | `/jugar/asteroids` | Juego  | Ya con soporte táctil (specs 10/11); revisar detalles residuales             |
| Tetris      | `/jugar/tetris` | Juego     | Ya con soporte táctil (specs 10/11); revisar detalles residuales             |
| Arkanoid    | `/jugar/arkanoid` | Juego   | Ya con soporte táctil (specs 10/11); revisar detalles residuales             |
| Snake       | `/jugar/snake`  | Juego     | Ya con soporte táctil (specs 10/11); revisar detalles residuales             |

## Revisado

| Fecha | Objetivo | Anchos evaluados | Cambios aplicados | Verificado en dispositivo |
| ----- | -------- | ----------------- | ------------------ | -------------------------- |
| 2026-08-02 | Frogger (`/jugar/frogger`) — 3.ª revisión: HUD en una sola fila | 360 / 375 / 414 px y alto 640 px | `touchControls` de `frogger` revalidado sin cambios (`lib/games/registry.ts:134-138`: D-pad de 4 direcciones, `dpadRepeat: true`, `actions: []`); el motor solo mapea `ArrowUp/Down/Left/Right` vía `KEY_DIRECTIONS[e.code]` (`lib/games/frogger/engine.ts:93-103`), no hay acción no direccional sin botón y no hizo falta agregar ningún binding al motor. **HUD en una fila a 360px (escalón 1 de la escalera, redundantes):** el motor ya dibuja la barra de tiempo dentro del canvas (`drawTimerBar`, `engine.ts:483-500`) y las ranas asentadas en las 5 casas (`drawHomeSlots`, `engine.ts:451-481`), así que en táctil se ocultan por CSS los stats `time` y `homes` (`app/globals.css:1178-1185`); el HUD pasa de 343px de ancho requerido a ~253px contra 307.6px disponibles a 360px → una sola fila (también en 375 y 414). No se compactaron vidas, ni se redujo tipografía adicional, ni se abreviaron etiquetas: con el escalón 1 alcanzó. `initialState.stats`/`onStateChange` del registry sin tocar → en escritorio se siguen viendo los 5 stats. **Canvas:** clase nueva `touch-portrait-canvas` derivada del registry (`height > width` y sin canvas secundario, `components/GamePlayer.tsx:213-217`), con `max-height` de 44vh / 38vh en `max-height:700px` (`app/globals.css:1237-1244` y `1358-1362`); a 360×640 el canvas pasa de 154×166px a ~226×243px y la celda de 40px de 11.9px a 17.4px, sin desbordar (queda dentro de los 278px de ancho útil) y con la cuadrícula 13×14 intacta (atributos `width`/`height` sin cambios). Presupuesto vertical a 360×640: ~583px de 640, sin scroll. | Pendiente en dispositivo real |
| 2026-08-02 | Frogger (`/jugar/frogger`) — re-revisión con D-pad táctil | 360 / 375 / 414 px y alto 640 px | Frogger ya tiene `touchControls` en `lib/games/registry.ts:134-138` (D-pad de 4 direcciones, `dpadRepeat: true`, `actions: []` → layout centrado sin bloque de acciones, igual que Arkanoid/Snake); el motor filtra por `e.code` (`lib/games/frogger/engine.ts:95`), compatible con los eventos sintéticos de `TouchControls`. Canvas 520×560 sin canvas secundario → cae en las reglas genéricas `34vh` / `26vh` (`@media (max-height:700px)`); celda de 40px se renderiza a 11.9px (360×640), 12.4px (375×667) y 21.8px (414×896), cuadrícula 13×14 intacta. Presupuesto vertical a 360×640: ~558px de 640 (nav 57 + HUD 88 + CRT 227 + D-pad 140 + márgenes), sin scroll. Cambios: piso de 44px en los botones del D-pad bajo `max-height:700px` (antes 39.6px a 360px); compactación horizontal del HUD (`gap` de `hud-stats-row`/`player-hud` a `clamp(6px,2vw,12px)`, `letter-spacing` de las etiquetas a 0.08em, padding lateral del botón PAUSA a 12px) → las 5 stats pasan de 3+2 a 4+1 filas en 360/375 y a una sola fila en 414; `.crt-bottom` compactado y con `flex-wrap` para que no parta el texto a media frase. | Pendiente en dispositivo real |
| 2026-08-01 | Frogger (`/jugar/frogger`) | 360 / 375 / 414 px y alto 640 px | Padding lateral de `.av-player.touch-mode` y del `.crt` con `clamp()`; `min-height: 44px` para `.btn` en modo táctil; fila de stats del HUD con clase `hud-stats-row` y `gap` compactado en táctil (5 stats ya no envuelven en 3 filas a 360px); `max-height` mayor del canvas (52vh / 46vh en `max-height:700px`) cuando el juego no renderiza `TouchControls`, para no dejar las celdas de 40px ilegibles. Cuadrícula lógica 13×14 intacta. | Pendiente en dispositivo real |

## Hallazgos abiertos

| Objetivo | Hallazgo | Motivo por el que no se corrigió |
| -------- | -------- | ---------------------------------- |
| ~~Frogger~~ | ~~Sin `touchControls` en `lib/games/registry.ts:130-146`~~ | **CERRADO 2026-08-02:** el usuario agregó `touchControls` a la entrada `frogger` (D-pad de 4 direcciones con repetición); el juego ya es jugable con D-pad en móvil. Se eliminaron las dos reglas CSS de "Frogger sin D-pad" (`:not(:has(.touch-controls))`, 52vh/46vh) que quedaron inalcanzables. |
| ~~Frogger~~ | ~~El HUD de 5 stats (Puntuación, Vidas, Nivel, Tiempo, Casillas) sigue ocupando 2 filas a 360 y 375px (4+1)~~ | **CERRADO 2026-08-02:** resuelto con el escalón 1 de la escalera (ocultar redundantes en táctil): `time` y `homes` ya los dibuja el motor dentro del canvas, así que se ocultan solo en `.av-player.touch-mode`. No hizo falta abreviar etiquetas, con lo cual la decisión "No abreviar" del spec 11 sigue vigente para este juego. |
| ~~Frogger~~ | ~~A 360×640 el canvas se renderiza a 154×166px dentro de un área de 302px de ancho~~ | **CERRADO 2026-08-02:** se agregó la clase `touch-portrait-canvas` (derivada del registry: `height > width` y sin canvas secundario), con tope propio de 44vh / 38vh. No alcanza a Asteroids/Arkanoid (4:3), Snake (`touch-square-canvas`, 1:1) ni Tetris (tiene canvas secundario), así que no exigió re-auditarlos. |
| Frogger | La fila de temporizador que el motor dibuja dentro del canvas (`SIDEWALK_ROW`/`TIMER_ROW`, celdas de 40px) queda muy pequeña al escalar el canvas a 46vh en 360×640. | Corregirlo implicaría tocar el dibujo del motor; queda a validación visual del usuario en dispositivo real. **Mitigado 2026-08-02** al subir el tope del canvas a 38vh (celda de 11.9px → 17.4px a 360×640), pero sigue abierto hasta la comprobación visual. |
