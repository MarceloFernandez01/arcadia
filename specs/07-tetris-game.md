# SPEC 07 — Juego Tetris

> **Estado:** Aprobado
> **Depende de:** SPEC 05 (asteroids-game), SPEC 06 (leaderboard-supabase)
> **Fecha:** 2026-07-26
> **Objetivo:** Adaptar el Tetris de referencia (`references/started-games/03-tetris`) como motor real en TypeScript/Canvas bajo el id `tetris`, introduciendo un punto de extensión (`lib/games/registry.ts`) en `GamePlayer.tsx` para que futuros juegos no requieran modificarlo, y dar de alta el juego en Supabase para que aparezca en el Salón de la Fama.

## Alcance

**Incluye:**

- Crear el punto de extensión para motores de juego, ya que `lib/games/registry.ts` todavía no existe:
  - `lib/games/types.ts` con la interfaz común `ArcadeGameEngine` (`start()/pause()/resume()/restart()/destroy()`), opciones genéricas `onStateChange(state)`/`onGameOver(finalScore)`, y un estado de HUD flexible `{ score: number; stats: { key: string; label: string; value: string }[] }`.
  - `lib/games/registry.ts`: mapa `id → { width, height, initialState, create(canvas, options) }`.
  - `components/GamePlayer.tsx` resolviendo el motor vía el registry en vez del import directo de `AsteroidsEngine`, con el `<canvas>` y el HUD (`engineState.stats.map(...)`) dependiendo de esos datos en vez de valores fijos de Asteroids (Puntuación/Vidas/Nivel), y suscribiéndose a `onGameOver` de forma genérica (sin lógica hardcodeada de un juego en particular) para abrir el modal de fin de partida existente.
  - Migrar la entrada existente de `asteroides` al mismo registry, para que `GamePlayer.tsx` quede completamente genérico (sin ramas específicas de un juego).
  - Generalizar `.asteroids-canvas` en `app/globals.css` (línea ~1065) a una clase de canvas genérica (ej. `.game-canvas`), usada por ambos juegos.
- Motor de Tetris portado a TypeScript en `lib/games/tetris/engine.ts`, implementando `ArcadeGameEngine`, manteniendo la lógica del original (`board`, pieza actual/siguiente, `rotateCW`/wall kicks, `collide`, `clearLines`, ghost piece, `dropInterval` por nivel), sin variables globales de módulo (estado encapsulado por instancia).
- Segundo `<canvas>` de "siguiente pieza" (120×120), gestionado por el propio motor (recibe ambos canvases al construirse) e integrado en `GamePlayer.tsx` junto al canvas principal dentro de `.crt-screen`. **Layout:** el canvas principal (300×600) queda centrado horizontalmente dentro de `.crt-screen`; el canvas secundario se ubica a la derecha del principal, sin alinearse verticalmente con él (desplazado hacia arriba respecto al centro). Ambos canvases son hijos DOM directos de `.crt-screen` —el secundario no se renderiza fuera del componente `GamePlayer.tsx` ni de su contenedor visual (nada de `position: fixed` global ni portal fuera del árbol de React).
- El motor expone stats de HUD (`score`, `lines`, `level`) vía el estado flexible del registry, actualizados solo cuando cambian.
- **Condición de game over y su reflejo en React:** en `spawn()`, cuando la pieza nueva colisiona inmediatamente contra el tablero, el motor invoca `onGameOver(finalScore)` una sola vez y detiene el loop, en vez de dibujar el overlay interno de "GAME OVER" del canvas original (que queda deshabilitado, sin reinicio por tecla). `GamePlayer.tsx` recibe `onGameOver` desde el registry (genérico, no hardcodeado): al dispararse, pausa el motor, guarda `finalScore` en el estado de React y abre el mismo modal de fin de partida ya existente. A diferencia de Asteroids (que tiene vidas y un botón "FIN" que simula un cierre sin derrota), Tetris solo tiene una forma de terminar (la pieza no entra); el botón "FIN" del `player-hud` sigue siendo salida voluntaria sin marcar game over interno, y solo `onGameOver` representa una derrota real — ambos caminos abren el mismo modal, con el `finalScore` real vía el estado genérico `stats`/`score` del registry.
- El overlay interno de "PAUSA" del canvas original también se deshabilita; React controla la pausa (`pause()`/`resume()`) desde el botón "PAUSA" del `player-hud`, igual que en Asteroids.
- Controles de teclado: `←`/`→` mover, `↑` o `X` rotar, `↓` soft drop, `Espacio` hard drop — la tecla `P` de pausa del original no se usa (la pausa la controla el botón "PAUSA" del `player-hud`, igual que en Asteroids).
- Alta de `tetris` en la tabla `games` de Supabase (migración `supabase/migrations/002_seed_tetris.sql`), con `cat: 'PUZZLE'`, `color: 'magenta'`, cover `.cover-tetro` (reutilizada, sin CSS nuevo).
- Registro de la entrada `tetris` en `lib/games/registry.ts` con `width: 300, height: 600` (más las dimensiones del canvas secundario de "siguiente pieza").

**Fuera de alcance (para specs futuros):**

- Sin Realtime (el leaderboard se actualiza al navegar/recargar).
- Sin paginación del leaderboard (top fijo de `getTopScores`).
- Sin autenticación real (`user_id: null` en `scores`, cualquiera puede escribir su nombre).
- Sin controles táctiles/móviles — solo teclado, igual que la referencia.
- Sin sonidos/efectos de audio (el original no los tiene).
- Sin tests automatizados.
- Sin tema claro/oscuro propio del juego (el original tiene un toggle de tema independiente; Arcade Vault ya tiene su propio tema global, no se porta ese toggle).
- Sin cambios a `GameDetail.tsx` ni a la ruta `/juego/[id]` más allá de que ahora exista una entrada navegable para `tetris`.

## Modelo de datos

```ts
// lib/games/types.ts
export interface EngineHudStat {
  key: string;
  label: string;
  value: string;
}

export interface EngineState {
  score: number;
  stats: EngineHudStat[]; // ej. [{ key: "lines", label: "Líneas", value: "12" }, { key: "level", label: "Nivel", value: "03" }]
}

export interface ArcadeGameEngineOptions {
  onStateChange: (state: EngineState) => void;
  onGameOver: (finalScore: number) => void;
}

export interface ArcadeGameEngine {
  start(): void;
  pause(): void;
  resume(): void;
  restart(): void;
  destroy(): void; // cancela rAF y remueve listeners de teclado
}
```

```ts
// lib/games/registry.ts
export interface GameRegistryEntry {
  width: number;
  height: number;
  secondaryCanvas?: { width: number; height: number; label: string }; // ej. "siguiente pieza"
  initialState: EngineState;
  create(
    canvas: HTMLCanvasElement,
    options: ArcadeGameEngineOptions,
    secondaryCanvas?: HTMLCanvasElement
  ): ArcadeGameEngine;
}

export const GAME_REGISTRY: Record<string, GameRegistryEntry> = {
  asteroides: { width: 800, height: 600, initialState: { score: 0, stats: [/* vidas, nivel */] }, create: /* ... */ },
  tetris: {
    width: 300,
    height: 600,
    secondaryCanvas: { width: 120, height: 120, label: "Siguiente" },
    initialState: { score: 0, stats: [{ key: "lines", label: "Líneas", value: "0" }, { key: "level", label: "Nivel", value: "01" }] },
    create: /* ... */
  },
};
```

```ts
// lib/games/tetris/engine.ts
export class TetrisEngine implements ArcadeGameEngine {
  constructor(
    canvas: HTMLCanvasElement,
    nextCanvas: HTMLCanvasElement,
    options: ArcadeGameEngineOptions,
  );
  start(): void;
  pause(): void;
  resume(): void;
  restart(): void;
  destroy(): void;
}
```

- `games` en Supabase gana una fila más (`tetris`), usando el esquema ya existente de `001_games_and_scores.sql` (sin cambios de columnas ni de RLS):

```sql
-- supabase/migrations/002_seed_tetris.sql
insert into games (id, title, short, long, cat, cover, color, best_seed, plays_seed)
values (
  'tetris',
  'TETRIS',
  'El clásico rompecabezas de bloques que caen.',
  'Encaja las 7 piezas clásicas (más una pieza extra, la tuerca), gira con wall kicks, usa hard/soft drop y sube de nivel cada 10 líneas.',
  'PUZZLE',
  'cover-tetro',
  'magenta',
  0,
  '0'
);
```

- `scores` no cambia de esquema: las partidas de Tetris se insertan con `game_id: 'tetris'`, `user_id: null`, igual que Asteroids.

## Plan de implementación

1. **Punto de extensión del motor.** Crear `lib/games/types.ts` (`ArcadeGameEngine`, `ArcadeGameEngineOptions`, `EngineState`, `EngineHudStat`) y `lib/games/registry.ts` con una sola entrada por ahora (`asteroides`, envolviendo `AsteroidsEngine` existente para cumplir la interfaz genérica sin tocar su lógica interna). El sistema sigue igual: `GamePlayer.tsx` todavía no usa el registry.
2. **`GamePlayer.tsx` genérico.** Modificar `GamePlayer.tsx` para resolver el motor vía `GAME_REGISTRY[game.id]` en vez del import directo de `AsteroidsEngine`; el `<canvas>` toma `width`/`height` del registry y el HUD renderiza `engineState.stats.map(...)` en vez de los campos fijos "Vidas"/"Nivel". Generalizar `.asteroids-canvas` a `.game-canvas` en `app/globals.css`. Probar `/jugar/asteroides`: debe verse y jugarse exactamente igual que antes, ahora pasando por el registry.
3. **Motor de Tetris.** Crear `lib/games/tetris/engine.ts` portando la lógica de `game.js` (tablero, piezas, rotación con wall kicks, colisión, limpieza de líneas, ghost piece, velocidad por nivel) encapsulada en `TetrisEngine implements ArcadeGameEngine`, recibiendo el canvas principal y el canvas de "siguiente pieza" en el constructor. Se implementa `onStateChange` (score/lines/level) y `onGameOver` (al colisionar `spawn()`), sin overlays internos de "GAME OVER"/"PAUSA" ni el listener de la tecla `P`. Todavía sin uso en la UI.
4. **Alta en el registry.** Agregar la entrada `tetris` a `lib/games/registry.ts` (`width: 300, height: 600`, `secondaryCanvas: { width: 120, height: 120, label: "Siguiente" }`, `initialState` con stats `lines`/`level`, `create()` instanciando `TetrisEngine`). Aún no es jugable porque `tetris` no existe en `games` de Supabase, así que `/jugar/tetris` da 404.
5. **Layout del canvas secundario.** En `GamePlayer.tsx`, renderizar el canvas de "siguiente pieza" cuando el registry lo declare (`secondaryCanvas`), posicionado dentro de `.crt-screen` a la derecha del canvas principal y sin alinearse verticalmente con él (desplazado hacia arriba). Agregar la clase CSS correspondiente (ej. `.next-piece-canvas`) en `app/globals.css`.
6. **Migración de seed.** Crear `supabase/migrations/002_seed_tetris.sql` con el `insert` de la fila `tetris` (valores confirmados en el Modelo de datos) y aplicarla con `apply_migration` del MCP de Supabase. A partir de aquí `/juego/tetris` y `/jugar/tetris` son accesibles y Tetris aparece en `/biblioteca`, `/` y `/salon`.
7. **Repaso final.** `npm run build` sin errores de tipos. Probar en el navegador el flujo completo: `/biblioteca` → detalle de "tetris" → `/jugar/tetris` → mover/rotar/soft drop/hard drop, ver la pieza siguiente actualizarse, subir de nivel cada 10 líneas, pausar/reanudar sin saltos, perder (pieza no entra) → modal automático con puntaje real, "GUARDAR PUNTUACIÓN" inserta en `scores`, "JUGAR DE NUEVO" reinicia el motor, "SALIR" no deja el loop corriendo ni listeners activos. Confirmar también que Asteroids sigue funcionando igual tras el refactor del registry.

## Criterios de aceptación

- [ ] Existe `lib/games/types.ts` con `ArcadeGameEngine`/`ArcadeGameEngineOptions`/`EngineState`/`EngineHudStat`, y `lib/games/registry.ts` con las entradas `asteroides` y `tetris`.
- [ ] `GamePlayer.tsx` resuelve el motor, dimensiones del canvas y stats del HUD vía `GAME_REGISTRY[game.id]`, sin ninguna rama de código específica de `asteroides` o `tetris`.
- [ ] `/jugar/asteroides` sigue funcionando exactamente igual que antes del refactor (canvas 800×600, HUD Puntuación/Vidas/Nivel, pausa, fin, guardado de puntaje).
- [ ] Existe una fila `tetris` en `games` (Supabase) con los valores acordados (`cat: 'PUZZLE'`, `color: 'magenta'`, `cover: 'cover-tetro'`, `best_seed: 0`, `plays_seed: '0'`).
- [ ] `/jugar/tetris` renderiza el canvas principal (300×600) centrado horizontalmente dentro de `.crt-screen`, y el canvas secundario de "siguiente pieza" (120×120) a la derecha, sin alinearse verticalmente con el principal.
- [ ] El HUD de React refleja en tiempo real Puntuación, Líneas y Nivel del motor de Tetris (no valores fijos).
- [ ] Mover (`←`/`→`), rotar (`↑`/`X` con wall kicks), soft drop (`↓`) y hard drop (`Espacio`) funcionan igual que en `game.js`; la pieza fantasma se dibuja en el canvas principal.
- [ ] El canvas secundario se actualiza para mostrar la próxima pieza cada vez que la pieza actual cambia.
- [ ] Al completar líneas, `lines`/`score`/`level` se actualizan según las mismas fórmulas del original (`LINE_SCORES` × nivel, nivel = `floor(lines/10) + 1`, velocidad de caída correspondiente).
- [ ] PAUSA/REANUDAR detiene y reactiva el loop del motor sin saltos de física ni overlay interno del canvas.
- [ ] FIN congela el motor sin marcar game over y abre el modal existente con el puntaje real acumulado.
- [ ] Cuando una pieza nueva no entra al tablero (`spawn()` colisiona), se invoca `onGameOver` y se abre automáticamente el mismo modal de fin de partida con el puntaje real, sin que el canvas dibuje su propio overlay de "GAME OVER".
- [ ] "GUARDAR PUNTUACIÓN" inserta una fila en `scores` con `game_id: "tetris"`, `user_id: null`, `score` real.
- [ ] "JUGAR DE NUEVO" reinicia una instancia nueva del motor (tablero vacío, score 0, líneas 0, nivel 1).
- [ ] Tetris aparece como tab nuevo en `/salon` (sin tocar código de `HallOfFame.tsx`) y su top coincide con el mostrado en `/juego/tetris`.
- [ ] Salir del juego (botón "SALIR" o navegar fuera de `/jugar/tetris`) cancela el `requestAnimationFrame` y remueve los listeners de teclado del motor de Tetris.
- [ ] `npm run build` compila sin errores de tipos.

## Decisiones tomadas y descartadas

- **Sí:** crear `lib/games/registry.ts` y `lib/games/types.ts` en este spec (en vez de posponerlo), porque `GamePlayer.tsx` estaba hardcodeado a `AsteroidsEngine` y agregar un segundo juego sin ese punto de extensión obligaría a repetir el mismo refactor en cada spec de juego futuro.
- **No:** mantener `GamePlayer.tsx` con una rama `if (game.id === "tetris")` junto a la de Asteroids. Se descarta porque el objetivo del registry es justamente que agregar un juego no toque ese componente.
- **Sí:** migrar también `asteroides` al registry en este mismo spec, no dejarlo aparte. Necesario para que `GamePlayer.tsx` quede genérico de verdad; si Asteroids quedara con su rama especial, el registry no cumpliría su propósito.
- **Sí:** segundo `<canvas>` de "siguiente pieza" como hijo directo de `.crt-screen`, posicionado con `position: absolute` a la derecha del canvas principal sin alinearse verticalmente. Se prioriza fidelidad con la referencia (que sí muestra la pieza siguiente) sobre simplificar quitándolo.
- **No:** portar el toggle de tema claro/oscuro del `game.js` original. Arcade Vault ya tiene su propio sistema de tema global; duplicarlo generaría dos mecanismos de tema conviviendo sin necesidad.
- **No:** portar la tecla `P` de pausa del original. Se descarta para evitar dos formas de pausar (teclado + botón) fuera de sincronía con el estado de React, que es quien controla la pausa mostrando el overlay "EN PAUSA".
- **Sí:** categoría `PUZZLE` y color `magenta`, en vez de reutilizar `cyan` (color de Asteroids), para diferenciar visualmente ambos juegos en la biblioteca y el Salón de la Fama.
- **Sí:** reutilizar `.cover-tetro` ya existente en `app/globals.css` en vez de crear una clase nueva, porque ya representa visualmente piezas de Tetris y evita CSS duplicado.
- **Sí:** `onGameOver` se dispara solo por colisión de `spawn()` (derrota real), mientras que el botón "FIN" del HUD sigue siendo salida voluntaria sin ese callback, igual que la distinción ya existente en Asteroids entre perder las 3 vidas y presionar "FIN".
- **No:** agregar un concepto de "vidas" artificial a Tetris para reutilizar el mismo shape de stats que Asteroids. Se descarta porque el estado de HUD ya es flexible (`stats: EngineHudStat[]`) y no necesita forzar campos que no aplican al juego.

## Riesgos identificados

| Riesgo                                                                                                                                                                                                                                                                                     | Mitigación                                                                                                                                                                          |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fuga del `requestAnimationFrame` y de los listeners de teclado si `TetrisEngine.destroy()` no los limpia al desmontar/navegar fuera de `/jugar/tetris`.                                                                                                                                    | Cubierto explícitamente en el paso 7 del plan (repaso de fugas al navegar fuera) y en los criterios de aceptación.                                                                  |
| `dt` (delta time) gigante al reanudar de una pausa larga, si `pause()` no detiene el reloj interno (`lastTime`) y `resume()` no lo resetea.                                                                                                                                                | Al pausar, detener el bucle por completo (no solo saltear `update`); al reanudar, resetear `lastTime` como si fuera el primer frame — mismo patrón que `AsteroidsEngine`.           |
| Estado global de módulo que sobrevive al HMR de Next.js, si `TetrisEngine` no encapsula todo su estado (`board`, `current`, `next`, `score`, etc.) en propiedades de instancia.                                                                                                            | El motor se escribe desde cero como clase con estado por instancia, sin variables de módulo, siguiendo el mismo patrón ya validado en `AsteroidsEngine`.                            |
| Overlay de "GAME OVER"/"PAUSA" duplicado entre el canvas y React, si el motor original conserva su propio dibujo de esos estados.                                                                                                                                                          | Se deshabilita explícitamente el dibujo interno de ambos overlays en el paso 3 del plan; React es el único responsable de mostrarlos.                                               |
| **Refactor del registry rompe Asteroids.** Migrar `AsteroidsEngine` al mismo registry genérico (`ArcadeGameEngine`) podría introducir una regresión en un juego que ya funciona y está en producción.                                                                                      | Paso 2 del plan exige probar `/jugar/asteroides` inmediatamente después del refactor, antes de tocar nada de Tetris; también cubierto en el criterio de aceptación correspondiente. |
| **Canvas secundario fuera de sincronía con el principal.** Si el motor actualiza el tablero principal pero no repinta el canvas de "siguiente pieza" en el mismo ciclo (por ejemplo tras un `hardDrop` que genera una nueva pieza), el jugador vería una pieza "siguiente" desactualizada. | El motor debe redibujar el canvas secundario dentro del mismo método `spawn()` que asigna `next`, de forma síncrona, igual que `drawNext()` en el original.                         |
| **Wall kicks y rotación cerca de los bordes.** La lógica de `tryRotate()` con kicks `[0,-1,1,-2,2]` puede fallar silenciosamente si el porteo a TypeScript altera el orden de intentos o la condición de colisión.                                                                         | El motor porta `collide()`/`rotateCW()`/`tryRotate()` sin alterar su lógica ni su orden de evaluación respecto a `game.js`.                                                         |
| **Layout del canvas secundario en pantallas angostas.** Al posicionarlo con `position: absolute` a la derecha del canvas principal dentro de `.crt-screen`, en viewports pequeños podría solaparse con el canvas principal o quedar cortado.                                               | No se resuelve en este spec (controles/layout táctil-móvil quedan fuera de alcance); se documenta como limitación conocida, no como bug.                                            |

## Lo que no está en este spec

- Realtime en el leaderboard.
- Paginación del leaderboard.
- Autenticación real.
- Controles táctiles/móviles.
- Sonidos/efectos de audio.
- Tests automatizados.
- Toggle de tema claro/oscuro propio del juego.
- Cambios a `GameDetail.tsx` o a la ruta `/juego/[id]` más allá de la nueva entrada navegable.

Cada uno de estos, si se necesita, va en su propio spec futuro.
