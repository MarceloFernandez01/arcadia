# SPEC GJ-vortice-neon-01 — Juego Vórtice Neón (base)

> **Estado:** Draft
> **Depende de:** SPEC 05 (asteroids-game), SPEC 06 (leaderboard-supabase), SPEC 07 (tetris-game)
> **Fecha:** 2026-08-14
> **Objetivo:** Implementar el Tempest de Atari (1981) como motor real en TypeScript/Canvas bajo el id `vortice-neon`, con vórtice de 16 carriles proyectado en 2D, los cinco enemigos canónicos (Tumbador, Tanque, Espigador, Fusible, Pulsar), Superzapper, espigas y descenso final por el tubo, dado de alta en `lib/games/registry.ts` y en Supabase para que aparezca en el Salón de la Fama.

> **Nota de numeración:** el identificador `GJ-vortice-neon-01` es local a esta game jam (`specs/game-jam/vortice-neon/`) y **no consume** la numeración correlativa global de `specs/` (que hoy llega hasta `12-optimizacion-performance-frogger.md`). Este spec **no depende** de `02-vortice-neon-mutante-game.md`: ambos son autocontenidos, independientes y se pueden implementar en cualquier orden, o solo uno de los dos.

## Por qué este spec existe

El juego base recibido para esta game jam es **Tempest** (Atari, 1981, diseño de Dave Theurer), que el agente `game-planner` ya tenía fichado en su backlog con el nombre de catálogo **"Vórtice Neón"** (`references/game-suggestions-todo.md`, línea "Vórtice Neón (Tempest) — SHOOTER — candidato"). Este archivo es la **versión base**: reproduce el bucle arcade original con el mínimo de ajustes necesarios para encajar en Arcade Vault, sin mecánicas añadidas.

La variante con modificación vive en `02-vortice-neon-mutante-game.md` (el vórtice muta en vivo durante la partida: carriles sellados, rotación del anillo, estrechamiento y apertura/cierre del tubo) y es **un juego distinto del catálogo**, con su propio id, color, portada y fila en `games`.

El planificador había marcado Tempest con una reserva: "la proyección de profundidad sube el costo del motor". Este spec cierra esa objeción fijando una proyección puramente 2D (interpolación radial desde un punto de fuga, sin matrices ni cámara 3D) y cierra también las decisiones que el planificador dejó abiertas: dimensiones, número de carriles, formas de tubo, fórmula de puntaje y curva de dificultad.

**Encaje con los criterios de la plataforma:**

1. **Score acumulable** — puntaje numérico único: 50/100/150/200/250 por enemigo según tipo, 1 punto por impacto sobre una espiga y `250 × min(nivel, 12)` por nivel completado. Comparable entre partidas y con techo natural en la habilidad del jugador.
2. **Un jugador, partidas cortas** — 3 vidas, sin continuaciones; una partida promedio dura entre 2 y 4 minutos. Sin multijugador, sin progreso persistente entre partidas.
3. **Motor viable en Canvas 2D + rAF** — todo el juego se resuelve con dos escalares por entidad (carril y profundidad `t ∈ [0,1]`) y una proyección radial desde un punto de fuga. No hay física continua, ni matrices 3D, ni pathfinding, ni audio obligatorio.
4. **Compatible con `ArcadeGameEngine`** — `start/pause/resume/restart/destroy`, HUD vía `stats[{key,label,value}]`, `onGameOver(finalScore)`; el motor **no dibuja overlays** de "GAME OVER" ni de "PAUSA".
5. **Control por teclado** — `←`/`→` (y `A`/`D`) para recorrer el borde, `Espacio` para disparar, `Z` para el Superzapper. El control rotatorio original (spinner) se sustituye por movimiento discreto de carril, decisión documentada abajo.
6. **Assets** — todo dibujado por código con trazos vectoriales neón. Sin spritesheets nuevos, por lo tanto **sin carpeta `public/games/vortice-neon/`**.
7. **Hueco de catálogo** — `references/implemented-games.md` tiene `asteroides` (SHOOTER/cyan), `tetris` (PUZZLE/magenta), `arkanoid` (ARCADE/green), `snake` (ARCADE/yellow), más `frogger` (ARCADE/green) de la game jam anterior. ARCADE está saturado (3 juegos) y SHOOTER tiene uno solo, así que `SHOOTER` es a la vez la categoría honesta y la que diversifica. El color se fija en `magenta` para no repetir el `cyan` de Asteroides, el otro SHOOTER, y para no chocar con el `yellow` del spec `02`.
8. **Estética retro/neón** — trazos vectoriales sobre fondo casi negro, con la paleta de `app/globals.css` (`--cyan`, `--magenta`, `--yellow`, `--green`) rotando por nivel, igual que el original cambiaba de color cada pantalla. Es, junto con Asteroides, el juego más "vectorial" del catálogo.

## Alcance

**Incluye:**

- Motor de Vórtice Neón en `lib/games/vortice-neon/engine.ts`, implementando `ArcadeGameEngine` (interfaz existente en `lib/games/types.ts`, sin cambios).
- `lib/games/vortice-neon/shapes.ts` con las seis formas de vórtice (lista de vértices normalizados, bandera de cerrado/abierto), la paleta por nivel y las funciones puras de la curva de dificultad.
- Canvas de **800×600**, con el vórtice proyectado desde un punto de fuga fijo y 16 carriles en todas las formas.
- Jugador ("garra") que se desplaza de carril en carril por el borde exterior, con wrap en las formas cerradas y tope en las abiertas.
- Los cinco enemigos canónicos: **Tumbador** (Flipper), **Tanque** (Tanker), **Espigador** (Spiker), **Fusible** (Fuseball) y **Pulsar**, con sus comportamientos y valores de puntaje.
- Espigas dejadas por los Espigadores, que se pueden acortar a tiros y que pueden matar al jugador durante el descenso final del nivel.
- Disparos enemigos que suben por el carril hacia el borde y que el jugador puede destruir con sus propios disparos.
- Superzapper con dos cargas por nivel (primera: barre todos los enemigos vivos sin puntos; segunda: destruye uno al azar, con puntos).
- Fase de descenso al completar un nivel: el vórtice se recorre hasta el fondo, el jugador sigue moviéndose y disparando espigas, y se cobra el bonus de nivel.
- Curva de dificultad por nivel: más enemigos, spawn más rápido, velocidad de avance escalada con techo, y tipos de enemigo que se van habilitando.
- Vidas: 3 iniciales, una extra cada 20 000 puntos con techo de 5 acumuladas.
- Stats de HUD expuestas vía el estado flexible del registry: `lives`, `level`, `zaps`; el `score` lo muestra el `player-hud` aparte. Se notifican solo cuando cambian.
- Al perder la última vida, el motor invoca `onGameOver(finalScore)` una sola vez y detiene el loop, **sin overlay interno de "GAME OVER" ni de "PAUSA"** — React controla la pausa desde el botón "PAUSA" del `player-hud` y el modal de fin de partida ya existente, igual que Asteroids/Tetris/Arkanoid/Snake/Frogger.
- Alta de `vortice-neon` en la tabla `games` de Supabase (migración de seed nueva; ver Modelo de datos), `cat: 'SHOOTER'`, `color: 'magenta'`, cover `.cover-vortice` **nueva**, diseñada invocando `/frontend-design` (ver paso 1 del plan).
- Registro de la entrada `vortice-neon` en `lib/games/registry.ts` (`width: 800`, `height: 600`).

**Fuera de alcance (para specs futuros):**

- Sin multijugador y sin progresión persistente entre partidas (no se guarda el nivel alcanzado ni el "warp" de nivel inicial del original).
- Sin audio ni efectos de sonido.
- Sin control rotatorio analógico (spinner) ni soporte de rueda del ratón: el movimiento por el borde es discreto por carril.
- Sin mutaciones del vórtice, sin power-ups y sin modificadores temporales — eso es `02-vortice-neon-mutante-game.md`, que es un juego aparte.
- Sin las 99 pantallas ni las 16 formas del original: seis formas que se ciclan (ver Decisiones).
- Sin controles táctiles/móviles en este spec (el sistema genérico `touchControls` del registry existe y el agente `mobile-porter` puede agregarlos después sin tocar el motor).
- Sin assets de imagen: nada en `public/games/vortice-neon/`.
- Sin skins `clasico`/`retro`/`neon` en este spec: el motor se entrega con una sola paleta (la del propio juego, que ya rota por nivel). El agente `skin-designer` los agrega después.
- Heredado de SPEC 05/06: sin Realtime (el leaderboard se actualiza al navegar/recargar), sin paginación del leaderboard (top fijo de `getTopScores`), sin autenticación real (`user_id: null` en `scores`), sin tests automatizados, sin tema claro/oscuro propio del juego, sin cambios a `GameDetail.tsx` ni a la ruta `/juego/[id]` más allá de la nueva entrada navegable.

## Reglas del juego

### Geometría del vórtice y proyección

El vórtice se define como un polígono de **16 carriles** dibujado dos veces: el **borde exterior** (donde vive el jugador) y el **fondo** (el extremo lejano, cerca del punto de fuga). No hay cámara 3D ni matrices: la profundidad es un escalar y la proyección, una interpolación radial.

- Centro/punto de fuga fijo en `C = (400, 285)` sobre el canvas de 800×600.
- Cada forma es una lista de vértices normalizados `V_i` (radio 1 = `RIM_RADIUS = 250 px`). Con 16 carriles: 16 vértices en formas cerradas, 17 en formas abiertas.
- El **carril `i`** es el sector entre `V_i` y `V_{i+1}`; su eje pasa por el punto medio `M_i = (V_i + V_{i+1}) / 2`.
- Profundidad `t ∈ [0, 1]`: `t = 0` es el fondo (donde nacen los enemigos), `t = 1` es el borde exterior (donde vive el jugador).
- Factor radial: `r(t) = 0.12 + 0.88 · t^1.6`. La potencia `1.6` es lo que produce la sensación de perspectiva (las cosas lejanas se amontonan cerca del fondo).
- Posición en pantalla de cualquier entidad: `P(i, t) = C + (M_i − C) · r(t)`. Los bordes del carril se calculan igual con `V_i` y `V_{i+1}`.
- Escala de dibujo por profundidad: `size(t) = 0.25 + 0.75 · t`; grosor de trazo `1 + 1.5 · t` px.
- Render del tubo: polígono del borde, polígono del fondo, una "costilla" por vértice uniendo ambos y dos anillos intermedios en `t = 0.35` y `t = 0.70`. Fondo del canvas `#05050f`.

### Formas del vórtice

Seis formas, todas de 16 carriles, que se ciclan por nivel: `SHAPES[(nivel − 1) % 6]`.

| Índice | Nombre     | Cerrada | Descripción                                                        |
| ------ | ---------- | ------- | ------------------------------------------------------------------ |
| 0      | `circulo`  | Sí      | 16 vértices sobre una circunferencia de radio 1.                    |
| 1      | `cuadrado` | Sí      | Cuadrado con 4 vértices por lado.                                   |
| 2      | `cruz`     | Sí      | Cruz de 12 esquinas, subdividida hasta 16 vértices.                 |
| 3      | `estrella` | Sí      | 8 puntas, radios alternados 1.0 / 0.55.                             |
| 4      | `linea`    | No      | 17 vértices sobre una recta horizontal (campo abierto, sin wrap).   |
| 5      | `uve`      | No      | 17 vértices formando una V abierta.                                 |

En formas **cerradas** el jugador da la vuelta completa (carril 15 → carril 0). En formas **abiertas** los carriles 0 y 15 son topes: el jugador no puede pasar de ahí y los Tumbadores invierten su dirección de volteo al llegar.

La paleta rota por nivel entre `--cyan`, `--magenta`, `--yellow` y `--green` (`LEVEL_COLORS[(nivel − 1) % 4]`), tal como el original cambiaba de color cada pantalla.

### Bucle, jugador y disparos

- El loop usa `requestAnimationFrame` con delta time real (`performance.now()`); todas las velocidades se expresan en unidades de profundidad por segundo o en segundos, nunca "por frame".
- El jugador ocupa un carril entero (`playerLane`) y se dibuja como una garra de tres puntas apoyada sobre el borde exterior. Cada pulsación de `←`/`→` mueve exactamente un carril; mantener la tecla repite el movimiento cada **90 ms**.
- Disparo del jugador: nace en `t = 1` en su carril y baja hacia el fondo a **2.2 unidades de `t` por segundo**. Máximo **6 disparos en vuelo**; cadencia mínima **0.12 s**.
- Un disparo impacta un enemigo si comparten carril y `|t_disparo − t_enemigo| ≤ 0.04`.
- Un disparo que llega a `t ≤ 0` se destruye. Si en el camino atraviesa una espiga de su carril, impacta la espiga (ver más abajo) en vez de seguir.
- Los disparos del jugador también destruyen disparos enemigos (0 puntos).

### Enemigos

Todos avanzan desde `t = 0` hacia el borde: `t += velocidad · multiplicadorNivel · dt`.

| Enemigo    | Puntos | Velocidad base | Comportamiento                                                                                                                                                                                                                                       |
| ---------- | ------ | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Espigador  | 50     | 0.35 /s        | Sube hasta un tope sorteado en `[0.45, 0.80]` dejando una **espiga** en su carril hasta su `t` máximo alcanzado; al llegar al tope vuelve a `t = 0` y repite. No dispara y no mata por contacto.                                                        |
| Tanque     | 100    | 0.22 /s        | No dispara. Al ser destruido, o al alcanzar `t ≥ 0.95`, se parte en **2 Tumbadores** en los carriles `i − 1` e `i + 1` (si el vecino no existe por ser forma abierta, nace en `i`), heredando su `t`.                                                   |
| Tumbador   | 150    | 0.30 /s        | Al llegar a `t ≥ 0.95` entra en modo borde: cada **0.55 s** se voltea a un carril vecino (dirección sorteada, se invierte al topar un extremo en formas abiertas). Mata al jugador si comparten carril con `t ≥ 0.90`. Dispara desde `t ≥ 0.40` cada 1.8–3.2 s. |
| Pulsar     | 200    | 0.24 /s        | Ciclo de **1.6 s**: 1.0 s inactivo, 0.6 s electrificado (todo su carril brilla de extremo a extremo). Si el jugador está en ese carril durante la fase electrificada, muere. Dispara desde `t ≥ 0.50` cada 2.5 s.                                        |
| Fusible    | 250    | 0.26 /s        | Se desplaza lateralmente: alterna cada **0.40 s** entre estar centrado en un carril y estar sobre la frontera con el vecino. **Solo es vulnerable al disparo mientras está centrado.** Al llegar al borde recorre el anillo a 1 carril cada 0.35 s durante 4 s y luego desaparece; mata al contacto. |

- **Disparos enemigos:** suben hacia el borde a **0.75 /s** por el carril desde el que se dispararon. Matan al jugador si llegan a `t ≥ 0.97` en su carril.
- **Espigas:** cada carril tiene como máximo una espiga, con una altura `spikeTop ∈ [0, 0.8]` (profundidad hasta donde llega desde el fondo). Cada impacto de disparo la acorta **0.08** y suma **1 punto**; al llegar a 0 desaparece. Las espigas **no** matan durante el juego normal: solo en el descenso final.

### Superzapper

- Dos cargas por nivel, recargadas al iniciar cada nivel. Tecla `Z`.
- **Primera carga:** destruye todos los enemigos vivos en el vórtice, **sin sumar puntos** (igual que el original). Destello blanco de 0.25 s sobre todo el tubo.
- **Segunda carga:** destruye un enemigo vivo al azar y **sí** suma su puntaje.
- Pulsar `Z` sin cargas no hace nada. El Superzapper no afecta a las espigas ni a los disparos enemigos.

### Nivel, descenso y curva de dificultad

- Cada nivel tiene un presupuesto de enemigos: `enemigosTotal = min(8 + 2 · (nivel − 1), 30)`.
- Los enemigos aparecen de a uno en un carril al azar con `t = 0`, cada `spawnInterval = max(1.6 − 0.08 · (nivel − 1), 0.45)` segundos, con un tope de **7 enemigos vivos simultáneos**.
- Tipos habilitados por nivel: niveles 1–2 solo Tumbadores; desde el 3 se suman Tanques; desde el 4, Espigadores; desde el 6, Fusibles; desde el 8, Pulsares. Cuando hay varios habilitados, el tipo se sortea con pesos `Tumbador 40 %, Tanque 20 %, Espigador 15 %, Fusible 12 %, Pulsar 13 %`, renormalizados entre los habilitados.
- Multiplicador de velocidad por nivel: `min(1 + 0.08 · (nivel − 1), 2.2)` (techo alcanzado en el nivel 16).
- **Fin de nivel:** cuando se agotó el presupuesto de spawn y no queda ningún enemigo vivo, comienza la **fase de descenso** de 2 600 ms: el vórtice se re-escala como si la cámara viajara del borde al fondo. Durante el descenso el jugador puede seguir moviéndose de carril y disparando (útil para limpiar espigas). Si al terminar el descenso el carril del jugador conserva una espiga con `spikeTop ≥ 0.35`, pierde una vida (pero igual pasa de nivel).
- Al terminar el descenso se suma el **bonus de nivel**: `250 × min(nivel, 12)`. Luego se arma el nivel siguiente con su forma, su color, su presupuesto y las dos cargas de Superzapper repuestas.

### Muerte, vidas y fin de partida

- El jugador muere por: contacto con un Tumbador o un Fusible en el borde, estar en un carril electrificado por un Pulsar, recibir un disparo enemigo en el borde, o empalarse en una espiga al final del descenso.
- Al morir: explosión de 1.2 s (el juego se congela salvo la animación), se eliminan los enemigos con `t ≥ 0.85` (para no revivir dentro de una trampa) y el jugador reaparece en el mismo carril con **1.5 s de invulnerabilidad** parpadeante. Las espigas y el progreso de spawn del nivel **se conservan**.
- Vidas: 3 iniciales. Se gana una vida extra cada **20 000 puntos**, con techo de **5 vidas acumuladas** al mismo tiempo.
- Al perder la última vida: `onGameOver(finalScore)` una sola vez y el loop se detiene.

### Controles

- `←` / `→` y `A` / `D`: mover un carril por el borde (repetición cada 90 ms manteniendo la tecla).
- `Espacio`: disparar (repetición limitada por la cadencia mínima de 0.12 s).
- `Z`: Superzapper.
- Ninguna otra tecla tiene efecto. En particular, no hay tecla de pausa ni de reinicio: la pausa la controla el botón "PAUSA" del `player-hud` y el reinicio, el botón "JUGAR DE NUEVO" del modal.
- `preventDefault()` en flechas y `Espacio` para que la página no haga scroll durante la partida.

### HUD y estética

- Stats: `lives` ("Vidas", `♥ ♥ ♥`), `level` ("Nivel", `01`), `zaps` ("Zapper", `2`). El `score` lo muestra el `player-hud` aparte.
- Todo se dibuja con trazos (`stroke`) de 1–3 px y `shadowBlur` moderado para el brillo neón; nada de rellenos sólidos salvo el destello del Superzapper.
- El color del vórtice cambia por nivel (`LEVEL_COLORS`); los enemigos conservan color propio para ser reconocibles: Tumbador `--magenta`, Tanque `--yellow`, Espigador `--green`, Pulsar `--cyan`, Fusible blanco con núcleo `--magenta`.
- El jugador se dibuja siempre en `--yellow` con brillo; durante la invulnerabilidad parpadea a 8 Hz.

## Modelo de datos

Reutiliza sin cambios `ArcadeGameEngine`, `ArcadeGameEngineOptions`, `EngineState`, `EngineHudStat` de `lib/games/types.ts` y `GameRegistryEntry` de `lib/games/registry.ts` (ya existentes, sin modificaciones).

```ts
// lib/games/vortice-neon/shapes.ts
export interface VortexShape {
  name: string;
  closed: boolean;
  vertices: { x: number; y: number }[]; // normalizados a radio 1, respecto al punto de fuga
}

export const LANE_COUNT = 16;
export const RIM_RADIUS = 250;
export const VANISHING = { x: 400, y: 285 };
export const SHAPES: VortexShape[]; // circulo, cuadrado, cruz, estrella, linea, uve
export const LEVEL_COLORS: string[]; // cyan, magenta, yellow, green
export const levelSpeedMult: (level: number) => number; // min(1 + 0.08*(level-1), 2.2)
export const levelEnemyBudget: (level: number) => number; // min(8 + 2*(level-1), 30)
export const levelSpawnInterval: (level: number) => number; // max(1.6 - 0.08*(level-1), 0.45) s
```

```ts
// lib/games/vortice-neon/engine.ts
type EnemyKind = "tumbador" | "tanque" | "espigador" | "fusible" | "pulsar";

interface Enemy {
  kind: EnemyKind;
  lane: number;
  laneOffset: number; // 0 = centrado; 0.5 = sobre la frontera (solo Fusible)
  depth: number; // t ∈ [0,1]
  phaseMs: number; // reloj del ciclo propio (volteo, pulso, zigzag)
  fireCooldownMs: number;
  peakDepth?: number; // solo Espigador
}

interface Shot {
  lane: number;
  depth: number;
  fromPlayer: boolean;
}

export class VorticeNeonEngine implements ArcadeGameEngine {
  constructor(canvas: HTMLCanvasElement, options: ArcadeGameEngineOptions);
  start(): void;
  pause(): void;
  resume(): void;
  restart(): void;
  destroy(): void;
}
```

```ts
// lib/games/vortice-neon/engine.ts — constantes de balance (valores del spec)
const ENEMY_POINTS = { espigador: 50, tanque: 100, tumbador: 150, pulsar: 200, fusible: 250 };
const PLAYER_SHOT_SPEED = 2.2; // t/s
const ENEMY_SHOT_SPEED = 0.75; // t/s
const MAX_PLAYER_SHOTS = 6;
const FIRE_COOLDOWN_MS = 120;
const MOVE_REPEAT_MS = 90;
const MAX_ALIVE_ENEMIES = 7;
const DESCENT_MS = 2600;
const SPIKE_HIT_STEP = 0.08; // cuánto acorta cada impacto
const SPIKE_KILL_DEPTH = 0.35; // espiga que empala en el descenso
const RESPAWN_INVULN_MS = 1500;
const EXTRA_LIFE_EVERY = 20000;
const MAX_LIVES = 5;
```

```ts
// lib/games/registry.ts (nueva entrada, sin tocar las existentes)
"vortice-neon": {
  width: 800,
  height: 600,
  initialState: {
    score: 0,
    stats: [
      { key: "lives", label: "Vidas", value: "♥ ♥ ♥" },
      { key: "level", label: "Nivel", value: "01" },
      { key: "zaps", label: "Zapper", value: "2" },
    ],
  },
  create(canvas, options) {
    return new VorticeNeonEngine(canvas, options);
  },
},
```

- `games` en Supabase gana una fila más (`vortice-neon`), usando el esquema ya existente de `001_games_and_scores.sql` (sin cambios de columnas ni de políticas RLS). El archivo va en `supabase/migrations/NNN_seed_vortice_neon.sql`, donde `NNN` es **el siguiente número disponible al momento de implementar** (hoy `006`, porque existen `001`–`005`); los dos specs de esta game jam compiten por el mismo hueco de numeración, así que el número se confirma al implementar, no antes.

```sql
-- supabase/migrations/NNN_seed_vortice_neon.sql  (NNN = siguiente disponible)
insert into games (id, title, short, long, cat, cover, color, best_seed, plays_seed)
values (
  'vortice-neon',
  'VÓRTICE NEÓN',
  'Defiende el borde del tubo antes de que suban hasta ti.',
  'Recorre el borde de un vórtice de 16 carriles y dispara hacia el fondo para frenar a los Tumbadores, Tanques, Espigadores, Fusibles y Pulsares que trepan hacia ti. Cada nivel cambia la forma y el color del tubo, y termina con un descenso a toda velocidad donde las espigas que dejaste sin limpiar te pueden empalar. Dos cargas de Superzapper por nivel y tres vidas: nada más.',
  'SHOOTER',
  'cover-vortice',
  'magenta',
  0,
  '0'
);
```

- `scores` no cambia de esquema: las partidas se insertan con `game_id: 'vortice-neon'`, `user_id: null`, igual que los demás juegos.

## Plan de implementación

1. **Portada.** Diseñar la clase `.cover-vortice` en `app/globals.css` invocando `/frontend-design` (regla de `CLAUDE.md`): tubo poligonal en perspectiva, trazos neón en `--magenta` sobre fondo oscuro, con la garra del jugador insinuada en el borde. Ninguna `.cover-*` existente representa un vórtice (`cover-rocas`, `cover-tetro`, `cover-bricks`, `cover-snake`, `cover-rana` ya están en uso; `cover-glot`, `cover-invaders` y `cover-duelo` representan otros juegos), así que la clase es nueva y no debe quedar como placeholder. Manual test: la portada se ve correctamente en una tarjeta de `/biblioteca` con datos de prueba.
2. **Migración de seed.** Crear `supabase/migrations/NNN_seed_vortice_neon.sql` con el `insert` de la fila `vortice-neon` (valores del Modelo de datos, `NNN` = siguiente disponible) y aplicarla con `apply_migration` del MCP de Supabase. A partir de aquí el juego aparece en `/biblioteca`, `/` y `/salon`, y `/juego/vortice-neon` es navegable con la portada del paso 1, aunque todavía no sea jugable. Manual test: ver la tarjeta en `/biblioteca` y el tab nuevo en `/salon`.
3. **Geometría y formas.** Crear `lib/games/vortice-neon/shapes.ts` con `SHAPES` (las seis formas de 16 carriles), `LEVEL_COLORS` y las tres funciones de curva de dificultad. Módulo puro, sin estado ni dibujo.
4. **Motor — esqueleto y render del tubo.** Crear `lib/games/vortice-neon/engine.ts` con `VorticeNeonEngine implements ArcadeGameEngine` y todo el estado en propiedades de instancia (`playerLane`, `enemies`, `shots`, `spikes`, `score`, `lives`, `level`, `zaps`). El loop de `requestAnimationFrame` acumula `dt` real y por ahora solo dibuja el vórtice de la forma del nivel 1 y la garra quieta en un carril.
5. **Alta en el registry.** Agregar la entrada `vortice-neon` a `lib/games/registry.ts` (`width: 800`, `height: 600`, `initialState` con los tres stats, `create()` instanciando el motor). Manual test: `/jugar/vortice-neon` muestra el vórtice dentro de `.crt-screen` con el HUD en sus valores iniciales.
6. **Controles y disparo del jugador.** Listener de teclado (flechas + `A`/`D` con repetición de 90 ms, `Espacio` con cadencia de 0.12 s, `preventDefault`) y disparos que bajan por el carril hasta `t = 0`. Manual test: la garra recorre el borde con wrap en `circulo` y con tope en `linea`, y los disparos se ven viajar hacia el fondo con la escala correcta.
7. **Enemigos que suben y colisión con disparos.** Implementar el spawn por presupuesto/intervalo, el avance en profundidad, la colisión disparo-enemigo (`|Δt| ≤ 0.04` en el mismo carril) y el puntaje por tipo, empezando solo por el Tumbador (incluyendo su volteo en el borde y su muerte por contacto). Manual test: matar Tumbadores suma 150 puntos cada uno y dejar que uno llegue al borde y toque al jugador cuesta una vida.
8. **Resto de enemigos.** Agregar Tanque (división en dos Tumbadores), Espigador (espigas), Fusible (zigzag e invulnerabilidad fuera del centro del carril, paseo por el borde) y Pulsar (ciclo de electrificación), más los disparos enemigos y su destrucción por disparo del jugador. Manual test: comprobar uno por uno cada comportamiento y valor de puntaje forzando el spawn desde el nivel correspondiente.
9. **Superzapper, vidas y game over.** Implementar las dos cargas por nivel (barrido sin puntos y disparo único con puntos), la muerte con explosión y respawn invulnerable, la vida extra cada 20 000 puntos con techo de 5, y `onGameOver(finalScore)` al perder la última vida. Manual test: usar ambas cargas, ver el HUD bajar de `2` a `0` y perder tres vidas hasta el modal automático.
10. **Fin de nivel, descenso y curva de dificultad.** Implementar la fase de descenso de 2 600 ms con la cámara viajando al fondo, el empalamiento por espiga (`spikeTop ≥ 0.35`), el bonus `250 × min(nivel, 12)`, la rotación de forma y color por nivel, y las tres funciones de dificultad. Manual test: completar los niveles 1 a 4 y verificar cambio de forma, cambio de color, aumento de enemigos y descenso con y sin espigas en el carril.
11. **Repaso final.** `npm run build` sin errores de tipos. Probar el flujo completo en el navegador: `/biblioteca` → detalle de "vortice-neon" → `/jugar/vortice-neon` → jugar dos o tres niveles, pausar/reanudar sin saltos ni enemigos teleportados, perder las tres vidas → modal automático con el puntaje real, "GUARDAR PUNTUACIÓN" inserta en `scores`, "JUGAR DE NUEVO" reinicia el motor, "SALIR" no deja el loop ni listeners activos. Confirmar que Asteroids, Tetris, Arkanoid, Snake y Frogger siguen funcionando igual.

## Criterios de aceptación

- [ ] Existen `lib/games/vortice-neon/shapes.ts` (seis formas de 16 carriles, paleta por nivel y funciones de dificultad) y `lib/games/vortice-neon/engine.ts` con `VorticeNeonEngine implements ArcadeGameEngine`, sin variables globales de módulo.
- [ ] No se agrega ningún archivo a `public/games/vortice-neon/`: todo el juego se dibuja con trazos de Canvas.
- [ ] Existe la clase `.cover-vortice` en `app/globals.css`, diseñada con `/frontend-design`, y la tarjeta de `/biblioteca` la usa.
- [ ] Existe una fila `vortice-neon` en `games` (Supabase) con los valores acordados (`cat: 'SHOOTER'`, `color: 'magenta'`, `cover: 'cover-vortice'`, `best_seed: 0`, `plays_seed: '0'`), en una migración nueva que no toca `001_games_and_scores.sql` ni las políticas RLS existentes.
- [ ] `/jugar/vortice-neon` renderiza el canvas de 800×600 dentro de `.crt-screen`, con la clase `game-canvas`.
- [ ] El HUD de React refleja en tiempo real Puntuación, Vidas, Nivel y Zapper del motor (no valores fijos).
- [ ] Moverse con `←`/`→` y con `A`/`D` avanza exactamente un carril por pulsación y repite cada 90 ms al mantener la tecla.
- [ ] En las formas cerradas (`circulo`, `cuadrado`, `cruz`, `estrella`) el jugador pasa del carril 15 al 0; en las abiertas (`linea`, `uve`) queda topado en ambos extremos.
- [ ] Nunca hay más de 6 disparos del jugador en vuelo y la cadencia mínima entre disparos es de 0.12 s.
- [ ] Destruir cada enemigo suma exactamente: Espigador 50, Tanque 100, Tumbador 150, Pulsar 200, Fusible 250.
- [ ] Un Tanque destruido genera exactamente 2 Tumbadores en carriles vecinos con su misma profundidad.
- [ ] Un Fusible no puede ser destruido mientras está sobre la frontera entre dos carriles, y sí puede mientras está centrado.
- [ ] Un Pulsar mata al jugador solo durante su fase electrificada (0.6 s de cada ciclo de 1.6 s) y únicamente si comparten carril.
- [ ] Cada impacto sobre una espiga la acorta 0.08 de profundidad y suma exactamente 1 punto.
- [ ] La primera carga del Superzapper elimina todos los enemigos vivos sin sumar puntos; la segunda elimina uno al azar y sí suma su puntaje; una tercera pulsación no hace nada hasta el nivel siguiente.
- [ ] Completar un nivel dispara la fase de descenso de 2 600 ms, durante la cual el jugador puede moverse y disparar, y suma `250 × min(nivel, 12)` puntos al terminarla.
- [ ] Terminar el descenso en un carril con una espiga de `spikeTop ≥ 0.35` cuesta una vida, pero el nivel igual avanza.
- [ ] Cada nivel nuevo cambia la forma del vórtice según `SHAPES[(nivel − 1) % 6]` y el color según `LEVEL_COLORS[(nivel − 1) % 4]`, y repone las dos cargas de Superzapper.
- [ ] La velocidad de avance de los enemigos se multiplica por `min(1 + 0.08 × (nivel − 1), 2.2)` y el presupuesto por nivel es `min(8 + 2 × (nivel − 1), 30)`, con un máximo de 7 enemigos vivos a la vez.
- [ ] Al morir, los enemigos con `t ≥ 0.85` se eliminan y el jugador reaparece con 1.5 s de invulnerabilidad parpadeante, conservando espigas y progreso de spawn del nivel.
- [ ] Se gana una vida extra cada 20 000 puntos, sin superar nunca 5 vidas acumuladas.
- [ ] Todo el movimiento se basa en delta time real, de modo que la velocidad percibida es la misma en un monitor de 60 Hz y en uno de 144 Hz.
- [ ] Perder la última vida invoca `onGameOver` una sola vez y abre automáticamente el modal de fin de partida con el puntaje real, sin overlay interno de "GAME OVER" en el canvas.
- [ ] PAUSA/REANUDAR detiene y reactiva el loop sin saltos de profundidad ni ciclos de Pulsar/Fusible perdidos, y sin overlay interno de "PAUSA".
- [ ] "GUARDAR PUNTUACIÓN" inserta una fila en `scores` con `game_id: "vortice-neon"`, `user_id: null`, `score` real.
- [ ] "JUGAR DE NUEVO" reinicia una instancia nueva del motor (nivel 1, forma `circulo`, score 0, 3 vidas, 2 cargas de Superzapper, sin espigas).
- [ ] Vórtice Neón aparece como tab nuevo en `/salon` (sin tocar código de `HallOfFame.tsx`) y su top coincide con el mostrado en `/juego/vortice-neon`.
- [ ] Salir del juego (botón "SALIR" o navegar fuera de `/jugar/vortice-neon`) cancela el `requestAnimationFrame` y remueve los listeners de teclado.
- [ ] Una partida de un jugador que ya conoce el juego dura entre 2 y 4 minutos.
- [ ] `npm run build` compila sin errores de tipos.

## Decisiones tomadas y descartadas

- **Sí:** proyección 2D por interpolación radial desde un punto de fuga (`P(i, t) = C + (M_i − C) · r(t)`, con `r(t) = 0.12 + 0.88 · t^1.6`) en vez de una cámara 3D con matrices. Es exactamente la objeción que el `game-planner` había levantado sobre Tempest, y se resuelve con dos escalares por entidad (carril y profundidad). Cumple el criterio 3 sin renunciar a la estética del original.
- **Sí:** 16 carriles fijos en todas las formas. El original varía el número de segmentos según la pantalla; fijarlo en 16 mantiene una sola lógica de vecindad, wrap y colisión, y no cambia la sensación de juego.
- **Sí:** movimiento discreto de carril con repetición a 90 ms, en vez de emular el spinner analógico del original. El criterio 5 de la plataforma exige teclado; un eje analógico simulado con teclas se siente peor que un salto limpio de carril, y la colisión por carril entero se vuelve exacta en vez de aproximada.
- **No:** control por rueda del ratón o por movimiento horizontal del puntero como sustituto del spinner. Rompería la coherencia con el resto del catálogo (todo teclado) y dejaría el juego inusable en el D-pad táctil que `mobile-porter` agregará después.
- **Sí:** los cinco enemigos canónicos con sus valores originales (Espigador 50, Tanque 100, Tumbador 150, Pulsar 200, Fusible 250). Verificados en las fuentes consultadas (ver abajo), no inventados. Recortar la lista dejaría un Tempest irreconocible: cada enemigo obliga a una respuesta distinta del jugador.
- **Sí:** Fusible con valor fijo de 250 puntos. En el original su valor varía entre 250 y 750 según la situación; se fija en 250 para que el leaderboard sea comparable y para no introducir una regla difícil de comunicar al jugador sin manual.
- **Sí:** Superzapper con dos cargas por nivel, la primera sin puntos y la segunda contra un solo enemigo al azar. Es la regla del original y evita que el barrido se use para farmear puntaje.
- **Sí:** seis formas de vórtice cicladas en vez de las 16 del original y de sus 99 pantallas. Seis alcanzan para que cada nivel se sienta distinto (dos de ellas abiertas, que cambian de verdad la estrategia) y mantienen `shapes.ts` legible. Ampliar el set más adelante es agregar entradas a un arreglo, sin tocar el motor.
- **Sí:** espigas que solo matan durante el descenso final, tal como el original. Es lo que le da sentido a disparar hacia el fondo cuando ya no quedan enemigos y evita que el jugador ignore a los Espigadores.
- **Sí:** eliminar los enemigos con `t ≥ 0.85` al morir el jugador y darle 1.5 s de invulnerabilidad. Sin esta regla, morir con tres Tumbadores en el borde encadena varias muertes seguidas y la partida termina antes de los 2 minutos.
- **Sí:** vida extra cada 20 000 puntos con techo de 5 acumuladas, siguiendo el ajuste habitual del arcade original (una vida gratis cada 20 000). El techo evita que una partida excepcional se estire más allá de los 5 minutos y rompa el criterio 2.
- **Sí:** `cat: 'SHOOTER'` y `color: 'magenta'`. El `check` de `001_games_and_scores.sql` solo admite cuatro categorías y cuatro colores, y los cuatro colores ya están en uso, así que "diversificar" es elegir bien: SHOOTER es la categoría honesta y además la menos poblada (solo Asteroides), y `magenta` evita confundirlo visualmente con Asteroides (`cyan`) y no choca con el `yellow` del spec `02`.
- **Sí:** cover `.cover-vortice` nueva, diseñada con `/frontend-design`. Ninguna de las clases libres (`cover-glot`, `cover-invaders`, `cover-duelo`, `cover-bg`) representa un tubo en perspectiva; usarlas sería un placeholder disfrazado.
- **No:** skins `clasico`/`retro`/`neon` dentro de este spec. El motor ya rota su paleta por nivel; los tres skins canónicos son trabajo del agente `skin-designer`, que tiene su propio flujo y memoria (`references/game-with-theme.md`).
- **No:** tecla de pausa dentro del motor. Misma decisión que en Tetris, Snake y Frogger: la pausa es responsabilidad del botón "PAUSA" de React, y dos mecanismos quedarían fuera de sincronía.
- **Sin fuente local:** `references/started-games/` solo tiene `02-asteroids`, `03-tetris` y `04-arkanoid`, y `references/assest-source/` solo tiene assets de Snake y Frogger. No hay código ni arte previo de Tempest en el repositorio, así que las reglas se verificaron por investigación web y el juego se dibuja íntegramente por código.
- **Fuentes consultadas sobre el original** (solo para verificar reglas y balance, sin copiar código de terceros):
  - `https://strategywiki.org/wiki/Tempest/Gameplay` (vía resultados de búsqueda; el fetch directo quedó bloqueado por el proxy de egreso) — comportamiento de Flippers, Tankers, Spikers, Fuseballs y Pulsars; regla del Superzapper (primer uso barre todo, segundo uso mata uno al azar); fin de nivel al descender por el tubo.
  - `https://shmup.fandom.com/wiki/Tempest` y `https://www.arcade-history.com/?n=tempest-upright-model&page=detail&id=2865` (vía resultados de búsqueda) — tabla de puntaje: Spiker 50, Tanker 100, Flipper 150, Pulsar 200, Fuseball 250–750.
  - `https://en.wikipedia.org/wiki/Tempest_(video_game)` y `https://www.mobygames.com/game/23846/tempest/` (vía resultados de búsqueda) — 99 niveles construidos sobre 16 formas de web, tubos cerrados frente a campos abiertos con extremos, control por spinner, autoría de Dave Theurer.
  - `https://forums.arcade-museum.com/threads/tempest-cheat.40523/` (vía resultados de búsqueda) — ajuste de operador habitual: tres naves y una vida extra cada 20 000 puntos; las espigas se pueden disparar y valen muy poco (ajustan los últimos dígitos del puntaje).

## Riesgos identificados

| Riesgo                                                                                                                                                                                              | Mitigación                                                                                                                                                                                                                              |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fuga del `requestAnimationFrame` y de los listeners de teclado si `VorticeNeonEngine.destroy()` no los limpia al desmontar o navegar fuera de `/jugar/vortice-neon`.                                | Cubierto en el paso 11 del plan y en los criterios de aceptación; `destroy()` cancela el rAF y remueve los listeners registrados en `start()`.                                                                                          |
| `dt` gigante al reanudar de una pausa larga si `pause()` no detiene el reloj interno y `resume()` no lo resetea: los enemigos saltarían media profundidad de golpe y los ciclos de Pulsar/Fusible se desincronizarían. | Al pausar se detiene el bucle por completo (incluidos los relojes de ciclo `phaseMs`); al reanudar se resetea `lastTime` como si fuera el primer frame — mismo patrón ya validado en los cinco motores existentes.                       |
| Estado global de módulo que sobrevive al HMR de Next.js si el motor no encapsula todo en la instancia.                                                                                              | `shapes.ts` es un módulo puro de constantes y funciones sin estado; todo lo mutable (jugador, enemigos, disparos, espigas, score, vidas, nivel, cargas) vive en propiedades de `VorticeNeonEngine`.                                     |
| Overlay de "GAME OVER"/"PAUSA" duplicado entre el canvas y React.                                                                                                                                   | El motor nunca dibuja esos textos; solo invoca `onGameOver(finalScore)` y React muestra el modal y el overlay de pausa.                                                                                                                 |
| **Colisión ambigua en profundidad.** Con una tolerancia `|Δt| ≤ 0.04` fija, un disparo a 2.2 t/s recorre 0.037 de `t` por frame a 60 Hz: en un frame lento podría atravesar un enemigo sin tocarlo. | La comprobación de impacto se hace por **intervalo recorrido** (`t_anterior → t_actual`) y no por posición puntual, de modo que ningún disparo puede "saltar" por encima de un enemigo aunque el frame sea largo.                       |
| **Legibilidad del fondo del tubo.** Cerca del punto de fuga todos los carriles se amontonan y varios enemigos con `t` bajo se dibujan casi encima, volviendo ilegible qué sube por dónde.           | `r(t)` usa exponente 1.6 (no lineal) para separar mejor la zona cercana, se dibujan dos anillos guía en `t = 0.35` y `t = 0.70`, y los enemigos tienen color propio por tipo además de forma propia.                                    |
| **Sensación de injusticia al morir en el borde.** Tumbadores y Fusibles que llegan al anillo pueden encadenar muertes instantáneas, sobre todo en formas abiertas donde no hay escape lateral.      | Al morir se eliminan los enemigos con `t ≥ 0.85` y el respawn tiene 1.5 s de invulnerabilidad; el criterio de duración (2–4 min) sirve de prueba de que el balance no es frustrante.                                                    |
| **Balance del Pulsar.** Una fase electrificada demasiado larga vuelve carriles enteros intransitables y el jugador muere sin haber podido reaccionar.                                                | Ciclo fijo de 1.6 s con solo 0.6 s de electrificación y aviso visual durante la carga; el Pulsar recién aparece a partir del nivel 8, cuando el jugador ya domina el movimiento por el borde.                                           |
| **Fusible invulnerable e inalcanzable.** Si el zigzag lo deja demasiado tiempo sobre la frontera entre carriles, el jugador no puede eliminarlo y el nivel se estanca esperando a que el presupuesto se agote. | El zigzag alterna en ciclos fijos de 0.40 s (mitad del tiempo centrado, o sea vulnerable) y el Fusible desaparece solo a los 4 s de llegar al borde, así que ningún nivel puede quedar bloqueado por él.                                |
| **Formas abiertas con extremos.** En `linea` y `uve` la lógica de vecindad (volteo de Tumbadores, división de Tanques, wrap del jugador) puede indexar fuera de rango.                              | La vecindad se resuelve en una única función `neighborLane(lane, dir, shape)` que respeta `shape.closed`; los Tanques que se dividirían fuera de rango generan el Tumbador en su propio carril.                                         |
| **Costo por frame del trazado vectorial.** Dibujar el tubo completo con `shadowBlur` en cada frame (16 costillas + 4 polígonos + entidades) puede degradar el rendimiento.                          | El vórtice es estático dentro de un nivel: se hornea una vez por nivel en un canvas offscreen y se blitea cada frame, siguiendo el catálogo de `specs/12-optimizacion-performance-frogger.md`. Solo las entidades se redibujan.        |
| **Canvas de 800×600 en pantallas angostas.** Puede quedar ajustado dentro de `.crt-screen` en viewports pequeños.                                                                                   | No se resuelve en este spec (layout móvil está fuera de alcance); el agente `mobile-porter` lo revisa después, igual que con los demás juegos de 800×600 ya implementados.                                                              |

## Lo que no está en este spec

- Mutaciones del vórtice, power-ups y modificadores temporales (eso es `02-vortice-neon-mutante-game.md`, un juego aparte).
- Control rotatorio analógico (spinner) y soporte de ratón.
- Las 99 pantallas y las 16 formas del original, y el "warp" para empezar en un nivel avanzado.
- Valor variable del Fusible (250–750) y demás ajustes de operador del arcade original.
- Audio y efectos de sonido.
- Assets de imagen en `public/games/vortice-neon/`.
- Skins `clasico`/`retro`/`neon` (trabajo del agente `skin-designer`).
- Controles táctiles/móviles (trabajo del agente `mobile-porter`).
- Multijugador y progresión persistente entre partidas.
- Realtime, paginación del leaderboard y autenticación real.
- Tests automatizados.
- Tema claro/oscuro propio del juego.
- Cambios a `GameDetail.tsx` o a la ruta `/juego/[id]` más allá de la nueva entrada navegable.

Cada uno de estos, si se necesita, va en su propio spec futuro.
