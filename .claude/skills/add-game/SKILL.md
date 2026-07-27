---
name: add-game
description: Genera un spec para agregar un juego nuevo con leaderboard a Arcade Vault, siguiendo el patrón de los specs 05 y 06. No escribe código.
disable-model-invocation: true
argument-hint: "<carpeta de references/started-games o descripción del juego>"
---

# /add-game — Generador de specs para juegos nuevos con leaderboard

Este skill produce un spec listo para implementar (`specs/NN-<slug>.md`) que describe cómo
llevar un juego nuevo a Arcade Vault: motor real en TypeScript/Canvas, alta en Supabase y
leaderboard en el Salón de la Fama. **No escribe código, no toca Supabase, no ejecuta
migraciones.** Su único producto es el archivo `.md` del spec.

Tu respuesta debe estar siempre en español neutro, sin voceo ni modismos regionales (nada de
"vos", "tenés", "podés" — usar "tú"/"usted"), siguiendo `CLAUDE.md` del proyecto.

## Estado actual de la plataforma (léelo antes de escribir nada)

Estos hechos vienen de `specs/05-asteroids-game.md` y `specs/06-leaderboard-supabase.md`, ya
implementados. Todo spec que generes debe ser coherente con ellos:

- **El catálogo y los puntajes viven solo en Supabase**, tablas `games` / `scores`
  (`supabase/migrations/001_games_and_scores.sql`). `lib/data.ts` ya no tiene ningún catálogo
  mock — solo conserva los tipos `Game`, `ScoreRow` y la constante `CATS`. Nunca propongas
  agregar un juego a `lib/data.ts`.
- **Capa de datos ya existente y reutilizable** — no la reinventes en el spec:
  - `getAllGames()` / `getGameById(id)` en `lib/games.ts` (Server, consultan Supabase).
  - `getTopScores(gameId, limit=12)` en `lib/scores.server.ts` (Server).
  - `saveScore(gameId, playerName, score)` en `lib/scores.ts` (Client).
- **El leaderboard es gratis.** `app/salon/page.tsx` llama a `getAllGames()` y genera un tab por
  cada fila de `games`; `app/juego/[id]/page.tsx` ya usa `getTopScores(id)`. Un juego nuevo con
  una fila en `games` aparece solo en `/salon` y en `/juego/<id>`, sin código adicional. El spec
  que generes **no debe incluir ningún paso de "conectar el leaderboard"** — solo el `insert` en
  `games`.
- **Limitación conocida a resolver en el primer spec.** `components/GamePlayer.tsx` (alrededor
  de la línea 39) instancia `AsteroidsEngine` de forma hardcodeada, con un `<canvas>` fijo de
  800×600 y un HUD cerrado a Puntuación/Vidas/Nivel. Antes de escribir el plan de implementación,
  revisa si ya existe `lib/games/registry.ts`:
  - **Si no existe**, el spec debe incluir como **paso 1** crear el punto de extensión:
    - `lib/games/types.ts` con la interfaz común `ArcadeGameEngine`
      (`start()/pause()/resume()/restart()/destroy()`) y un estado de HUD flexible
      `{ score: number; stats: { key: string; label: string; value: string }[] }` — flexible
      porque no todos los juegos tienen "vidas" (Tetris cuenta líneas, no vidas).
    - `lib/games/registry.ts`: mapa `id → { width, height, initialState, create(canvas, options) }`.
    - `components/GamePlayer.tsx` resolviendo el motor vía el registry en vez del import directo,
      con el `<canvas>` y el HUD (`engineState.stats.map(...)`) dependiendo de esos datos en vez
      de valores fijos.
    - `.asteroids-canvas` en `app/globals.css` (línea ~1065) es específica de Asteroids; el spec
      debe generalizarla a una clase de canvas genérica si el registry ya no existe.
  - **Si ya existe**, el spec solo necesita dar de alta el juego en el registry — no repitas el
    refactor.

## Fase 1 — Contexto y fuente

1. **Lee primero la skill `spec`** (`~/.claude/skills/spec/SKILL.md` y su plantilla
   `~/.claude/skills/spec/template.md`, en `C:\Users\UsuarioCompuElite\.claude\skills\spec\` si
   usas ruta absoluta). Es la fuente de verdad del formato de spec de este proyecto: estructura
   de secciones, orden, tono de las preguntas y reglas ("nunca generar el spec completo de una
   sola vez", "sección por sección con confirmación", numeración de `specs/`). Todo lo que este
   skill haga en las Fases 2 a 4 debe ajustarse a esa plantilla; donde este documento y la
   plantilla de `spec` difieran, la plantilla de `spec` manda salvo en el contenido específico de
   juegos/leaderboard descrito más abajo, que es propio de `add-game`.
2. Lee `CLAUDE.md` del proyecto.
3. Lista `specs/` para determinar el siguiente número correlativo y repasar las convenciones ya
   aplicadas en la práctica (especialmente `05-asteroids-game.md` y `06-leaderboard-supabase.md`,
   que son el ejemplo concreto de la plantilla de `spec` ya usada para juegos).
4. Revisa si existe `lib/games/registry.ts` (determina si el spec debe incluir el paso 1
   descrito arriba).
5. Determina la fuente del juego a partir de `$ARGUMENTS`:
   - **Con carpeta de referencia** (ej. `references/started-games/03-tetris`): lee su
     `CLAUDE.md`, `README.md` y `game.js` completos. Extrae: dimensiones del canvas, controles,
     sistema de puntaje, condición de fin de partida/game over, clases del juego (equivalentes a
     `Bullet`/`Asteroid`/`Ship`/`Particle`/`PowerUp` del original), assets (`assets/`, sonidos,
     spritesheets) y canvases secundarios (ej. Tetris tiene un canvas de "next piece" aparte —
     el spec debe decidir explícitamente si se integra al canvas principal o se agrega un
     segundo `<canvas>`).
   - **Sin carpeta** (descripción libre): el juego se diseña desde la descripción del usuario; el
     spec deberá incluir también las reglas de juego en la sección de objetivo/alcance, no solo
     la integración técnica.

## Fase 2 — Preguntas

Un único bloque de 4 a 6 preguntas, numeradas, con valores por defecto ya propuestos a partir de
lo leído en la Fase 1 (no preguntes en blanco si la referencia ya sugiere una respuesta):

1. **Id/slug** del juego (usado como `game_id` en Supabase y como carpeta en `lib/games/<id>/`).
2. **Título**, descripción corta y larga (copy para `games.title/short/long`).
3. **Categoría** (`ARCADE`/`PUZZLE`/`SHOOTER`/`VERSUS`) y **color** (`cyan`/`magenta`/`green`/
   `yellow`).
4. **Cover**: clase `cover-*` a reutilizar de `app/globals.css` o crear una nueva.
5. **Dimensiones del canvas** (ancho×alto) y si necesita un segundo canvas.
6. **Stats del HUD** (aparte de Puntuación) y **controles de teclado**.

Espera las respuestas antes de continuar a la Fase 3.

## Fase 3 — Escribir el spec, sección por sección

Usa la estructura y el orden de secciones definidos en `template.md` de la skill `spec` (leída
en la Fase 1): Header, Alcance, Modelo de datos, Plan de implementación, Criterios de
aceptación, Decisiones tomadas y descartadas, Riesgos identificados. `specs/05-asteroids-game.md`
es el ejemplo concreto de esa misma plantilla ya aplicado a un juego — úsalo como referencia de
tono y nivel de detalle, no como fuente del formato en sí. Muestra cada sección en markdown y
espera confirmación del usuario antes de pasar a la siguiente — no generes el spec completo de
una sola vez, siguiendo la regla dura de la skill `spec`.

- **Header**: Estado `Draft`, Dependencias (`05-asteroids-game`, `06-leaderboard-supabase`, y
  el spec del registry si se creó antes), Fecha, Objetivo en una sola frase.
- **Alcance → Incluye**: usa como referencia el plan de implementación armado en esta fase.
- **Alcance → No incluye**: incluye siempre, heredado de los specs 05/06, salvo que el usuario
  pida explícitamente lo contrario:
  - Sin Realtime (el leaderboard se actualiza al navegar/recargar).
  - Sin paginación del leaderboard (top fijo de `getTopScores`).
  - Sin autenticación real (`user_id: null` en `scores`, cualquiera puede escribir su nombre).
  - Sin controles táctiles/móviles (salvo que el usuario pida lo contrario).
  - Sin tests automatizados.
- **Modelo de datos**: el `insert into games (id, title, short, long, cat, cover, color,
best_seed, plays_seed) values (...)` con `best_seed: 0`, `plays_seed: '0'`, en una migración
  nueva `supabase/migrations/NNN_seed_<id>.sql` (siguiente número tras revisar
  `supabase/migrations/`). Sin cambios de esquema ni de políticas RLS — las tablas y políticas de
  `001_games_and_scores.sql` ya cubren cualquier juego nuevo.
- **Plan de implementación**: pasos numerados, cada uno dejando el sistema funcional, típicamente:
  1. (Solo si el registry no existe) crear `lib/games/types.ts` y `lib/games/registry.ts`,
     adaptar `GamePlayer.tsx`.
  2. Motor del juego en `lib/games/<id>/engine.ts`, implementando `ArcadeGameEngine`.
  3. Assets a `public/games/<id>/` si aplica.
  4. Alta de la entrada en `lib/games/registry.ts`.
  5. Clase `.cover-<slug>` en `app/globals.css` si no se reutiliza una existente.
  6. Migración de seed en Supabase, aplicada con `apply_migration` del MCP.
  7. Repaso final: `npm run build` y prueba manual del flujo completo.
- **Riesgos identificados**: incluye siempre los heredados de `specs/05-asteroids-game.md`
  (son estructurales al patrón "motor con `requestAnimationFrame` dentro de un componente React",
  no anecdóticos de Asteroids), adaptados al juego nuevo:
  - Fuga del `requestAnimationFrame` y de los listeners de teclado si `destroy()` no los limpia
    al desmontar/navegar fuera.
  - `dt` (delta time) gigante al reanudar de una pausa larga si `pause()` no detiene el reloj
    interno y `resume()` no resetea `lastTime`.
  - Estado global de módulo que sobrevive al HMR de Next.js si el motor no encapsula todo su
    estado en la instancia.
  - Overlay de game over duplicado entre el canvas y React si el motor original dibuja su propio
    "GAME OVER" — debe deshabilitarse a favor del modal de React.
  - Cualquier riesgo específico de la referencia leída en la Fase 1 (ej. colisiones con
    spritesheets, canvases secundarios, sonidos).
- **Criterios de aceptación**, como mínimo (booleanos, verificables):
  - [ ] Existe una fila nueva en `games` con los valores acordados (`best_seed: 0`,
        `plays_seed: '0'`).
  - [ ] `/jugar/<id>` renderiza el canvas con las dimensiones acordadas dentro de `.crt-screen`.
  - [ ] El HUD de React refleja en tiempo real el estado del motor (no valores fijos).
  - [ ] PAUSA/REANUDAR detiene y reactiva el loop sin saltos de física.
  - [ ] FIN abre el modal de fin de partida con el puntaje real sin matar la nave/pieza.
  - [ ] Al perder (game over del motor) se abre el mismo modal automáticamente.
  - [ ] "GUARDAR PUNTUACIÓN" inserta una fila en `scores` con `game_id: "<id>"`, `user_id: null`.
  - [ ] El juego aparece como tab nuevo en `/salon` (sin tocar código de `HallOfFame.tsx`) y su
        top coincide con `/juego/<id>`.
  - [ ] Salir del juego cancela el `requestAnimationFrame` y remueve los listeners de teclado.
  - [ ] `npm run build` compila sin errores de tipos.

## Fase 4 — Guardar

1. Determina el número correlativo siguiente según `specs/` (ej. si el último es
   `06-leaderboard-supabase.md`, este es `07-`).
2. Propone un slug corto derivado del objetivo y confirma el nombre de archivo con el usuario
   antes de escribir.
3. Crea `specs/NN-<slug>.md` con todas las secciones aprobadas, Estado `Draft`.
4. Confirma al usuario:
   - Ruta del archivo creado.
   - Recordatorio: el spec queda en `Draft`; debe pasar a `Approved` cuando el usuario lo
     revise.
   - Próximo paso: `/spec-impl NN-<slug>` cuando esté aprobado.
5. **Detente ahí.** No propongas implementar el spec, ni escribas código, ni ejecutes ninguna
   herramienta de Supabase.

## Reglas duras

- **Nunca escribas código, migraciones SQL como archivo real, ni ejecutes `apply_migration` u
  otra tool del MCP de Supabase.** El SQL del `insert` va _dentro_ del spec como texto, no se
  aplica.
- **Nunca propongas implementar el spec** después de guardarlo.
- No agregues juegos a `lib/data.ts` — ese catálogo mock ya no existe.
- No generes un spec para un juego sin motor real: si el usuario solo quiere un juego mock
  (arena decorativa sin lógica), indícale que eso está fuera del alcance de este skill (los
  juegos mock no llevan fila en `games` ni leaderboard, según `specs/06-leaderboard-supabase.md`).
- No inventes rutas, nombres de archivo ni valores de columnas que el usuario no confirmó.
- No modifiques `supabase/migrations/001_games_and_scores.sql` ni ninguna política RLS existente.
