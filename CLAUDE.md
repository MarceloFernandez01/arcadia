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

Además existen game jams en `specs/game-jam/<slug>/`, generadas por el agente `game-jam` (ver "Agentes"): la numeración `GJ-` es local a esa carpeta y no consume la numeración correlativa global anterior. Hoy solo existe `specs/game-jam/frogger/` con dos specs en estado **Draft**, sin implementar: `01-frogger-game.md` (Frogger clásico, id `frogger`) y `02-frogger-poderes-game.md` (variante con poderes temporales, id `frogger-poderes`); ambas autocontenidas e independientes entre sí.

## Skills

Se debe usar siempre `/frontend-design` para diseñar la interfaz de usuario.

Flujo de Spec Driven Design (skills globales en `~/.claude/skills/`):

- `/spec` — genera specs sección por sección con confirmación del usuario, sin escribir código.
- `/spec-impl` — implementa un spec ya aprobado.
- `/add-game` (skill de proyecto en `.claude/skills/add-game/SKILL.md`) — genera el spec de un juego nuevo con leaderboard (`specs/NN-<slug>.md`) siguiendo el patrón de los specs 05–09; no escribe código, no toca Supabase ni ejecuta migraciones.
- `/spec-impl-game` (skill de proyecto en `.claude/skills/spec-impl-game/SKILL.md`) — variante de `/spec-impl` para specs que agregan un juego nuevo: sigue el mismo lineamiento (valida estado "Aprobado", crea rama, implementa paso a paso) y, al terminar y con `npm run build` limpio, encadena en serie (nunca en paralelo) los agentes `skin-designer` y luego `mobile-porter` sobre el juego recién implementado.

## Agentes

- `game-planner` (`.claude/agents/game-planner.md`) — analiza el catálogo y recomienda qué juego agregar a
  continuación. Mantiene memoria en `references/game-ideas.md` y el backlog en
  `references/game-suggestions-todo.md`. No escribe código ni specs; el siguiente paso tras su recomendación
  es `/add-game`.
- `game-jam` (`.claude/agents/game-jam.md`) — recibe un juego concreto (ej. "Pac-Man") y, sin
  consultar nada intermedio, genera 2 specs de implementación de ese mismo juego en
  `specs/game-jam/<game-slug>/`: `01-<base-id>-game.md` con el juego base y `02-<mod-id>-game.md`
  con una modificación (niveles, power-ups, u otra que el usuario indique en el prompt de
  invocación), ambos siguiendo el patrón técnico de los specs 07–09 y autocontenidos e
  implementables por separado (la `02` no depende de la `01`). Puede usar `WebSearch`/`WebFetch`
  para verificar reglas y balance del original cuando es un clásico conocido. No escribe código, no
  toca Supabase ni ejecuta migraciones; la numeración `GJ-` es local a la carpeta y no consume la
  numeración correlativa global de `specs/`. El siguiente paso es que el usuario revise los 2
  archivos y decida cuál llevar a `/spec-impl`.
- `skin-designer` (`.claude/agents/skin-designer.md`) — aplica los 3 skins canónicos
  (`clasico`/`retro`/`neon`) al motor de un juego concreto, uno por invocación (nunca reskinea el
  catálogo entero de una corrida). Si no se le indica un juego, reporta pendientes desde
  `references/game-with-theme.md` y se detiene. A diferencia de `game-planner`/`game-jam`, sí escribe
  código: crea `lib/games/skins.ts` y `lib/games/<id>/skins.ts`, refactoriza el `engine.ts` del juego
  indicado y verifica el resultado con capturas de Playwright. Mantiene memoria en
  `references/game-with-theme.md`.
- `mobile-porter` (`.claude/agents/mobile-porter.md`) — revisa y corrige la adaptación a navegador
  móvil de un juego o un elemento/página concreto (ej. "menú principal", "salón", un juego puntual),
  uno por invocación. Si no se le indica un objetivo, reporta pendientes desde
  `references/mobile-review-log.md` y se detiene. Toma como fuente de convenciones ya acordadas los
  specs `10-controles-tactiles-moviles.md` y `11-refinamiento-hud-movil.md`. Sí escribe código
  (CSS/TSX), pero audita de forma **estática** (lectura de código y CSS contra los anchos 360/375/414px,
  sin Playwright ni navegador); la comprobación visual final queda a cargo del usuario en un
  dispositivo real. Su alcance es exclusivamente navegador móvil (no agrega PWA, manifest, service
  worker ni ningún wrapper nativo tipo Capacitor). En un juego, siempre garantiza controles táctiles
  jugables (agrega `touchControls` al registry aunque el spec del juego los omita o los declare fuera
  de alcance, y puede sumar un binding de teclado faltante al motor solo para habilitar un botón) y que
  el HUD del reproductor quede en una sola línea a 360px (con una escalera de recursos que llega hasta
  abreviar etiquetas en modo táctil como último recurso, solo en táctil). Mantiene memoria en
  `references/mobile-review-log.md`.
- `game-performance` (`.claude/agents/game-performance.md`) — optimiza el rendimiento por frame del
  motor de un juego concreto (fondo estático cacheado en canvas offscreen, sprites con glow horneado,
  glow agrupado por lote de color, lookups precalculados, notificación al HUD condicional a un cambio
  real, derivados cacheados por tick), siguiendo el catálogo de `specs/12-optimizacion-performance-frogger.md`,
  cuya implementación en `lib/games/frogger/engine.ts` es su referencia canónica. **Solo se ejecuta cuando
  el usuario u otro agente le indica explícitamente qué juego optimizar**: nunca elige el juego por su
  cuenta ni se dispara solo; sin un juego indicado, se detiene sin tocar código. Si el juego indicado no
  figura en su memoria, lo analiza igual desde cero antes de optimizarlo. Sí escribe código, pero verifica
  de forma **estática** (lectura de código + `npm run build`/`npm run lint`, sin Playwright ni navegador);
  la comprobación visual final queda a cargo del usuario. Ninguna optimización puede alterar el resultado
  visual ni la jugabilidad. Mantiene memoria en `references/game-performance-log.md`.

## Dev server

Antes de levantar `npm run dev`, verificar si ya hay una instancia corriendo (por ejemplo, revisando procesos en el puerto 3000). Si ya hay una instancia levantada, reutilizarla en vez de levantar una nueva.

## Screenshots de Playwright MCP

Todos los screenshots tomados con el MCP de Playwright (`browser_take_screenshot`) deben guardarse en `.playwright-screenshots/`, pasando el parámetro `filename` con esa ruta (ej. `.playwright-screenshots/home.png`). Directorio ignorado por git.

## Arquitectura

**Implementación real** (App Router, TypeScript), resultado de migrar el prototipo estático siguiendo los specs de `specs/`. Sesión mock (sin backend ni autenticación real) vía `localStorage` (`av_user`); ver `lib/avUser.ts` / `lib/useAvUser.ts`. El catálogo de juegos y los puntajes viven en Supabase (`lib/games.ts`, `lib/scores.ts`, `lib/scores.server.ts`); no hay data mock de juegos.

### Motores de juego

Punto de extensión introducido en el SPEC 07 para los juegos (Asteroids, Tetris, Arkanoid, Snake y más). Detalle completo, incluyendo el sistema de skins, en `lib/games/CLAUDE.md`.

### Supabase y migraciones

Ver `supabase/CLAUDE.md` para el detalle de migraciones, seeds y validación de conexión.

### Formato y calidad

- Hook `PostToolUse` (`.claude/settings.json` → `.claude/hooks/format-file.ps1`) corre automáticamente `prettier --write` y `eslint --fix` sobre cada archivo escrito o editado; no hace falta formatear a mano. Excluye `node_modules/`, `.next/`, `references/`, `out/`, `build/`.
- Config de Prettier en `.prettierrc.json` (`printWidth: 100`, comillas dobles, `trailingComma: all`).
- `npm run build` es la verificación de tipos obligatoria antes de cerrar un spec; también hay `npm run lint` y `npm run format`.

**Prototipo de referencia** (`references/templates/`): HTML/JSX estático (React sin build, vía CDN) usado como guía funcional durante la migración. No se importa directamente en la app; sirve solo de referencia visual/funcional (`app.jsx`, `nav.jsx`, `biblioteca.jsx`, `detalle.jsx`, `reproductor.jsx`, `auth.jsx`, `salon.jsx`, `data.jsx`, `styles.css`).

**Código fuente de los juegos portados** (`references/started-games/`): JS original de cada juego antes de portarlo a TypeScript/Canvas (`02-asteroids`, `03-tetris`, `04-arkanoid`), fuente de verdad para nuevos ports vía `/add-game`.

**Assets crudos** (`references/assest-source/`): recursos gráficos sin procesar usados como base de un motor (ej. `snake-assets/`, `frogger-assets/`).

**Catálogo actual y memoria del planificador** (`references/implemented-games.md`, `references/game-ideas.md`, `references/game-suggestions-todo.md`): estado del catálogo de juegos y memoria/backlog que mantiene el agente `game-planner` (ver "Agentes" arriba).

**Memoria de skins** (`references/game-with-theme.md`): estado de skins (`clasico`/`retro`/`neon`) por juego que mantiene el agente `skin-designer` (ver "Agentes" arriba).

**Memoria de performance** (`references/game-performance-log.md`): estado de optimización por juego que mantiene el agente `game-performance` (ver "Agentes" arriba).
