# SPEC 12 — Optimización de performance en Frogger

> **Estado:** Aprobado
> **Depende de:** `specs/game-jam/frogger/01-frogger-game.md` (implementado)
> **Fecha:** 2026-08-02
> **Objetivo:** Reducir el trabajo por frame de `FroggerEngine` (`lib/games/frogger/engine.ts`) en máquinas poco potentes mediante optimizaciones internas de cálculo y dibujo, sin alterar ni un solo píxel del resultado visual ni ninguna regla de jugabilidad.

## Alcance

**Incluye:**

- **Cachear el fondo estático del tablero** en un canvas offscreen: color base de cada carril, líneas punteadas de las carreteras (`setLineDash`/`strokeRect`) y los hedges de `drawHomeSlots` (`lib/games/frogger/engine.ts` — `drawBoard`, parte de `drawHomeSlots`). Se recompone solo cuando cambia el skin o `homesOccupied`; el resto de los frames reutiliza la imagen ya renderizada.
- **Agrupar el toggle de `shadowBlur`/`shadowColor` por lote de color** en vez de por objeto individual, en los dos lugares donde hoy se aplica dentro de un loop: tortugas en `drawLaneObjects` y casillas home ocupadas en `drawHomeSlots`.
- **Pre-renderizar sprites con el glow "horneado"** para las formas repetidas (vehículos, troncos, tortugas) en un canvas offscreen por color/skin, reemplazando el `fillRect` con `shadowBlur` activo en cada frame por un `drawImage` de la forma ya calculada.
- **Precalcular en `initGame`** el array/set de "es columna de home" (`HOME_SLOT_COLS`) en vez de resolverlo con `.includes()` dentro del loop de `GRID_COLS` en cada frame de `drawHomeSlots`.
- **`onStateChange` (que notifica al componente React del HUD, `GamePlayer.tsx`) solo debe dispararse cuando el estado realmente cambió**, nunca en cada frame por defecto. Hoy `notifyStateChange` ya compara contra el último estado notificado antes de llamar a `onStateChange`, pero construye el objeto `EngineState` completo (arrays y strings nuevos) en cada frame incluso cuando nada cambió, antes de descartarlo. El cambio consiste en evaluar primero los valores crudos (score, vidas, nivel, segundos restantes, homes) contra los últimos notificados, y solo si alguno difiere: (a) construir el nuevo `EngineState` y (b) llamar a `onStateChange`. Si no hay diferencia, no se construye el objeto ni se notifica al HUD. El contenido notificado (mismas etiquetas/valores) no cambia, solo la frecuencia con la que se invoca la notificación y el trabajo hecho queda sujeta a un cambio real.
- **Cachear valores derivados por carril dentro del mismo tick** (por ejemplo `ringLength`, `turtleCycleMs()`) en vez de recalcularlos en más de un método (`updateLanes`, `checkRiverSupport`, `drawLaneObjects`) durante el mismo frame.
- Verificación de que el resultado visual es pixel-idéntico al actual en los 3 skins (`clasico`/`retro`/`neon`) y que la jugabilidad (colisiones, tiempos, puntaje, velocidad de carriles/tortugas) no cambia.

**Fuera de alcance (para specs futuros):**

- Cualquier otro motor de juego (Asteroids, Tetris, Arkanoid, Snake): esta spec es exclusiva de Frogger.
- Cambios de balance/jugabilidad (velocidades, hitboxes, tiempos de nivel, puntaje, ciclo de tortugas): se mantienen exactamente iguales.
- Cambios visuales de cualquier tipo (paletas, glow, proporciones, tipografía del HUD): el resultado en pantalla debe ser indistinguible del actual.
- Instrumentación de FPS o métricas de performance en producción: la verificación es cualitativa (jugar en una máquina/dispositivo liviano y con las devtools del navegador), no se agrega código de medición al motor.
- Web Workers, OffscreenCanvas fuera del hilo principal, o cualquier cambio de arquitectura del render loop (`requestAnimationFrame`, cálculo de `dt`): se mantiene el mismo modelo de loop actual.

## Modelo de datos

Esta spec no introduce estructuras de datos nuevas ni cambia las existentes (`EngineState`, `LaneObject`, `Frog`, etc. siguen igual). Los cambios son campos privados internos de `FroggerEngine` para cachear resultados (canvas offscreen del fondo, sprites pre-renderizados, array de columnas home, últimos valores crudos notificados) — detalles de implementación, no un modelo de datos nuevo a nivel de contrato.

## Plan de implementación

1. **Precalcular el array de columnas home** en `initGame`: agregar un campo privado (por ejemplo `homeSlotColSet`) que resuelva de una sola vez, por columna de `GRID_COLS`, si es o no una columna de home, reemplazando el `HOME_SLOT_COLS.includes(col)` que hoy corre dentro del loop de `drawHomeSlots` en cada frame. Manual test: comparar visualmente `drawHomeSlots` antes/después en los 3 skins — debe verse exactamente igual.

2. **Cachear el fondo estático del tablero en un canvas offscreen**: crear un `HTMLCanvasElement` interno (mismo tamaño que el canvas principal) y mover a un nuevo método `renderStaticBoard()` el dibujo de colores base de carriles, líneas punteadas de carretera y hedges (la parte de `drawBoard`/`drawHomeSlots` que no depende de `homesOccupied` ni de objetos dinámicos). Este método se llama una sola vez al iniciar, y de nuevo solo cuando cambia el skin (`setColorScheme`) o cuando cambia `homesOccupied` (en `checkHomeArrival`). El `draw()` de cada frame pasa a hacer `ctx.drawImage(staticBoardCanvas, 0, 0)` en vez de repetir esos cálculos. Manual test: en los 3 skins, comparar captura de pantalla del tablero antes/después del cambio — debe ser pixel-idéntico; confirmar que ocupar una casilla home actualiza el fondo cacheado correctamente.

3. **Agrupar el toggle de glow por lote de color** en los dos loops que hoy lo aplican por objeto: tortugas en `drawLaneObjects` (separar el loop en sub-grupos por `bodyColor` real usado — `palette.turtle` vs `palette.turtleWarn` — aplicando `applyGlow`/`clearGlow` una vez por sub-grupo) y casillas home ocupadas en `drawHomeSlots` (aplicar el glow una vez para todas las casillas ocupadas, ya que comparten el mismo color `palette.frog`). Manual test: comparar visualmente que el brillo se ve igual (mismo `shadowBlur`/color) que antes, en los 3 skins.

4. **Pre-renderizar sprites con glow horneado** para las formas repetidas de color fijo (vehículos por carril, troncos, cuerpo de tortuga no advertida) en canvas offscreen chicos, uno por combinación color+tamaño+skin, generados una vez en `initGame`/`setColorScheme` y cacheados en un `Map` o `Record`. `drawLaneObjects` pasa a usar `ctx.drawImage(sprite, obj.x, y)` en vez de `fillRect` con `shadowBlur` activo para esas formas. Los estados que cambian por frame y no son cacheables tal cual (tortuga sumergida con solo `strokeRect`, parpadeo de advertencia) se mantienen dibujados igual que hoy, sin sprite cacheado. Manual test: comparar captura de pantalla de una escena con vehículos/troncos/tortugas antes/después — debe verse pixel-idéntica en los 3 skins.

5. **Evitar notificaciones y construcciones innecesarias de `EngineState`** en `notifyStateChange`: comparar primero los valores crudos (`score`, `lives`, `level`, `Math.ceil(timeLeftMs / 1000)`, `homes`) contra los últimos valores notificados (guardados como campos primitivos, no como el objeto `EngineState` completo); solo si alguno cambió, construir el nuevo `EngineState` y llamar a `this.options.onStateChange`. Manual test: con las devtools abiertas, confirmar que el HUD (Puntuación, Vidas, Nivel, Tiempo, Casillas) sigue actualizándose con los mismos valores en los mismos momentos que antes (por ejemplo, el tiempo baja de a 1 en 1 cada segundo, no antes).

6. **Cachear valores derivados por carril dentro del mismo tick**: en el `loop`, calcular una vez por frame (no por método) los valores que hoy se recalculan más de una vez por carril en el mismo frame (`turtleCycleMs()`, `turtleSubmergedRatio()`, `laneRingLength(lane)` para los carriles relevantes) y pasarlos como parámetros a `updateLanes`, `checkRiverSupport` y `drawLaneObjects` en vez de que cada uno los recalcule. Manual test: confirmar que el comportamiento de tortugas (ciclo de sumersión, velocidad) y de carriles de río/carretera no cambia en ningún nivel.

7. **Repaso final**: `npm run build` sin errores de tipos. Jugar una partida completa en Frogger en los 3 skins verificando: (a) el tablero, los objetos de carril, la rana y el HUD se ven exactamente igual que antes del cambio; (b) las colisiones, el tiempo por nivel, el puntaje y el ciclo de tortugas se comportan igual; (c) el juego se siente más fluido en una máquina/dispositivo liviano (verificación cualitativa, panel Performance de devtools opcional); (d) el HUD sigue actualizándose correctamente pese a notificarse con menor frecuencia.

## Criterios de aceptación

- [ ] El resultado visual de Frogger (tablero, carriles, vehículos, troncos, tortugas, rana, timer, home slots) es pixel-idéntico al actual en los 3 skins (`clasico`/`retro`/`neon`).
- [ ] Ninguna regla de jugabilidad cambia: velocidades de carriles, ciclo y ratio de sumersión de tortugas, hitboxes de colisión, tiempo por nivel, cálculo de puntaje y condiciones de game over se comportan exactamente igual que antes de esta spec.
- [ ] El fondo estático del tablero (colores de carril, líneas punteadas de carretera, hedges) se cachea en un canvas offscreen y solo se recompone al cambiar el skin o al ocupar/liberar una casilla home, no en cada frame.
- [ ] El toggle de `shadowBlur`/`shadowColor` para tortugas y casillas home ocupadas se aplica agrupado por color, no por objeto individual.
- [ ] Los vehículos, troncos y cuerpos de tortuga no advertida se dibujan mediante sprites pre-renderizados con `drawImage`, no con `fillRect` + `shadowBlur` recalculado en cada frame.
- [ ] `HOME_SLOT_COLS` se resuelve mediante una estructura precalculada en `initGame`, sin `.includes()` dentro del loop de dibujo por frame.
- [ ] `onStateChange` (notificación al HUD de React) solo se invoca cuando cambia al menos uno de los valores crudos de estado (score, vidas, nivel, segundos restantes, homes); si no hay cambio, no se construye un nuevo `EngineState` ni se notifica al componente.
- [ ] Los valores derivados por carril que antes se recalculaban más de una vez por frame (`turtleCycleMs()`, `turtleSubmergedRatio()`, `laneRingLength()`) se calculan una sola vez por tick y se reutilizan.
- [ ] El HUD (Puntuación, Vidas, Nivel, Tiempo, Casillas) sigue reflejando los valores correctos en los mismos momentos que antes (verificado jugando una partida completa).
- [ ] No queda código residual tras la optimización: sin métodos sin usar, sin lógica comentada, sin duplicación entre la implementación anterior y la nueva (verificable con `npm run lint`).
- [ ] `npm run build` compila sin errores de tipos.
- [ ] Verificación cualitativa: el juego se percibe más fluido en una máquina/dispositivo liviano tras el cambio.

## Decisiones

- **Sí:** el alcance se limita exclusivamente a Frogger. Los demás motores (Asteroids, Tetris, Arkanoid, Snake) quedan fuera; si presentan problemas similares, se abordan en una spec propia más adelante.
- **Sí:** ninguna optimización puede alterar el resultado visual ni la jugabilidad. Se prioriza cachear/reordenar cálculos por sobre cualquier cambio que toque cómo se ve o se juega el juego, aunque esto último diera más margen de mejora de performance.
- **Sí:** el fondo estático del tablero se cachea en un canvas offscreen en vez de usar técnicas más agresivas (Web Workers, OffscreenCanvas fuera del hilo principal, WebGL). Se descartó ir más allá porque el objetivo es una optimización acotada y de bajo riesgo, no una reescritura del motor de render.
- **Sí:** la verificación de la mejora de performance es cualitativa (jugar en una máquina/dispositivo liviano, opcionalmente con el panel Performance de devtools), no se agrega instrumentación de FPS al código del motor. Evita dejar código de debug en producción.
- **Sí:** `onStateChange` se vuelve condicional a un cambio real en los valores crudos de estado, en vez de construirse y compararse el objeto completo en cada frame. Fue un requisito explícito del usuario, no solo una optimización derivada.
- **Sí:** al reemplazar la lógica de dibujo por versiones cacheadas (fondo estático, sprites pre-renderizados), el código anterior que queda reemplazado se elimina por completo, no se deja comentado ni como método muerto sin llamar. No debe quedar código duplicado entre el camino viejo y el nuevo.
- **No:** cambiar el modelo de render loop (`requestAnimationFrame`, cálculo de `dt`) ni introducir un timestep fijo. Se descartó porque no es necesario para resolver los problemas identificados y agregaría riesgo de alterar la sensación de control.
- **No:** abreviar, quitar o modificar el contenido notificado al HUD (mismas etiquetas y valores que hoy). Solo cambia la frecuencia de notificación, no el contenido.

## Riesgos

| Riesgo                                                                                                                                                                                                                                                                      | Mitigación                                                                                                                                                                                                                                                                       |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| El canvas offscreen cacheado del fondo podría desincronizarse del estado real (por ejemplo, si `homesOccupied` cambia sin invalidar el cache), mostrando un tablero desactualizado.                                                                                         | Se invalida y recompone explícitamente en los únicos dos puntos donde el fondo cambia (`setColorScheme` y `checkHomeArrival`), verificado en el manual test del paso 2 del plan.                                                                                                 |
| Los sprites pre-renderizados con glow podrían verse ligeramente distintos al `fillRect`+`shadowBlur` original si el tamaño del canvas offscreen o el padding alrededor del sprite no reproduce exactamente el área de blur.                                                 | Se valida con comparación visual pixel a pixel (captura de pantalla antes/después) en los 3 skins como parte del manual test del paso 4, antes de dar por cerrada la spec.                                                                                                       |
| Al volverse condicional, `onStateChange` podría no dispararse en algún caso límite donde sí debería (por ejemplo, un cambio de vidas que coincide justo con un score sin cambio), dejando al HUD con datos viejos.                                                          | Se comparan todos los valores crudos relevantes (score, vidas, nivel, segundos, homes) de forma independiente antes de decidir si notificar, no un solo valor combinado; se verifica jugando una partida completa (paso 7 del plan) prestando atención a cada stat por separado. |
| Cachear valores derivados por tick (`turtleCycleMs()`, etc.) en variables locales del loop podría introducir un descalce si algún método interno los recalcula por su cuenta en vez de recibir el valor cacheado, generando inconsistencia entre métodos en el mismo frame. | Se pasan explícitamente como parámetros a los métodos que los necesitan (`updateLanes`, `checkRiverSupport`, `drawLaneObjects`) en vez de dejar que cada uno llame a su propio getter, eliminando la posibilidad de que diverjan dentro del mismo frame.                         |
