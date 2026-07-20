# Spec 02 — Home landing page

- **Estado:** Implementado
- **Dependencias:** 01-mvp-visual
- **Fecha:** 2026-07-19
- **Objetivo:** Agregar una nueva página de inicio (Home) como ruta principal (`/`) del proyecto, migrando `home.jsx` del prototipo, y mover la Biblioteca actual (grilla de juegos) a `/biblioteca`.

## Alcance

### Incluye

- Nueva ruta `/` (pimplementar tambien `/home`) con el componente `Home` (`components/Home.tsx`), port fiel de `references/templates/home-about/home.jsx`: hero con siluetas flotantes (`FloatingSilhouettes`), animación scroll-reveal (`useReveal`), secciones "Por qué Arcade Vault", "Juegos disponibles ahora" (usa `GAMES.slice(0,6)` de `lib/data.ts`), "Estadísticas", "Actividad en vivo" (datos hardcodeados inline, igual que el prototipo), "Precios/FAQ" y CTA final.
- Los botones/CTAs del Home que en el prototipo navegaban a `biblioteca` ahora apuntan a `/biblioteca`; los que navegaban a `auth`/`salon`/`detalle` apuntan a `/auth`, `/salon`, `/juego/[id]` respectivamente.
- La Biblioteca actual (grilla de juegos con búsqueda y filtro, hoy en `app/page.tsx`) se mueve a `app/biblioteca/page.tsx`, sin cambios funcionales.
- `app/page.tsx` pasa a renderizar `Home` en vez de `Library`.
- CSS: portar el bloque `/* ===== HOME PAGE ===== */` de `references/templates/home-about/styles.css` (líneas ~930 en adelante: `.home`, `.home-hero`, `.home-silos`, `.feature-*`, `.mini-*`, `.home-stats`, `.activity-*`, `.top-*`, `.pricing-*`, `.home-final`, `.reveal`/`.in`, etc.) hacia `app/globals.css`, agregado al final del archivo.
- `components/Nav.tsx`: agregar enlace "Inicio" apuntando a `/`, y actualizar el enlace "Biblioteca" para apuntar a `/biblioteca` (en vez de `/`). Se actualiza también la lógica `isActive` para reflejar las nuevas rutas. Esto aplica tanto al nav de escritorio como al panel móvil.
- Cualquier lugar del código actual que enlace a `/` esperando la Biblioteca (por ejemplo el logo del Nav) se revisa y decide explícitamente si debe apuntar a `/` (ahora Home) o `/biblioteca`.

### No incluye (fuera de alcance)

- Página "Acerca de" (`about.jsx` del prototipo): no se crea ninguna ruta `/about` ni se agrega el enlace "Acerca de" al Nav.
- Cualquier dato real detrás de las secciones "Actividad en vivo" y "Top jugadores" del Home — quedan con los mismos arrays hardcodeados del prototipo, sin conectar a `av_scores` ni a lógica real.
- Cambios a la lógica interna de la Biblioteca (búsqueda, filtro, tilt) más allá de moverla de ruta.
- Tests automatizados.

## Modelo de datos

Este spec no introduce nuevas estructuras de datos en `lib/data.ts`. Los arrays de "Actividad en vivo" (últimas puntuaciones) y "Top jugadores" del Home quedan como constantes locales dentro de `components/Home.tsx`, igual que en `home.jsx` del prototipo (no se exportan ni se tipan como parte del modelo compartido).

## Plan de implementación

1. **CSS del Home.** Portar el bloque `/* ===== HOME PAGE ===== */` de `references/templates/home-about/styles.css` al final de `app/globals.css`. El sistema queda funcional sin cambios visibles todavía (CSS sin usar).
2. **Componente `Home`.** Crear `components/Home.tsx` como port de `home.jsx`: `useReveal`, `FloatingSilhouettes`, `MiniCard`, `FeatureIcon` y el componente `Home` con sus secciones, usando `GAMES` de `lib/data.ts` para la sección de juegos y arrays locales para actividad/top jugadores. Los `navigate`/`onClick` del prototipo se traducen a `Link`/`useRouter` de Next hacia `/biblioteca`, `/auth`, `/salon`, `/juego/[id]`.
3. **Mover Biblioteca a `/biblioteca`.** Crear `app/biblioteca/page.tsx` que renderiza `Library` (mismo contenido que el actual `app/page.tsx`).
4. **Nuevo `/` como Home.** Reemplazar el contenido de `app/page.tsx` para que renderice `Home` en vez de `Library`. El sistema queda navegable: `/` muestra el Home y `/biblioteca` muestra la grilla de juegos.
5. **Actualizar `Nav`.** En `components/Nav.tsx`, agregar el enlace "Inicio" (`/`), actualizar el enlace "Biblioteca" para apuntar a `/biblioteca`, y ajustar `isActive` para que "Inicio" se marque activo solo en `/` y "Biblioteca" se marque activo en `/biblioteca`, `/juego/*` y `/jugar/*`. Aplicar el mismo cambio en el panel móvil.
6. **Repaso de navegación cruzada.** Verificar que todos los enlaces/CTAs del Home, del Nav (desktop y móvil) y del logo apuntan a la ruta correcta, y que el flujo Home → Biblioteca → Detalle → Reproductor → volver funciona sin rutas rotas ni errores de consola.

## Criterios de aceptación

- [x] `/` y `/home` renderiza el componente `Home` con todas sus secciones (hero, "por qué Arcade Vault", juegos disponibles, estadísticas, actividad en vivo, precios/FAQ, CTA final) visualmente equivalentes a `home.jsx`/`home-about/styles.css`.
- [x] El hero del Home muestra las siluetas flotantes decorativas (`FloatingSilhouettes`) y las secciones aplican la animación scroll-reveal (clase `.reveal`/`.in`) al entrar en viewport.
- [x] La sección "Juegos disponibles ahora" del Home muestra los primeros 6 juegos de `GAMES` (`lib/data.ts`) como `MiniCard`, cada una navega a `/juego/[id]`.
- [x] Los botones "Explorar juegos", "Ver todos los juegos" y el CTA final del Home navegan a `/biblioteca`; el botón "Crear cuenta" navega a `/auth`; el enlace "Ver salón" navega a `/salon`.
- [x] `/biblioteca` muestra la misma grilla de juegos con búsqueda y filtro por categoría que antes vivía en `/`, sin cambios de comportamiento.
- [x] `Nav` muestra "Inicio" y "Biblioteca" como enlaces separados, tanto en escritorio como en el panel móvil; "Inicio" está activo solo en `/`, "Biblioteca" está activo en `/biblioteca`, `/juego/[id]` y `/jugar/[id]`.
- [x] `Nav` no muestra ningún enlace "Acerca de".
- [x] Navegar el flujo Home → Biblioteca → Detalle → Reproductor → volver a Biblioteca → Inicio, y Home → Salón de la Fama → volver, no produce errores en consola ni rutas rotas.
- [x] No existe la ruta `/about` ni ningún archivo que la implemente.

## Decisiones tomadas y descartadas

- **Home reemplaza a Biblioteca como ruta `/`**, y Biblioteca se mueve a `/biblioteca`, en vez de poner el Home en una ruta nueva (ej. `/home`) y dejar Biblioteca en `/`. Es lo que pidió explícitamente el usuario: Home debe ser la página principal.
- **Se ignora "Acerca de" por completo** (sin ruta, sin enlace en Nav) en vez de crear un placeholder o dejar el enlace deshabilitado. El usuario indicó que ese módulo no se necesita por ahora; agregar un placeholder sería trabajo fuera de alcance sin valor inmediato.
- **Datos de "Actividad en vivo" y "Top jugadores" quedan hardcodeados dentro de `Home.tsx`**, igual que en el prototipo, en vez de derivarlos de `av_scores`/`lib/data.ts`. Conectarlos a datos reales/mock compartidos es trabajo adicional no pedido y rompería la fidelidad exacta con la referencia visual, que es el requisito explícito de este spec.
- **CSS portado casi literal** desde `home-about/styles.css` (bloque `HOME PAGE`) al final de `globals.css`, en vez de reescribirlo con utilidades Tailwind, siguiendo el mismo criterio que el spec 01 para mantener fidelidad visual exacta.
- **Fidelidad visual exacta como requisito no negociable**: el usuario remarcó explícitamente que el Home debe verse igual al prototipo de referencia, por lo que se prioriza portar `useReveal`, `FloatingSilhouettes` y las animaciones tal cual, sin simplificaciones.

## Riesgos identificados

- **`IntersectionObserver` en Server Components.** `useReveal` usa `useEffect` y `document.querySelectorAll`, por lo que `Home.tsx` debe marcarse `"use client"` explícitamente, igual que el resto de componentes interactivos del proyecto. Mitigación: agregar la directiva al inicio del archivo y verificar que no se rompe el build.
- **Enlaces internos rotos por el cambio de ruta de la Biblioteca.** Cualquier `Link`/`router.push` existente que asuma que la Biblioteca vive en `/` (por ejemplo el logo del Nav, o botones "Volver al Vault" en Detalle/Reproductor) debe revisarse y actualizarse a `/biblioteca` si corresponde, o dejarse en `/` si ahora debe llevar al Home. Mitigación: el paso 6 del plan de implementación cubre este repaso explícitamente.
- **Fuentes/assets del bloque CSS de Home.** El bloque `HOME PAGE` de `home-about/styles.css` puede depender de variables CSS (`--cyan`, `--magenta`, `--pixel`, etc.) ya definidas en `globals.css`; si alguna variable no existe se rompe el estilo silenciosamente. Mitigación: verificar visualmente el Home tras portar el CSS y comparar contra el prototipo.
