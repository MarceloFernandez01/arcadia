# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Debes hablarme siempre en español neutro, el codigo ppuede estar en ingles. debe evitar simepre usar modismos y voceos.

Regla reforzada: nada de "vos" ni sus conjugaciones ("tenés", "sos", "podés", "revisás", "dale"), ni en saludos/cierres ni en el cuerpo técnico de la respuesta (ej.: "las agregaste vos mismo antes" es incorrecto; usar "las agregaste tú antes"). Usar siempre "tú"/"usted".

## Advertencia de versión

Este proyecto usa **Next.js 16.2.10** (App Router) con **React 19.2.4** y **Tailwind CSS v4**. Es una versión más nueva de la que puede reflejar tu conocimiento previo: APIs, convenciones y estructura de archivos pueden diferir. Antes de usar una API de Next.js de la que no estés seguro, consulta la documentación local en `node_modules/next/dist/docs/` (secciones `01-app` para App Router, `02-pages` para Pages Router) en vez de asumir comportamiento de versiones anteriores. Presta atención a los avisos de deprecación.

## Proyecto: Arcade Vault

Plataforma para jugar online y competir por puntos. El desarrollo sigue Spec Driven Design (carpetas/flujos `/spec` y `/spec-impl`) usando las skills de `Klerith/fernando-skills` (instalables con `npx skills@latest add Klerith/fernando-skills`). Specs en `specs/`, todas marcadas como implementadas:

- `01-mvp-visual.md` — MVP visual (sin backend ni lógica de juego real), base de `app/`, `components/` y `lib/`.
- `02-home-page.md` — página de inicio (`/`) con `components/Home.tsx`, y movió la Biblioteca (grilla de juegos) de `/` a `/biblioteca`.
- `03-about-page-resend.md` — página "Acerca de" (`/about`) con formulario de contacto que envía correos reales vía Resend a través de una API Route.
- `04-integracion-supabase.md` — conexión técnica con Supabase (clientes `lib/supabase/client.ts` y `lib/supabase/server.ts` vía `@supabase/ssr`), sin tablas ni autenticación real todavía.
- `05-asteroids-game.md` — juego Asteroids con motor real en TypeScript/Canvas (`lib/games/asteroids/engine.ts`), integrado en `GamePlayer.tsx`.
- `06-leaderboard-supabase.md` — migración del catálogo de juegos y los puntajes a Supabase (tablas `games`/`scores`); el catálogo mock de `lib/data.ts` se eliminó (el archivo se conserva solo con los tipos `Game`/`ScoreRow` y la constante `CATS`).
- `07-tetris-game.md` — juego Tetris (`lib/games/tetris/engine.ts`, con canvas secundario de "siguiente pieza"); introdujo el punto de extensión `lib/games/types.ts` + `lib/games/registry.ts` (ver "Motores de juego" en Arquitectura) y dejó `GamePlayer.tsx` completamente genérico.
- `08-arkanoid-game.md` — juego Arkanoid (`lib/games/arkanoid/engine.ts`, `levels.ts`, `spritesheet.ts`), con assets en `public/games/arkanoid/`.
- `09-snake-game.md` — juego Snake (`lib/games/snake/engine.ts`, `fruits.ts`), con wrap-around en los bordes y frutas del atlas retro.

## Skills

Se debe usar siempre `/frontend-design` para diseñar la interfaz de usuario.

Flujo de Spec Driven Design (skills globales en `~/.claude/skills/`):

- `/spec` — genera specs sección por sección con confirmación del usuario, sin escribir código.
- `/spec-impl` — implementa un spec ya aprobado.
- `/add-game` (skill de proyecto en `.claude/skills/add-game/SKILL.md`) — genera el spec de un juego nuevo con leaderboard (`specs/NN-<slug>.md`) siguiendo el patrón de los specs 05–09; no escribe código, no toca Supabase ni ejecuta migraciones.

## Agentes

- `game-planner` (`.claude/agents/game-planner.md`) — analiza el catálogo y recomienda qué juego agregar a
  continuación. Mantiene memoria en `references/game-ideas.md` y el backlog en
  `references/game-suggestions-todo.md`. No escribe código ni specs; el siguiente paso tras su recomendación
  es `/add-game`.

## Dev server

Antes de levantar `npm run dev`, verificar si ya hay una instancia corriendo (por ejemplo, revisando procesos en el puerto 3000). Si ya hay una instancia levantada, reutilizarla en vez de levantar una nueva.

## Screenshots de Playwright MCP

Todos los screenshots tomados con el MCP de Playwright (`browser_take_screenshot`) deben guardarse en `.playwright-screenshots/`, pasando el parámetro `filename` con esa ruta (ej. `.playwright-screenshots/home.png`). Directorio ignorado por git.

## Arquitectura

**Implementación real** (App Router, TypeScript), resultado de migrar el prototipo estático siguiendo los specs de `specs/`. Sesión mock (sin backend ni autenticación real) vía `localStorage` (`av_user`); ver `lib/avUser.ts` / `lib/useAvUser.ts`. El catálogo de juegos y los puntajes viven en Supabase (`lib/games.ts`, `lib/scores.ts`, `lib/scores.server.ts`); no hay data mock de juegos.

### Motores de juego

Punto de extensión introducido en el SPEC 07, usado por los juegos actuales y futuros a implementar (Asteroids, Tetris, Arkanoid, Snake y más):

- `lib/games/types.ts` define la interfaz común `ArcadeGameEngine` (`start()/pause()/resume()/restart()/destroy()`, opcional `setColorScheme()`) y el estado de HUD flexible `EngineState` (`{ score, stats: { key, label, value }[] }`).
- `lib/games/registry.ts` es el mapa `id → { width, height, secondaryCanvas?, colorSchemes?, initialState, create() }` que resuelve cada motor.
- `components/GamePlayer.tsx` es genérico: instancia el motor a través del registry según `game.id`, renderiza el HUD desde `engineState.stats`, agrega el canvas secundario cuando la entrada lo declara (hoy solo Tetris) y el selector de esquema de color cuando hay `colorSchemes` (hoy solo Tetris). **No debe volver a hardcodear un motor específico.**
- Convención para un juego nuevo: motor en `lib/games/<id>/engine.ts`, assets propios en `public/games/<id>/`, portada en una clase `.cover-<slug>` de `app/globals.css`, canvas con clase `game-canvas` (o `game-canvas-fixed` si hay canvas secundario). El motor nunca dibuja sus propios overlays de "GAME OVER"/"PAUSA"; dispara `onGameOver(finalScore)` y React controla pausa/modal.
- La skill `/add-game` describe este mismo patrón en detalle y lo usa para generar specs de juegos nuevos.

### Supabase y migraciones

- MCP de Supabase configurado en `.mcp.json` (proyecto `hcfjfjfqvnzwisurvbiz`); las migraciones se aplican con la tool `apply_migration` del MCP, nunca a mano.
- Migraciones versionadas en `supabase/migrations/`: `001_games_and_scores.sql` define el esquema y las políticas RLS; cada juego agrega solo su propio seed (`002_seed_tetris.sql`, `003_seed_arkanoid.sql`, `004_seed_snake.sql`). Un juego nuevo no debe tocar `001` ni las políticas existentes.
- El seed de un juego se aplica antes de escribir su motor: eso deja el juego visible en `/biblioteca` y `/salon` desde el inicio, aunque todavía no sea jugable.
- `npx tsx scripts/check-supabase.ts` valida la conexión usando las variables de `.env.local` (plantilla en `.env.template`).

### Formato y calidad

- Hook `PostToolUse` (`.claude/settings.json` → `.claude/hooks/format-file.ps1`) corre automáticamente `prettier --write` y `eslint --fix` sobre cada archivo escrito o editado; no hace falta formatear a mano. Excluye `node_modules/`, `.next/`, `references/`, `out/`, `build/`.
- Config de Prettier en `.prettierrc.json` (`printWidth: 100`, comillas dobles, `trailingComma: all`).
- `npm run build` es la verificación de tipos obligatoria antes de cerrar un spec; también hay `npm run lint` y `npm run format`.

**Prototipo de referencia** (`references/templates/`): HTML/JSX estático (React sin build, vía CDN) usado como guía funcional durante la migración. No se importa directamente en la app; sirve solo de referencia visual/funcional (`app.jsx`, `nav.jsx`, `biblioteca.jsx`, `detalle.jsx`, `reproductor.jsx`, `auth.jsx`, `salon.jsx`, `data.jsx`, `styles.css`).

**Código fuente de los juegos portados** (`references/started-games/`): JS original de cada juego antes de portarlo a TypeScript/Canvas (`02-asteroids`, `03-tetris`, `04-arkanoid`), fuente de verdad para nuevos ports vía `/add-game`.

**Assets crudos** (`references/assest-source/`): recursos gráficos sin procesar usados como base de un motor (ej. `snake-assets/`).

**Catálogo actual y memoria del planificador** (`references/implemented-games.md`, `references/game-ideas.md`, `references/game-suggestions-todo.md`): estado del catálogo de juegos y memoria/backlog que mantiene el agente `game-planner` (ver "Agentes" arriba).
