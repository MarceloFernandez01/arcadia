# SPEC GJ-vortice-neon-02 — Juego Vórtice Mutante (Tempest con geometría alterada)

> **Estado:** Draft
> **Depende de:** SPEC 05 (asteroids-game), SPEC 06 (leaderboard-supabase), SPEC 07 (tetris-game)
> **Fecha:** 2026-08-14
> **Objetivo:** Implementar una variante de Tempest bajo el id `vortice-neon-mutante`, con el mismo bucle de tubo, 16 carriles y cinco enemigos canónicos, más una mecánica añadida de **mutaciones del vórtice** (carriles sellados, rotación del anillo, estrechamiento y apertura/cierre del circuito) que alteran la geometría en vivo cada pocos segundos, dado de alta en `lib/games/registry.ts` y en Supabase para que aparezca en el Salón de la Fama.

> **Nota de numeración:** el identificador `GJ-vortice-neon-02` es local a esta game jam (`specs/game-jam/vortice-neon/`) y **no consume** la numeración correlativa global de `specs/` (que hoy llega hasta `12-optimizacion-performance-frogger.md`). Este spec **no depende** de `01-vortice-neon-game.md`: es autocontenido, describe el juego completo (base + mutaciones) y se puede implementar antes, después o en lugar del otro.

## Por qué este spec existe

El juego base recibido para esta game jam es **Tempest** (Atari, 1981, diseño de Dave Theurer), fichado por el agente `game-planner` con el nombre de catálogo "Vórtice Neón" (`references/game-suggestions-todo.md`). Este archivo es la **versión modificada**: reproduce el mismo bucle arcade y le agrega una mecánica propia, las **mutaciones del vórtice**.

**En qué consiste la modificación:** cada pocos segundos el vórtice deja de ser una geometría estable. Con 1.5 s de aviso, muta durante unos segundos y luego vuelve a su forma base. Hay cuatro mutaciones: **SELLADO** (tres carriles quedan clausurados), **ROTACIÓN** (el contenido del tubo gira bajo los pies del jugador), **ESTRECHAMIENTO** (el tubo se contrae y todo sube más rápido) y **APERTURA/CIERRE** (un tubo cerrado se corta y pierde el wrap, o un campo abierto se cierra y lo gana). Mientras una mutación está activa, cada enemigo destruido vale **el doble**, y sobrevivir a la mutación completa sin perder una vida paga un bonus. El resultado es un juego con un ritmo distinto al del Tempest clásico: la tensión no viene solo de lo que sube por el tubo, sino de que el propio tubo deja de ser confiable.

La versión base sin mutaciones vive en `01-vortice-neon-game.md` y es **un juego distinto del catálogo**, con su propio id, color, portada y fila en `games`.

**Por qué esta modificación y no otra** (el prompt de invocación no indicó ninguna): Tempest es, entre todos los clásicos, el que define su identidad por la geometría del campo de juego — su propio original ya cambia de forma cada pantalla. Modificar esa geometría *durante* la partida es la única alteración que se siente como una evolución natural del juego y no como un injerto. Además evita repetir la familia de modificación que ya usó la game jam anterior (`specs/game-jam/frogger/02-frogger-poderes-game.md`, power-ups temporales), y no exige assets nuevos ni entidades nuevas: reusa la misma capa de proyección y la misma lista de enemigos.

**Encaje con los criterios de la plataforma:**

1. **Score acumulable** — puntaje numérico único: 50/100/150/200/250 por enemigo (×2 durante una mutación), 1 punto por impacto sobre una espiga, `250 × min(nivel, 12)` por nivel completado y `150 × min(nivel, 12)` por cada mutación sobrevivida sin perder vida.
2. **Un jugador, partidas cortas** — 3 vidas, sin continuaciones; una partida promedio dura entre 2 y 4 minutos. Sin multijugador, sin progreso persistente entre partidas.
3. **Motor viable en Canvas 2D + rAF** — dos escalares por entidad (carril y profundidad `t ∈ [0,1]`) y una proyección radial desde un punto de fuga. Las mutaciones no agregan física: son cambios de parámetros de esa misma proyección y de las reglas de vecindad entre carriles.
4. **Compatible con `ArcadeGameEngine`** — `start/pause/resume/restart/destroy`, HUD vía `stats[{key,label,value}]`, `onGameOver(finalScore)`; el motor **no dibuja overlays** de "GAME OVER" ni de "PAUSA". El rótulo de mutación que sí dibuja es estado de juego (como la barra de tiempo de Frogger), no un overlay de control.
5. **Control por teclado** — `←`/`→` (y `A`/`D`) para recorrer el borde, `Espacio` para disparar, `Z` para el Superzapper.
6. **Assets** — todo dibujado por código con trazos vectoriales neón. Sin spritesheets nuevos, por lo tanto **sin carpeta `public/games/vortice-neon-mutante/`**.
7. **Hueco de catálogo** — `references/implemented-games.md` tiene `asteroides` (SHOOTER/cyan), `tetris` (PUZZLE/magenta), `arkanoid` (ARCADE/green), `snake` (ARCADE/yellow), más `frogger` (ARCADE/green) de la game jam anterior. ARCADE está saturado (3 juegos) y SHOOTER tiene uno solo: `SHOOTER` es a la vez la categoría honesta y la que diversifica. El color se fija en `yellow` para no repetir el `cyan` de Asteroides ni el `magenta` que usa el spec `01`.
8. **Estética retro/neón** — trazos vectoriales sobre fondo casi negro, con la paleta de `app/globals.css` rotando por nivel; los carriles sellados y el corte de apertura se marcan con trama y parpadeo, sin salir de la paleta.

## Alcance

**Incluye:**

- Motor de Vórtice Mutante en `lib/games/vortice-neon-mutante/engine.ts`, implementando `ArcadeGameEngine` (interfaz existente en `lib/games/types.ts`, sin cambios).
- `lib/games/vortice-neon-mutante/shapes.ts` con las seis formas de vórtice (vértices normalizados y bandera de cerrado/abierto), la paleta por nivel y las funciones puras de la curva de dificultad.
- `lib/games/vortice-neon-mutante/mutations.ts` con la definición declarativa de las cuatro mutaciones (id, etiqueta para el HUD, condiciones de elegibilidad y parámetros de balance) y las funciones de temporización por nivel.
- Canvas de **800×600**, con el vórtice proyectado desde un punto de fuga fijo y 16 carriles en todas las formas.
- Jugador ("garra") que se desplaza de carril en carril por el borde exterior, con wrap en formas cerradas y tope en abiertas.
- Los cinco enemigos canónicos: **Tumbador**, **Tanque**, **Espigador**, **Fusible** y **Pulsar**, con sus comportamientos y valores de puntaje.
- Espigas, disparos enemigos, Superzapper de dos cargas por nivel y fase de descenso al completar un nivel.
- **Mecánica añadida:** ciclo de mutaciones del vórtice con aviso previo, duración acotada, multiplicador ×2 de puntaje mientras están activas y bonus por sobrevivirlas.
- Curva de dificultad por nivel, tanto en enemigos (más cantidad, spawn más rápido, velocidad escalada) como en mutaciones (más frecuentes y más largas).
- Vidas: 3 iniciales, una extra cada 20 000 puntos con techo de 5 acumuladas.
- Stats de HUD expuestas vía el estado flexible del registry: `lives`, `level`, `zaps`, `mut`; el `score` lo muestra el `player-hud` aparte. Se notifican solo cuando cambian.
- Al perder la última vida, el motor invoca `onGameOver(finalScore)` una sola vez y detiene el loop, **sin overlay interno de "GAME OVER" ni de "PAUSA"** — React controla la pausa desde el botón "PAUSA" del `player-hud` y el modal de fin de partida ya existente.
- Alta de `vortice-neon-mutante` en la tabla `games` de Supabase (migración de seed nueva; ver Modelo de datos), `cat: 'SHOOTER'`, `color: 'yellow'`, cover `.cover-vortice-mutante` **nueva**, diseñada invocando `/frontend-design` (ver paso 1 del plan).
- Registro de la entrada `vortice-neon-mutante` en `lib/games/registry.ts` (`width: 800`, `height: 600`).

**Fuera de alcance (para specs futuros):**

- Sin multijugador y sin progresión persistente entre partidas (no se guardan mutaciones desbloqueadas ni nivel alcanzado).
- Sin audio ni efectos de sonido.
- Sin control rotatorio analógico (spinner) ni soporte de ratón: el movimiento por el borde es discreto por carril.
- Sin power-ups recogibles ni armas alternativas: la única mecánica añadida son las mutaciones de geometría.
- Sin mutaciones elegibles por el jugador ni votación entre ellas: el sorteo es del motor.
- Sin las 99 pantallas ni las 16 formas del original: seis formas que se ciclan.
- Sin controles táctiles/móviles en este spec (el sistema genérico `touchControls` del registry existe y el agente `mobile-porter` puede agregarlos después sin tocar el motor).
- Sin assets de imagen: nada en `public/games/vortice-neon-mutante/`.
- Sin skins `clasico`/`retro`/`neon` en este spec: el motor se entrega con una sola paleta (que ya rota por nivel). El agente `skin-designer` los agrega después.
- Sin reutilizar ni importar código de `lib/games/vortice-neon/` (spec `01`): este juego es autónomo y no asume que el otro exista.
- Heredado de SPEC 05/06: sin Realtime (el leaderboard se actualiza al navegar/recargar), sin paginación del leaderboard (top fijo de `getTopScores`), sin autenticación real (`user_id: null` en `scores`), sin tests automatizados, sin tema claro/oscuro propio del juego, sin cambios a `GameDetail.tsx` ni a la ruta `/juego/[id]` más allá de la nueva entrada navegable.

## Reglas del juego

### Geometría del vórtice y proyección

El vórtice se define como un polígono de **16 carriles** dibujado dos veces: el **borde exterior** (donde vive el jugador) y el **fondo** (extremo lejano, cerca del punto de fuga). No hay cámara 3D ni matrices: la profundidad es un escalar y la proyección, una interpolación radial.

- Centro/punto de fuga fijo en `C = (400, 285)` sobre el canvas de 800×600.
- Cada forma es una lista de vértices normalizados `V_i` (radio 1 = `RIM_RADIUS = 250 px`). Con 16 carriles: 16 vértices en formas cerradas, 17 en abiertas.
- El **carril `i`** es el sector entre `V_i` y `V_{i+1}`; su eje pasa por el punto medio `M_i = (V_i + V_{i+1}) / 2`.
- Profundidad `t ∈ [0, 1]`: `t = 0` es el fondo (donde nacen los enemigos), `t = 1` es el borde exterior (donde vive el jugador).
- Factor radial: `r(t) = 0.12 + 0.88 · t^1.6`.
- Posición en pantalla: `P(i, t) = C + (M_i − C) · r(t) · rimScale`, donde `rimScale` vale 1 salvo durante la mutación ESTRECHAMIENTO.
- Escala de dibujo por profundidad: `size(t) = 0.25 + 0.75 · t`; grosor de trazo `1 + 1.5 · t` px.
- Render del tubo: polígono del borde, polígono del fondo, una "costilla" por vértice uniendo ambos y dos anillos intermedios en `t = 0.35` y `t = 0.70`. Fondo del canvas `#05050f`.

### Formas del vórtice

Seis formas, todas de 16 carriles, cicladas por nivel: `SHAPES[(nivel − 1) % 6]`.

| Índice | Nombre     | Cerrada | Descripción                                                       |
| ------ | ---------- | ------- | ----------------------------------------------------------------- |
| 0      | `circulo`  | Sí      | 16 vértices sobre una circunferencia de radio 1.                   |
| 1      | `cuadrado` | Sí      | Cuadrado con 4 vértices por lado.                                  |
| 2      | `cruz`     | Sí      | Cruz de 12 esquinas, subdividida hasta 16 vértices.                |
| 3      | `estrella` | Sí      | 8 puntas, radios alternados 1.0 / 0.55.                            |
| 4      | `linea`    | No      | 17 vértices sobre una recta horizontal (campo abierto, sin wrap).  |
| 5      | `uve`      | No      | 17 vértices formando una V abierta.                                |

En formas **cerradas** el jugador da la vuelta completa (carril 15 → carril 0); en **abiertas**, los carriles 0 y 15 son topes. La paleta rota por nivel entre `--cyan`, `--magenta`, `--yellow` y `--green` (`LEVEL_COLORS[(nivel − 1) % 4]`).

### Bucle, jugador y disparos

- El loop usa `requestAnimationFrame` con delta time real (`performance.now()`); todas las velocidades se expresan en unidades de profundidad por segundo o en segundos, nunca "por frame".
- El jugador ocupa un carril entero (`playerLane`), dibujado como una garra de tres puntas apoyada en el borde. Cada pulsación de `←`/`→` mueve un carril; mantener la tecla repite cada **90 ms**.
- Disparo del jugador: nace en `t = 1` en su carril y baja a **2.2 t/s**. Máximo **6 disparos en vuelo**, cadencia mínima **0.12 s**.
- Un disparo impacta si comparte carril con el enemigo y el intervalo recorrido en el frame cruza su profundidad (tolerancia equivalente a `|Δt| ≤ 0.04`).
- Un disparo que llega a `t ≤ 0` se destruye; si en el camino atraviesa una espiga de su carril, la impacta en vez de seguir.
- Los disparos del jugador también destruyen disparos enemigos (0 puntos).

### Enemigos

Todos avanzan desde `t = 0` hacia el borde: `t += velocidad · multiplicadorNivel · multiplicadorMutación · dt`.

| Enemigo    | Puntos | Velocidad base | Comportamiento                                                                                                                                                                                                                                        |
| ---------- | ------ | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Espigador  | 50     | 0.35 /s        | Sube hasta un tope sorteado en `[0.45, 0.80]` dejando una **espiga** en su carril hasta su `t` máximo; al llegar vuelve a `t = 0` y repite. No dispara y no mata por contacto.                                                                          |
| Tanque     | 100    | 0.22 /s        | No dispara. Al ser destruido, o al alcanzar `t ≥ 0.95`, se parte en **2 Tumbadores** en los carriles `i − 1` e `i + 1` (o en `i` si el vecino no existe), heredando su `t`.                                                                             |
| Tumbador   | 150    | 0.30 /s        | Al llegar a `t ≥ 0.95` entra en modo borde: cada **0.55 s** se voltea a un carril vecino (dirección sorteada, se invierte al topar un extremo). Mata al jugador si comparten carril con `t ≥ 0.90`. Dispara desde `t ≥ 0.40` cada 1.8–3.2 s.            |
| Pulsar     | 200    | 0.24 /s        | Ciclo de **1.6 s**: 1.0 s inactivo, 0.6 s electrificado (su carril brilla de extremo a extremo). Mata al jugador si comparten carril durante la fase electrificada. Dispara desde `t ≥ 0.50` cada 2.5 s.                                                |
| Fusible    | 250    | 0.26 /s        | Alterna cada **0.40 s** entre estar centrado en un carril y estar sobre la frontera con el vecino; **solo es vulnerable mientras está centrado**. Al llegar al borde recorre el anillo a 1 carril cada 0.35 s durante 4 s y luego desaparece; mata al contacto. |

- **Disparos enemigos:** suben hacia el borde a **0.75 t/s** por su carril; matan al jugador al llegar a `t ≥ 0.97` en el carril de este.
- **Espigas:** una por carril como máximo, con altura `spikeTop ∈ [0, 0.8]`. Cada impacto la acorta **0.08** y suma **1 punto**. Solo matan durante el descenso final del nivel.

### Mutaciones del vórtice (mecánica añadida)

El vórtice muta durante la partida. Cada mutación tiene tres fases: **aviso** (1.5 s), **activa** y **retorno** (0.6 s de transición visual de vuelta a la forma base).

**Temporización**

- La primera mutación de cada nivel arranca a los **10 s** de comenzado el nivel.
- Las siguientes arrancan `intervalo = max(14 − 0.6 · (nivel − 1), 8)` segundos después del final de la anterior.
- Duración activa: `duración = min(9 + 0.5 · (nivel − 1), 14)` segundos.
- El sorteo elige entre las cuatro mutaciones **sin repetir la inmediatamente anterior**. Si la sorteada no es elegible para la forma actual, se sustituye por ESTRECHAMIENTO (siempre elegible).
- Durante la fase de descenso de fin de nivel no se dispara ninguna mutación; el reloj de mutaciones se reinicia al empezar el nivel siguiente.
- Si una mutación sigue activa cuando termina el último enemigo del nivel, se cierra de inmediato (con su bonus, si corresponde) antes de iniciar el descenso.

**Las cuatro mutaciones**

| Id              | Etiqueta del HUD | Elegible en          | Efecto                                                                                                                                                                                                                                                                                                                     |
| --------------- | ---------------- | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sellado`       | `SELLADO`        | Todas las formas     | **3 carriles no contiguos** sorteados quedan clausurados: el jugador no puede detenerse en ellos (los salta al moverse), sus disparos no entran, los Pulsares no pueden electrificarlos y los enemigos que suban por ellos se desvían al carril libre más cercano al alcanzar `t = 0.5`. Si al empezar el jugador está en uno, se lo empuja al carril libre más cercano en la dirección de su último movimiento. |
| `rotacion`      | `ROTACIÓN`       | Solo formas cerradas | El **contenido** del tubo rota **1 carril cada 0.55 s** en una dirección sorteada: enemigos, disparos enemigos y espigas cambian de carril. El jugador y sus propios disparos **no** rotan: el mundo se mueve bajo él.                                                                                                       |
| `estrechamiento`| `ESTRECHAMIENTO` | Todas las formas     | `rimScale` baja de `1.00` a `0.70` con una transición de 0.6 s (el tubo entero se contrae hacia el punto de fuga) y el `multiplicadorMutación` de velocidad de los enemigos pasa a **1.20**. Al terminar, vuelve con la misma transición.                                                                                     |
| `apertura`      | `APERTURA` / `CIERRE` | Todas las formas | En formas **cerradas**: se corta la unión entre el carril 15 y el 0; el jugador pierde el wrap y los Tumbadores invierten su volteo en esos extremos (etiqueta `APERTURA`). En formas **abiertas**: ocurre lo inverso, el circuito se cierra y gana wrap (etiqueta `CIERRE`). El corte o la unión se dibujan con una costilla parpadeante. |

**Puntaje y riesgo**

- Mientras hay una mutación **activa** (no durante el aviso ni el retorno), cada enemigo destruido vale **×2** su puntaje base. El multiplicador no se aplica a los impactos sobre espigas ni al bonus de nivel.
- Terminar una mutación **sin haber perdido una vida durante ella** suma `150 × min(nivel, 12)` puntos ("mutación superada").
- Perder una vida durante una mutación no la interrumpe y anula su bonus de supervivencia.
- El Superzapper **no** cancela ni acorta una mutación (decisión documentada abajo).

**Aviso visual**

- Durante los 1.5 s de aviso, los elementos que van a cambiar parpadean a 6 Hz (los tres carriles a sellar, la costilla del corte, o el borde completo en ROTACIÓN y ESTRECHAMIENTO) y una etiqueta corta con el nombre de la mutación aparece bajo el vórtice, en el color del nivel. La etiqueta se mantiene atenuada mientras la mutación está activa. Es estado de juego dibujado en el canvas, no un overlay de control: el motor sigue sin dibujar "GAME OVER" ni "PAUSA".

### Superzapper

- Dos cargas por nivel, repuestas al iniciar cada nivel. Tecla `Z`.
- **Primera carga:** destruye todos los enemigos vivos, **sin sumar puntos** (ni siquiera con mutación activa). Destello blanco de 0.25 s.
- **Segunda carga:** destruye un enemigo vivo al azar y **sí** suma su puntaje (×2 si hay mutación activa).
- Pulsar `Z` sin cargas no hace nada. No afecta a espigas, disparos enemigos ni mutaciones.

### Nivel, descenso y curva de dificultad

- Presupuesto de enemigos por nivel: `enemigosTotal = min(7 + 2 · (nivel − 1), 28)` — un enemigo menos que en la versión base, para compensar la presión extra de las mutaciones.
- Los enemigos aparecen de a uno en un carril al azar con `t = 0`, cada `spawnInterval = max(1.6 − 0.08 · (nivel − 1), 0.45)` segundos, con un tope de **7 enemigos vivos simultáneos**. Un carril sellado nunca se elige como carril de spawn.
- Tipos habilitados por nivel: niveles 1–2 solo Tumbadores; desde el 3 se suman Tanques; desde el 4, Espigadores; desde el 6, Fusibles; desde el 8, Pulsares. Pesos entre los habilitados: `Tumbador 40 %, Tanque 20 %, Espigador 15 %, Fusible 12 %, Pulsar 13 %`, renormalizados.
- Multiplicador de velocidad por nivel: `min(1 + 0.08 · (nivel − 1), 2.2)`.
- **Fin de nivel:** agotado el presupuesto y sin enemigos vivos, comienza la **fase de descenso** de 2 600 ms; el jugador puede seguir moviéndose y disparando espigas. Si al terminar el descenso su carril conserva una espiga con `spikeTop ≥ 0.35`, pierde una vida (pero igual pasa de nivel).
- Al terminar el descenso se suma el **bonus de nivel**: `250 × min(nivel, 12)`; luego se arma el nivel siguiente (forma, color, presupuesto, cargas de Superzapper y reloj de mutaciones reiniciado).

### Muerte, vidas y fin de partida

- El jugador muere por: contacto con Tumbador o Fusible en el borde, carril electrificado por un Pulsar, disparo enemigo en el borde, o empalamiento en una espiga al final del descenso.
- Al morir: explosión de 1.2 s, se eliminan los enemigos con `t ≥ 0.85` y el jugador reaparece en el mismo carril (o en el libre más cercano si el suyo quedó sellado) con **1.5 s de invulnerabilidad** parpadeante. Espigas, progreso de spawn y la mutación en curso **se conservan**.
- Vidas: 3 iniciales, una extra cada **20 000 puntos**, con techo de **5 acumuladas**.
- Al perder la última vida: `onGameOver(finalScore)` una sola vez y el loop se detiene.

### Controles

- `←` / `→` y `A` / `D`: mover un carril por el borde (repetición cada 90 ms; los carriles sellados se saltan).
- `Espacio`: disparar (cadencia mínima 0.12 s).
- `Z`: Superzapper.
- Ninguna otra tecla tiene efecto: no hay tecla de pausa ni de reinicio (los controla React).
- `preventDefault()` en flechas y `Espacio` para que la página no haga scroll durante la partida.

### HUD y estética

- Stats: `lives` ("Vidas", `♥ ♥ ♥`), `level` ("Nivel", `01`), `zaps` ("Zapper", `2`), `mut` ("Mutación", `—` cuando no hay ninguna, o `SELLADO` / `ROTACIÓN` / `ESTRECHAMIENTO` / `APERTURA` / `CIERRE`). El `score` lo muestra el `player-hud` aparte.
- Todo se dibuja con trazos de 1–3 px y `shadowBlur` moderado; nada de rellenos sólidos salvo el destello del Superzapper.
- Color del vórtice por nivel (`LEVEL_COLORS`); enemigos con color propio: Tumbador `--magenta`, Tanque `--yellow`, Espigador `--green`, Pulsar `--cyan`, Fusible blanco con núcleo `--magenta`.
- Carriles sellados: trama diagonal en `--magenta` al 40 % de opacidad sobre toda su longitud. Corte de APERTURA: costilla doble parpadeante. Durante ESTRECHAMIENTO, el borde exterior se dibuja además con una circunferencia guía tenue en su tamaño original, para que el jugador perciba la contracción.
- El jugador se dibuja siempre en `--yellow` con brillo; durante la invulnerabilidad parpadea a 8 Hz.

## Modelo de datos

Reutiliza sin cambios `ArcadeGameEngine`, `ArcadeGameEngineOptions`, `EngineState`, `EngineHudStat` de `lib/games/types.ts` y `GameRegistryEntry` de `lib/games/registry.ts` (ya existentes, sin modificaciones).

```ts
// lib/games/vortice-neon-mutante/shapes.ts
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
export const levelEnemyBudget: (level: number) => number; // min(7 + 2*(level-1), 28)
export const levelSpawnInterval: (level: number) => number; // max(1.6 - 0.08*(level-1), 0.45) s
```

```ts
// lib/games/vortice-neon-mutante/mutations.ts
export type MutationId = "sellado" | "rotacion" | "estrechamiento" | "apertura";

export interface MutationDef {
  id: MutationId;
  label: string; // etiqueta base del HUD ("APERTURA" se muestra como "CIERRE" en formas abiertas)
  requiresClosed: boolean; // rotacion = true; el resto = false
}

export const MUTATIONS: MutationDef[];
export const FIRST_MUTATION_DELAY_MS = 10000;
export const MUTATION_WARN_MS = 1500;
export const MUTATION_RETURN_MS = 600;
export const SEALED_LANES = 3;
export const ROTATION_STEP_MS = 550;
export const NARROW_RIM_SCALE = 0.7;
export const NARROW_SPEED_MULT = 1.2;
export const mutationGapMs: (level: number) => number; // max(14 - 0.6*(level-1), 8) * 1000
export const mutationDurationMs: (level: number) => number; // min(9 + 0.5*(level-1), 14) * 1000
export const mutationSurvivalBonus: (level: number) => number; // 150 * min(level, 12)
```

```ts
// lib/games/vortice-neon-mutante/engine.ts
type EnemyKind = "tumbador" | "tanque" | "espigador" | "fusible" | "pulsar";
type MutationPhase = "idle" | "warn" | "active" | "returning";

interface Enemy {
  kind: EnemyKind;
  lane: number;
  laneOffset: number; // 0 = centrado; 0.5 = sobre la frontera (solo Fusible)
  depth: number; // t ∈ [0,1]
  phaseMs: number; // reloj del ciclo propio (volteo, pulso, zigzag)
  fireCooldownMs: number;
  peakDepth?: number; // solo Espigador
}

interface MutationState {
  phase: MutationPhase;
  id: MutationId | null;
  elapsedMs: number;
  sealedLanes: number[]; // solo "sellado"
  rotationDir: 1 | -1; // solo "rotacion"
  livesLostDuring: number; // decide el bonus de supervivencia
}

export class VorticeMutanteEngine implements ArcadeGameEngine {
  constructor(canvas: HTMLCanvasElement, options: ArcadeGameEngineOptions);
  start(): void;
  pause(): void;
  resume(): void;
  restart(): void;
  destroy(): void;
}
```

```ts
// lib/games/vortice-neon-mutante/engine.ts — constantes de balance (valores del spec)
const ENEMY_POINTS = { espigador: 50, tanque: 100, tumbador: 150, pulsar: 200, fusible: 250 };
const MUTATION_SCORE_MULT = 2;
const PLAYER_SHOT_SPEED = 2.2; // t/s
const ENEMY_SHOT_SPEED = 0.75; // t/s
const MAX_PLAYER_SHOTS = 6;
const FIRE_COOLDOWN_MS = 120;
const MOVE_REPEAT_MS = 90;
const MAX_ALIVE_ENEMIES = 7;
const DESCENT_MS = 2600;
const SPIKE_HIT_STEP = 0.08;
const SPIKE_KILL_DEPTH = 0.35;
const RESPAWN_INVULN_MS = 1500;
const EXTRA_LIFE_EVERY = 20000;
const MAX_LIVES = 5;
```

```ts
// lib/games/registry.ts (nueva entrada, sin tocar las existentes)
"vortice-neon-mutante": {
  width: 800,
  height: 600,
  initialState: {
    score: 0,
    stats: [
      { key: "lives", label: "Vidas", value: "♥ ♥ ♥" },
      { key: "level", label: "Nivel", value: "01" },
      { key: "zaps", label: "Zapper", value: "2" },
      { key: "mut", label: "Mutación", value: "—" },
    ],
  },
  create(canvas, options) {
    return new VorticeMutanteEngine(canvas, options);
  },
},
```

- `games` en Supabase gana una fila más (`vortice-neon-mutante`), usando el esquema ya existente de `001_games_and_scores.sql` (sin cambios de columnas ni de políticas RLS). El archivo va en `supabase/migrations/NNN_seed_vortice_neon_mutante.sql`, donde `NNN` es **el siguiente número disponible al momento de implementar** (hoy `006`, porque existen `001`–`005`); los dos specs de esta game jam compiten por el mismo hueco de numeración, así que el número se confirma al implementar, no antes.

```sql
-- supabase/migrations/NNN_seed_vortice_neon_mutante.sql  (NNN = siguiente disponible)
insert into games (id, title, short, long, cat, cover, color, best_seed, plays_seed)
values (
  'vortice-neon-mutante',
  'VÓRTICE MUTANTE',
  'El tubo se deforma mientras defiendes el borde.',
  'Recorre el borde de un vórtice de 16 carriles y dispara hacia el fondo para frenar a los Tumbadores, Tanques, Espigadores, Fusibles y Pulsares que trepan hacia ti. Cada pocos segundos el propio tubo muta: carriles clausurados, el anillo girando bajo tus pies, la geometría contrayéndose o el circuito abriéndose sin retorno. Mientras la mutación dura, cada enemigo vale el doble y sobrevivirla entera paga bonus. Tres vidas y dos cargas de Superzapper por nivel.',
  'SHOOTER',
  'cover-vortice-mutante',
  'yellow',
  0,
  '0'
);
```

- `scores` no cambia de esquema: las partidas se insertan con `game_id: 'vortice-neon-mutante'`, `user_id: null`, igual que los demás juegos.

## Plan de implementación

1. **Portada.** Diseñar la clase `.cover-vortice-mutante` en `app/globals.css` invocando `/frontend-design` (regla de `CLAUDE.md`): tubo poligonal en perspectiva con dos carriles clausurados y el anillo desalineado, trazos neón en `--yellow` sobre fondo oscuro. Ninguna `.cover-*` existente representa un vórtice deformado (`cover-rocas`, `cover-tetro`, `cover-bricks`, `cover-snake` y `cover-rana` ya están en uso; `cover-glot`, `cover-invaders` y `cover-duelo` representan otros juegos), y debe distinguirse a simple vista de la portada del spec `01` si ambos terminan en el catálogo. Manual test: la portada se ve correctamente en una tarjeta de `/biblioteca` con datos de prueba.
2. **Migración de seed.** Crear `supabase/migrations/NNN_seed_vortice_neon_mutante.sql` con el `insert` de la fila `vortice-neon-mutante` (valores del Modelo de datos, `NNN` = siguiente disponible) y aplicarla con `apply_migration` del MCP de Supabase. A partir de aquí el juego aparece en `/biblioteca`, `/` y `/salon`, y `/juego/vortice-neon-mutante` es navegable con la portada del paso 1, aunque todavía no sea jugable. Manual test: ver la tarjeta en `/biblioteca` y el tab nuevo en `/salon`.
3. **Geometría y formas.** Crear `lib/games/vortice-neon-mutante/shapes.ts` con `SHAPES` (las seis formas de 16 carriles), `LEVEL_COLORS` y las tres funciones de curva de dificultad. Módulo puro, sin estado ni dibujo.
4. **Motor — esqueleto y render del tubo.** Crear `lib/games/vortice-neon-mutante/engine.ts` con `VorticeMutanteEngine implements ArcadeGameEngine` y todo el estado en propiedades de instancia (`playerLane`, `enemies`, `shots`, `spikes`, `mutation`, `score`, `lives`, `level`, `zaps`). El loop de `requestAnimationFrame` acumula `dt` real y por ahora solo dibuja el vórtice del nivel 1 y la garra quieta en un carril. La función de proyección ya recibe `rimScale` como parámetro, aunque todavía valga siempre 1.
5. **Alta en el registry.** Agregar la entrada `vortice-neon-mutante` a `lib/games/registry.ts` (`width: 800`, `height: 600`, `initialState` con los cuatro stats, `create()` instanciando el motor). Manual test: `/jugar/vortice-neon-mutante` muestra el vórtice dentro de `.crt-screen` con el HUD en sus valores iniciales, incluida la stat "Mutación" en `—`.
6. **Controles y disparo del jugador.** Listener de teclado (flechas + `A`/`D` con repetición de 90 ms, `Espacio` con cadencia de 0.12 s, `preventDefault`) y disparos que bajan por el carril hasta `t = 0`. Manual test: la garra recorre el borde con wrap en `circulo` y con tope en `linea`, y los disparos viajan al fondo con la escala correcta.
7. **Enemigos que suben y colisión con disparos.** Implementar spawn por presupuesto/intervalo, avance en profundidad, colisión disparo-enemigo por intervalo recorrido y puntaje por tipo, empezando solo por el Tumbador (volteo en el borde y muerte por contacto incluidos). Manual test: matar Tumbadores suma 150 puntos y dejar que uno toque al jugador cuesta una vida.
8. **Resto de enemigos.** Agregar Tanque (división en dos Tumbadores), Espigador (espigas), Fusible (zigzag, invulnerabilidad fuera del centro, paseo por el borde) y Pulsar (ciclo de electrificación), más disparos enemigos y su destrucción por disparo del jugador. Manual test: comprobar uno por uno cada comportamiento y valor de puntaje forzando el spawn desde el nivel correspondiente.
9. **Superzapper, vidas y game over.** Implementar las dos cargas por nivel (barrido sin puntos y disparo único con puntos), la muerte con explosión y respawn invulnerable, la vida extra cada 20 000 puntos con techo de 5, y `onGameOver(finalScore)` al perder la última vida. Manual test: usar ambas cargas, ver el HUD bajar de `2` a `0` y perder tres vidas hasta el modal automático.
10. **Fin de nivel, descenso y curva de dificultad.** Implementar la fase de descenso de 2 600 ms, el empalamiento por espiga (`spikeTop ≥ 0.35`), el bonus `250 × min(nivel, 12)`, la rotación de forma y color por nivel y las tres funciones de dificultad. Manual test: completar los niveles 1 a 4 y verificar cambio de forma, cambio de color, aumento de enemigos y descenso con y sin espigas.
11. **Máquina de estados de mutación.** Crear `lib/games/vortice-neon-mutante/mutations.ts` (definiciones y funciones de temporización) y agregar al motor el ciclo `idle → warn → active → returning → idle` con el sorteo sin repetición, la etiqueta en el HUD (`mut`), el aviso parpadeante y el reinicio del reloj por nivel. En este paso las mutaciones todavía **no tienen efecto** sobre el juego: solo se anuncian y se muestran. Manual test: ver las etiquetas rotando en el HUD con los tiempos esperados (primera a los 10 s, luego cada 14 s en el nivel 1) y confirmar que ninguna se dispara durante el descenso.
12. **Efectos de las mutaciones.** Implementar los cuatro efectos: SELLADO (carriles clausurados, empuje del jugador, desvío de enemigos en `t = 0.5`, spawn y Pulsar excluidos), ROTACIÓN (rotación del contenido cada 0.55 s, solo formas cerradas), ESTRECHAMIENTO (`rimScale` a 0.70 con transición de 0.6 s y velocidad ×1.20) y APERTURA/CIERRE (alternancia de `closed` con corte o unión dibujada). Manual test: provocar cada mutación bajando temporalmente `FIRST_MUTATION_DELAY_MS` y verificar el comportamiento uno por uno, incluida la sustitución de ROTACIÓN por ESTRECHAMIENTO en `linea` y `uve`.
13. **Puntaje de mutación.** Aplicar el multiplicador ×2 durante la fase activa (y solo ahí), el bonus `150 × min(nivel, 12)` por mutación superada sin perder vidas, y la anulación de ese bonus al morir durante la mutación. Manual test: matar un Tumbador con y sin mutación activa (150 vs 300) y comparar el puntaje al terminar una mutación con y sin muerte de por medio.
14. **Repaso final.** `npm run build` sin errores de tipos. Probar el flujo completo en el navegador: `/biblioteca` → detalle de "vortice-neon-mutante" → `/jugar/vortice-neon-mutante` → jugar dos o tres niveles atravesando al menos tres mutaciones distintas, pausar durante una mutación y reanudar sin que salte de fase, perder las tres vidas → modal automático con el puntaje real, "GUARDAR PUNTUACIÓN" inserta en `scores`, "JUGAR DE NUEVO" reinicia el motor, "SALIR" no deja el loop ni listeners activos. Confirmar que Asteroids, Tetris, Arkanoid, Snake y Frogger siguen funcionando igual.

## Criterios de aceptación

- [ ] Existen `lib/games/vortice-neon-mutante/shapes.ts`, `lib/games/vortice-neon-mutante/mutations.ts` y `lib/games/vortice-neon-mutante/engine.ts` con `VorticeMutanteEngine implements ArcadeGameEngine`, sin variables globales de módulo y sin importar nada de `lib/games/vortice-neon/`.
- [ ] No se agrega ningún archivo a `public/games/vortice-neon-mutante/`: todo el juego se dibuja con trazos de Canvas.
- [ ] Existe la clase `.cover-vortice-mutante` en `app/globals.css`, diseñada con `/frontend-design`, y la tarjeta de `/biblioteca` la usa.
- [ ] Existe una fila `vortice-neon-mutante` en `games` (Supabase) con los valores acordados (`cat: 'SHOOTER'`, `color: 'yellow'`, `cover: 'cover-vortice-mutante'`, `best_seed: 0`, `plays_seed: '0'`), en una migración nueva que no toca `001_games_and_scores.sql` ni las políticas RLS existentes.
- [ ] `/jugar/vortice-neon-mutante` renderiza el canvas de 800×600 dentro de `.crt-screen`, con la clase `game-canvas`.
- [ ] El HUD de React refleja en tiempo real Puntuación, Vidas, Nivel, Zapper y Mutación del motor (no valores fijos), y la stat "Mutación" muestra `—` cuando no hay ninguna activa.
- [ ] Moverse con `←`/`→` y con `A`/`D` avanza exactamente un carril por pulsación y repite cada 90 ms al mantener la tecla.
- [ ] En las formas cerradas el jugador pasa del carril 15 al 0; en las abiertas queda topado en ambos extremos.
- [ ] Destruir cada enemigo suma exactamente: Espigador 50, Tanque 100, Tumbador 150, Pulsar 200, Fusible 250 (sin mutación activa).
- [ ] Un Tanque destruido genera exactamente 2 Tumbadores en carriles vecinos con su misma profundidad.
- [ ] Un Fusible no puede ser destruido mientras está sobre la frontera entre dos carriles, y sí puede mientras está centrado.
- [ ] Un Pulsar mata al jugador solo durante su fase electrificada (0.6 s de cada ciclo de 1.6 s) y únicamente si comparten carril.
- [ ] Cada impacto sobre una espiga la acorta 0.08 de profundidad y suma exactamente 1 punto, con o sin mutación activa.
- [ ] La primera mutación de cada nivel arranca a los 10 s y las siguientes cada `max(14 − 0.6 × (nivel − 1), 8)` s tras el fin de la anterior, con 1.5 s de aviso y `min(9 + 0.5 × (nivel − 1), 14)` s de duración.
- [ ] Nunca se sortea dos veces seguidas la misma mutación, y ROTACIÓN nunca ocurre en `linea` ni en `uve` (se sustituye por ESTRECHAMIENTO).
- [ ] SELLADO clausura exactamente 3 carriles no contiguos: el jugador los salta al moverse, sus disparos no entran, ningún enemigo aparece ahí, los Pulsares no los electrifican y los enemigos que subían por ellos se desvían al carril libre más cercano al llegar a `t = 0.5`.
- [ ] Si SELLADO empieza con el jugador en un carril que va a clausurarse, el jugador es empujado a un carril libre y no muere por ello.
- [ ] ROTACIÓN mueve enemigos, disparos enemigos y espigas un carril cada 0.55 s en una sola dirección, sin mover al jugador ni a sus disparos.
- [ ] ESTRECHAMIENTO contrae el vórtice a `rimScale = 0.70` con transición de 0.6 s y multiplica por 1.20 la velocidad de avance de los enemigos, restaurando ambos valores al terminar.
- [ ] APERTURA quita el wrap en formas cerradas (etiqueta `APERTURA`) y lo agrega en formas abiertas (etiqueta `CIERRE`), con el corte o la unión visibles en el canvas.
- [ ] Con una mutación activa, cada enemigo destruido suma exactamente el doble de su puntaje base; el multiplicador no se aplica durante el aviso ni durante el retorno, ni a las espigas, ni al bonus de nivel.
- [ ] Terminar una mutación sin haber perdido vidas durante ella suma exactamente `150 × min(nivel, 12)` puntos; si se perdió al menos una vida, no suma nada.
- [ ] No se dispara ninguna mutación durante la fase de descenso, y una mutación activa al terminar el último enemigo del nivel se cierra antes del descenso, cobrando su bonus si corresponde.
- [ ] La primera carga del Superzapper elimina todos los enemigos vivos sin sumar puntos; la segunda elimina uno al azar y sí suma su puntaje; el Superzapper no cancela ni acorta la mutación en curso.
- [ ] Completar un nivel dispara la fase de descenso de 2 600 ms y suma `250 × min(nivel, 12)` puntos al terminarla; terminar el descenso en un carril con una espiga de `spikeTop ≥ 0.35` cuesta una vida, pero el nivel igual avanza.
- [ ] Cada nivel nuevo cambia la forma según `SHAPES[(nivel − 1) % 6]` y el color según `LEVEL_COLORS[(nivel − 1) % 4]`, repone las dos cargas de Superzapper y reinicia el reloj de mutaciones.
- [ ] El presupuesto por nivel es `min(7 + 2 × (nivel − 1), 28)`, con un máximo de 7 enemigos vivos a la vez, y la velocidad se multiplica por `min(1 + 0.08 × (nivel − 1), 2.2)`.
- [ ] Al morir, los enemigos con `t ≥ 0.85` se eliminan y el jugador reaparece con 1.5 s de invulnerabilidad, en un carril libre si el suyo quedó sellado, conservando espigas, progreso de spawn y la mutación en curso.
- [ ] Se gana una vida extra cada 20 000 puntos, sin superar nunca 5 vidas acumuladas.
- [ ] Todo el movimiento y todos los relojes de mutación se basan en delta time real, de modo que el juego se percibe igual en un monitor de 60 Hz y en uno de 144 Hz.
- [ ] Perder la última vida invoca `onGameOver` una sola vez y abre automáticamente el modal de fin de partida con el puntaje real, sin overlay interno de "GAME OVER" en el canvas.
- [ ] PAUSA/REANUDAR detiene y reactiva el loop sin saltos de profundidad, sin avanzar el reloj de la mutación durante la pausa y sin overlay interno de "PAUSA".
- [ ] "GUARDAR PUNTUACIÓN" inserta una fila en `scores` con `game_id: "vortice-neon-mutante"`, `user_id: null`, `score` real.
- [ ] "JUGAR DE NUEVO" reinicia una instancia nueva del motor (nivel 1, forma `circulo`, score 0, 3 vidas, 2 cargas de Superzapper, sin espigas y sin mutación activa).
- [ ] Vórtice Mutante aparece como tab nuevo en `/salon` (sin tocar código de `HallOfFame.tsx`) y su top coincide con el mostrado en `/juego/vortice-neon-mutante`.
- [ ] Salir del juego (botón "SALIR" o navegar fuera de `/jugar/vortice-neon-mutante`) cancela el `requestAnimationFrame` y remueve los listeners de teclado.
- [ ] Una partida de un jugador que ya conoce el juego dura entre 2 y 4 minutos, e incluye al menos dos mutaciones antes de perder la primera vida en condiciones normales.
- [ ] `npm run build` compila sin errores de tipos.

## Decisiones tomadas y descartadas

- **Sí:** la modificación son **mutaciones de la geometría del vórtice**, no power-ups. El prompt de invocación no indicó ninguna modificación, así que se eligió esta por tres motivos: (a) Tempest define su identidad por la forma del campo, y alterarla en vivo es la evolución más natural del juego; (b) la game jam anterior (`specs/game-jam/frogger/02-frogger-poderes-game.md`) ya usó power-ups temporales, y repetir esa familia aportaría menos al catálogo; (c) no exige entidades ni assets nuevos, solo parámetros de la proyección y de la vecindad entre carriles, así que el costo del motor sube poco frente a la versión base.
- **Sí:** cuatro mutaciones y no más. Con cuatro, ninguna se vuelve rutinaria dentro de una partida de 2–4 minutos y cada una obliga a una respuesta distinta (reubicarse, anticipar el giro, ajustar la distancia, perder o ganar la ruta de escape). Un catálogo más grande diluiría el aprendizaje del jugador y multiplicaría el trabajo de balance.
- **Sí:** aviso previo de 1.5 s con parpadeo de lo que va a cambiar. Sin aviso, cualquier mutación se leería como una muerte arbitraria; con aviso, se convierte en una decisión (reposicionarse a tiempo).
- **Sí:** multiplicador ×2 durante la mutación activa y bonus de supervivencia `150 × min(nivel, 12)`. La mutación tiene que ser una oportunidad además de una amenaza; si solo estorbara, la estrategia óptima sería esconderse y esperar, que es exactamente lo contrario del bucle arcade que se busca.
- **No:** el Superzapper no cancela ni acorta la mutación. Si la cancelara, la mecánica añadida quedaría neutralizada por un recurso que se recarga cada nivel y el juego volvería a ser el base.
- **Sí:** ROTACIÓN restringida a formas cerradas, con sustitución automática por ESTRECHAMIENTO en `linea` y `uve`. Rotar un campo abierto obligaría a decidir qué pasa con lo que "cae" por los extremos, y cualquier respuesta se sentiría arbitraria.
- **Sí:** el jugador **no** rota durante ROTACIÓN. Si rotara con el tubo, la mutación sería puramente visual; al no hacerlo, el mundo se mueve bajo él y obliga a corregir la posición constantemente, que es el punto de la mecánica.
- **Sí:** SELLADO con 3 carriles no contiguos (de 16). Es suficiente para reordenar la partida sin llegar a bloquear el borde: siempre quedan 13 carriles libres y ninguna región del tubo queda inalcanzable.
- **Sí:** ESTRECHAMIENTO como escala global (`rimScale = 0.70`) más un +20 % de velocidad, en vez de fusionar carriles o cambiar su número. Fusionar carriles obligaría a remapear enemigos, disparos y espigas en pleno vuelo, con alto riesgo de estados inconsistentes; escalar la proyección tiene el mismo efecto percibido con una fracción del riesgo.
- **Sí:** presupuesto de enemigos un poco menor que en la versión base (`7 + 2·(n−1)` en vez de `8 + 2·(n−1)`, techo 28 en vez de 30). La presión total por nivel debe ser comparable entre ambos juegos, y aquí las mutaciones ya aportan dificultad.
- **Sí:** proyección 2D por interpolación radial desde un punto de fuga (`r(t) = 0.12 + 0.88 · t^1.6`) en vez de una cámara 3D. Es exactamente la objeción que el `game-planner` había levantado sobre Tempest, y se resuelve con dos escalares por entidad.
- **Sí:** 16 carriles fijos en todas las formas y movimiento discreto de carril con repetición a 90 ms, en vez del spinner analógico del original. El criterio 5 exige teclado; la colisión por carril entero queda exacta en vez de aproximada, y el D-pad táctil que `mobile-porter` agregará después funciona sin tocar el motor.
- **Sí:** los cinco enemigos canónicos con sus valores originales (Espigador 50, Tanque 100, Tumbador 150, Pulsar 200, Fusible 250), verificados en las fuentes consultadas (ver abajo), no inventados. Con menos enemigos la variante perdería el contraste entre "amenaza que sube" y "geometría que cambia".
- **Sí:** Fusible con valor fijo de 250 puntos (en el original varía entre 250 y 750 según la situación), para que el leaderboard sea comparable y la regla explicable sin manual.
- **Sí:** vida extra cada 20 000 puntos con techo de 5 acumuladas, siguiendo el ajuste habitual del arcade original. El techo evita que una partida excepcional rompa el criterio de partidas de 1 a 5 minutos.
- **Sí:** `cat: 'SHOOTER'` y `color: 'yellow'`. El `check` de `001_games_and_scores.sql` solo admite cuatro categorías y cuatro colores, y los cuatro colores ya están en uso; SHOOTER es la categoría honesta y la menos poblada, y `yellow` no repite el `magenta` del spec `01` ni el `cyan` de Asteroides.
- **Sí:** cover `.cover-vortice-mutante` nueva, diseñada con `/frontend-design`. Ninguna clase libre (`cover-glot`, `cover-invaders`, `cover-duelo`, `cover-bg`) representa un tubo en perspectiva, y la portada debe distinguirse de la del spec `01` si ambos juegos conviven en el catálogo.
- **No:** skins `clasico`/`retro`/`neon` dentro de este spec — trabajo del agente `skin-designer`, con su propio flujo y memoria (`references/game-with-theme.md`).
- **No:** tecla de pausa dentro del motor. Misma decisión que en Tetris, Snake y Frogger: la pausa la controla el botón "PAUSA" de React.
- **Sin fuente local:** `references/started-games/` solo tiene `02-asteroids`, `03-tetris` y `04-arkanoid`, y `references/assest-source/` solo tiene assets de Snake y Frogger. No hay código ni arte previo de Tempest en el repositorio, así que las reglas del original se verificaron por investigación web y el juego se dibuja íntegramente por código.
- **Fuentes consultadas sobre el original** (solo para verificar reglas y balance, sin copiar código de terceros):
  - `https://strategywiki.org/wiki/Tempest/Gameplay` (vía resultados de búsqueda; el fetch directo quedó bloqueado por el proxy de egreso) — comportamiento de Flippers, Tankers, Spikers, Fuseballs y Pulsars; regla del Superzapper (primer uso barre todo, segundo uso mata uno al azar); fin de nivel al descender por el tubo.
  - `https://shmup.fandom.com/wiki/Tempest` y `https://www.arcade-history.com/?n=tempest-upright-model&page=detail&id=2865` (vía resultados de búsqueda) — tabla de puntaje: Spiker 50, Tanker 100, Flipper 150, Pulsar 200, Fuseball 250–750.
  - `https://en.wikipedia.org/wiki/Tempest_(video_game)` y `https://www.mobygames.com/game/23846/tempest/` (vía resultados de búsqueda) — 99 niveles construidos sobre 16 formas de web, tubos cerrados frente a campos abiertos con extremos, control por spinner, autoría de Dave Theurer.
  - `https://forums.arcade-museum.com/threads/tempest-cheat.40523/` (vía resultados de búsqueda) — ajuste de operador habitual: tres naves y una vida extra cada 20 000 puntos; las espigas se pueden disparar y valen muy poco.

## Riesgos identificados

| Riesgo                                                                                                                                                                                                        | Mitigación                                                                                                                                                                                                                                        |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fuga del `requestAnimationFrame` y de los listeners de teclado si `VorticeMutanteEngine.destroy()` no los limpia al desmontar o navegar fuera de `/jugar/vortice-neon-mutante`.                               | Cubierto en el paso 14 del plan y en los criterios de aceptación; `destroy()` cancela el rAF y remueve los listeners registrados en `start()`.                                                                                                    |
| `dt` gigante al reanudar de una pausa larga si `pause()` no detiene el reloj interno y `resume()` no lo resetea: los enemigos saltarían media profundidad y **la mutación podría cambiar de fase durante la pausa**. | Al pausar se detiene el bucle completo, incluidos `phaseMs` de cada enemigo y `elapsedMs` de la máquina de mutación; al reanudar se resetea `lastTime` como si fuera el primer frame — patrón ya validado en los cinco motores existentes.        |
| Estado global de módulo que sobrevive al HMR de Next.js si el motor no encapsula todo en la instancia.                                                                                                        | `shapes.ts` y `mutations.ts` son módulos puros de constantes y funciones; todo lo mutable (jugador, enemigos, disparos, espigas, estado de mutación, score, vidas, nivel, cargas) vive en propiedades de `VorticeMutanteEngine`.                  |
| Overlay de "GAME OVER"/"PAUSA" duplicado entre el canvas y React.                                                                                                                                             | El motor nunca dibuja esos textos; solo invoca `onGameOver(finalScore)`. La única etiqueta que dibuja es el nombre de la mutación, que es estado de juego (equivalente a la barra de tiempo de Frogger), no un control.                           |
| **Estado inconsistente al terminar una mutación.** Si el retorno a la forma base no revierte `closed`, `rimScale`, `sealedLanes` y el multiplicador de velocidad, el juego queda permanentemente deformado.   | Una única función `endMutation()` restaura todos los parámetros derivados desde la definición del nivel (forma, `rimScale = 1`, sin carriles sellados, multiplicador 1), y la fase `returning` es la única salida posible de `active`.            |
| **Mutaciones encadenadas que dejan al jugador sin salida.** Un SELLADO seguido de una APERTURA puede acorralarlo entre carriles clausurados y un extremo sin wrap.                                             | Solo puede haber **una mutación activa a la vez** (la siguiente se agenda tras el retorno de la anterior), SELLADO clausura carriles no contiguos y siempre deja 13 libres, y el aviso de 1.5 s da tiempo a reposicionarse.                       |
| **Balance del multiplicador ×2.** Un multiplicador demasiado generoso convertiría el leaderboard en una carrera por jugar solo durante mutaciones, y las partidas sin mutación quedarían sin valor.            | ×2 aplica únicamente en la fase activa (nunca en aviso ni retorno) y no toca espigas ni el bonus de nivel; el bonus de supervivencia está acotado por `min(nivel, 12)`, igual que el bonus de nivel.                                              |
| **Colisión ambigua en profundidad.** Con tolerancia fija, un disparo a 2.2 t/s recorre 0.037 de `t` por frame a 60 Hz y en un frame lento podría atravesar un enemigo sin tocarlo.                             | La comprobación de impacto se hace por intervalo recorrido (`t_anterior → t_actual`), no por posición puntual.                                                                                                                                    |
| **Remapeo de carril durante ROTACIÓN.** Rotar enemigos, disparos y espigas puede desincronizar la espiga de su carril o duplicar entidades si el desplazamiento se aplica dos veces en el mismo tick.          | La rotación se aplica una sola vez por paso de 0.55 s, en una única función que recorre las tres colecciones y suma el mismo desplazamiento modular; la comprobación se documenta en el manual test del paso 12.                                  |
| **Legibilidad del fondo del tubo.** Cerca del punto de fuga los carriles se amontonan y varios enemigos con `t` bajo se dibujan casi encima; el estrechamiento agrava el problema.                             | `r(t)` usa exponente 1.6 para separar la zona cercana, hay dos anillos guía (`t = 0.35` y `t = 0.70`), cada tipo de enemigo tiene forma y color propios, y durante ESTRECHAMIENTO se dibuja una circunferencia guía del tamaño original.          |
| **Sensación de injusticia al morir en el borde**, agravada porque una mutación puede empujar al jugador a un carril ocupado.                                                                                  | Al morir se eliminan los enemigos con `t ≥ 0.85`, el respawn tiene 1.5 s de invulnerabilidad y el empuje por SELLADO elige el carril libre más cercano; el criterio de duración (2–4 min) sirve de prueba de balance.                             |
| **Costo por frame del trazado vectorial**, que aquí no se puede hornear tan fácil porque la geometría cambia durante la mutación.                                                                              | El tubo se hornea en un canvas offscreen y se re-hornea **solo** cuando cambia la geometría (inicio de nivel, cada paso de `rimScale` durante las transiciones de 0.6 s, cambio de `closed` o de carriles sellados), siguiendo `specs/12-optimizacion-performance-frogger.md`. |
| **Canvas de 800×600 en pantallas angostas.** Puede quedar ajustado dentro de `.crt-screen` en viewports pequeños, y el HUD tiene cuatro stats.                                                                | No se resuelve en este spec (layout móvil está fuera de alcance); el agente `mobile-porter` lo revisa después, igual que hizo con los cuatro stats de Frogger.                                                                                    |

## Lo que no está en este spec

- El Tempest base sin mutaciones (eso es `01-vortice-neon-game.md`, un juego aparte).
- Power-ups recogibles, armas alternativas y modificadores elegidos por el jugador.
- Control rotatorio analógico (spinner) y soporte de ratón.
- Las 99 pantallas y las 16 formas del original, y el "warp" para empezar en un nivel avanzado.
- Valor variable del Fusible (250–750) y demás ajustes de operador del arcade original.
- Audio y efectos de sonido.
- Assets de imagen en `public/games/vortice-neon-mutante/`.
- Skins `clasico`/`retro`/`neon` (trabajo del agente `skin-designer`).
- Controles táctiles/móviles (trabajo del agente `mobile-porter`).
- Multijugador y progresión persistente entre partidas.
- Realtime, paginación del leaderboard y autenticación real.
- Tests automatizados.
- Tema claro/oscuro propio del juego.
- Cambios a `GameDetail.tsx` o a la ruta `/juego/[id]` más allá de la nueva entrada navegable.

Cada uno de estos, si se necesita, va en su propio spec futuro.
