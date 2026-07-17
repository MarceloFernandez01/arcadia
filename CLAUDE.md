# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Advertencia de versión

Este proyecto usa **Next.js 16.2.10** (App Router) con **React 19.2.4** y **Tailwind CSS v4**. Es una versión más nueva de la que puede reflejar tu conocimiento previo: APIs, convenciones y estructura de archivos pueden diferir. Antes de usar una API de Next.js de la que no estés seguro, consulta la documentación local en `node_modules/next/dist/docs/` (secciones `01-app` para App Router, `02-pages` para Pages Router) en vez de asumir comportamiento de versiones anteriores. Presta atención a los avisos de deprecación.

## Comandos

```bash
npm run dev      # servidor de desarrollo (Next.js con Turbopack)
npm run build    # build de producción
npm run start    # levantar el build de producción
npm run lint     # ESLint (flat config, eslint-config-next)
```

No hay suite de tests configurada todavía.

## Arquitectura

- **App Router** (`app/`): `app/layout.tsx` es el layout raíz (fuentes Geist Sans/Geist Mono vía `next/font/google`, `<html>`/`<body>` con flexbox de altura completa). `app/page.tsx` es la home, actualmente el scaffold por defecto de `create-next-app`.
- **Alias de imports**: `@/*` mapea a la raíz del proyecto (ver `tsconfig.json`).
- **Estilos**: Tailwind v4 vía `@tailwindcss/postcss`, importado en `app/globals.css` con `@import "tailwindcss"` y variables de tema (`@theme inline`) para colores/fuentes, con soporte de dark mode por `prefers-color-scheme`.
- **ESLint**: configuración flat (`eslint.config.mjs`) que compone `eslint-config-next/core-web-vitals` y `eslint-config-next/typescript`.

## Proyecto: Arcade Vault

Plataforma para jugar online y competir por puntos. El desarrollo sigue Spec Driven Design (carpetas/flujos `/spec` y `/spec-impl`) usando las skills de `Klerith/fernando-skills` (instalables con `npx skills@latest add Klerith/fernando-skills`). El código aún no refleja esta arquitectura: por ahora es el scaffold inicial de `create-next-app`.
