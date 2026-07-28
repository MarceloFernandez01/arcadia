# SPEC 09 — Juego Snake

> **Estado:** Aprobado
> **Depende de:** SPEC 05 (asteroids-game), SPEC 06 (leaderboard-supabase), SPEC 07 (tetris-game)
> **Fecha:** 2026-07-28
> **Objetivo:** Implementar Snake como motor real en TypeScript/Canvas bajo el id `snake`, con grid clásico, wrap-around en los bordes y frutas del atlas retro de `references/assest-source/snake-assets/`, dado de alta en `lib/games/registry.ts` y en Supabase para que aparezca en el Salón de la Fama.

## Alcance

**Incluye:**

- Motor de Snake en `lib/games/snake/engine.ts`, implementando `ArcadeGameEngine` (interfaz existente en `lib/games/types.ts`, sin cambios).
- Grid clásico de movimiento discreto (dimensiones exactas a confirmar durante la implementación; punto de partida: 20×20 celdas de 30px → canvas 600×600).
- Serpiente representada como rectángulos simples (sin sprite propio), igual que las piezas de Tetris — sin depender de `sprites.js` para la serpiente.
- Wrap-around en los cuatro bordes: la serpiente reaparece del lado opuesto en vez de morir contra la pared.
- Muerte únicamente por colisión contra el propio cuerpo.
- Fruta representada con el atlas retro (fila "pixel art" de `fruits.png`, coordenadas re-derivadas en TypeScript a partir de `sprites.js`, no se porta el archivo `.js` tal cual). Solo se usan las frutas de esa fila (no la primera fila "flat" ni la tercera "realista").
- Al comer una fruta: la serpiente crece un segmento, suma 10 puntos (valor fijo para todas las frutas) y aparece una nueva fruta aleatoria (aleatoria entre las frutas retro, en una celda libre del grid).
- Velocidad de la serpiente aumenta en función de su longitud (reduciendo el intervalo del tick a medida que crece, con un piso mínimo de velocidad).
- El motor avanza el grid usando delta time real (`performance.now()` acumulado entre frames de `requestAnimationFrame`), no un paso por frame, para que la velocidad sea consistente sin importar la tasa de refresco del monitor.
- Controles: flechas del teclado y WASD, sin permitir giro de 180° instantáneo (no se puede invertir directamente sobre el propio cuello).
- El motor expone stats de HUD (`score`, `length`) vía el estado flexible del registry, actualizados solo cuando cambian.
- Al chocar contra el propio cuerpo, el motor invoca `onGameOver(finalScore)` una sola vez y detiene el loop, sin overlay interno de "GAME OVER" — el modal de fin de partida de React es el único responsable, igual que Asteroids/Tetris/Arkanoid.
- Alta de `snake` en la tabla `games` de Supabase (migración `supabase/migrations/004_seed_snake.sql`), `cat: 'ARCADE'`, `color: 'yellow'`, cover `.cover-snake` (ya existente en `app/globals.css`, sin CSS nuevo).
- Registro de la entrada `snake` en `lib/games/registry.ts` (dimensiones a confirmar en el plan de implementación).

**Fuera de alcance (para specs futuros):**

- Sin Realtime (el leaderboard se actualiza al navegar/recargar).
- Sin paginación del leaderboard (top fijo de `getTopScores`).
- Sin autenticación real (`user_id: null` en `scores`, cualquiera puede escribir su nombre).
- Sin controles táctiles/móviles.
- Sin las filas "flat" ni "realista" del atlas de frutas — solo la fila retro/pixel art.
- Sin obstáculos, power-ups ni niveles adicionales — Snake clásico simple.
- Sin corrección de los nombres desalineados de `sprites.js` ni sistema de valores/rareza distintos por fruta (ej. sandía = 30 puntos y menos frecuente) — todas las frutas valen 10 puntos por igual y usan las claves de nombre tal como se porten. Si se necesita en el futuro, va en un spec propio de "frutas con valor y rareza variable".
- Sin tests automatizados.
- Sin tema claro/oscuro propio del juego.
- Sin cambios a `GameDetail.tsx` ni a la ruta `/juego/[id]` más allá de la nueva entrada navegable.

## Modelo de datos

Reutiliza sin cambios `ArcadeGameEngine`, `ArcadeGameEngineOptions`, `EngineState`, `EngineHudStat` de `lib/games/types.ts` y `GameRegistryEntry` de `lib/games/registry.ts` (ya existentes, sin modificaciones).

```ts
// lib/games/snake/fruits.ts
export interface FruitSprite {
  x: number;
  y: number;
  w: number;
  h: number; // recorte dentro de fruits.png (fila retro)
}
export const FRUITS: Record<string, FruitSprite>; // solo la fila retro/pixel art del atlas
```

```ts
// lib/games/snake/engine.ts
interface Segment {
  x: number;
  y: number;
} // coordenadas en celdas de grid, no en píxeles

export class SnakeEngine implements ArcadeGameEngine {
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
snake: {
  width: 600,
  height: 600,
  initialState: {
    score: 0,
    stats: [
      { key: "length", label: "Longitud", value: "1" },
    ],
  },
  create(canvas, options) {
    return new SnakeEngine(canvas, options);
  },
},
```

- `games` en Supabase gana una fila más (`snake`), usando el esquema ya existente de `001_games_and_scores.sql` (sin cambios de columnas ni de RLS):

```sql
-- supabase/migrations/004_seed_snake.sql
insert into games (id, title, short, long, cat, cover, color, best_seed, plays_seed)
values (
  'snake',
  'SNAKE',
  'Come frutas, crece y no choques contra tu propia cola.',
  'Controla la serpiente con las flechas o WASD para comer frutas retro y crecer. Los bordes del tablero funcionan como wrap-around; la única forma de perder es chocar contra tu propio cuerpo. La velocidad aumenta a medida que la serpiente crece.',
  'ARCADE',
  'cover-snake',
  'yellow',
  0,
  '0'
);
```

- `scores` no cambia de esquema: las partidas de Snake se insertan con `game_id: 'snake'`, `user_id: null`, igual que los demás juegos.

## Plan de implementación

1. **Sprites de frutas.** Crear `lib/games/snake/fruits.ts` con el mapa `FRUITS` (recortes de la fila retro de `fruits.png`, coordenadas re-derivadas de `sprites.js`) y una función `loadFruitSheet()` que carga la imagen desde `public/games/snake/fruits.png`.
2. **Assets.** Copiar `fruits.png` de `references/assest-source/snake-assets/` a `public/games/snake/fruits.png`.
3. **Motor — esqueleto y grid.** Crear `lib/games/snake/engine.ts` con `SnakeEngine implements ArcadeGameEngine`, estado por instancia (`snakeBody: Segment[]`, `direction`, `fruitCell`, `score`). El loop usa `requestAnimationFrame` acumulando `dt` real entre frames (`performance.now()`) y solo avanza un paso del grid cuando el acumulador supera el intervalo del tick vigente — nunca un paso por frame. Dibuja el grid y la serpiente (rectángulos) sin fruta ni colisiones todavía.
4. **Alta en el registry.** Agregar la entrada `snake` a `lib/games/registry.ts` (dimensiones de grid confirmadas, `initialState` con stat `length`, `create()` instanciando `SnakeEngine`).
5. **Migración de seed.** Crear `supabase/migrations/004_seed_snake.sql` con el `insert` de la fila `snake` (valores confirmados en el Modelo de datos) y aplicarla con `apply_migration` del MCP de Supabase. A partir de aquí `/juego/snake` y `/jugar/snake` son accesibles y Snake aparece en `/biblioteca`, `/` y `/salon`. Manual test: verificar en el navegador el esqueleto del motor (grid y serpiente sin fruta ni colisiones) directamente en `/jugar/snake`, para detectar cualquier problema de integración de forma temprana en vez de al final del plan.
6. **Controles.** Listener de teclado para flechas y WASD, bloqueando el giro de 180° instantáneo sobre el propio cuello. Manual test: probar ambos esquemas de control y el bloqueo de giro 180° en `/jugar/snake` (nota: el comportamiento en el borde del grid es todavía indefinido/temporal en este punto, porque el wrap-around se implementa en el paso siguiente).
7. **Colisión y wrap-around.** Implementar wrap-around en los bordes y muerte por colisión contra el propio cuerpo (`onGameOver`). El aumento de velocidad por longitud se deja para el paso siguiente, junto con el crecimiento, porque recién ahí la serpiente puede crecer y la velocidad tiene algo real que medir. Manual test: probar wrap-around en los cuatro bordes y game over por colisión contra el propio cuerpo en `/jugar/snake`.
8. **Fruta, crecimiento y velocidad.** Agregar spawn de fruta aleatoria (entre las 21 del atlas) en celda libre, detección de colisión cabeza-fruta, crecimiento de la serpiente y suma de 10 puntos, llamando a `loadFruitSheet()` del paso 1; junto con el aumento de velocidad (reducción del intervalo del tick, con piso mínimo) en función de la longitud de la serpiente. Manual test: probar en `/jugar/snake` que la fruta aparece, se come, suma puntos, la serpiente crece y la velocidad aumenta con la longitud.
9. **Repaso final.** `npm run build` sin errores de tipos. Probar en el navegador el flujo completo: `/biblioteca` → detalle de "snake" → `/jugar/snake` → mover con flechas y WASD, comer frutas (ver longitud y puntaje subir), cruzar los bordes (wrap-around), notar el aumento de velocidad al crecer, chocar contra el propio cuerpo → modal automático con puntaje real, pausar/reanudar sin saltos, "GUARDAR PUNTUACIÓN" inserta en `scores`, "JUGAR DE NUEVO" reinicia el motor, "SALIR" no deja el loop ni listeners activos. Confirmar que Asteroids, Tetris y Arkanoid siguen funcionando igual.

## Criterios de aceptación

- [ ] Existe `lib/games/snake/fruits.ts` con el mapa `FRUITS` (21 frutas, coordenadas portadas de `sprites.js`; los nombres son solo claves internas y no necesitan coincidir exactamente con el sprite visual) y `lib/games/snake/engine.ts` con `SnakeEngine implements ArcadeGameEngine`, sin variables globales de módulo.
- [ ] El asset `fruits.png` existe en `public/games/snake/fruits.png` y el motor lo carga desde ahí.
- [ ] Existe una fila `snake` en `games` (Supabase) con los valores acordados (`cat: 'ARCADE'`, `color: 'yellow'`, `cover: 'cover-snake'`, `best_seed: 0`, `plays_seed: '0'`).
- [ ] `/jugar/snake` renderiza el canvas del grid dentro de `.crt-screen`.
- [ ] El HUD de React refleja en tiempo real Puntuación y Longitud del motor (no valores fijos).
- [ ] Mover la serpiente con flechas y con WASD funciona; no se puede girar 180° instantáneamente sobre el propio cuello.
- [ ] Cruzar cualquiera de los cuatro bordes hace que la serpiente reaparezca del lado opuesto (wrap-around), sin terminar la partida.
- [ ] Comer una fruta suma exactamente 10 puntos, hace crecer la serpiente un segmento y genera una nueva fruta aleatoria en una celda libre.
- [ ] El avance de la serpiente se basa en delta time real (no en frames), de modo que la velocidad percibida es la misma sin importar la tasa de refresco del monitor.
- [ ] La velocidad del tick disminuye (la serpiente se mueve más rápido) a medida que la longitud aumenta, respetando un piso mínimo de intervalo.
- [ ] Chocar contra el propio cuerpo invoca `onGameOver` y abre automáticamente el modal de fin de partida con el puntaje real, sin overlay interno "GAME OVER".
- [ ] PAUSA/REANUDAR detiene y reactiva el loop sin saltos ni movimientos perdidos.
- [ ] "GUARDAR PUNTUACIÓN" inserta una fila en `scores` con `game_id: "snake"`, `user_id: null`, `score` real.
- [ ] "JUGAR DE NUEVO" reinicia una instancia nueva del motor (serpiente en posición inicial, score 0, longitud inicial).
- [ ] Snake aparece como tab nuevo en `/salon` (sin tocar código de `HallOfFame.tsx`) y su top coincide con el mostrado en `/juego/snake`.
- [ ] Salir del juego (botón "SALIR" o navegar fuera de `/jugar/snake`) cancela el `requestAnimationFrame` y remueve los listeners de teclado.
- [ ] `npm run build` compila sin errores de tipos.

## Decisiones tomadas y descartadas

- **Sí:** nombres de `FRUITS` como claves internas sin corregir el desfase de `sprites.js`. No afectan la jugabilidad ni se muestran al jugador; corregirlos ahora sería esfuerzo sin beneficio funcional.
- **No:** valores de puntaje distintos por fruta o frecuencia de aparición variable (ej. frutas "raras" que valgan más). Queda fuera de este spec; candidato a spec futuro si se decide diferenciar frutas.
- **Sí:** wrap-around en los bordes en vez de muerte contra la pared, para diferenciar a Snake de la mecánica más común y porque el usuario lo pidió explícitamente.
- **Sí:** WASD además de flechas, ya que el resto de los juegos de la plataforma no lo requería pero Snake se beneficia de un control más flexible.
- **Sí:** serpiente dibujada como rectángulos simples (sin sprite propio), igual que las piezas de Tetris, en vez de crear un sprite dedicado — consistente con el resto de la plataforma y evita depender de assets adicionales no provistos.
- **Sí:** solo la fila retro/pixel art del atlas de frutas (`fruits.png`), descartando las filas "flat" y "realista" para mantener consistencia visual con la estética retro de la plataforma.
- **Sí:** categoría `ARCADE` y color `yellow`, reutilizando `.cover-snake` ya existente en `app/globals.css` (creada previamente pero sin uso), evitando CSS nuevo.
- **Sí:** delta time real (`performance.now()` acumulado) para avanzar el grid, en vez de un paso por frame de `requestAnimationFrame`, para que la velocidad sea consistente entre equipos con distinta tasa de refresco.
- **No:** power-ups, obstáculos o niveles adicionales — Snake clásico simple, según lo acordado en el alcance.

## Riesgos identificados

| Riesgo                                                                                                                                                                                                                                                               | Mitigación                                                                                                                                                                                                                                                                               |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fuga del `requestAnimationFrame` y de los listeners de teclado si `SnakeEngine.destroy()` no los limpia al desmontar/navegar fuera de `/jugar/snake`.                                                                                                                | Cubierto explícitamente en el paso 9 del plan y en los criterios de aceptación.                                                                                                                                                                                                          |
| `dt` (delta time) gigante al reanudar de una pausa larga, si `pause()` no detiene el reloj/acumulador interno del tick y `resume()` no lo resetea, provocando que la serpiente "salte" varias celdas de golpe al reanudar.                                           | Al pausar, detener el bucle por completo (no solo saltear `update`); al reanudar, resetear el acumulador de tiempo como si fuera el primer frame — mismo patrón ya validado en `AsteroidsEngine`/`TetrisEngine`/`ArkanoidEngine`.                                                        |
| Estado global de módulo que sobrevive al HMR de Next.js, si `SnakeEngine` no encapsula todo su estado (`snakeBody`, `direction`, `fruitCell`, `score`, velocidad actual) en propiedades de instancia.                                                                | El motor se escribe desde cero como clase con estado por instancia, sin variables de módulo, siguiendo el mismo patrón ya validado en los motores existentes.                                                                                                                            |
| **Cambio de dirección en el mismo tick que revierte sobre el cuello.** Si el jugador presiona dos teclas de dirección opuestas muy rápido dentro del mismo intervalo de tick, la serpiente podría "morir" contra sí misma de forma no intencional (input buffering). | El motor solo aplica un cambio de dirección por tick (el último presionado antes del siguiente paso del grid) y descarta cualquier dirección que sea el opuesto exacto de la dirección actual, no solo del último input aceptado.                                                        |
| **Fruta generada dentro del propio cuerpo de la serpiente.** El spawn aleatorio podría elegir una celda ocupada por un segmento de la serpiente.                                                                                                                     | El spawn valida contra `snakeBody` y reintenta hasta encontrar una celda libre (o recorre las celdas libres restantes si la serpiente ocupa gran parte del grid).                                                                                                                        |
| **Velocidad creciente sin techo.** Si el intervalo del tick se reduce linealmente con la longitud sin un mínimo, en partidas muy largas el juego podría volverse injugable o el loop podría degradar el rendimiento.                                                 | Se define un intervalo mínimo de tick (piso de velocidad) al portar la fórmula de aumento de velocidad en el paso 5 del plan.                                                                                                                                                            |
| **Velocidad dependiente de la tasa de refresco del monitor.** Si el motor avanza la serpiente una celda por frame de `requestAnimationFrame` en vez de por tiempo transcurrido, la serpiente se movería más rápido en monitores de 144Hz que en uno de 60Hz.         | El motor acumula `dt` real (`performance.now()` entre frames) y solo avanza un paso del grid cuando el acumulador supera el intervalo del tick vigente (mismo patrón de delta time ya usado en `AsteroidsEngine`/`TetrisEngine`/`ArkanoidEngine`), independiente de la tasa de refresco. |
| Overlay de "GAME OVER" duplicado entre el canvas y React, si el motor dibuja su propio texto de fin de partida.                                                                                                                                                      | Se deshabilita explícitamente el dibujo interno de ese overlay; React es el único responsable de mostrarlo, igual que en los demás juegos.                                                                                                                                               |

## Lo que no está en este spec

- Realtime en el leaderboard.
- Paginación del leaderboard.
- Autenticación real.
- Controles táctiles/móviles.
- Filas "flat" y "realista" del atlas de frutas.
- Obstáculos, power-ups o niveles adicionales.
- Corrección de nombres de `sprites.js` o sistema de valores/rareza distintos por fruta.
- Tests automatizados.
- Toggle de tema claro/oscuro propio del juego.
- Cambios a `GameDetail.tsx` o a la ruta `/juego/[id]` más allá de la nueva entrada navegable.

Cada uno de estos, si se necesita, va en su propio spec futuro.
