## Arcade Vault

Es una plataforma para jugar online y competir por la mayor cantidad de puntos.

Stack: Next.js 16.2.10 (App Router), React 19.2.4, TypeScript, Tailwind CSS v4.

## Estado actual

Specs implementadas en `specs/` (todas con estado "Implementado"):

- `01-mvp-visual.md` — MVP visual: 5 pantallas (Biblioteca, Detalle de juego, Reproductor, Auth, Salón de la Fama) migradas del prototipo estático (`references/templates/`) a rutas reales de App Router, con sesión y puntuaciones mock persistidas en `localStorage`. Sin backend ni lógica de juego real.
- `02-home-page.md` — página de inicio (`/`) con `components/Home.tsx`; la Biblioteca se movió de `/` a `/biblioteca`.
- `03-about-page-resend.md` — página "Acerca de" (`/about`) con formulario de contacto que envía correos reales vía Resend desde una API Route (`app/api/contact/route.ts`).
- `04-integracion-supabase.md` — conexión técnica con Supabase: clientes de navegador y servidor (`lib/supabase/client.ts`, `lib/supabase/server.ts`) vía `@supabase/ssr`, y script de verificación (`scripts/check-supabase.ts`). Sin tablas, sin autenticación real todavía.
- `05-asteroids-game.md` — juego Asteroids con motor real en TypeScript/Canvas (`lib/games/asteroids/engine.ts`), integrado en `GamePlayer.tsx` con HUD conectado en tiempo real (puntuación, vidas, nivel).
- `06-leaderboard-supabase.md` — migración del catálogo de juegos y los puntajes a Supabase (tablas `games` y `scores`, `lib/games.ts`, `lib/scores.ts`). El catálogo ya no tiene datos mock: `getAllGames()`, `getGameById()` y el Salón de la Fama (`HallOfFame.tsx`) consultan únicamente Supabase.
- `07-tetris-game.md` — juego Tetris (`lib/games/tetris/engine.ts`, con canvas secundario de "siguiente pieza"); introdujo el punto de extensión `lib/games/types.ts` + `lib/games/registry.ts`.
- `08-arkanoid-game.md` — juego Arkanoid (`lib/games/arkanoid/engine.ts`, `levels.ts`, `spritesheet.ts`), con assets en `public/games/arkanoid/`.
- `09-snake-game.md` — juego Snake (`lib/games/snake/engine.ts`, `fruits.ts`), con wrap-around en los bordes y frutas del atlas retro.

Además existe una game jam en `specs/game-jam/frogger/` con dos specs en estado **Draft** (sin implementar): `01-frogger-game.md` (Frogger clásico, id `frogger`) y `02-frogger-poderes-game.md` (variante con poderes temporales, id `frogger-poderes`). Ambas son autocontenidas e independientes entre sí.

Sesión de usuario sigue siendo mock (sin autenticación real) vía `localStorage` (`components/Auth.tsx`, `lib/avUser.ts`) — la auth real queda para un spec futuro, junto con la limpieza de puntajes de invitados guardados sin usuario autenticado.

Para el envío de correos se necesita un `.env.local` (no versionado) basado en `.env.template`, con `RESEND_API_KEY` y `CONTACT_TO_EMAIL`. Para la conexión a Supabase se necesitan además `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (el proyecto usa el sistema nuevo de API keys de Supabase, sin anon key clásica).

## Catálogo de juegos

Catálogo actual en Supabase (tabla `games`), todos implementados:

| ID           | Título     | Categoría | Skins                                                                 |
| ------------ | ---------- | --------- | --------------------------------------------------------------------- |
| `asteroides` | Asteroides | Shooter   | Clásico, Retro, Neón                                                  |
| `tetris`     | Tetris     | Puzzle    | Retro, Normal, Pastel, Neón (pendiente de migrar al esquema canónico) |
| `arkanoid`   | Arkanoid   | Arcade    | Clásico, Retro, Neón                                                  |
| `snake`      | Snake      | Arcade    | Clásico, Retro, Neón                                                  |

## Skins

Los tres skins canónicos de la plataforma son **Clásico** (default), **Retro** y **Neón**. El contrato vive en `lib/games/skins.ts` (`SkinId`, `CANONICAL_SKINS`, `resolveSkin()`), y cada juego define su paleta en `lib/games/<id>/skins.ts`. El selector aparece en el reproductor (`GamePlayer.tsx`) y la elección se persiste por juego en `localStorage`. Tetris todavía usa su propia lista de esquemas (no migrada al módulo compartido); ver `references/game-with-theme.md` para el detalle y el pendiente.

## Agentes y skills

- `/add-game` — genera el spec de un juego nuevo con leaderboard, sin escribir código.
- `game-planner` — recomienda el próximo juego a agregar según el catálogo y su memoria en `references/game-ideas.md` / `references/game-suggestions-todo.md`.
- `game-jam` — genera, para un juego concreto, dos specs de implementación (base + variante) en `specs/game-jam/<slug>/`.
- `skin-designer` — aplica los skins canónicos al motor de un juego, uno por invocación; mantiene memoria en `references/game-with-theme.md`.

## Usa Spec Driven Design

Basado en /spec y /spec-impl

Siguiendo las buenas practicas recomendadas aquí:
https://github.com/Klerith/fernando-skills

## Skills usadas

```bash
npx skills@latest add Klerith/fernando-skills
```

## Comandos

```bash
npm run dev      # servidor de desarrollo (Next.js con Turbopack)
npm run build    # build de producción
npm run start    # levantar el build de producción
npm run lint     # ESLint (flat config, eslint-config-next)
npm run format   # Prettier --write

npx tsx scripts/check-supabase.ts   # valida la conexión a Supabase con las variables de .env.local
```
