## Arcade Vault

Es una plataforma para jugar online y competir por la mayor cantidad de puntos.

Stack: Next.js 16.2.10 (App Router), React 19.2.4, TypeScript, Tailwind CSS v4.

## Estado actual

Specs implementadas en `specs/`:

- `01-mvp-visual.md` — MVP visual: 5 pantallas (Biblioteca, Detalle de juego, Reproductor, Auth, Salón de la Fama) migradas del prototipo estático (`references/templates/`) a rutas reales de App Router, con sesión y puntuaciones mock persistidas en `localStorage`. Sin backend ni lógica de juego real.
- `02-home-page.md` — página de inicio (`/`) con `components/Home.tsx`; la Biblioteca se movió de `/` a `/biblioteca`.
- `03-about-page-resend.md` — página "Acerca de" (`/about`) con formulario de contacto que envía correos reales vía Resend desde una API Route (`app/api/contact/route.ts`).

Para el envío de correos se necesita un `.env.local` (no versionado) basado en `.env.template`, con `RESEND_API_KEY` y `CONTACT_TO_EMAIL`.

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
```
