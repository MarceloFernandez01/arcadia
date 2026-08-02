# SPEC GJ-frogger-01 — Juego Frogger (base)

> **Estado:** Implementado
> **Depende de:** SPEC 05 (asteroids-game), SPEC 06 (leaderboard-supabase), SPEC 07 (tetris-game)
> **Fecha:** 2026-07-29
> **Objetivo:** Implementar el Frogger clásico de Konami como motor real en TypeScript/Canvas bajo el id `frogger`, con carretera de cinco carriles, río de cinco filas de troncos y tortugas, cinco casillas de llegada y temporizador por rana, dado de alta en `lib/games/registry.ts` y en Supabase para que aparezca en el Salón de la Fama.

> **Nota de numeración:** el identificador `GJ-frogger-01` es local a esta game jam (`specs/game-jam/frogger/`) y **no consume** la numeración correlativa global de `specs/` (que hoy llega hasta `09-snake-game.md`). Este spec **no depende** de `02-frogger-poderes-game.md`: ambos son independientes y se pueden implementar en cualquier orden, o solo uno de los dos.

## Por qué este spec existe

El juego base recibido para esta game jam es **Frogger** (Konami, 1981). Este archivo es la **versión base**: reproduce el bucle arcade original con el mínimo de ajustes necesarios para encajar en Arcade Vault, sin mecánicas añadidas. La variante con modificación vive en `02-frogger-poderes-game.md` (power-ups temporales) y es un juego distinto del catálogo, con su propio id, color y fila en `games`.

Frogger ya estaba en el backlog del agente `game-planner` (`references/game-suggestions-todo.md`, línea "Frogger (Rana) — ARCADE — alternativa"), evaluado como viable pero sin diversificar categoría. Este spec lo toma tal cual y cierra las decisiones abiertas que el planificador dejó sin fijar (dimensiones, balance, fórmula de puntaje).

**Encaje con los criterios de la plataforma:**

1. **Score acumulable** — puntaje numérico único: 10 por fila nueva avanzada, 50 por rana en casa, bonus por tiempo restante, 1000 por nivel completo. Comparable entre partidas.
2. **Un jugador, partidas cortas** — 3 ranas (vidas) y 40 segundos por intento; una partida promedio dura entre 2 y 4 minutos. Sin multijugador, sin progreso persistente.
3. **Motor viable en Canvas 2D + rAF** — filas con objetos que se desplazan a velocidad constante y colisión AABB; no hay física continua, ni 3D, ni pathfinding, ni audio obligatorio.
4. **Compatible con `ArcadeGameEngine`** — `start/pause/resume/restart/destroy`, HUD vía `stats[{key,label,value}]`, `onGameOver(finalScore)`; el motor no dibuja overlays de "GAME OVER" ni de "PAUSA".
5. **Control por teclado** — flechas y WASD, un salto discreto por pulsación.
6. **Assets** — todo dibujado por código con formas geométricas. Sin spritesheets nuevos, por lo tanto **sin carpeta `public/games/frogger/`**.
7. **Hueco de catálogo** — `references/implemented-games.md` tiene `asteroides` (SHOOTER/cyan), `tetris` (PUZZLE/magenta), `arkanoid` (ARCADE/green), `snake` (ARCADE/yellow). Frogger entra como `ARCADE`/`green`: la categoría no diversifica (es intrínsecamente ARCADE), pero aporta una mecánica ausente en el catálogo, el avance por filas contra obstáculos en movimiento, que no se parece a ningún juego ya implementado.
8. **Estética retro/neón** — paleta de variables de `app/globals.css` (`--green`, `--cyan`, `--magenta`, `--yellow`) sobre fondo oscuro; cover `.cover-rana`, ya existente y sin uso.

## Alcance

**Incluye:**

- Motor de Frogger en `lib/games/frogger/engine.ts`, implementando `ArcadeGameEngine` (interfaz existente en `lib/games/types.ts`, sin cambios).
- `lib/games/frogger/lanes.ts` con la definición declarativa de las filas (tipo, dirección, velocidad base, largo y espaciado de los objetos) y la curva de dificultad por nivel.
- Tablero en grid de 13 columnas × 14 filas de 40 px → canvas de **520×560**, con el mismo layout del original: fila de casillas arriba, cinco filas de río, mediana segura, cinco carriles de carretera, acera de inicio y una franja inferior con la barra de tiempo dibujada dentro del canvas.
- Cinco casillas de llegada (`home slots`) que se marcan como ocupadas al llegar una rana; completar las cinco sube de nivel.
- Temporizador de 40 segundos por intento, con bonus de puntaje por tiempo restante al llegar a casa.
- Tres ranas (vidas). Muerte por atropello, por caer al agua, por ir sobre una tortuga sumergida, por ser arrastrada fuera del borde lateral sobre una plataforma, por saltar a una casilla ya ocupada o al seto entre casillas, y por agotar el tiempo.
- Tortugas que se sumergen en ciclo, con fase de aviso visual antes de hundirse.
- Curva de dificultad por nivel: velocidades escaladas y tiempo por intento reducido, con techo y piso explícitos.
- Controles: flechas y WASD; un salto discreto de una celda por pulsación, con interpolación visual corta.
- Stats de HUD expuestas vía el estado flexible del registry: `lives`, `level`, `time`, `homes`; `score` aparte, actualizados solo cuando cambian.
- Al perder la última rana, el motor invoca `onGameOver(finalScore)` una sola vez y detiene el loop, **sin overlay interno de "GAME OVER" ni de "PAUSA"** — React controla la pausa desde el botón "PAUSA" del `player-hud` y el modal de fin de partida ya existente, igual que Asteroids/Tetris/Arkanoid/Snake.
- Alta de `frogger` en la tabla `games` de Supabase (migración de seed nueva; ver Modelo de datos), `cat: 'ARCADE'`, `color: 'green'`, cover `.cover-rana` (ya existente en `app/globals.css`, sin CSS nuevo).
- Registro de la entrada `frogger` en `lib/games/registry.ts` (`width: 520`, `height: 560`).

**Fuera de alcance (para specs futuros):**

- Sin multijugador y sin progresión persistente entre partidas.
- Sin audio ni efectos de sonido.
- Sin cocodrilos en el río, serpientes en la mediana, nutrias, rana hembra ni cocodrilo asomando en una casilla (extras del original en niveles altos; suben el costo del motor sin cambiar el bucle).
- Sin mosca bonus en las casillas: se descarta en la versión base para mantener el motor mínimo (ver Decisiones).
- Sin power-ups ni modificadores temporales — eso es el spec `02-frogger-poderes-game.md`, que es un juego aparte.
- Sin assets de imagen: nada en `public/games/frogger/`.
- Heredado de SPEC 05/06: sin Realtime (el leaderboard se actualiza al navegar/recargar), sin paginación del leaderboard (top fijo de `getTopScores`), sin autenticación real (`user_id: null` en `scores`), sin tests automatizados, sin tema claro/oscuro propio del juego, sin cambios a `GameDetail.tsx` ni a la ruta `/juego/[id]` más allá de la nueva entrada navegable.

## Reglas del juego

### Layout del tablero

Grid de 13 columnas × 14 filas, celda de 40 px. Filas de arriba (índice 0) hacia abajo:

| Fila | Contenido                                           | Seguridad                       |
| ---- | --------------------------------------------------- | ------------------------------- |
| 0    | Cinco casillas de llegada separadas por seto        | Meta (o muerte si está ocupada) |
| 1    | Río — troncos medianos (3 celdas), hacia la derecha | Solo sobre plataforma           |
| 2    | Río — tortugas (grupos de 3), hacia la izquierda    | Solo sobre tortuga a flote      |
| 3    | Río — troncos largos (4 celdas), hacia la derecha   | Solo sobre plataforma           |
| 4    | Río — troncos cortos (2 celdas), hacia la derecha   | Solo sobre plataforma           |
| 5    | Río — tortugas (grupos de 2), hacia la izquierda    | Solo sobre tortuga a flote      |
| 6    | Mediana (isla de césped)                            | Segura                          |
| 7    | Carretera — buggies (1 celda), derecha, rápidos     | Muerte por colisión             |
| 8    | Carretera — camiones (2 celdas), izquierda          | Muerte por colisión             |
| 9    | Carretera — coches (1 celda), derecha               | Muerte por colisión             |
| 10   | Carretera — bulldozers (1 celda), izquierda         | Muerte por colisión             |
| 11   | Carretera — coches (1 celda), derecha, lentos       | Muerte por colisión             |
| 12   | Acera de inicio                                     | Segura, reaparición de la rana  |
| 13   | Franja de la barra de tiempo (no jugable)           | —                               |

Velocidades base en px/s por fila (nivel 1): fila 1 = 55, fila 2 = 70, fila 3 = 85, fila 4 = 110, fila 5 = 65, fila 7 = 130, fila 8 = 55, fila 9 = 75, fila 10 = 90, fila 11 = 60. El signo lo define la dirección de la fila.

Espaciado entre objetos de la misma fila: constante por fila, expresado en celdas (troncos 4–6 celdas de hueco, tortugas 3–4, vehículos 4–7 según carril). Cuando un objeto sale por completo por un borde, reaparece por el borde opuesto conservando el espaciado, de modo que el patrón de cada fila es cíclico y determinista.

### Bucle y movimiento

- El loop usa `requestAnimationFrame` con delta time real (`performance.now()`), y todas las posiciones se integran en píxeles por segundo. Nada avanza "por frame".
- La rana ocupa una celda lógica (`col`, `row`) más un desplazamiento en píxeles cuando va sobre una plataforma. Su hitbox es de 28×28 px centrada en la celda.
- Un salto mueve la rana exactamente una celda en la dirección pulsada, con interpolación visual de 100 ms. Durante ese lapso no se acepta otro salto; se guarda como máximo un salto en cola.
- La rana no puede salir del tablero por su propio salto (los saltos que la sacarían del grid se ignoran).
- Sobre una plataforma del río, la rana se desplaza con ella cada frame. Si el centro de la rana sale del rango horizontal del canvas mientras está sobre una plataforma, muere.

### Colisiones y muerte

- **Carretera:** solapamiento de la hitbox de la rana con la hitbox de un vehículo (ancho del objeto menos 4 px de margen a cada lado) → muerte.
- **Río:** si la hitbox de la rana (28×28 px) no se solapa con ninguna plataforma a flote de la fila → muerte por ahogo. Igual que en la carretera, se usa solapamiento de hitbox y no solo el punto central, para no matar al jugador cuando aterriza cerca del borde de un tronco visualmente ocupado.
- **Tortuga sumergida:** las tortugas alternan un ciclo de 4 s: 2.4 s a flote, 0.8 s parpadeando (aún sostienen), 0.8 s sumergidas (no sostienen). Estar sobre una tortuga sumergida → muerte.
- **Casillas:** saltar a una casilla libre = rana en casa. Saltar a una casilla ya ocupada o al seto entre casillas → muerte.
- **Tiempo:** si el temporizador llega a 0 → muerte.
- Cada muerte descuenta una rana, reinicia la posición en la acera de inicio (columna central) y reinicia el temporizador al valor del nivel. Las casillas ya ocupadas **se conservan**.
- Al perder la tercera rana: `onGameOver(finalScore)` una sola vez y el loop se detiene.

### Puntaje

- **10 puntos** por cada fila nueva alcanzada por encima de la fila más alta alcanzada en el intento actual (`maxRowReached`). Bajar y volver a subir no vuelve a puntuar: evita farmear puntos saltando arriba y abajo.
- **50 puntos** por cada rana que llega a una casilla libre.
- **Bonus de tiempo** al llegar a casa: `10 × floor(msRestantes / 500)` — es decir 10 puntos por cada medio segundo no usado, igual que el original (20 puntos por segundo restante).
- **1000 puntos** al ocupar las cinco casillas (nivel completado).
- No hay puntos por sobrevivir sin avanzar ni por tiempo transcurrido.

### Curva de dificultad

- El nivel arranca en 1 y sube en 1 cada vez que se completan las cinco casillas. Al subir de nivel, las casillas se vacían, la rana vuelve a la acera y el temporizador se reinicia.
- Multiplicador de velocidad por nivel: `min(0.7 + 0.1875 × (nivel - 1), 2.2)` — el nivel 1 arranca a 70 % de la velocidad base (más permisivo para el primer contacto con el juego) y alcanza el mismo techo de `2.2` en el nivel 9, mantenido después.
- Tiempo por intento: `max(40 - (nivel - 1), 20)` segundos — un segundo menos por nivel, con piso de 20 s.
- El ciclo de inmersión de las tortugas se acorta un 5 % por nivel, con piso de 2.6 s de ciclo total. Además, la proporción del ciclo que pasan sumergidas también depende del nivel: `min(0.2, 0.08 + 0.024 × (nivel - 1))` — 8 % del ciclo en el nivel 1, creciendo hasta el 20 % original a partir del nivel 6. El resto del ciclo se reparte entre la fase a flote y la fase de aviso (20 % fijo).
- Las vidas **no** se reponen al subir de nivel.

### Controles

- `←` / `→` / `↑` / `↓` y `A` / `D` / `W` / `S`: salto de una celda en esa dirección.
- Ninguna otra tecla tiene efecto. En particular, no hay tecla de pausa ni de reinicio: la pausa la controla el botón "PAUSA" del `player-hud` y el reinicio el botón "JUGAR DE NUEVO" del modal.
- `preventDefault()` en las flechas para que la página no haga scroll durante la partida.
- Táctil/móvil: D-pad de 4 direcciones (`touchControls.dpadEnabled: ["up", "down", "left", "right"]` en `lib/games/registry.ts`, sin `actions`), con `dpadRepeat: true` — mantener presionada una dirección repite el salto cada 120 ms. El motor no distingue el origen del `KeyboardEvent`: el D-pad dispara `ArrowUp/Down/Left/Right` sintéticos sobre `window`, el mismo camino que ya escucha `onKeyDown`.

### HUD y estética

- Stats: `lives` ("Vidas", `♥ ♥ ♥`), `level` ("Nivel", `01`), `time` ("Tiempo", segundos enteros restantes), `homes` ("Casillas", `0/5`). El `score` lo muestra el `player-hud` aparte.
- Paleta: fondo `#0a0a18`; carretera gris oscuro con líneas discontinuas; río azul profundo con brillo cyan; mediana y acera verdes apagadas; rana en `--green` con ojos en `--yellow`; troncos en marrón desaturado con borde neón; tortugas en `--cyan`; vehículos alternando `--magenta`, `--yellow` y `--cyan` según carril; casillas ocupadas con la rana dibujada en verde tenue.
- Barra de tiempo en la franja inferior: se acorta de derecha a izquierda y pasa a `--magenta` cuando queda menos del 25 % del tiempo.

## Modelo de datos

Reutiliza sin cambios `ArcadeGameEngine`, `ArcadeGameEngineOptions`, `EngineState`, `EngineHudStat` de `lib/games/types.ts` y `GameRegistryEntry` de `lib/games/registry.ts` (ya existentes, sin modificaciones).

```ts
// lib/games/frogger/lanes.ts
export type LaneKind = "road" | "log" | "turtle" | "safe" | "home";

export interface LaneDef {
  row: number;
  kind: LaneKind;
  direction: 1 | -1; // 1 = hacia la derecha
  speed: number; // px/s a nivel 1
  objectCells: number; // largo del objeto en celdas
  gapCells: number; // hueco entre objetos, en celdas
  style: string; // clave de dibujo (buggy, truck, car, bulldozer, log, turtle)
}

export const LANES: LaneDef[]; // 13 filas del tablero, orden fijo
export const LEVEL_SPEED_MULT: (level: number) => number; // min(0.7 + 0.1875*(level-1), 2.2)
export const LEVEL_TIME_MS: (level: number) => number; // max(40 - (level-1), 20) * 1000
```

```ts
// lib/games/frogger/engine.ts
interface LaneObject {
  x: number; // px, borde izquierdo
  width: number; // px
  submerged?: boolean; // solo tortugas
  phaseMs?: number; // reloj del ciclo de inmersión
}

interface Frog {
  col: number;
  row: number;
  offsetX: number; // arrastre de la plataforma, en px
  hopFromMs: number; // 0 si no está saltando
}

export class FroggerEngine implements ArcadeGameEngine {
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
frogger: {
  width: 520,
  height: 560,
  initialState: {
    score: 0,
    stats: [
      { key: "lives", label: "Vidas", value: "♥ ♥ ♥" },
      { key: "level", label: "Nivel", value: "01" },
      { key: "time", label: "Tiempo", value: "40" },
      { key: "homes", label: "Casillas", value: "0/5" },
    ],
  },
  create(canvas, options) {
    return new FroggerEngine(canvas, options);
  },
},
```

- `games` en Supabase gana una fila más (`frogger`), usando el esquema ya existente de `001_games_and_scores.sql` (sin cambios de columnas ni de políticas RLS). El archivo va en `supabase/migrations/NNN_seed_frogger.sql`, donde `NNN` es **el siguiente número disponible al momento de implementar** (hoy `005`, porque existen `001`–`004`); los dos specs de esta game jam compiten por el mismo hueco de numeración, así que el número se confirma al implementar, no antes.

```sql
-- supabase/migrations/NNN_seed_frogger.sql  (NNN = siguiente disponible)
insert into games (id, title, short, long, cat, cover, color, best_seed, plays_seed)
values (
  'frogger',
  'FROGGER',
  'Cruza la carretera y el río antes de que se agote el tiempo.',
  'Guía a la rana por cinco carriles de tráfico y luego por un río de troncos y tortugas hasta ocupar las cinco casillas de llegada. Cada avance suma puntos, llegar a casa con tiempo de sobra suma bonus y completar las cinco casillas sube de nivel con todo más rápido. Tres ranas, 40 segundos por intento.',
  'ARCADE',
  'cover-rana',
  'green',
  0,
  '0'
);
```

- `scores` no cambia de esquema: las partidas se insertan con `game_id: 'frogger'`, `user_id: null`, igual que los demás juegos.

## Plan de implementación

1. **Migración de seed.** Crear `supabase/migrations/NNN_seed_frogger.sql` con el `insert` de la fila `frogger` (valores del Modelo de datos, `NNN` = siguiente disponible) y aplicarla con `apply_migration` del MCP de Supabase. A partir de aquí Frogger aparece en `/biblioteca`, `/` y `/salon`, y `/juego/frogger` es navegable con la portada `.cover-rana`, aunque todavía no sea jugable. Manual test: ver la tarjeta en `/biblioteca` y el tab nuevo en `/salon`.
2. **Definición de filas.** Crear `lib/games/frogger/lanes.ts` con `LANES` (las 13 filas del tablero con tipo, dirección, velocidad, largo y hueco), `LEVEL_SPEED_MULT` y `LEVEL_TIME_MS`. Módulo puro, sin estado; todavía sin uso.
3. **Motor — esqueleto y dibujo estático.** Crear `lib/games/frogger/engine.ts` con `FroggerEngine implements ArcadeGameEngine` y todo el estado en propiedades de instancia (`frog`, `lanes: LaneObject[][]`, `score`, `lives`, `level`, `homes`, `timeLeftMs`). El loop de `requestAnimationFrame` acumula `dt` real y por ahora solo dibuja el tablero (franjas, casillas, mediana, barra de tiempo) y la rana quieta en la acera.
4. **Alta en el registry.** Agregar la entrada `frogger` a `lib/games/registry.ts` (`width: 520`, `height: 560`, `initialState` con los cuatro stats, `create()` instanciando `FroggerEngine`). Manual test: `/jugar/frogger` muestra el tablero dentro de `.crt-screen` con el HUD en sus valores iniciales.
5. **Movimiento de las filas.** Poblar cada fila con sus objetos según `LANES` y desplazarlos con `dt` y el reciclado cíclico por los bordes. Sin colisiones todavía. Manual test: los cinco carriles y las cinco filas de río se mueven a velocidades distintas y el patrón nunca deja huecos irregulares.
6. **Controles y salto.** Listener de teclado (flechas + WASD, con `preventDefault`) y salto discreto de una celda con interpolación de 100 ms y cola de un salto. Manual test: la rana salta en las cuatro direcciones y no puede salir del grid; todavía atraviesa todo sin morir.
7. **Colisiones de carretera y río.** Implementar la colisión AABB con vehículos, el arrastre de la rana sobre troncos, la muerte por ahogo, la muerte por salir del borde lateral sobre una plataforma, el descuento de vidas y la reaparición en la acera. `onGameOver(finalScore)` al perder la tercera rana. Manual test: morir por atropello, por agua y por borde; ver bajar las vidas y abrirse el modal al perder la tercera.
8. **Tortugas que se sumergen.** Agregar el ciclo de 4 s (a flote / aviso / sumergida) en las filas 2 y 5, con dibujo distinto por fase y muerte al estar sobre una sumergida. Manual test: quedarse sobre una tortuga hasta que se hunde y comprobar la muerte, y que la fase de aviso es visible antes.
9. **Casillas, temporizador y puntaje.** Implementar las cinco casillas (llegada, ocupación, muerte por casilla ocupada o seto), el temporizador de 40 s con su barra y la muerte por tiempo, y la fórmula completa de puntaje (10 por fila nueva, 50 por casa, bonus de tiempo, 1000 por nivel). Manual test: verificar cada componente del puntaje con números concretos en el HUD.
10. **Curva de dificultad.** Aplicar `LEVEL_SPEED_MULT`, `LEVEL_TIME_MS` y el acortamiento del ciclo de tortugas al subir de nivel, con el vaciado de casillas y el reinicio de posición. Manual test: completar un nivel y notar el aumento de velocidad y el segundo menos de tiempo.
11. **Repaso final.** `npm run build` sin errores de tipos. Probar el flujo completo en el navegador: `/biblioteca` → detalle de "frogger" → `/jugar/frogger` → cruzar carretera y río, llenar las cinco casillas, subir de nivel, pausar/reanudar sin saltos ni movimiento perdido, perder las tres ranas → modal automático con el puntaje real, "GUARDAR PUNTUACIÓN" inserta en `scores`, "JUGAR DE NUEVO" reinicia el motor, "SALIR" no deja el loop ni listeners activos. Confirmar que Asteroids, Tetris, Arkanoid y Snake siguen funcionando igual.

## Criterios de aceptación

- [ ] Existen `lib/games/frogger/lanes.ts` (definición de las 13 filas y curva de dificultad) y `lib/games/frogger/engine.ts` con `FroggerEngine implements ArcadeGameEngine`, sin variables globales de módulo.
- [ ] No se agrega ningún archivo a `public/games/frogger/`: todo el juego se dibuja con formas de Canvas.
- [ ] Existe una fila `frogger` en `games` (Supabase) con los valores acordados (`cat: 'ARCADE'`, `color: 'green'`, `cover: 'cover-rana'`, `best_seed: 0`, `plays_seed: '0'`), en una migración nueva que no toca `001_games_and_scores.sql` ni las políticas RLS existentes.
- [ ] `/jugar/frogger` renderiza el canvas de 520×560 dentro de `.crt-screen`, con la clase `game-canvas`.
- [ ] El HUD de React refleja en tiempo real Puntuación, Vidas, Nivel, Tiempo y Casillas del motor (no valores fijos).
- [ ] Saltar con flechas y con WASD funciona en las cuatro direcciones, un salto por pulsación, y la rana nunca sale del grid por su propio salto.
- [ ] Avanzar a una fila nueva por encima del máximo del intento actual suma exactamente 10 puntos; volver a bajar y subir a la misma fila no suma nada.
- [ ] Llegar a una casilla libre suma exactamente 50 puntos más `10 × floor(msRestantes / 500)` de bonus de tiempo.
- [ ] Ocupar las cinco casillas suma exactamente 1000 puntos, sube el nivel en 1, vacía las casillas y reinicia el temporizador.
- [ ] Un vehículo que toca la rana le quita una vida y la devuelve a la acera de inicio, conservando las casillas ya ocupadas.
- [ ] Caer al agua (fila de río sin plataforma bajo el centro de la rana) quita una vida.
- [ ] Sobre un tronco o una tortuga a flote, la rana se desplaza con la plataforma; si es arrastrada fuera del borde lateral, pierde una vida.
- [ ] Las tortugas de las filas 2 y 5 se sumergen en ciclo con una fase de aviso visible, y estar sobre una sumergida quita una vida.
- [ ] Saltar a una casilla ya ocupada o al seto entre casillas quita una vida.
- [ ] Agotar el temporizador de 40 s (menos en niveles altos, con piso de 20 s) quita una vida.
- [ ] Al subir de nivel, todas las velocidades se multiplican por `min(0.7 + 0.1875 × (nivel - 1), 2.2)` y el tiempo baja un segundo por nivel con piso de 20 s.
- [ ] El movimiento de vehículos y plataformas se basa en delta time real, de modo que la velocidad percibida es la misma en un monitor de 60 Hz y en uno de 144 Hz.
- [ ] Perder la tercera rana invoca `onGameOver` una sola vez y abre automáticamente el modal de fin de partida con el puntaje real, sin overlay interno de "GAME OVER" en el canvas.
- [ ] PAUSA/REANUDAR detiene y reactiva el loop sin saltos de posición, sin consumir tiempo del temporizador durante la pausa y sin overlay interno de "PAUSA".
- [ ] "GUARDAR PUNTUACIÓN" inserta una fila en `scores` con `game_id: "frogger"`, `user_id: null`, `score` real.
- [ ] "JUGAR DE NUEVO" reinicia una instancia nueva del motor (rana en la acera, score 0, 3 vidas, nivel 1, 0/5 casillas).
- [ ] Frogger aparece como tab nuevo en `/salon` (sin tocar código de `HallOfFame.tsx`) y su top coincide con el mostrado en `/juego/frogger`.
- [ ] Salir del juego (botón "SALIR" o navegar fuera de `/jugar/frogger`) cancela el `requestAnimationFrame` y remueve los listeners de teclado.
- [ ] Una partida de un jugador que ya conoce el juego dura entre 2 y 4 minutos.
- [ ] `npm run build` compila sin errores de tipos.

## Decisiones tomadas y descartadas

- **Sí:** reproducir el layout canónico del original (cinco carriles de tráfico, mediana segura, cinco filas de río, cinco casillas, temporizador por intento). Es lo que hace reconocible a Frogger; recortarlo lo convertiría en otro juego.
- **Sí:** fórmula de puntaje del arcade original: 10 por fila avanzada, 50 por rana en casa, 10 por cada medio segundo no usado, 1000 por completar las cinco casillas. Verificado en las fuentes consultadas (ver abajo), no inventado.
- **Sí:** puntuar solo la fila más alta nueva del intento (`maxRowReached`). El original no premia el vaivén, y sin esta regla el leaderboard se rompería farmeando saltos arriba/abajo en la acera.
- **No:** mosca bonus de 200 puntos y rana hembra de 200 puntos. Ambas son extras del original que agregan spawns y estados sin cambiar el bucle; se descartan para mantener el motor mínimo en la versión base. Candidatos a spec futuro.
- **No:** cocodrilos en el río, serpientes en la mediana, nutrias y cocodrilo asomando en una casilla. Son enemigos con comportamiento propio que aparecen en niveles altos del original; suben el costo del motor y el riesgo de balance sin aportar al bucle base.
- **Sí:** 3 vidas fijas. El arcade original permitía 3, 5 o 7 según la configuración del operador; se fija en 3 para alinearse con Asteroids y Arkanoid, que ya usan `♥ ♥ ♥`.
- **Sí:** 40 segundos por intento, con reducción de 1 s por nivel y piso de 20 s. El valor canónico original (30 s) resultó demasiado exigente en el playtesting durante la implementación; se sube a 40 s para dar más margen en el primer contacto con el juego, manteniendo la misma progresión (−1 s por nivel, piso de 20 s).
- **Sí:** curva de velocidad y de sumersión de tortugas más permisivas en los primeros niveles (`LEVEL_SPEED_MULT` arranca en 0.7× en vez de 1× y la proporción de tiempo sumergido de las tortugas empieza en 8 % en vez de 20 %, ambas convergiendo a los valores originales hacia el nivel 6–9). Ajuste de balance hecho durante el playtesting: la versión inicial resultaba frustrante para quien recién prueba el juego. El techo de velocidad (`2.2×` en el nivel 9) y el piso del ciclo de tortugas (2.6 s) se mantienen sin cambios respecto a la decisión original.
- **Sí:** todo dibujado por código, sin spritesheets. No hay assets locales de Frogger (`references/started-games/` solo tiene `02-asteroids`, `03-tetris` y `04-arkanoid`; `references/assest-source/` no tiene nada de Frogger), y pedir arte nuevo agregaría un riesgo evitable. Formas geométricas con la paleta neón bastan para distinguir rana, troncos, tortugas y vehículos.
- **Sí:** reutilizar `.cover-rana`, que ya existe en `app/globals.css` (línea ~791, rana verde sobre franjas cyan) y no está en uso por ningún juego. Evita CSS nuevo y ya representa exactamente este juego, así que no hace falta invocar `/frontend-design`.
- **Sí:** `cat: 'ARCADE'` y `color: 'green'`. Las cuatro categorías y los cuatro colores permitidos por el `check` de `001_games_and_scores.sql` ya están usados, así que ninguna combinación "diversifica" de verdad; se elige la categoría honesta (ARCADE) y el color que representa a la rana. `green` no colisiona con el color elegido en el spec `02` (`cyan`).
- **No:** modelar el río con física continua o con rebotes. Las filas son cintas de objetos a velocidad constante con reciclado cíclico: determinista, barato y suficiente.
- **Sí:** canvas de 520×560 (13×14 celdas de 40 px). Mantiene la proporción vertical del original y el tamaño de celda es cómodo para dibujar la rana sin sprites; queda entre los tamaños ya usados (300×600 de Tetris y 600×600 de Snake).
- **No:** tecla de pausa dentro del motor. Misma decisión que en Tetris y Snake: la pausa es responsabilidad del botón "PAUSA" de React, y dos mecanismos quedarían fuera de sincronía.
- **Sí:** D-pad táctil de 4 direcciones con `dpadRepeat: true`, agregado después de la implementación inicial (que lo había dejado fuera de alcance). El sistema de controles táctiles ya existente (`components/TouchControls.tsx`) es genérico: dispara los mismos `KeyboardEvent` de flechas que el motor ya escucha, así que no requirió cambios en `engine.ts`, solo declarar `touchControls` en `lib/games/registry.ts`, igual que Snake. Se activa `dpadRepeat` (a diferencia de Snake) porque el salto es una acción discreta por pulsación y no un movimiento continuo: sin repetición, cruzar el tablero en móvil exigiría tocar 11+ veces.
- **Fuentes consultadas sobre el original** (solo para verificar reglas y balance, sin copiar código de terceros):
  - `https://classicgaming.cc/classics/frogger/about` — layout de carretera y río, cinco casillas, vidas configurables (3/5/7), progresión por niveles.
  - `https://frogger.fandom.com/wiki/Frogger_(video_game)` (vía resultados de búsqueda; el fetch directo devolvió HTTP 402) — 30 segundos por rana, tortugas que se sumergen, endurecimiento del tráfico y aparición de cocodrilos/serpientes en niveles altos.
  - `https://www.arcade-museum.com/Videogame/frogger` y `https://arcade-history.com/?id=879` (vía resultados de búsqueda) — tabla de puntaje: 10 por avance, 50 por rana en casa, 10 por medio segundo no usado, 200 por mosca o rana hembra, 1000 por nivel completo.

## Riesgos identificados

| Riesgo                                                                                                                                                                                                                                                 | Mitigación                                                                                                                                                                                                                                |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fuga del `requestAnimationFrame` y de los listeners de teclado si `FroggerEngine.destroy()` no los limpia al desmontar o navegar fuera de `/jugar/frogger`.                                                                                            | Cubierto en el paso 11 del plan y en los criterios de aceptación; `destroy()` cancela el rAF y remueve el listener registrado en `start()`.                                                                                               |
| `dt` gigante al reanudar de una pausa larga, si `pause()` no detiene el reloj interno y `resume()` no lo resetea: los vehículos "teleportarían" y el temporizador saltaría.                                                                            | Al pausar se detiene el bucle por completo y el temporizador; al reanudar se resetea `lastTime` como si fuera el primer frame — mismo patrón ya validado en los cuatro motores existentes.                                                |
| Estado global de módulo que sobrevive al HMR de Next.js si el motor no encapsula todo en la instancia.                                                                                                                                                 | `lanes.ts` es un módulo puro de constantes; todo el estado mutable (`frog`, objetos de cada fila, score, vidas, nivel, tiempo) vive en propiedades de `FroggerEngine`.                                                                    |
| Overlay de "GAME OVER"/"PAUSA" duplicado entre el canvas y React.                                                                                                                                                                                      | El motor nunca dibuja esos textos; solo invoca `onGameOver(finalScore)` y React muestra el modal y el overlay de pausa.                                                                                                                   |
| **Colisión injusta en la carretera.** Con hitbox de celda completa la rana muere al rozar un vehículo que visualmente todavía no la toca, y el juego se siente tramposo.                                                                               | Hitbox de la rana reducida a 28×28 px y hitbox del vehículo recortada 4 px por lado; el criterio de aceptación de duración de partida (2–4 min) sirve de prueba de que el balance no es frustrante.                                       |
| **Rana sobre el límite entre dos plataformas o cerca del borde de un tronco.** Un cálculo por celda en vez de por píxel, o un chequeo de un único punto central, podría matarla estando visualmente a salvo.                                           | La comprobación de soporte usa solapamiento de la hitbox completa de la rana (28×28 px) contra el rango de cada objeto de la fila en píxeles, no la celda lógica ni un único punto central — mismo criterio que la colisión de vehículos. |
| **Arrastre acumulado por la plataforma.** Si el offset en píxeles no se reconcilia con la celda lógica al saltar, la rana podría quedar desalineada del grid y romper la lógica de casillas.                                                           | Al iniciar un salto, la celda de origen se recalcula desde la posición real en píxeles (redondeo a la columna más cercana) y el offset se reinicia a 0.                                                                                   |
| **Balance del ciclo de inmersión de las tortugas.** Un ciclo demasiado corto, o una proporción sumergida demasiado alta, vuelve las filas de tortugas casi impasables y dispara muertes que el jugador no puede prever, sobre todo al empezar a jugar. | Ciclo de 4 s con fase de aviso fija del 20 %; la proporción sumergida escala con el nivel (8 % en el nivel 1 hasta 20 % desde el nivel 6), y el acortamiento del ciclo total por nivel tiene piso de 2.6 s.                               |
| **Reciclado de objetos con hueco irregular.** Reposicionar un objeto al salir del borde sin conservar el espaciado dejaría patrones imposibles de cruzar en filas rápidas.                                                                             | Cada fila se genera como un anillo de objetos con espaciado constante y se recicla sumando el largo total del anillo, no reposicionando al azar.                                                                                          |
| **Velocidades escaladas sin techo.** Un multiplicador lineal sin límite volvería el juego injugable en niveles altos y podría hacer que un vehículo cruce más de una celda entre frames.                                                               | El multiplicador tiene techo `2.2`; con ese techo el objeto más rápido (fila 7, 286 px/s) recorre menos de 5 px por frame a 60 Hz, muy por debajo del ancho de una hitbox.                                                                |
| **Canvas de 520×560 en pantallas angostas.** Puede quedar ajustado dentro de `.crt-screen` en viewports pequeños.                                                                                                                                      | No se resuelve en este spec (layout móvil está fuera de alcance); se documenta como limitación conocida, igual que en SPEC 07 con el canvas secundario de Tetris.                                                                         |

## Lo que no está en este spec

- Power-ups y modificadores temporales (eso es `02-frogger-poderes-game.md`, un juego aparte).
- Mosca bonus y rana hembra.
- Cocodrilos, serpientes, nutrias y cocodrilo asomando en una casilla.
- Audio y efectos de sonido.
- Assets de imagen en `public/games/frogger/`.
- Multiplayer y progresión persistente entre partidas.
- Realtime, paginación del leaderboard y autenticación real.
- Tests automatizados.
- Tema claro/oscuro propio del juego.
- Cambios a `GameDetail.tsx` o a la ruta `/juego/[id]` más allá de la nueva entrada navegable.

Cada uno de estos, si se necesita, va en su propio spec futuro.
