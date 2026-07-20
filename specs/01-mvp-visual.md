# Spec 01 — MVP visual de Arcade Vault

- **Estado:** Aprobado
- **Dependencias:** Ninguna (primer spec del proyecto)
- **Fecha:** 2026-07-17
- **Objetivo:** Migrar las 5 pantallas del prototipo estático (`references/templates/`) a rutas reales de Next.js App Router con TypeScript, conservando la estética y la interactividad de UI del prototipo, sin implementar lógica de juego real ni backend.

## Alcance

### Incluye

- Layout global (`app/layout.tsx`) con `Nav` (barra superior + panel móvil) y footer, compartido por todas las rutas.
- `app/globals.css`: port casi literal de `references/templates/styles.css` (paleta neón/pixel, variables CSS, clases `.btn`, `.card`, `.chip`, etc.), cargado globalmente. Tailwind v4 se usa solo para ajustes puntuales de layout donde no haya ya una clase equivalente en el CSS portado.
- **Biblioteca** (`/`): grilla de juegos con búsqueda por nombre, filtro por categoría (chips) y efecto tilt en hover de las cards. Datos desde `GAMES` mock.
- **Detalle de juego** (`/juego/[id]`): ficha del juego, stats, tabla de mejores puntuaciones (`seededScores`), botones "Jugar ahora" y "Volver al Vault".
- **Reproductor** (`/jugar/[id]`): HUD (jugador, puntuación, vidas, nivel), marco CRT con arena estática (sin bucle de puntaje ni colisiones reales), botones Pausa/Fin/Salir. El botón "Fin" abre el modal de fin de partida con un puntaje mock fijo. El modal permite ingresar iniciales y "Guardar puntuación", que persiste en `localStorage` (`av_scores`) igual que el prototipo, y botones "Jugar de nuevo" / "Volver al Vault".
- **Auth** (`/auth`): formulario con tabs Iniciar sesión / Crear cuenta, botón "Jugar como invitado", botones sociales decorativos (Google/GitHub, sin acción). Al enviar, simula login guardando `{ name }` en `localStorage` (`av_user`) y navega a Biblioteca, igual que el prototipo.
- **Salón de la Fama** (`/salon`): tabs por juego, podio (top 3), tabla de ranking (`seededScores`), fila destacada "tu mejor marca" si hay sesión iniciada.
- Interactividad de UI client-side sin backend: filtros, tabs, hover/tilt, pausa, apertura/cierre de modal, tabs de auth, menú móvil del Nav.
- Sesión mock vía `localStorage` (`av_user`), leída/escrita desde componentes cliente — sin autenticación real, sin validación de credenciales, sin cookies ni servidor.
- Datos mock tipados con TypeScript en `lib/data.ts` (`Game`, `ScoreRow`, `Player`, etc.), con el mismo contenido que `data.jsx` del prototipo.

### No incluye (fuera de alcance)

- Cualquier lógica de juego jugable real (colisiones, físicas, input de teclado/táctil para jugar). El "Reproductor" es una maqueta visual estática.
- Backend, API routes, base de datos o autenticación real (OAuth, hashing de contraseñas, validación de credenciales).
- Persistencia de puntuaciones o cuentas en servidor — todo queda en `localStorage` del navegador, igual que el prototipo.
- Sistema de créditos/monedas funcional — el contador "CRÉDITOS · 03" en el Nav es decorativo.
- Menú desplegable real de cuenta de usuario — el click en el nombre de usuario cierra sesión directamente, sin dropdown.
- Responsive/accesibilidad más allá de lo que ya trae el CSS portado del prototipo.
- Tests automatizados.

## Modelo de datos

Todo el "modelo de datos" de este MVP es mock estático en cliente, tipado con TypeScript, en `lib/data.ts` (o `lib/data.ts` + `lib/types.ts` si conviene separar tipos).

### `Game`

```typescript
interface Game {
  id: string;
  title: string;
  short: string;
  long: string;
  cat: "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS";
  cover: string;       // clase CSS del fondo de portada (cover-bricks, cover-tetro, ...)
  color: "cyan" | "magenta" | "green" | "yellow";
  best: number;
  plays: string;        // ej. "12.4K"
}
```

- `GAMES: Game[]` — mismo contenido que el array `GAMES` de `data.jsx` (8 juegos).
- `CATS: readonly string[]` — `["TODOS", "ARCADE", "PUZZLE", "SHOOTER", "VERSUS"]`.

### `ScoreRow`

```typescript
interface ScoreRow {
  rank: number;
  name: string;
  score: number;
  date: string; // "DD/MM/2026"
}
```

- `PLAYERS: string[]` — lista de nombres mock (mismo contenido que el prototipo).
- `seededScores(seed: number, count?: number): ScoreRow[]` — misma función pseudoaleatoria determinista del prototipo, portada a TypeScript.

### Datos de sesión y puntuaciones (cliente, `localStorage`)

No son parte del mock estático sino estado que la app lee/escribe en el navegador, igual que el prototipo:

- `av_user` → `{ name: string } | null`.
- `av_scores` → array de `{ game: string; score: number; name: string; at: number }`, append-only, sin versionado (igual que el prototipo — fuera de alcance cualquier migración de esquema).

## Plan de implementación

1. **Base de estilos y layout global.** Portar `references/templates/styles.css` a `app/globals.css`. Crear `app/layout.tsx` con `<Nav />` y el footer, reemplazando el layout actual del scaffold. El sistema queda funcional mostrando el layout vacío/base.
2. **Datos mock tipados.** Crear `lib/data.ts` con `Game`, `ScoreRow`, `GAMES`, `CATS`, `PLAYERS`, `seededScores`, portados desde `data.jsx`.
3. **Componente `Nav`.** Crear `components/Nav.tsx` (port de `nav.jsx`) usando `usePathname`/`Link` de Next para resaltar la ruta activa y navegar, con menú móvil, estado de sesión leído de `localStorage` (`av_user`) y botón de login/logout. Se integra en el layout ya creado en el paso 1.
4. **Biblioteca.** Crear `components/Library.tsx` (con `GameCard` incluido) y `app/page.tsx` que la renderiza como home. Incluye búsqueda, filtro por categoría y efecto tilt. El sistema queda navegable desde la home con el catálogo completo visible.
5. **Detalle de juego.** Crear `components/GameDetail.tsx` y `app/juego/[id]/page.tsx`. Enlazar "JUGAR" de las cards y del detalle a `/juego/[id]` y `/jugar/[id]` respectivamente.
6. **Auth.** Crear `components/Auth.tsx` y `app/auth/page.tsx`, con el submit simulando login (guarda `av_user`, navega a home) y el botón "jugar como invitado".
7. **Reproductor.** Crear `components/GamePlayer.tsx` y `app/jugar/[id]/page.tsx`, con HUD y CRT estáticos (sin bucle de puntaje), pausa, modal de fin de partida con puntaje mock y guardado en `av_scores`.
8. **Salón de la Fama.** Crear `components/HallOfFame.tsx` y `app/salon/page.tsx`, con tabs por juego, podio y tabla de ranking, incluyendo la fila "tu mejor marca" cuando hay sesión.
9. **Repaso de navegación cruzada.** Verificar que todos los enlaces/botones entre las 5 pantallas (incluido Nav y menú móvil) apuntan a la ruta correcta y que el flujo completo (Biblioteca → Detalle → Reproductor → volver) funciona de punta a punta.

## Criterios de aceptación

- [x] `app/globals.css` incluye el CSS portado de `styles.css` y las 5 pantallas se ven visualmente equivalentes al prototipo (paleta neón, tipografías pixel, efectos glow/scanline).
- [x] El layout global renderiza `Nav` y el footer en todas las rutas.
- [ ] `/` (Biblioteca) muestra la grilla de `GAMES`, filtra por búsqueda de texto y por categoría (chips), y muestra el estado "NO HAY RESULTADOS" cuando el filtro no matchea nada.
- [x] `/juego/[id]` muestra la ficha del juego correspondiente al `id`, con sus stats y tabla de mejores puntuaciones generada por `seededScores`.
- [x] `/jugar/[id]` muestra el HUD y el marco CRT sin bucle de puntaje automático; el botón "Pausa" alterna el overlay de pausa; el botón "Fin" abre el modal de fin de partida con un puntaje mock fijo.
- [x] En el modal de fin de partida, ingresar iniciales y presionar "Guardar puntuación" persiste una entrada en `localStorage` bajo `av_scores` y cambia el UI a estado "guardado".
- [x] `/auth` permite alternar entre tabs "Iniciar sesión"/"Crear cuenta"; enviar el formulario o presionar "Jugar como invitado" guarda `av_user` en `localStorage` (o `null` para invitado) y navega a `/`.
- [x] Con `av_user` presente, `Nav` muestra el nombre de usuario en vez del botón "Iniciar sesión", y un click sobre el nombre cierra sesión (borra `av_user`) sin dropdown.
- [x] `/salon` muestra tabs por cada juego de `GAMES`, un podio con los 3 primeros puestos y una tabla de ranking; si hay sesión iniciada, se agrega la fila "tu mejor marca".
- [x] Navegar el flujo completo Biblioteca → Detalle → Reproductor → volver a Biblioteca, y Biblioteca → Salón de la Fama → volver, no produce errores en consola ni rutas rotas.
- [x] No existe ningún archivo/módulo del MVP que implemente lógica de juego jugable (colisiones, input de control, físicas).

## Decisiones tomadas y descartadas

- **Rutas de archivo reales de App Router** en vez de replicar el router por hash del prototipo. Es el patrón nativo de Next.js y evita mantener un router propio innecesario.
- **CSS portado casi literal** (`styles.css` → `globals.css`) en vez de reescribir todo a utilidades Tailwind. La estética neón/pixel ya está afinada en el prototipo; reescribirla en Tailwind es trabajo redundante sin beneficio para un MVP visual.
- **Reproductor con HUD/CRT estático** en vez de omitir la pantalla o mostrar solo un placeholder "próximamente". Mantiene la fidelidad visual completa del prototipo, que es el objetivo de este spec, sin simular gameplay real.
- **Auth y guardado de puntajes sí persisten en `localStorage`** (mismo mecanismo que el prototipo) aunque no haya backend. Se descartó dejarlos como cambios puramente visuales porque el prototipo ya define ese comportamiento y replicarlo no agrega complejidad de backend.
- **Componentes separados en `components/`** en vez de lógica embebida en cada `page.tsx`. Nav se comparte entre todas las rutas vía layout, lo que exige extraerlo como componente de todos modos; se mantiene el mismo criterio para el resto por consistencia.
- **Datos mock tipados con TypeScript** en vez de JS plano, coherente con que el resto del proyecto ya usa TypeScript.
- **Elementos decorativos sin funcionalidad** (botones sociales, contador de créditos, dropdown de cuenta) se mantienen como decorativos, igual que el prototipo — implementarlos queda fuera de alcance de este MVP visual.

## Riesgos identificados

- **Acceso a `localStorage`/`location` en Server Components.** Next.js App Router renderiza en servidor por defecto; leer `localStorage` o usar hooks de estado sin `"use client"` en los componentes que lo requieren (Nav, Auth, GamePlayer, Biblioteca) rompe el build o lanza error en runtime. Mitigación: marcar explícitamente esos componentes como client components y leer `localStorage` solo dentro de `useEffect`/handlers, nunca en el render inicial de servidor.
- **`id` de ruta dinámica inexistente.** Si `/juego/[id]` o `/jugar/[id]` reciben un `id` que no está en `GAMES` (URL manual o enlace roto), el prototipo simplemente retorna `null` (pantalla en blanco). Mitigación: usar `notFound()` de Next para mostrar el 404 nativo en vez de una pantalla vacía silenciosa.
- **Fuentes/assets del prototipo no incluidos.** `styles.css` puede referenciar fuentes pixel (`@font-face`) o rutas de imagen que no viajaron junto al CSS. Mitigación: al portar el CSS, verificar que toda fuente/asset referenciado exista en `public/` o se reemplace por una fuente equivalente disponible.
- **Colisión de nombres entre componente y ruta.** Hay una pantalla y un componente ambos llamados "Auth"/"auth" (`app/auth/page.tsx` vs `components/Auth.tsx`). Mitigación: mantener convención clara de nombres (`AuthForm` para el componente si hace falta evitar ambigüedad al importar).
- **Estado de sesión desincronizado entre pestañas/recargas.** Como no hay backend, `Nav` puede mostrar sesión inconsistente si `localStorage` cambia en otra pestaña. Riesgo aceptado explícitamente: está fuera de alcance sincronizar sesión entre pestañas en este MVP.
