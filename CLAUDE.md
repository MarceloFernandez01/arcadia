# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Debes hablarme siempre en español neutro, el codigo ppuede estar en ingles. debe evitar simepre usar modismos y voceos.

## Advertencia de versión

Este proyecto usa **Next.js 16.2.10** (App Router) con **React 19.2.4** y **Tailwind CSS v4**. Es una versión más nueva de la que puede reflejar tu conocimiento previo: APIs, convenciones y estructura de archivos pueden diferir. Antes de usar una API de Next.js de la que no estés seguro, consulta la documentación local en `node_modules/next/dist/docs/` (secciones `01-app` para App Router, `02-pages` para Pages Router) en vez de asumir comportamiento de versiones anteriores. Presta atención a los avisos de deprecación.

## Proyecto: Arcade Vault

Plataforma para jugar online y competir por puntos. El desarrollo sigue Spec Driven Design (carpetas/flujos `/spec` y `/spec-impl`) usando las skills de `Klerith/fernando-skills` (instalables con `npx skills@latest add Klerith/fernando-skills`). El spec `specs/01-mvp-visual.md` (MVP visual, sin backend ni lógica de juego real) ya está mayormente implementado en `app/`, `components/` y `lib/`.

## Stack

- **Next.js** 16.2.10 (App Router)
- **React** 19.2.4 / **React DOM** 19.2.4
- **TypeScript** ^5
- **Tailwind CSS** v4 (`@tailwindcss/postcss`)
- **ESLint** ^9 (`eslint-config-next`)

## Skills

Se debe usar siempre /frontend-desing para diseñar la interfaz de usuario.

## Dev server

Antes de levantar `npm run dev`, verificar si ya hay una instancia corriendo (por ejemplo, revisando procesos en el puerto 3000). Si ya hay una instancia levantada, reutilizarla en vez de levantar una nueva.

## Screenshots de Playwright MCP

Todos los screenshots tomados con el MCP de Playwright (`browser_take_screenshot`) deben guardarse en `.playwright-screenshots/`, pasando el parámetro `filename` con esa ruta (ej. `.playwright-screenshots/home.png`). Directorio ignorado por git.

## Arquitectura

**Implementación real** (App Router, TypeScript), resultado de migrar el prototipo estático siguiendo `specs/01-mvp-visual.md`:

- `app/layout.tsx` — layout global: `Nav` + footer, compartido por todas las rutas.
- `app/page.tsx` — Biblioteca (`/`): grilla de juegos con búsqueda y filtro por categoría, usa `components/Library.tsx`.
- `app/juego/[id]/page.tsx` — Detalle de juego, usa `components/GameDetail.tsx`.
- `app/jugar/[id]/page.tsx` — Reproductor (HUD/CRT estático, sin lógica de juego real), usa `components/GamePlayer.tsx`.
- `app/auth/page.tsx` — Login/registro, usa `components/Auth.tsx`.
- `app/salon/page.tsx` — Salón de la Fama / ranking, usa `components/HallOfFame.tsx`.
- `app/globals.css` — port del CSS del prototipo (paleta neón/pixel, variables CSS, clases `.btn`, `.card`, `.chip`, etc.), con Tailwind v4 para ajustes puntuales.
- `components/Nav.tsx` — barra de navegación global (desktop + menú móvil), muestra sesión activa vía `lib/useAvUser.ts`.
- `lib/data.ts` — datos mock tipados: `Game`, `ScoreRow`, `GAMES`, `CATS`, `PLAYERS`, `seededScores`.
- `lib/avUser.ts` / `lib/useAvUser.ts` — manejo de sesión mock en `localStorage` (`av_user`), sin backend ni autenticación real; `useAvUser` expone el estado reactivo vía `useSyncExternalStore`.
- Puntuaciones del reproductor persisten en `localStorage` (`av_scores`).

**Prototipo de referencia** (`references/templates/`): HTML/JSX estático (React sin build, vía CDN) usado como guía funcional durante la migración. No se importa directamente en la app; sirve solo de referencia visual/funcional (`app.jsx`, `nav.jsx`, `biblioteca.jsx`, `detalle.jsx`, `reproductor.jsx`, `auth.jsx`, `salon.jsx`, `data.jsx`, `styles.css`).
