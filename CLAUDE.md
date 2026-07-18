# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Advertencia de versión

Este proyecto usa **Next.js 16.2.10** (App Router) con **React 19.2.4** y **Tailwind CSS v4**. Es una versión más nueva de la que puede reflejar tu conocimiento previo: APIs, convenciones y estructura de archivos pueden diferir. Antes de usar una API de Next.js de la que no estés seguro, consulta la documentación local en `node_modules/next/dist/docs/` (secciones `01-app` para App Router, `02-pages` para Pages Router) en vez de asumir comportamiento de versiones anteriores. Presta atención a los avisos de deprecación.

## Proyecto: Arcade Vault

Plataforma para jugar online y competir por puntos. El desarrollo sigue Spec Driven Design (carpetas/flujos `/spec` y `/spec-impl`) usando las skills de `Klerith/fernando-skills` (instalables con `npx skills@latest add Klerith/fernando-skills`). El código aún no refleja esta arquitectura: por ahora es el scaffold inicial de `create-next-app`.

## Stack

- **Next.js** 16.2.10 (App Router)
- **React** 19.2.4 / **React DOM** 19.2.4
- **TypeScript** ^5
- **Tailwind CSS** v4 (`@tailwindcss/postcss`)
- **ESLint** ^9 (`eslint-config-next`)

## Skills

Se debe usar siempre /frontend-desing para diseñar la interfaz de usuario.

## Arquitectura

**Prototipo de referencia** (`references/templates/`): HTML/JSX estático (React sin build,
 vía CDN) que define la UX objetivo de Arcade Vault y sirve de guía funcional para la impl
ementación real en App Router. No se debe importar directamente; hay que reescribirlo como
 componentes Next.js/TypeScript siguiendo Spec Driven Design.

- `app.jsx` — shell de la SPA: enrutamiento propio basado en `location.hash` (estado `rout
e` serializado en JSON) y sesión de usuario en `localStorage` (`av_user`). Al migrar a App
 Router esto se reemplaza por rutas reales de archivo (`app/**/page.tsx`) y el manejo de s
esión debe revisarse (localStorage → server/cookies según corresponda).
- `nav.jsx` — barra de navegación global.
- `biblioteca.jsx` — pantalla "Library": listado/catálogo de juegos, filtrable por categor
ía (`CATS`).
- `detalle.jsx` — ficha de un juego (`GameDetail`).
- `reproductor.jsx` — reproductor/ejecución del juego (`GamePlayer`), guarda puntajes en `
localStorage` (`av_scores`).
- `auth.jsx` — pantalla de login/registro (`Auth`).
- `salon.jsx` — salón de la fama / ranking (`HallOfFame`).
- `data.jsx` — datos mock compartidos: catálogo `GAMES` (id, título, categoría, mejor punt
aje, etc.), `CATS`, lista de jugadores y generador de tablas de puntajes de ejemplo (`seed
edScores`).
- `styles.css` — estilos del prototipo (paleta neón/pixel, variables CSS).
