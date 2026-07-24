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

## Skills

Se debe usar siempre /frontend-desing para diseñar la interfaz de usuario.

## Dev server

Antes de levantar `npm run dev`, verificar si ya hay una instancia corriendo (por ejemplo, revisando procesos en el puerto 3000). Si ya hay una instancia levantada, reutilizarla en vez de levantar una nueva.

## Screenshots de Playwright MCP

Todos los screenshots tomados con el MCP de Playwright (`browser_take_screenshot`) deben guardarse en `.playwright-screenshots/`, pasando el parámetro `filename` con esa ruta (ej. `.playwright-screenshots/home.png`). Directorio ignorado por git.

## Arquitectura

**Implementación real** (App Router, TypeScript), resultado de migrar el prototipo estático siguiendo los specs de `specs/`. Sesión mock (sin backend ni autenticación real) vía `localStorage` (`av_user`, `av_scores`); ver `lib/avUser.ts` / `lib/useAvUser.ts`.

**Prototipo de referencia** (`references/templates/`): HTML/JSX estático (React sin build, vía CDN) usado como guía funcional durante la migración. No se importa directamente en la app; sirve solo de referencia visual/funcional (`app.jsx`, `nav.jsx`, `biblioteca.jsx`, `detalle.jsx`, `reproductor.jsx`, `auth.jsx`, `salon.jsx`, `data.jsx`, `styles.css`).
