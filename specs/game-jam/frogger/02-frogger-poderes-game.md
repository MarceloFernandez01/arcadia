# SPEC GJ-frogger-02 — Juego Rana Neón (Frogger con poderes temporales)

> **Estado:** Draft
> **Depende de:** SPEC 05 (asteroids-game), SPEC 06 (leaderboard-supabase), SPEC 07 (tetris-game)
> **Fecha:** 2026-07-29
> **Objetivo:** Implementar una variante de Frogger como motor real en TypeScript/Canvas bajo el id `frogger-poderes`, idéntica al clásico en su tablero de carretera y río pero con cápsulas de energía que otorgan cuatro poderes temporales (tiempo lento, escudo, salto doble, anfibio) y duplican los puntos de avance mientras están activos, dada de alta en `lib/games/registry.ts` y en Supabase para que aparezca en el Salón de la Fama.

> **Nota de numeración:** el identificador `GJ-frogger-02` es local a esta game jam (`specs/game-jam/frogger/`) y **no consume** la numeración correlativa global de `specs/` (que hoy llega hasta `09-snake-game.md`). Este spec es **autocontenido y no depende** de `01-frogger-game.md`: describe el juego completo, no un delta sobre el base, y se puede implementar sin haber implementado la versión base.

## Por qué este spec existe

El juego base recibido para esta game jam es **Frogger** (Konami, 1981). Este archivo es la **versión modificada**: mismo tablero y mismo bucle de cruce, con una mecánica añadida de **poderes temporales recogibles**. Es un juego distinto del catálogo, con su propio id (`frogger-poderes`), su propio color (`cyan`), su propia fila en `games` y su propio leaderboard.

**Por qué esta modificación y no otra** (el prompt de invocación no indicó una): Frogger ya trae progresión por niveles en su forma canónica, así que "niveles progresivos" no sería una modificación real sino parte del original. Una geometría alterada (carriles verticales, tablero circular) rompería el reconocimiento del clásico. Los poderes temporales, en cambio, agregan una decisión nueva en cada intento —desviarse del camino corto para recoger una cápsula— sin tocar el motor de filas, cambian la curva de riesgo y son mecánicamente distintos de los power-ups de Arkanoid, el único juego del catálogo que hoy tiene power-ups (los de Arkanoid modifican la paleta y la bola; estos modifican el tiempo, la supervivencia y el alcance del salto del jugador). Es la modificación que más aporta al catálogo con menor riesgo de motor.

**Encaje con los criterios de la plataforma:**

1. **Score acumulable** — puntaje numérico único: 10 por fila nueva avanzada (20 con poder activo), 25 por cápsula recogida, 50 por rana en casa, bonus por tiempo restante, 1000 por nivel completo.
2. **Un jugador, partidas cortas** — 3 ranas y 30 segundos por intento; partida promedio de 2 a 4 minutos. Sin multijugador, sin progreso persistente.
3. **Motor viable en Canvas 2D + rAF** — filas de objetos a velocidad constante, colisión AABB y temporizadores de poder; sin física continua, sin 3D, sin audio obligatorio, sin backend extra.
4. **Compatible con `ArcadeGameEngine`** — `start/pause/resume/restart/destroy`, HUD vía `stats[{key,label,value}]`, `onGameOver(finalScore)`; el motor no dibuja overlays de "GAME OVER" ni de "PAUSA".
5. **Control por teclado** — flechas y WASD, un salto discreto por pulsación. Los poderes se activan al recogerlos, sin tecla dedicada.
6. **Assets** — todo dibujado por código con formas geométricas. Sin spritesheets nuevos, por lo tanto **sin carpeta `public/games/frogger-poderes/`**.
7. **Hueco de catálogo** — `references/implemented-games.md` tiene `asteroides` (SHOOTER/cyan), `tetris` (PUZZLE/magenta), `arkanoid` (ARCADE/green), `snake` (ARCADE/yellow). Esta variante entra como `ARCADE`/`cyan`: la categoría no diversifica (el juego es intrínsecamente ARCADE) pero la mecánica de avance por filas con modificadores temporales no existe en el catálogo. `cyan` no repite el color del spec `01` (`green`).
8. **Estética retro/neón** — paleta de `app/globals.css`; las cápsulas y el aura del poder activo son el elemento visual característico del juego, en cyan/magenta/amarillo/verde según el tipo.

## Alcance

**Incluye:**

- Motor en `lib/games/frogger-poderes/engine.ts`, implementando `ArcadeGameEngine` (interfaz existente en `lib/games/types.ts`, sin cambios).
- `lib/games/frogger-poderes/lanes.ts` con la definición declarativa de las filas del tablero y la curva de dificultad por nivel.
- `lib/games/frogger-poderes/powers.ts` con la tabla de los cuatro poderes (id, etiqueta, duración, color) y las reglas de spawn de cápsulas.
- Tablero en grid de 13 columnas × 14 filas de 40 px → canvas de **520×560**: fila de casillas arriba, cinco filas de río (troncos y tortugas), mediana segura, cinco carriles de carretera, acera de inicio y franja inferior con la barra de tiempo dibujada dentro del canvas.
- Cinco casillas de llegada; completarlas todas sube de nivel.
- Temporizador de 30 segundos por intento, con bonus de puntaje por tiempo restante al llegar a casa.
- Tres ranas (vidas). Muerte por atropello, por caer al agua, por tortuga sumergida, por ser arrastrada fuera del borde lateral, por saltar a una casilla ocupada o al seto, y por agotar el tiempo.
- Tortugas que se sumergen en ciclo, con fase de aviso visual.
- **Mecánica añadida:** cápsulas de energía que aparecen en el tablero y otorgan uno de cuatro poderes temporales al pasar la rana por encima; un solo poder activo a la vez; puntos de avance duplicados mientras hay poder activo.
- Curva de dificultad por nivel: velocidades escaladas (un 15 % más rápidas que el clásico desde el nivel 1, para compensar los poderes) y tiempo por intento reducido, con techo y piso explícitos.
- Controles: flechas y WASD; un salto discreto por pulsación, con interpolación visual corta.
- Stats de HUD expuestas vía el estado flexible del registry: `lives`, `level`, `time`, `homes`, `power`; `score` aparte, actualizados solo cuando cambian.
- Al perder la última rana, el motor invoca `onGameOver(finalScore)` una sola vez y detiene el loop, **sin overlay interno de "GAME OVER" ni de "PAUSA"** — React controla la pausa desde el botón "PAUSA" del `player-hud` y el modal de fin de partida ya existente.
- Alta de `frogger-poderes` en la tabla `games` de Supabase (migración de seed nueva; ver Modelo de datos), `cat: 'ARCADE'`, `color: 'cyan'`.
- Clase de portada nueva `.cover-rana-neon` en `app/globals.css`, diseñada invocando `/frontend-design` (regla de `CLAUDE.md`), para no reutilizar la misma portada que el Frogger clásico.
- Registro de la entrada `frogger-poderes` en `lib/games/registry.ts` (`width: 520`, `height: 560`).

**Fuera de alcance (para specs futuros):**

- Sin multijugador y sin progresión persistente entre partidas.
- Sin audio ni efectos de sonido.
- Sin controles táctiles/móviles.
- Sin cocodrilos, serpientes, nutrias ni rana hembra del original.
- Sin mosca bonus en las casillas.
- Sin acumulación ni inventario de poderes: no se guardan para usarlos después, no se combinan dos a la vez y no hay tecla para activarlos manualmente.
- Sin poderes negativos ni cápsulas trampa.
- Sin assets de imagen: nada en `public/games/frogger-poderes/`.
- Heredado de SPEC 05/06: sin Realtime, sin paginación del leaderboard, sin autenticación real (`user_id: null` en `scores`), sin tests automatizados, sin tema claro/oscuro propio del juego, sin cambios a `GameDetail.tsx` ni a la ruta `/juego/[id]` más allá de la nueva entrada navegable.

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

Velocidades base en px/s por fila a nivel 1: fila 1 = 63, fila 2 = 80, fila 3 = 98, fila 4 = 126, fila 5 = 75, fila 7 = 150, fila 8 = 63, fila 9 = 86, fila 10 = 104, fila 11 = 69. Son las velocidades del clásico multiplicadas por 1.15, para compensar la ventaja que dan los poderes.

Espaciado entre objetos de la misma fila: constante por fila, expresado en celdas (troncos 4–6 celdas de hueco, tortugas 3–4, vehículos 4–7 según carril). Al salir por completo por un borde, el objeto reaparece por el borde opuesto conservando el espaciado; el patrón de cada fila es un anillo cíclico y determinista.

### Bucle y movimiento

- El loop usa `requestAnimationFrame` con delta time real (`performance.now()`); todas las posiciones se integran en píxeles por segundo. Nada avanza "por frame".
- La rana ocupa una celda lógica (`col`, `row`) más un desplazamiento en píxeles cuando va sobre una plataforma. Su hitbox es de 28×28 px centrada en la celda.
- Un salto mueve la rana una celda (o dos hacia arriba con el poder de salto doble) con interpolación visual de 100 ms. Durante ese lapso no se acepta otro salto; se guarda como máximo un salto en cola.
- La rana no puede salir del tablero por su propio salto; los saltos que la sacarían del grid se ignoran.
- Sobre una plataforma del río, la rana se desplaza con ella cada frame. Si su centro sale del rango horizontal del canvas mientras está sobre una plataforma, muere.

### Poderes temporales (mecánica añadida)

**Cápsulas.** Objetos de 24×24 px con un aura del color de su poder, dibujados por código.

- Aparece una cápsula cada **7 segundos** de juego efectivo (el reloj de spawn se congela durante la pausa), con un máximo de **2 cápsulas simultáneas** en pantalla.
- Ubicación: se elige al azar, con igual probabilidad, entre (a) una plataforma del río (tronco o tortuga a flote) con espacio libre, en cuyo caso la cápsula viaja con la plataforma, y (b) una celda libre de la mediana o de un carril de la carretera, en cuyo caso queda fija.
- Vida de la cápsula: **6 segundos**, o hasta que su plataforma sale por completo del canvas, o hasta que la rana la recoge.
- Recoger: la hitbox de la rana solapa la de la cápsula. Suma **25 puntos** y activa el poder.
- El tipo de poder se elige al azar con probabilidad uniforme entre los cuatro (25 % cada uno).

**Los cuatro poderes.** Solo uno activo a la vez: recoger otra cápsula reemplaza el poder vigente y reinicia su temporizador (no se acumulan ni se combinan).

| Poder       | Etiqueta en el HUD | Color       | Duración | Efecto                                                                                                                                                                                          |
| ----------- | ------------------ | ----------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `slow`      | LENTO              | `--cyan`    | 6 s      | Todas las velocidades de vehículos y plataformas se multiplican por 0.5. El temporizador de la partida sigue corriendo normal.                                                                  |
| `shield`    | ESCUDO             | `--magenta` | 8 s      | Absorbe **una** muerte por atropello, ahogo o tortuga sumergida. Al absorberla, la rana se reubica en la fila segura más cercana por debajo y el escudo se consume de inmediato.                |
| `doublehop` | SALTO ×2           | `--yellow`  | 6 s      | El salto hacia arriba avanza 2 celdas de una vez. La celda intermedia se ignora; solo cuenta el destino, con las reglas de muerte normales. Los otros tres sentidos siguen siendo de una celda. |
| `amphibian` | ANFIBIO            | `--green`   | 6 s      | La rana no muere por caer al agua ni por tortuga sumergida: flota en su celda del río sin arrastre. No protege contra vehículos ni contra salir del borde lateral.                              |

- Mientras hay un poder activo, los **puntos por fila nueva avanzada valen 20 en vez de 10**. El resto del puntaje (casa, bonus de tiempo, nivel completo, cápsula) no se duplica.
- El escudo no protege contra la muerte por tiempo agotado ni por casilla ocupada.
- Al morir, el poder activo se descarta; la rana reaparece sin poder.
- Al subir de nivel, el poder activo se descarta y el reloj de spawn se reinicia.
- El poder activo se muestra en el HUD como `LENTO 4s` (etiqueta y segundos enteros restantes), y como `—` cuando no hay ninguno. En el canvas, la rana lleva un aura del color del poder mientras está activo, que parpadea durante el último segundo.

### Colisiones y muerte

- **Carretera:** solapamiento de la hitbox de la rana (28×28) con la de un vehículo (ancho del objeto menos 4 px por lado) → muerte, salvo escudo activo.
- **Río:** en una fila de río, si el centro de la rana no está sobre ninguna plataforma a flote → muerte por ahogo, salvo escudo o anfibio activos.
- **Tortuga sumergida:** las tortugas alternan un ciclo de 4 s: 2.4 s a flote, 0.8 s parpadeando (aún sostienen), 0.8 s sumergidas (no sostienen). Estar sobre una sumergida → muerte, salvo escudo o anfibio activos.
- **Casillas:** casilla libre = rana en casa; casilla ocupada o seto entre casillas → muerte (el escudo no aplica).
- **Borde lateral:** ser arrastrada fuera del canvas sobre una plataforma → muerte (el escudo no aplica).
- **Tiempo:** temporizador a 0 → muerte (el escudo no aplica).
- Cada muerte descuenta una rana, reinicia la posición en la acera de inicio (columna central), descarta el poder activo y reinicia el temporizador al valor del nivel. Las casillas ya ocupadas se conservan.
- Al perder la tercera rana: `onGameOver(finalScore)` una sola vez y el loop se detiene.

### Puntaje

- **10 puntos** por cada fila nueva alcanzada por encima de la fila más alta del intento actual (`maxRowReached`); **20** si hay un poder activo en ese momento. Bajar y volver a subir no vuelve a puntuar.
- **25 puntos** por cada cápsula recogida.
- **50 puntos** por cada rana que llega a una casilla libre.
- **Bonus de tiempo** al llegar a casa: `10 × floor(msRestantes / 500)`.
- **1000 puntos** al ocupar las cinco casillas (nivel completado).
- Con salto doble, avanzar dos filas de una vez puntúa las dos filas nuevas (40 puntos en total, porque el poder está activo por definición).

### Curva de dificultad

- El nivel arranca en 1 y sube en 1 al completar las cinco casillas. Al subir, las casillas se vacían, la rana vuelve a la acera, el poder activo se descarta y el temporizador se reinicia.
- Multiplicador de velocidad por nivel: `min(1 + 0.15 × (nivel - 1), 2.2)`, aplicado sobre las velocidades base de este juego (que ya incluyen el ×1.15).
- Tiempo por intento: `max(30 - (nivel - 1), 20)` segundos.
- Intervalo de spawn de cápsulas: `max(7 - 0.5 × (nivel - 1), 4.5)` segundos — las cápsulas se vuelven algo más frecuentes en niveles altos, para que la dificultad creciente siga siendo manejable.
- El ciclo de inmersión de las tortugas se acorta un 5 % por nivel, con piso de 2.6 s de ciclo total.
- Las vidas no se reponen al subir de nivel.

### Controles

- `←` / `→` / `↑` / `↓` y `A` / `D` / `W` / `S`: salto en esa dirección.
- Ninguna otra tecla tiene efecto: no hay tecla de pausa, de reinicio ni de activación de poder.
- `preventDefault()` en las flechas para evitar el scroll de la página.

### HUD y estética

- Stats: `lives` ("Vidas", `♥ ♥ ♥`), `level` ("Nivel", `01`), `time` ("Tiempo", segundos enteros), `homes` ("Casillas", `0/5`), `power` ("Poder", `—` o `LENTO 4s`). El `score` lo muestra el `player-hud` aparte.
- Paleta: fondo `#0a0a18`; carretera gris oscuro con líneas discontinuas; río azul profundo con brillo cyan; mediana y acera verdes apagadas; rana en `--green`; troncos en marrón desaturado con borde neón; tortugas en `--cyan`; vehículos alternando `--magenta`, `--yellow` y `--cyan`.
- Cápsulas: rombo de 24×24 px con relleno del color del poder y halo pulsante; parpadeo en el último segundo de vida.
- Barra de tiempo en la franja inferior: se acorta de derecha a izquierda y pasa a `--magenta` bajo el 25 % del tiempo.

## Modelo de datos

Reutiliza sin cambios `ArcadeGameEngine`, `ArcadeGameEngineOptions`, `EngineState`, `EngineHudStat` de `lib/games/types.ts` y `GameRegistryEntry` de `lib/games/registry.ts` (ya existentes, sin modificaciones).

```ts
// lib/games/frogger-poderes/lanes.ts
export type LaneKind = "road" | "log" | "turtle" | "safe" | "home";

export interface LaneDef {
  row: number;
  kind: LaneKind;
  direction: 1 | -1; // 1 = hacia la derecha
  speed: number; // px/s a nivel 1 (clásico × 1.15)
  objectCells: number;
  gapCells: number;
  style: string; // buggy, truck, car, bulldozer, log, turtle
}

export const LANES: LaneDef[]; // 13 filas del tablero, orden fijo
export const LEVEL_SPEED_MULT: (level: number) => number; // min(1 + 0.15*(level-1), 2.2)
export const LEVEL_TIME_MS: (level: number) => number; // max(30 - (level-1), 20) * 1000
export const LEVEL_SPAWN_MS: (level: number) => number; // max(7 - 0.5*(level-1), 4.5) * 1000
```

```ts
// lib/games/frogger-poderes/powers.ts
export type PowerId = "slow" | "shield" | "doublehop" | "amphibian";

export interface PowerDef {
  id: PowerId;
  label: string; // "LENTO", "ESCUDO", "SALTO ×2", "ANFIBIO"
  color: string; // var(--cyan) | var(--magenta) | var(--yellow) | var(--green)
  durationMs: number; // 6000, salvo shield: 8000
}

export const POWERS: Record<PowerId, PowerDef>;
export const CAPSULE_LIFETIME_MS = 6000;
export const CAPSULE_POINTS = 25;
export const MAX_CAPSULES = 2;
```

```ts
// lib/games/frogger-poderes/engine.ts
interface LaneObject {
  x: number; // px, borde izquierdo
  width: number; // px
  submerged?: boolean; // solo tortugas
  phaseMs?: number; // reloj del ciclo de inmersión
}

interface Capsule {
  power: PowerId;
  x: number; // px
  row: number;
  lifeMs: number;
  carrier?: LaneObject; // si viaja sobre una plataforma
}

interface ActivePower {
  power: PowerId;
  remainingMs: number;
}

interface Frog {
  col: number;
  row: number;
  offsetX: number; // arrastre de la plataforma, en px
  hopFromMs: number; // 0 si no está saltando
}

export class FroggerPowersEngine implements ArcadeGameEngine {
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
"frogger-poderes": {
  width: 520,
  height: 560,
  initialState: {
    score: 0,
    stats: [
      { key: "lives", label: "Vidas", value: "♥ ♥ ♥" },
      { key: "level", label: "Nivel", value: "01" },
      { key: "time", label: "Tiempo", value: "30" },
      { key: "homes", label: "Casillas", value: "0/5" },
      { key: "power", label: "Poder", value: "—" },
    ],
  },
  create(canvas, options) {
    return new FroggerPowersEngine(canvas, options);
  },
},
```

- `games` en Supabase gana una fila más (`frogger-poderes`), usando el esquema ya existente de `001_games_and_scores.sql` (sin cambios de columnas ni de políticas RLS). El archivo va en `supabase/migrations/NNN_seed_frogger_poderes.sql`, donde `NNN` es **el siguiente número disponible al momento de implementar** (hoy `005`, porque existen `001`–`004`); los dos specs de esta game jam compiten por el mismo hueco de numeración, así que el número se confirma al implementar.

```sql
-- supabase/migrations/NNN_seed_frogger_poderes.sql  (NNN = siguiente disponible)
insert into games (id, title, short, long, cat, cover, color, best_seed, plays_seed)
values (
  'frogger-poderes',
  'RANA NEÓN',
  'Cruza el tráfico y el río recogiendo poderes temporales.',
  'La rana cruza cinco carriles de tráfico y un río de troncos y tortugas hasta ocupar las cinco casillas de llegada, pero ahora aparecen cápsulas de energía: tiempo lento, escudo, salto doble y anfibio, cada una activa por unos segundos. Con un poder activo los avances valen el doble. Tres ranas, 30 segundos por intento y todo un 15 % más rápido que el clásico.',
  'ARCADE',
  'cover-rana-neon',
  'cyan',
  0,
  '0'
);
```

- `scores` no cambia de esquema: las partidas se insertan con `game_id: 'frogger-poderes'`, `user_id: null`, igual que los demás juegos.

## Plan de implementación

1. **Portada.** Diseñar la clase `.cover-rana-neon` en `app/globals.css` invocando `/frontend-design` (regla de `CLAUDE.md`), siguiendo el patrón de las demás `.cover-*` (CSS puro, `::before`/`::after`, sin imágenes): rana en `--green` sobre franjas de río en cyan y una cápsula romboidal luminosa. No debe ser una copia de `.cover-rana`, que representa al Frogger clásico. Manual test: ver la clase aplicada en una tarjeta de `/biblioteca` una vez exista la fila en `games` (paso 2).
2. **Migración de seed.** Crear `supabase/migrations/NNN_seed_frogger_poderes.sql` con el `insert` de la fila `frogger-poderes` (valores del Modelo de datos, `NNN` = siguiente disponible) y aplicarla con `apply_migration` del MCP de Supabase. A partir de aquí el juego aparece en `/biblioteca`, `/` y `/salon`, y `/juego/frogger-poderes` es navegable con la portada del paso 1, aunque todavía no sea jugable.
3. **Definición de filas.** Crear `lib/games/frogger-poderes/lanes.ts` con `LANES` (las 13 filas con tipo, dirección, velocidad ya escalada ×1.15, largo y hueco), `LEVEL_SPEED_MULT`, `LEVEL_TIME_MS` y `LEVEL_SPAWN_MS`. Módulo puro, sin estado.
4. **Tabla de poderes.** Crear `lib/games/frogger-poderes/powers.ts` con `POWERS` (los cuatro poderes con etiqueta, color y duración) y las constantes de cápsula. Módulo puro, sin estado.
5. **Motor — esqueleto y dibujo estático.** Crear `lib/games/frogger-poderes/engine.ts` con `FroggerPowersEngine implements ArcadeGameEngine` y todo el estado en propiedades de instancia (`frog`, `lanes`, `capsules`, `activePower`, `score`, `lives`, `level`, `homes`, `timeLeftMs`, `spawnTimerMs`). El loop de `requestAnimationFrame` acumula `dt` real y por ahora solo dibuja el tablero y la rana quieta en la acera.
6. **Alta en el registry.** Agregar la entrada `frogger-poderes` a `lib/games/registry.ts` (`width: 520`, `height: 560`, `initialState` con los cinco stats, `create()` instanciando `FroggerPowersEngine`). Manual test: `/jugar/frogger-poderes` muestra el tablero dentro de `.crt-screen` con el HUD en sus valores iniciales, incluido `Poder: —`.
7. **Movimiento de las filas.** Poblar cada fila con sus objetos según `LANES` y desplazarlos con `dt`, con reciclado cíclico por los bordes. Manual test: las diez filas móviles se mueven a velocidades distintas y el patrón nunca deja huecos irregulares.
8. **Controles y salto.** Listener de teclado (flechas + WASD, con `preventDefault`) y salto discreto de una celda con interpolación de 100 ms y cola de un salto. Manual test: la rana salta en las cuatro direcciones y no sale del grid; todavía atraviesa todo sin morir.
9. **Colisiones de carretera y río.** Colisión AABB con vehículos, arrastre sobre troncos, muerte por ahogo, muerte por borde lateral, descuento de vidas y reaparición en la acera. `onGameOver(finalScore)` al perder la tercera rana. Manual test: morir por atropello, por agua y por borde; ver bajar las vidas y abrirse el modal al perder la tercera.
10. **Tortugas que se sumergen.** Ciclo de 4 s (a flote / aviso / sumergida) en las filas 2 y 5, con dibujo distinto por fase y muerte al estar sobre una sumergida. Manual test: quedarse sobre una tortuga hasta que se hunde y comprobar la muerte, con el aviso visible antes.
11. **Casillas, temporizador y puntaje base.** Cinco casillas (llegada, ocupación, muerte por casilla ocupada o seto), temporizador de 30 s con su barra y muerte por tiempo, y el puntaje sin poderes (10 por fila nueva, 50 por casa, bonus de tiempo, 1000 por nivel). Manual test: verificar cada componente con números concretos en el HUD.
12. **Cápsulas.** Spawn cada 7 s (máximo 2 simultáneas), ubicación al azar entre plataforma del río y celda libre de mediana/carretera, vida de 6 s, viaje con la plataforma cuando corresponde, recogida por solapamiento de hitbox y +25 puntos. Todavía sin efecto de poder: recoger solo suma puntos y muestra la etiqueta en el HUD. Manual test: ver aparecer y desaparecer cápsulas en ambas ubicaciones y recogerlas.
13. **Efectos de los cuatro poderes.** Implementar `slow` (×0.5 a todas las velocidades), `shield` (absorbe una muerte y reubica en la fila segura más cercana por debajo), `doublehop` (salto de 2 celdas hacia arriba) y `amphibian` (inmune a agua y tortuga sumergida, sin arrastre), con un solo poder activo, reemplazo al recoger otro, descarte al morir o al subir de nivel, cuenta atrás en el HUD y aura en el canvas. Manual test: activar cada poder y comprobar su efecto y su expiración a los 6 s (8 s para el escudo).
14. **Duplicación de puntos y curva de dificultad.** Puntos de avance a 20 mientras hay poder activo; `LEVEL_SPEED_MULT`, `LEVEL_TIME_MS`, `LEVEL_SPAWN_MS` y el acortamiento del ciclo de tortugas al subir de nivel. Manual test: avanzar una fila con y sin poder y comparar el puntaje; completar un nivel y notar el aumento de velocidad y el spawn más frecuente.
15. **Repaso final.** `npm run build` sin errores de tipos. Probar el flujo completo en el navegador: `/biblioteca` → detalle de "RANA NEÓN" → `/jugar/frogger-poderes` → cruzar carretera y río, recoger los cuatro poderes, llenar las cinco casillas, subir de nivel, pausar/reanudar sin saltos y sin que se consuma tiempo de poder durante la pausa, perder las tres ranas → modal automático con el puntaje real, "GUARDAR PUNTUACIÓN" inserta en `scores`, "JUGAR DE NUEVO" reinicia el motor, "SALIR" no deja el loop ni listeners activos. Confirmar que Asteroids, Tetris, Arkanoid y Snake siguen funcionando igual.

## Criterios de aceptación

- [ ] Existen `lib/games/frogger-poderes/lanes.ts`, `lib/games/frogger-poderes/powers.ts` y `lib/games/frogger-poderes/engine.ts` con `FroggerPowersEngine implements ArcadeGameEngine`, sin variables globales de módulo.
- [ ] No se agrega ningún archivo a `public/games/frogger-poderes/`: todo el juego se dibuja con formas de Canvas.
- [ ] Existe la clase `.cover-rana-neon` en `app/globals.css`, diseñada con `/frontend-design`, en CSS puro y visualmente distinta de `.cover-rana`.
- [ ] Existe una fila `frogger-poderes` en `games` (Supabase) con los valores acordados (`title: 'RANA NEÓN'`, `cat: 'ARCADE'`, `color: 'cyan'`, `cover: 'cover-rana-neon'`, `best_seed: 0`, `plays_seed: '0'`), en una migración nueva que no toca `001_games_and_scores.sql` ni las políticas RLS existentes.
- [ ] `/jugar/frogger-poderes` renderiza el canvas de 520×560 dentro de `.crt-screen`, con la clase `game-canvas`.
- [ ] El HUD de React refleja en tiempo real Puntuación, Vidas, Nivel, Tiempo, Casillas y Poder del motor (no valores fijos).
- [ ] Saltar con flechas y con WASD funciona en las cuatro direcciones, un salto por pulsación, y la rana nunca sale del grid por su propio salto.
- [ ] Avanzar a una fila nueva sin poder activo suma exactamente 10 puntos; con cualquier poder activo suma exactamente 20; volver a bajar y subir a la misma fila no suma nada.
- [ ] Llegar a una casilla libre suma exactamente 50 puntos más `10 × floor(msRestantes / 500)` de bonus de tiempo, sin duplicarse por tener un poder activo.
- [ ] Ocupar las cinco casillas suma exactamente 1000 puntos, sube el nivel en 1, vacía las casillas, descarta el poder activo y reinicia el temporizador.
- [ ] Aparece una cápsula cada 7 segundos de juego efectivo, con nunca más de 2 en pantalla, y cada una desaparece a los 6 segundos si no se recoge.
- [ ] Las cápsulas aparecen tanto sobre plataformas del río (viajando con ellas) como en celdas fijas de mediana o carretera.
- [ ] Recoger una cápsula suma exactamente 25 puntos y activa su poder, mostrándolo en el stat `Poder` con la cuenta atrás en segundos enteros.
- [ ] `LENTO` reduce a la mitad la velocidad de todos los vehículos y plataformas durante 6 segundos, sin frenar el temporizador de la partida.
- [ ] `ESCUDO` absorbe exactamente una muerte por atropello, ahogo o tortuga sumergida, reubica la rana en la fila segura más cercana por debajo, se consume al hacerlo y no protege contra tiempo agotado, casilla ocupada ni borde lateral.
- [ ] `SALTO ×2` hace que el salto hacia arriba avance 2 filas y puntúe las 2 filas nuevas (40 puntos), sin afectar los otros tres sentidos.
- [ ] `ANFIBIO` impide la muerte por agua y por tortuga sumergida durante 6 segundos, sin arrastre de plataforma, y no protege contra vehículos ni contra salir del borde lateral.
- [ ] Recoger una cápsula con un poder ya activo reemplaza el poder y reinicia su temporizador; nunca hay dos poderes activos a la vez.
- [ ] Morir descarta el poder activo y la rana reaparece sin poder ni aura.
- [ ] Un vehículo que toca la rana sin escudo le quita una vida y la devuelve a la acera de inicio, conservando las casillas ya ocupadas.
- [ ] Sobre un tronco o una tortuga a flote la rana se desplaza con la plataforma; si es arrastrada fuera del borde lateral, pierde una vida.
- [ ] Las tortugas de las filas 2 y 5 se sumergen en ciclo con una fase de aviso visible.
- [ ] Al subir de nivel, las velocidades se multiplican por `min(1 + 0.15 × (nivel - 1), 2.2)`, el tiempo baja un segundo por nivel con piso de 20 s y el intervalo de spawn baja medio segundo por nivel con piso de 4.5 s.
- [ ] El movimiento de vehículos, plataformas y cápsulas se basa en delta time real, de modo que la velocidad percibida es la misma en un monitor de 60 Hz y en uno de 144 Hz.
- [ ] Perder la tercera rana invoca `onGameOver` una sola vez y abre automáticamente el modal de fin de partida con el puntaje real, sin overlay interno de "GAME OVER" en el canvas.
- [ ] PAUSA/REANUDAR detiene y reactiva el loop sin saltos de posición, sin consumir tiempo del temporizador, ni del poder activo, ni del reloj de spawn de cápsulas durante la pausa, y sin overlay interno de "PAUSA".
- [ ] "GUARDAR PUNTUACIÓN" inserta una fila en `scores` con `game_id: "frogger-poderes"`, `user_id: null`, `score` real.
- [ ] "JUGAR DE NUEVO" reinicia una instancia nueva del motor (rana en la acera, score 0, 3 vidas, nivel 1, 0/5 casillas, sin poder ni cápsulas).
- [ ] El juego aparece como tab nuevo en `/salon` (sin tocar código de `HallOfFame.tsx`) y su top coincide con el mostrado en `/juego/frogger-poderes`.
- [ ] Salir del juego (botón "SALIR" o navegar fuera de `/jugar/frogger-poderes`) cancela el `requestAnimationFrame` y remueve los listeners de teclado.
- [ ] Una partida de un jugador que ya conoce el juego dura entre 2 y 4 minutos.
- [ ] `npm run build` compila sin errores de tipos.

## Decisiones tomadas y descartadas

- **Sí:** poderes temporales recogibles como modificación, elegida por el spec (el prompt de invocación no indicó una). Frogger ya trae progresión por niveles en su forma canónica, así que "niveles progresivos" no sería una modificación real; los poderes agregan una decisión nueva por intento (desviarse para recoger la cápsula) sin tocar el motor de filas.
- **No:** geometría alterada (carriles verticales, tablero circular, río arriba y abajo). Rompería el reconocimiento del clásico y complicaría el dibujo sin aportar decisiones nuevas al jugador.
- **No:** modo contrarreloj puro o modo "un solo intento". Reduciría la duración de partida por debajo del rango objetivo de 2–4 minutos y aplanaría el score.
- **Sí:** un solo poder activo a la vez, con reemplazo. Elimina de raíz la explosión combinatoria de interacciones entre poderes (por ejemplo lento + anfibio + escudo, que volvería el río trivial) y hace el HUD legible con un solo stat.
- **No:** inventario de poderes con tecla de activación manual. Agregaría teclas y una capa de gestión que no encaja con el bucle de reflejos de Frogger.
- **No:** poderes negativos o cápsulas trampa (por ejemplo "tráfico acelerado"). Con el tiempo ya corriendo en contra, un castigo aleatorio por recoger un objeto se percibe como injusto y no aporta decisión, solo varianza.
- **Sí:** velocidades base un 15 % más rápidas que el clásico. Los poderes son ventajas netas; sin este ajuste la variante sería más fácil que el juego base y sus puntajes no serían comparables en dificultad percibida.
- **Sí:** duplicar solo los puntos por fila avanzada mientras hay poder activo. Premia usar el poder para avanzar en vez de para esperar a salvo, y deja el resto de la tabla de puntaje idéntica al original, que es la parte reconocible.
- **Sí:** escudo con 8 s de duración frente a 6 s de los demás. Un escudo se consume en el primer error, así que necesita una ventana algo mayor para llegar a usarse; sin eso sería el poder más débil de los cuatro.
- **Sí:** 25 puntos por cápsula. Suficiente para notarse en el HUD, muy por debajo de los 50 de una rana en casa, para que el juego no se convierta en recolectar cápsulas en la acera en vez de cruzar.
- **Sí:** reglas del tablero, del temporizador y de la tabla de puntaje tomadas del arcade original (10 por avance, 50 por rana en casa, 10 por medio segundo no usado, 1000 por nivel completo, 30 s por rana, cinco casillas, tortugas que se sumergen). Verificado en las fuentes consultadas, no inventado.
- **Sí:** 3 vidas fijas, alineado con Asteroids y Arkanoid (`♥ ♥ ♥`), en vez de las 3/5/7 configurables por el operador en el arcade original.
- **No:** cocodrilos, serpientes, nutrias, rana hembra ni mosca bonus del original. La variante ya agrega una capa de mecánica; sumar enemigos con comportamiento propio subiría el costo del motor y haría el balance imposible de fijar en un solo spec.
- **Sí:** todo dibujado por código, sin spritesheets. No hay assets locales de Frogger (`references/started-games/` solo tiene `02-asteroids`, `03-tetris` y `04-arkanoid`; `references/assest-source/` no tiene nada de Frogger); las cápsulas y las auras se resuelven mejor con formas y sombras de Canvas que con sprites.
- **Sí:** portada nueva `.cover-rana-neon` diseñada con `/frontend-design`, en vez de reutilizar `.cover-rana` (que queda para el Frogger clásico del spec `01`). Dos juegos del catálogo con la misma portada serían indistinguibles en `/biblioteca`.
- **Sí:** `cat: 'ARCADE'` y `color: 'cyan'`. Las cuatro categorías y los cuatro colores del `check` de `001_games_and_scores.sql` ya están usados, así que ninguna combinación diversifica de verdad; se elige la categoría honesta y un color que no repita el del spec `01` (`green`).
- **Sí:** canvas de 520×560 (13×14 celdas de 40 px), igual que el clásico: mantiene la proporción vertical del original y la celda de 40 px permite dibujar rana y cápsula sin sprites.
- **No:** tecla de pausa dentro del motor. Misma decisión que en Tetris y Snake: la pausa la controla el botón "PAUSA" de React.
- **Fuentes consultadas sobre el original** (solo para verificar reglas y balance, sin copiar código de terceros):
  - `https://classicgaming.cc/classics/frogger/about` — layout de carretera y río, cinco casillas, vidas configurables (3/5/7), progresión por niveles.
  - `https://frogger.fandom.com/wiki/Frogger_(video_game)` (vía resultados de búsqueda; el fetch directo devolvió HTTP 402) — 30 segundos por rana, tortugas que se sumergen, endurecimiento del tráfico en niveles altos.
  - `https://www.arcade-museum.com/Videogame/frogger` y `https://arcade-history.com/?id=879` (vía resultados de búsqueda) — tabla de puntaje: 10 por avance, 50 por rana en casa, 10 por medio segundo no usado, 200 por mosca o rana hembra, 1000 por nivel completo.

## Riesgos identificados

| Riesgo                                                                                                                                                                                                      | Mitigación                                                                                                                                                                                                                              |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fuga del `requestAnimationFrame` y de los listeners de teclado si `FroggerPowersEngine.destroy()` no los limpia al desmontar o navegar fuera de `/jugar/frogger-poderes`.                                   | Cubierto en el paso 15 del plan y en los criterios de aceptación; `destroy()` cancela el rAF y remueve el listener registrado en `start()`.                                                                                             |
| `dt` gigante al reanudar de una pausa larga si `pause()` no detiene el reloj interno y `resume()` no lo resetea: además del salto de posición, se consumirían de golpe el poder activo y el reloj de spawn. | Al pausar se detiene el bucle completo (posiciones, temporizador, poder activo, spawn de cápsulas); al reanudar se resetea `lastTime` como si fuera el primer frame. Hay criterio de aceptación específico.                             |
| Estado global de módulo que sobrevive al HMR de Next.js si el motor no encapsula todo en la instancia.                                                                                                      | `lanes.ts` y `powers.ts` son módulos puros de constantes; todo el estado mutable (rana, filas, cápsulas, poder activo, score, vidas, nivel, tiempo, relojes) vive en propiedades de la clase.                                           |
| Overlay de "GAME OVER"/"PAUSA" duplicado entre el canvas y React.                                                                                                                                           | El motor nunca dibuja esos textos; solo invoca `onGameOver(finalScore)` y React muestra el modal y el overlay de pausa.                                                                                                                 |
| **Balance de los poderes.** Cuatro efectos que anulan causas de muerte pueden volver el juego trivial, o irrelevantes si duran muy poco.                                                                    | Un solo poder activo, duraciones cortas y fijas (6 s, 8 s para el escudo), velocidades base un 15 % más altas y cápsulas cada 7 s con vida de 6 s. El criterio de duración de partida (2–4 min) actúa como prueba de balance.           |
| **`ANFIBIO` combinado con quedarse quieto en el río.** Si el jugador puede flotar en el agua sin arrastre, podría usar el poder para esperar a salvo y farmear tiempo.                                      | El poder dura 6 s y el temporizador de la partida sigue corriendo; además los puntos solo se dan por filas nuevas, así que esperar no genera puntaje. Al expirar sobre agua, la rana muere de inmediato.                                |
| **`SALTO ×2` y las casillas de llegada.** Un salto de dos filas desde la fila 2 podría "saltarse" la fila de casillas o entrar en el seto por un cálculo de destino mal acotado.                            | El destino se acota al grid: si el salto de 2 celdas cae fuera del tablero, se degrada a 1 celda; si cae en el seto, aplica la muerte normal. Ambos casos están en el paso 13 y en los criterios.                                       |
| **`LENTO` y la integración por delta time.** Aplicar el factor 0.5 sobre `dt` en vez de sobre las velocidades frenaría también el temporizador y las animaciones, cambiando el juego más de lo definido.    | El factor multiplica solo las velocidades de vehículos, plataformas y cápsulas dentro del paso de integración; `dt` nunca se escala. Hay criterio de aceptación explícito.                                                              |
| **`ESCUDO` sin destino claro al absorber una muerte.** Reubicar la rana "donde estaba" tras un atropello la dejaría solapada con el vehículo y la mataría en el frame siguiente.                            | Al absorber, la rana se reubica en la fila segura más cercana por debajo (mediana o acera) y el escudo se consume; nunca queda dentro de la hitbox que la mató.                                                                         |
| **Cápsula generada en un lugar inalcanzable.** Un spawn sobre una plataforma que ya está saliendo del canvas, o en una celda ocupada por un vehículo, sería puntos regalados o imposibles.                  | El spawn valida que la plataforma elegida esté completamente dentro del canvas y que la celda fija elegida no solape ningún vehículo en ese instante; si no hay candidato válido, el intento se salta y se reintenta al siguiente tick. |
| **Colisión injusta en la carretera.** Con hitbox de celda completa la rana muere al rozar un vehículo que visualmente no la toca.                                                                           | Hitbox de la rana de 28×28 px y hitbox del vehículo recortada 4 px por lado.                                                                                                                                                            |
| **Rana sobre el límite entre dos plataformas, y arrastre acumulado.** Un cálculo por celda en vez de por píxel la mataría estando visualmente a salvo, o la dejaría desalineada del grid.                   | El soporte se comprueba con el centro horizontal en píxeles contra el rango de cada objeto; al iniciar un salto, la columna se recalcula por redondeo desde la posición real y el offset vuelve a 0.                                    |
| **Velocidades escaladas sin techo.** Sin límite, en niveles altos un vehículo podría cruzar más de una hitbox entre frames y atravesar la rana sin colisión.                                                | El multiplicador tiene techo `2.2`; con ese techo el objeto más rápido (fila 7, 330 px/s) recorre menos de 6 px por frame a 60 Hz, muy por debajo del ancho de una hitbox.                                                              |
| **HUD con cinco stats.** El `player-hud` renderiza `engineState.stats.map(...)` sin límite de cantidad, pero ningún juego actual pasa de dos stats además del score.                                        | El stat `power` usa un texto corto (`—`, `LENTO 4s`, `SALTO ×2 3s`); si el layout se ve apretado, se acorta la etiqueta, nunca se agregan cambios a `GamePlayer.tsx`.                                                                   |
| **Canvas de 520×560 en pantallas angostas.** Puede quedar ajustado dentro de `.crt-screen` en viewports pequeños.                                                                                           | No se resuelve en este spec (layout móvil está fuera de alcance); se documenta como limitación conocida, igual que en SPEC 07 con el canvas secundario de Tetris.                                                                       |

## Lo que no está en este spec

- El Frogger clásico sin poderes (eso es `01-frogger-game.md`, un juego aparte).
- Inventario de poderes, activación manual, combinación de dos poderes o poderes permanentes.
- Poderes negativos y cápsulas trampa.
- Mosca bonus, rana hembra, cocodrilos, serpientes y nutrias del original.
- Audio y efectos de sonido.
- Assets de imagen en `public/games/frogger-poderes/`.
- Multiplayer y progresión persistente entre partidas.
- Realtime, paginación del leaderboard y autenticación real.
- Controles táctiles/móviles.
- Tests automatizados.
- Tema claro/oscuro propio del juego.
- Cambios a `GameDetail.tsx` o a la ruta `/juego/[id]` más allá de la nueva entrada navegable.

Cada uno de estos, si se necesita, va en su propio spec futuro.
