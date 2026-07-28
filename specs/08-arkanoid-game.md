# SPEC 08 — Juego Arkanoid

> **Estado:** Aprobado
> **Depende de:** SPEC 05 (asteroids-game), SPEC 06 (leaderboard-supabase), SPEC 07 (tetris-game)
> **Fecha:** 2026-07-28
> **Objetivo:** Adaptar el Arkanoid de referencia (`references/started-games/04-arkanoid`) como motor real en TypeScript/Canvas bajo el id `arkanoid`, dando de alta el juego en el `lib/games/registry.ts` existente y en Supabase para que aparezca en el Salón de la Fama.

## Alcance

**Incluye:**

- Motor de Arkanoid portado a TypeScript en `lib/games/arkanoid/engine.ts`, implementando `ArcadeGameEngine` (interfaz ya existente en `lib/games/types.ts`, sin cambios), manteniendo la lógica del original (`paddle`, `ball`, `blocks[]`, `explosions[]`, `collideAABB`, rebotes contra paredes/paddle/bloques, 3 vidas, score acumulado, 5 niveles con velocidad creciente de `levels.js`).
- Datos de los 5 niveles portados a `lib/games/arkanoid/levels.ts` (mismo contenido que `levels.js`: patrones de bloques por nivel y `speed` multiplier).
- Helpers de sprites portados a `lib/games/arkanoid/spritesheet.ts` (equivalente a `assets/spritesheet.js`: `loadSpritesheet`, `drawSprite`, `drawFrame`, `SPRITES`, `EXPLOSION_FRAMES`, `EXPLOSION_DURATION`), cargando la imagen desde `public/games/arkanoid/spritesheet-breakout.png`.
- Assets copiados a `public/games/arkanoid/`:
  - `spritesheet-breakout.png`
  - `sounds/ball-bounce.mp3`
  - `sounds/break-sound.mp3`
- El motor reproduce los sonidos originales (`ball-bounce.mp3` en rebotes, `break-sound.mp3` al romper un bloque) vía `new Audio(...).cloneNode().play()`, igual que `game.js`.
- Animación de explosión al romper un bloque (4 frames del spritesheet por color), igual que el original.
- Controles: mover el paddle con el mouse (posición X del cursor sobre el canvas) o con `←`/`→`, igual que el original. Sin tecla `P` de pausa ni click para seleccionar nivel — la pausa la controla exclusivamente el botón "PAUSA" del `player-hud`, igual que en Asteroids y Tetris.
- El motor expone stats de HUD (`score`, `lives`, `level`) vía el estado flexible del registry, actualizados solo cuando cambian.
- **Condición de fin de partida y su reflejo en React:** cuando `lives` llega a 0 (derrota) o se completan los 5 niveles (victoria), el motor invoca `onGameOver(finalScore)` una sola vez y detiene el loop, en vez de dibujar los overlays internos "GAME OVER" / "¡Completaste el juego!" del canvas original (quedan deshabilitados). `GamePlayer.tsx` recibe `onGameOver` de forma genérica (mismo mecanismo ya usado por Asteroids y Tetris): al dispararse, pausa el motor, guarda `finalScore` y abre el modal de fin de partida existente, tanto en derrota como en victoria.
- El overlay interno de "PAUSA" del canvas original (con selector de nivel) se deshabilita por completo; React controla la pausa (`pause()`/`resume()`) desde el botón "PAUSA" del `player-hud`, igual que en Asteroids y Tetris.
- Alta de `arkanoid` en la tabla `games` de Supabase (migración `supabase/migrations/003_seed_arkanoid.sql`), con `cat: 'ARCADE'`, `color: 'green'`, cover `.cover-bricks` (reutilizada, sin CSS nuevo).
- Registro de la entrada `arkanoid` en `lib/games/registry.ts` con `width: 800, height: 600` (sin canvas secundario).

**Fuera de alcance (para specs futuros):**

- Sin Realtime (el leaderboard se actualiza al navegar/recargar).
- Sin paginación del leaderboard (top fijo de `getTopScores`).
- Sin autenticación real (`user_id: null` en `scores`, cualquiera puede escribir su nombre).
- Sin controles táctiles/móviles — solo mouse y teclado, igual que la referencia.
- Sin selector de nivel manual (el original lo tenía en el overlay de pausa; se descarta junto con ese overlay).
- Sin tests automatizados.
- Sin tema claro/oscuro propio del juego.
- Sin cambios a `GameDetail.tsx` ni a la ruta `/juego/[id]` más allá de que ahora exista una entrada navegable para `arkanoid`.

## Modelo de datos

Reutiliza sin cambios `ArcadeGameEngine`, `ArcadeGameEngineOptions`, `EngineState`, `EngineHudStat` de `lib/games/types.ts` y `GameRegistryEntry` de `lib/games/registry.ts` (ya existentes, sin modificaciones).

```ts
// lib/games/arkanoid/levels.ts
export interface ArkanoidLevel {
  blocks: { row: number; col: number; color: string }[];
  speed: number; // multiplicador sobre BASE_BALL_VX/VY
}

export const LEVELS: ArkanoidLevel[]; // 5 niveles, portados de levels.js
```

```ts
// lib/games/arkanoid/engine.ts
export class ArkanoidEngine implements ArcadeGameEngine {
  constructor(canvas: HTMLCanvasElement, options: ArcadeGameEngineOptions);
  start(): void;
  pause(): void;
  resume(): void;
  restart(): void;
  destroy(): void;
}
```

```ts
// lib/games/registry.ts (nueva entrada, sin tocar las existentes)
arkanoid: {
  width: 800,
  height: 600,
  initialState: {
    score: 0,
    stats: [
      { key: "lives", label: "Vidas", value: "♥ ♥ ♥" },
      { key: "level", label: "Nivel", value: "01" },
    ],
  },
  create(canvas, options) {
    return new ArkanoidEngine(canvas, options);
  },
},
```

- `games` en Supabase gana una fila más (`arkanoid`), usando el esquema ya existente de `001_games_and_scores.sql` (sin cambios de columnas ni de RLS):

```sql
-- supabase/migrations/003_seed_arkanoid.sql
insert into games (id, title, short, long, cat, cover, color, best_seed, plays_seed)
values (
  'arkanoid',
  'ARKANOID',
  'Rompe bloques con la paleta y la pelota antes de que se te acaben las vidas.',
  'Controla la paleta con el mouse o las flechas para rebotar la pelota y destruir los bloques de 5 niveles con velocidad creciente. 3 vidas, 10 puntos por bloque, animación de explosión y sonidos al rebotar y romper.',
  'ARCADE',
  'cover-bricks',
  'green',
  0,
  '0'
);
```

- `scores` no cambia de esquema: las partidas de Arkanoid se insertan con `game_id: 'arkanoid'`, `user_id: null`, igual que Asteroids y Tetris.

## Plan de implementación

1. **Assets.** Copiar `spritesheet-breakout.png` y `sounds/ball-bounce.mp3` / `sounds/break-sound.mp3` de `references/started-games/04-arkanoid/assets/` a `public/games/arkanoid/` (misma subestructura: `public/games/arkanoid/spritesheet-breakout.png`, `public/games/arkanoid/sounds/*.mp3`).
2. **Helpers de sprites.** Crear `lib/games/arkanoid/spritesheet.ts` portando `assets/spritesheet.js` (`loadSpritesheet`, `drawSprite`, `drawFrame`, `SPRITES`, `EXPLOSION_FRAMES`, `EXPLOSION_DURATION`), apuntando a la ruta pública del paso 1.
3. **Niveles.** Crear `lib/games/arkanoid/levels.ts` portando `levels.js` (5 niveles, patrones de bloques y `speed`).
4. **Motor.** Crear `lib/games/arkanoid/engine.ts` portando `game.js` (`paddle`, `ball`, `blocks`, `explosions`, físicas de rebote, colisiones AABB, vidas, score, sonidos) encapsulado en `ArkanoidEngine implements ArcadeGameEngine`, sin variables globales de módulo (estado por instancia). Implementa `onStateChange` (score/lives/level) y `onGameOver` (al perder la última vida o completar el nivel 5), sin overlays internos de "GAME OVER"/"¡Completaste el juego!"/"PAUSA" ni listener de la tecla `P` ni click de selector de nivel. Manual test: instanciar el motor de forma aislada (fuera de la UI) no es necesario; se prueba integrado en el paso 6.
5. **Alta en el registry.** Agregar la entrada `arkanoid` a `lib/games/registry.ts` (`width: 800, height: 600`, `initialState` con stats `lives`/`level`, `create()` instanciando `ArkanoidEngine`). Aún no es jugable porque `arkanoid` no existe en `games` de Supabase, así que `/jugar/arkanoid` da 404.
6. **Migración de seed.** Crear `supabase/migrations/003_seed_arkanoid.sql` con el `insert` de la fila `arkanoid` (valores confirmados en el Modelo de datos) y aplicarla con `apply_migration` del MCP de Supabase. A partir de aquí `/juego/arkanoid` y `/jugar/arkanoid` son accesibles y Arkanoid aparece en `/biblioteca`, `/` y `/salon`.
7. **Repaso final.** `npm run build` sin errores de tipos. Probar en el navegador el flujo completo: `/biblioteca` → detalle de "arkanoid" → `/jugar/arkanoid` → mover el paddle con mouse y flechas, rebotar la pelota, romper bloques (ver explosión y escuchar sonido), subir de nivel al vaciar el tablero, pausar/reanudar sin saltos, perder las 3 vidas → modal automático con puntaje real, completar el nivel 5 → mismo modal con puntaje real, "GUARDAR PUNTUACIÓN" inserta en `scores`, "JUGAR DE NUEVO" reinicia el motor, "SALIR" no deja el loop corriendo ni listeners activos. Confirmar también que Asteroids y Tetris siguen funcionando igual.

## Criterios de aceptación

- [ ] Existe `lib/games/arkanoid/levels.ts` con los 5 niveles portados de `levels.js` y `lib/games/arkanoid/spritesheet.ts` con los helpers portados de `assets/spritesheet.js`.
- [ ] Los assets (`spritesheet-breakout.png`, `ball-bounce.mp3`, `break-sound.mp3`) existen en `public/games/arkanoid/` y el motor los carga desde ahí.
- [ ] Existe `lib/games/arkanoid/engine.ts` con `ArkanoidEngine implements ArcadeGameEngine`, sin variables globales de módulo.
- [ ] Existe una fila `arkanoid` en `games` (Supabase) con los valores acordados (`cat: 'ARCADE'`, `color: 'green'`, `cover: 'cover-bricks'`, `best_seed: 0`, `plays_seed: '0'`).
- [ ] `/jugar/arkanoid` renderiza el canvas (800×600) dentro de `.crt-screen`.
- [ ] El HUD de React refleja en tiempo real Puntuación, Vidas y Nivel del motor (no valores fijos).
- [ ] Mover el paddle con el mouse y con `←`/`→` funciona igual que en `game.js`.
- [ ] Romper un bloque suma 10 puntos, dispara la animación de explosión (4 frames) y reproduce `break-sound.mp3`; rebotar contra pared o paddle reproduce `ball-bounce.mp3`.
- [ ] Vaciar los bloques de un nivel (1 a 4) carga el siguiente nivel con su velocidad correspondiente, sin abrir el modal de fin de partida.
- [ ] PAUSA/REANUDAR detiene y reactiva el loop del motor sin saltos de física ni overlay interno del canvas.
- [ ] Perder la última vida invoca `onGameOver` y abre automáticamente el modal de fin de partida con el puntaje real, sin overlay interno "GAME OVER".
- [ ] Completar el nivel 5 invoca `onGameOver` y abre automáticamente el mismo modal con el puntaje real, sin overlay interno "¡Completaste el juego!".
- [ ] "GUARDAR PUNTUACIÓN" inserta una fila en `scores` con `game_id: "arkanoid"`, `user_id: null`, `score` real.
- [ ] "JUGAR DE NUEVO" reinicia una instancia nueva del motor (nivel 1, 3 vidas, score 0).
- [ ] Arkanoid aparece como tab nuevo en `/salon` (sin tocar código de `HallOfFame.tsx`) y su top coincide con el mostrado en `/juego/arkanoid`.
- [ ] Salir del juego (botón "SALIR" o navegar fuera de `/jugar/arkanoid`) cancela el `requestAnimationFrame`, remueve los listeners de mouse/teclado y detiene cualquier audio en curso.
- [ ] `npm run build` compila sin errores de tipos.

## Decisiones tomadas y descartadas

- **Sí:** portar los sprites y sonidos originales (`spritesheet-breakout.png`, `ball-bounce.mp3`, `break-sound.mp3`) a `public/games/arkanoid/`, en vez de redibujar con formas simples. Se prioriza fidelidad visual/sonora con la referencia, decisión explícita del usuario aunque rompe la consistencia con Asteroids/Tetris (que no usan assets externos).
- **No:** portar el overlay interno de pausa con selector de nivel (click en botones 1–5). Se descarta para evitar dos mecanismos de pausa fuera de sincronía (teclado/click del canvas vs. botón "PAUSA" de React), mismo criterio ya aplicado en Tetris con la tecla `P`.
- **Sí:** portar los 5 niveles completos y el estado de victoria al completarlos, disparando `onGameOver(finalScore)` igual que la derrota, en vez de un overlay interno "¡Completaste el juego!". Mantiene consistencia: solo React dibuja overlays de fin de partida.
- **Sí:** categoría `ARCADE` y color `green`, en vez de reutilizar `cyan` (Asteroids) o `magenta` (Tetris), para diferenciar visualmente los tres juegos en la biblioteca y el Salón de la Fama.
- **Sí:** reutilizar `.cover-bricks` ya existente en `app/globals.css` en vez de crear una clase nueva, porque ya representa visualmente filas de bloques de colores y evita CSS duplicado.
- **No:** agregar canvas secundario. Arkanoid no tiene un elemento equivalente a la "pieza siguiente" de Tetris.
- **Sí:** mantener ambos controles de paddle del original (mouse y flechas), sin forzar uno solo, porque el original ya los soporta simultáneamente sin conflicto.

## Riesgos identificados

| Riesgo                                                                                                                                                                                                             | Mitigación                                                                                                                                                                                          |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fuga del `requestAnimationFrame` y de los listeners de mouse/teclado si `ArkanoidEngine.destroy()` no los limpia al desmontar/navegar fuera de `/jugar/arkanoid`.                                                  | Cubierto explícitamente en el paso 7 del plan y en los criterios de aceptación.                                                                                                                     |
| `dt` (delta time) gigante al reanudar de una pausa larga, si `pause()` no detiene el reloj interno (`lastTime`) y `resume()` no lo resetea.                                                                        | Al pausar, detener el bucle por completo (no solo saltear `update`); al reanudar, resetear `lastTime` como si fuera el primer frame — mismo patrón ya validado en `AsteroidsEngine`/`TetrisEngine`. |
| Estado global de módulo que sobrevive al HMR de Next.js, si `ArkanoidEngine` no encapsula todo su estado (`paddle`, `ball`, `blocks`, `explosions`, `lives`, `score`, `currentLevel`) en propiedades de instancia. | El motor se escribe desde cero como clase con estado por instancia, sin variables de módulo, siguiendo el mismo patrón ya validado en `AsteroidsEngine`/`TetrisEngine`.                             |
| Overlay de "GAME OVER"/"victoria"/"PAUSA" duplicado entre el canvas y React, si el motor conserva su propio dibujo de esos estados.                                                                                | Se deshabilita explícitamente el dibujo interno de los tres overlays en el paso 4 del plan; React es el único responsable de mostrarlos.                                                            |
| **Carga asíncrona de assets antes del primer frame.** Si el motor arranca el loop (`start()`) antes de que `loadSpritesheet` termine de cargar la imagen, el primer frame se dibuja en blanco o rompe.             | `start()` espera a que `loadSpritesheet` invoque su callback antes de llamar a `requestAnimationFrame`, igual que el original (`loadSpritesheet(() => { ...; requestAnimationFrame(loop); })`).     |
| **Política de autoplay de audio del navegador.** `Audio.play()` puede rechazar su promesa si se invoca sin gesto previo del usuario.                                                                               | No es un riesgo real en este flujo: el primer sonido siempre ocurre durante la partida, después de que el usuario ya interactuó (mouse/teclado) para llegar a `/jugar/arkanoid` y mover el paddle.  |
| **Canvas fuera de sincronía tras `destroy()`.** Si `destroy()` no detiene sonidos en reproducción (`Audio` clonados), un sonido podría seguir sonando tras salir del juego.                                        | El motor mantiene referencia a los `Audio` en reproducción o acepta el corte natural al desmontar el componente; cubierto en el criterio de aceptación de "SALIR".                                  |

## Lo que no está en este spec

- Realtime en el leaderboard.
- Paginación del leaderboard.
- Autenticación real.
- Controles táctiles/móviles.
- Selector manual de nivel.
- Tests automatizados.
- Toggle de tema claro/oscuro propio del juego.
- Cambios a `GameDetail.tsx` o a la ruta `/juego/[id]` más allá de la nueva entrada navegable.

Cada uno de estos, si se necesita, va en su propio spec futuro.
