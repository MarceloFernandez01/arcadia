# Spec 05 — Juego Asteroids

- **Estado:** Implementado
- **Dependencias:** 01-mvp-visual, 02-home-page (rutas `/juego/[id]` y `/jugar/[id]`)
- **Fecha:** 2026-07-24
- **Objetivo:** Adaptar el juego Asteroids de referencia (`references/started-games/02-asteroids`) como un motor real en TypeScript/Canvas, integrado en `GamePlayer` bajo el nuevo id `asteroides`, notificando a React el puntaje/vidas/nivel en tiempo real.

## Alcance

### Incluye

- Agregar una nueva entrada `asteroides` a `GAMES` en `lib/data.ts` (título, descripción corta/larga, categoría `SHOOTER`, cover, color, `best`/`plays` de ejemplo) reutilizando el copy del README del juego de referencia como base. La entrada `rocas` existente no se modifica ni se elimina.
- Motor del juego portado a TypeScript manteniendo la arquitectura de clases del original (`Bullet`, `Asteroid`, `Ship`, `Particle`, `PowerUp`), incluyendo power-ups de triple disparo, en un módulo nuevo dentro de `lib/games/asteroids/` (sin variables globales de módulo — el estado vive encapsulado por instancia, para soportar montar/desmontar el componente sin fugas de estado).
- El motor expone un callback `onStateChange` que se invoca solo cuando cambian `score`, `lives` o `level` (no en cada frame), y un callback `onGameOver` que se invoca cuando `lives` llega a 0.
- `GamePlayer.tsx` detecta si el juego tiene motor real (por ahora, solo `asteroides`) y en ese caso renderiza un `<canvas>` de 800×600 dentro de `.crt-screen` en vez del arena mock (`.game-arena` con enemigos/nave decorativos), escalado por CSS al tamaño del contenedor.
- El HUD de React (`player-hud`: Puntuación, Vidas, Nivel) se conecta al estado real del motor vía `onStateChange`. El HUD dibujado dentro del canvas (`drawHUD` del original) se mantiene tal cual, fiel al juego de referencia. Ambos HUD conviven en este spec.
- El overlay interno de "GAME OVER" del canvas se deshabilita (no se dibuja, no reinicia con Espacio): al llegar a 0 vidas, el motor solo invoca `onGameOver`.
- React controla la pausa desde afuera: el motor expone `pause()`/`resume()`, y el botón "PAUSA" del `player-hud` los invoca. El overlay visual "EN PAUSA" lo sigue dibujando React (el `div.crt-content` ya existente), no el canvas.
- El botón **FIN** congela el motor (sin matar la nave ni descontar vidas) y abre el modal existente de fin de partida con el puntaje acumulado real.
- Al perder la última vida (`onGameOver`), se dispara el mismo modal de fin de partida con el puntaje real (mismo camino que el botón FIN).
- El botón **JUGAR DE NUEVO** del modal reinicia una instancia nueva del motor (`restart()`).
- `saveScore` guarda en `av_scores` el puntaje real obtenido por el motor (reemplaza `MOCK_FINAL_SCORE`).
- Limpieza de listeners de teclado y cancelación del `requestAnimationFrame` al desmontar el componente o salir del juego.

### No incluye (fuera de alcance)

- Sonidos/efectos de audio (el original no los tiene).
- Controles táctiles/móviles — solo teclado (`←` `→` `↑` `Espacio`), igual que el original.
- Persistencia de high score específico de Asteroids más allá del mecanismo genérico `av_scores` ya existente.
- Leaderboard/Salón de la Fama para Asteroids: `saveScore` solo escribe en `av_scores` (localStorage), pero no se muestra ni se conecta ningún ranking (`HallOfFame.tsx`, `/salon`) con los puntajes de este juego en este spec.
- Cambios al resto de juegos de `GAMES` (siguen con el arena mock tal cual, incluida `rocas`).
- Cambios a `GameDetail.tsx` o a la ruta `/juego/[id]` más allá de que ahora exista también una entrada navegable para `asteroides`.
- Tests automatizados.

## Modelo de datos

Este spec no introduce persistencia nueva (el guardado de puntaje sigue usando `av_scores` en `localStorage`, ya existente). Sí introduce tipos nuevos en TypeScript para el motor:

```ts
// lib/games/asteroids/engine.ts
export interface AsteroidsEngineState {
  score: number;
  lives: number;
  level: number;
}

export interface AsteroidsEngineOptions {
  onStateChange: (state: AsteroidsEngineState) => void;
  onGameOver: (finalScore: number) => void;
}

export class AsteroidsEngine {
  constructor(canvas: HTMLCanvasElement, options: AsteroidsEngineOptions);
  start(): void;
  pause(): void;
  resume(): void;
  restart(): void;
  destroy(): void; // cancela rAF y remueve listeners de teclado
}
```

- `GAMES` en `lib/data.ts` gana una entrada más (`asteroides: Game`), usando la interfaz `Game` ya existente — no se agrega ningún campo nuevo a esa interfaz.

## Plan de implementación

1. **Motor del juego en TypeScript.** Crear `lib/games/asteroids/engine.ts` portando las clases del original (`Bullet`, `Asteroid`, `Ship`, `Particle`, `PowerUp`) y las constantes (`RADII`, `SPEEDS`, `POINTS`, `POWERUP_DROP_CHANCE`, etc.), encapsuladas en la clase `AsteroidsEngine` con métodos públicos `start()`, `pause()`, `resume()`, `restart()`, `destroy()`. El estado (`score`, `lives`, `level`, `state`) vive como propiedades de instancia, no como variables globales de módulo. El sistema queda igual (el motor no se usa todavía en ningún componente).
2. **Callbacks de notificación.** Dentro de `AsteroidsEngine`, integrar `onStateChange` (invocado solo cuando cambia `score`, `lives` o `level`) y `onGameOver` (invocado cuando `lives` llega a 0, en vez de setear `state = 'gameover'` y dibujar el overlay interno). Se quita el manejo de `Espacio` para reiniciar desde game over (ahora lo controla React). Todavía sin uso en la UI.
3. **Registro del nuevo juego.** Agregar la entrada `asteroides` a `GAMES` en `lib/data.ts`, basada en el copy de `references/started-games/02-asteroids/README.md`. Se puede visitar `/juego/asteroides` y `/jugar/asteroides` (con el arena mock todavía, sin canvas real).
4. **Canvas real en `GamePlayer`.** En `components/GamePlayer.tsx`, detectar si `game.id === "asteroides"` (o una lista de ids con motor real) y en ese caso renderizar un `<canvas width={800} height={600}>` dentro de `.crt-screen` en vez de `.game-arena`; instanciar `AsteroidsEngine` en un `useEffect` al montar, y `destroy()` al desmontar. El sistema queda jugable con Asteroids real, aunque el HUD de React todavía no refleja el estado (valores fijos previos).
5. **Conectar HUD real.** Usar `onStateChange` para actualizar el estado de React (`score`, `lives`, `level`) que alimenta el `player-hud` existente (reemplaza los valores fijos `0`, `♥ ♥ ♥`, `01`). El HUD interno del canvas (`drawHUD`) se mantiene sin cambios, dibujando en paralelo.
6. **Conectar PAUSA.** Modificar el handler del botón "PAUSA" para llamar a `engine.pause()`/`engine.resume()` además de alternar el `paused` state de React que ya controla el overlay visual "EN PAUSA".
7. **Conectar FIN y game over real.** El botón "FIN" llama a `engine.pause()` y abre el modal existente usando el `score` real acumulado (en vez de `MOCK_FINAL_SCORE`). `onGameOver` dispara el mismo camino: pausa el motor y abre el modal con el puntaje final real.
8. **Reinicio real.** El botón "JUGAR DE NUEVO" del modal llama a `engine.restart()` (reinstancia el estado interno del motor) en vez de solo resetear los estados locales de React.
9. **Guardado real del puntaje.** `saveScore` usa el `score` real (guardado en el estado de React desde `onStateChange`/`onGameOver`) al escribir en `av_scores`, en vez de `MOCK_FINAL_SCORE`.
10. **Repaso final.** Probar el flujo completo en el navegador: `/biblioteca` → detalle de "asteroides" → `/jugar/asteroides` → jugar, pausar, reanudar, morir las 3 vidas (o presionar FIN), guardar puntaje, jugar de nuevo, salir — sin errores de consola ni fugas de listeners/rAF al navegar fuera.

## Criterios de aceptación

- [x] `GAMES` en `lib/data.ts` incluye una entrada `asteroides` (título, descripciones, categoría `SHOOTER`, cover, color, `best`, `plays`), sin modificar ni eliminar la entrada `rocas`.
- [x] `/juego/asteroides` muestra el detalle del juego y `/jugar/asteroides` renderiza `GamePlayer` con un `<canvas>` de 800×600 dentro de `.crt-screen`, en vez del arena mock.
- [x] Dentro del canvas, la nave rota (`←`/`→`), propulsa (`↑`), dispara (`Espacio`), los asteroides grandes se dividen en medianos y estos en pequeños, y aparecen partículas de explosión al destruirlos — igual que el juego de referencia.
- [x] El power-up de triple disparo aparece y funciona igual que en `game.js` (radio de recolección, duración, disparo triple).
- [x] El HUD de React (`player-hud`: Puntuación, Vidas, Nivel) refleja en tiempo real los valores reales del motor (no valores fijos), actualizándose solo cuando cambian.
- [x] El HUD dibujado dentro del canvas (`drawHUD`) sigue mostrando SCORE/NIVEL/vidas/triple-shot, igual que el original.
- [x] El botón "PAUSA" detiene realmente el loop del motor (los asteroides/nave dejan de moverse) y "REANUDAR" lo reactiva sin saltos bruscos de física.
- [x] El botón "FIN" congela el motor sin matar la nave ni descontar vidas, y abre el modal de fin de partida mostrando el puntaje real acumulado hasta ese momento.
- [x] Al perder la tercera vida dentro del canvas, se abre automáticamente el mismo modal de fin de partida con el puntaje real, sin que el canvas dibuje su propio overlay de "GAME OVER" ni reinicie con Espacio.
- [x] "GUARDAR PUNTUACIÓN" en el modal escribe en `av_scores` (localStorage) el puntaje real de la partida (no `MOCK_FINAL_SCORE`).
- [x] "JUGAR DE NUEVO" reinicia el motor a un estado nuevo (score 0, 3 vidas, nivel 1) y el canvas vuelve a ser jugable.
- [x] Salir del juego (botón "SALIR" o navegar fuera de `/jugar/asteroides`) cancela el `requestAnimationFrame` y remueve los listeners de teclado del motor, sin dejar el loop corriendo en segundo plano.
- [x] El resto de juegos de `GAMES` (incluida `rocas`) siguen mostrando el arena mock sin cambios.
- [x] No se muestra ningún ranking/leaderboard nuevo asociado a Asteroids en este spec.
- [x] `npm run build` compila sin errores de tipos tras agregar el motor y los cambios en `GamePlayer.tsx`.

## Decisiones tomadas y descartadas

- **ID nuevo `asteroides`** en vez de reutilizar `rocas`, porque el usuario pidió explícitamente no tocar ni eliminar la entrada `rocas` existente (aunque temáticamente coincida); `asteroides` queda como un juego independiente en la biblioteca.
- **Motor portado a clases TypeScript encapsuladas en `AsteroidsEngine`** en vez de cargar `game.js` literal vía `<script>`, para evitar el riesgo de estado global de módulo compartido entre partidas/HMR de Next.js, y para que el motor exponga una API clara (`pause`, `resume`, `restart`, `destroy`, callbacks) consumible desde React.
- **Canvas fijo 800×600 escalado por CSS** en vez de un canvas responsive con `W`/`H` dinámicos, para no tocar la lógica interna de coordenadas del juego de referencia y mantener fidelidad exacta con el original.
- **Power-ups (triple disparo) incluidos**, porque el usuario confirmó que la fuente de verdad es el código de `game.js` (que sí los tiene), no el README (que no los menciona).
- **HUD duplicado (React + canvas)**: se mantiene el `drawHUD` interno del canvas tal cual el original, y además se conecta el HUD de React al estado real, porque el usuario prefirió fidelidad visual completa con el original en vez de eliminar la redundancia.
- **React controla la pausa desde afuera** (`engine.pause()`/`resume()` llamados por el botón "PAUSA"), y el overlay visual "EN PAUSA" lo sigue dibujando React (no el canvas), porque el usuario confirmó que el contenedor/componente React debe ser quien controla la pausa, no el motor por su cuenta.
- **Botón "FIN" congela sin matar la nave** (en vez de simular un game over real con `lives = 0`), para diferenciar terminar voluntariamente de perder por las 3 vidas, mientras ambos casos abren el mismo modal con el puntaje real.
- **`onGameOver` reemplaza el overlay interno de "GAME OVER" del canvas**: se deshabilita el dibujo y el reinicio con Espacio del original, porque ahora React es responsable único de mostrar el fin de partida (modal con nombre/guardado), evitando UI duplicada e inconsistente.
- **Callback `onStateChange` con throttle natural** (se invoca solo cuando cambian `score`/`lives`/`level`, no en cada frame) en vez de sincronizar a 60 FPS vía `setState`, para evitar re-renders innecesarios de React manteniendo el patrón estándar de estado del proyecto (sin refs con `textContent` manual).
- **Sin leaderboard en este spec**: `saveScore` solo persiste en `av_scores`, sin conectar `HallOfFame.tsx` ni `/salon`, porque el usuario indicó explícitamente que el ranking queda fuera de alcance por ahora.

## Riesgos identificados

- **Doble bucle de render (React + `requestAnimationFrame` del motor).** Si `AsteroidsEngine` no se destruye correctamente al desmontar `GamePlayer` (por ejemplo al navegar con el botón "SALIR" o el router de Next), el `requestAnimationFrame` puede seguir corriendo en segundo plano y acumular instancias en partidas sucesivas. Mitigación: `destroy()` debe cancelarse explícitamente en el cleanup del `useEffect` de montaje del canvas, verificado en el paso 10 del plan (repaso de fugas al navegar fuera).
- **Listeners de teclado globales (`window.addEventListener('keydown'/'keyup')`).** El original los registra a nivel de módulo sin removerlos nunca (asume una sola página HTML). Al portarlo a un componente que se monta/desmonta, si no se remueven en `destroy()`, quedan activos aunque el usuario haya salido del juego, capturando teclas en el resto de la app. Mitigación: `destroy()` debe remover ambos listeners explícitamente.
- **Divergencia entre el HUD del canvas y el de React.** Al mantener ambos HUD (decisión confirmada), un bug en el throttle de `onStateChange` podría hacer que muestren valores distintos momentáneamente (por ejemplo el canvas ya subió de nivel pero React todavía no se enteró). Mitigación: invocar `onStateChange` de forma síncrona apenas cambia cualquiera de los tres valores dentro del mismo `update(dt)`, no de forma diferida.
- **`dt` grande al reanudar de una pausa larga.** Si `pause()` no detiene realmente el reloj interno (`lastTime`) del motor, al reanudar el primer frame podría calcular un `dt` enorme (nave/asteroides saltando de posición). Mitigación: al pausar, detener el bucle por completo (no solo saltear `update`); al reanudar, resetear `lastTime` como si fuera el primer frame.
- **Canvas fijo 800×600 en pantallas pequeñas.** Al escalarlo por CSS dentro de `.crt-screen` (que puede ser más angosto en mobile), el juego podría verse minúsculo o con controles de teclado poco útiles en touch. Mitigación: no aplica en este spec (controles táctiles están fuera de alcance); se documenta como limitación conocida, no como bug.
