# SPEC 10 — Controles táctiles para juegos móviles

> **Estado:** Implementado
> **Depende de:** SPEC 05 (asteroids-game), SPEC 07 (tetris-game), SPEC 08 (arkanoid-game), SPEC 09 (snake-game)
> **Fecha:** 2026-07-30
> **Objetivo:** Hacer jugables los 4 juegos actuales (Asteroids, Tetris, Arkanoid, Snake) en dispositivos móviles con pantalla táctil, agregando un D-pad y botones de acción debajo del canvas que despachan los mismos eventos de teclado que ya escucha cada motor, y adaptando el escalado de los canvases que hoy no se ajustan a pantallas angostas (Tetris y Snake). El escalado responsive es exclusivo del modo táctil: el canvas y el layout de escritorio no se modifican en ningún caso, y los controles nunca se superponen ni tapan el canvas.

## Alcance

**Incluye:**

- Hook de detección de dispositivo táctil (`lib/useTouchDevice.ts` o similar), basado en feature detection (`matchMedia("(pointer: coarse)")` / `"ontouchstart" in window`), reevaluado una sola vez al montar. Este mismo hook gobierna tanto el D-pad táctil como el HUD simplificado descritos abajo — un único criterio de "modo mobile" en toda la pantalla del juego.
- Componente genérico `components/TouchControls.tsx` que renderiza un D-pad (cruz direccional) + botones de acción circulares, configurado por juego desde el registry — no hardcodea ningún motor específico, siguiendo la misma convención que `colorSchemes`.
- **Distribución tipo joystick:** en los juegos cuyo `touchControls.actions` tiene al menos un botón (Asteroids, Tetris), `TouchControls` se distribuye en fila con el D-pad a la izquierda y los botones de acción a la derecha, imitando la disposición de un control físico. En los juegos sin botones de acción (Arkanoid, Snake), el D-pad se mantiene centrado (sin distribución en fila), porque su mecánica solo requiere mover la cruceta y no hay nada que ubicar del lado derecho. El criterio es puramente derivado de `actions.length > 0`, sin bandera nueva de configuración por juego.
- Nueva propiedad opcional `touchControls` en `GameRegistryEntry` (`lib/games/registry.ts`), con la lista de botones de acción por juego y qué posiciones del D-pad están activas, cada una mapeada al `code` de teclado que ya escucha el motor correspondiente:
  - Asteroids: D-pad izq/der (rotar) + botón "AVANZAR" (`ArrowUp`) + botón "DISPARAR" (`Space`).
  - Tetris: D-pad izq/der/abajo (mover/soft drop) + botón "ROTAR" (`ArrowUp`) + botón "CAÍDA DURA" (`Space`).
  - Arkanoid: D-pad izq/der (mover paleta).
  - Snake: D-pad de 4 direcciones (`ArrowUp/Down/Left/Right`).
- Cada botón despacha `new KeyboardEvent("keydown"/"keyup", { code, key, bubbles: true, cancelable: true })` sintéticos sobre `window` en `touchstart`/`touchend`/`touchcancel`, reutilizando sin cambios la lógica de los 4 motores existentes. Se incluye `key` además de `code` porque **Arkanoid filtra por `e.key`** (`lib/games/arkanoid/engine.ts:63`, `if (e.key in this.keys)`); despachar solo `code` no movería la paleta.
- Repetición de `keydown` sintético a intervalo fijo mientras un botón se mantiene presionado, imitando el key-repeat nativo del sistema operativo, hasta el `touchend`/`touchcancel`. Aplica a dos casos, ambos porque el motor correspondiente reacciona a `keydown` discreto en vez de leer un estado booleano por frame:
  - El D-pad de Tetris (única acción discreta por `keydown`, sin lectura continua de estado).
  - El botón "DISPARAR" (`Space`) de Asteroids, que hoy consume el disparo con edge-detection (`lib/games/asteroids/engine.ts:445-449`, `pressed()` resetea al leer) y por lo tanto solo dispararía una vez por toque si no se repite.
- El D-pad siempre renderiza sus 4 posiciones (cruz completa); la posición que un juego no usa se muestra deshabilitada, no se oculta.
- `TouchControls` se renderiza en `GamePlayer.tsx` debajo del canvas, en flujo normal (nunca superpuesto ni con `position: absolute`/`z-index` sobre el canvas), solo cuando el hook de detección táctil devuelve `true` y el juego tiene `touchControls` definido en el registry.
- **Aislamiento del layout de escritorio:** `GamePlayer.tsx` agrega la clase `touch-mode` al contenedor `.av-player` únicamente cuando `useTouchDevice()` devuelve `true`. Todo el CSS nuevo de esta spec (escalado de canvas, layout en columna, `TouchControls`) cuelga de `.av-player.touch-mode`; las reglas existentes de `.crt-screen`, `.game-canvas`, `.game-canvas-fixed` y `.next-piece-canvas` no se modifican, por lo que el escritorio (sin esa clase) se comporta exactamente igual que antes del spec.
- **Layout en `.touch-mode`:** columna vertical (HUD → canvas → canvas secundario si aplica → `TouchControls`), todo en flujo normal. `.crt-screen` deja de forzar `aspect-ratio: 4/3` y pasa a usar el aspect ratio real de cada juego (4:3 Asteroids/Arkanoid, 1:2 Tetris, 1:1 Snake) con `max-width: 100%`. La altura del canvas se acota (`max-height`, calculado contra el alto de viewport disponible) para reservar siempre espacio a `TouchControls` debajo, de modo que los botones nunca queden fuera de pantalla ni se superpongan al canvas. Los atributos `width`/`height` del elemento `<canvas>` (y por lo tanto las constantes internas de cada motor, ej. `COLS`/`ROWS`/`BLOCK` de Tetris) no se tocan: el canvas se reduce solo por CSS, así que el dibujo se ve proporcionalmente idéntico al de escritorio, solo más chico.
- Los botones de `TouchControls` se dimensionan con `clamp()` sobre unidades de viewport y se compactan automáticamente cuando la altura disponible es escasa (vía media query de altura), sin necesidad de una bandera de configuración por juego. Esto es lo que resuelve el caso de Tetris (el canvas más alto, 1:2): al reducirse el alto disponible para el canvas, los botones se compactan en la misma pasada para no competir por espacio.
- **HUD simplificado en mobile** (mismo criterio de detección táctil): se oculta la fila "Jugador"; se mantienen Puntuación, los stats propios del motor (vidas/líneas/longitud/nivel según el juego) y el selector de skin. Los botones PAUSA/FIN/SALIR se colapsan en un único botón de PAUSA.
- Ese botón de PAUSA en mobile pausa el motor (igual que hoy) y además abre un panel/menú con REANUDAR, FIN y SALIR — las mismas acciones que en escritorio siguen siendo tres botones separados.
- Corrección del escalado responsive de Tetris y Snake (hoy con `.game-canvas-fixed`, tamaño fijo en píxeles sin adaptarse a pantallas angostas), **acotada a `.touch-mode`**: en vez de forzar el 4:3 actual de `.crt-screen`, cada juego respeta su aspect ratio real (1:2 Tetris, 1:1 Snake) mediante `max-width: 100%` + `aspect-ratio` + `max-height`. En escritorio, `.game-canvas-fixed` no cambia.
- Reposicionamiento del canvas secundario de "siguiente pieza" de Tetris (`.next-piece-canvas`, hoy con offset fijo `left: calc(50% + 174px)` que se sale de pantalla en mobile), **solo dentro de `.touch-mode`**: pasa a flujo normal, centrado debajo del canvas principal, sin `position: absolute` ni offset en px. Fuera de `.touch-mode`, `.next-piece-canvas` conserva su posicionamiento actual sin cambios.

**Fuera de alcance (para specs futuros):**

- Soporte por gestos (swipe/drag) como alternativa o complemento al D-pad.
- Toggle manual para forzar mostrar/ocultar los controles táctiles o el HUD simplificado en dispositivos sin touch.
- Forzar o sugerir un cambio de orientación del dispositivo.
- Vibración/haptic feedback al presionar los botones.
- Controles táctiles para juegos futuros fuera de los 4 actuales (se suman en su propio spec de juego, siguiendo el mismo patrón del registry).
- Rediseño visual adicional del D-pad más allá de lo acordado (iconografía elaborada, animaciones custom).
- Tests automatizados.

## Modelo de datos

```ts
// lib/useTouchDevice.ts
export function useTouchDevice(): boolean;
// true si matchMedia("(pointer: coarse)") o "ontouchstart" in window, evaluado una vez al montar
```

```ts
// components/TouchControls.tsx — layout de la cruz hardcodeado, mismo en los 4 juegos
// key incluida junto a code porque Arkanoid filtra el evento sintético por e.key
// (lib/games/arkanoid/engine.ts:63); sin key, sus botones no moverían la paleta.
const DPAD_BUTTONS = {
  up: { code: "ArrowUp", key: "ArrowUp", label: "▲" },
  down: { code: "ArrowDown", key: "ArrowDown", label: "▼" },
  left: { code: "ArrowLeft", key: "ArrowLeft", label: "◀" },
  right: { code: "ArrowRight", key: "ArrowRight", label: "▶" },
} as const;
// las 4 posiciones siempre se renderizan (cruz completa); la posición no listada
// en dpadEnabled se muestra deshabilitada, no se oculta
```

```ts
// lib/games/types.ts (tipos nuevos, sin tocar ArcadeGameEngine existente)
export interface TouchButton {
  code: string; // KeyboardEvent.code a despachar, ej. "Space"
  key: string; // KeyboardEvent.key a despachar, ej. " " para Space (Arkanoid filtra por e.key)
  label: string; // ej. "DISPARAR"
  repeat?: boolean; // default false; true repite el keydown sintético a intervalo fijo mientras se
  // mantiene presionado, para motores que reaccionan a keydown discreto en vez de
  // leer un estado booleano por frame (D-pad de Tetris, "DISPARAR" de Asteroids)
}

export interface TouchControlsConfig {
  dpadEnabled: ("up" | "down" | "left" | "right")[]; // posiciones activas de la cruz para este juego
  dpadRepeat?: boolean; // default false; aplica repeat a las posiciones del D-pad activas (solo Tetris)
  actions: TouchButton[]; // 0 a 2 botones de acción (vacío en Arkanoid y Snake)
}
```

```ts
// lib/games/registry.ts (nueva propiedad opcional en GameRegistryEntry, junto a colorSchemes)
export interface GameRegistryEntry {
  // ...propiedades existentes sin cambios...
  touchControls?: TouchControlsConfig;
}

// valores por juego:
asteroides.touchControls = {
  dpadEnabled: ["left", "right"],
  // orden intencional: DISPARAR más a la izquierda, AVANZAR más a la derecha dentro del
  // grupo de acciones (ambos del lado derecho del layout joystick); TouchControls
  // renderiza `actions` en el orden del arreglo, así que el orden aquí define el layout.
  actions: [
    { code: "Space", key: " ", label: "DISPARAR", repeat: true }, // Asteroids consume Space
    // con edge-detection (pressed(), lib/games/asteroids/engine.ts:445-449); sin repeat,
    // mantener presionado dispararía una sola vez
    { code: "ArrowUp", key: "ArrowUp", label: "AVANZAR" },
  ],
};

tetris.touchControls = {
  dpadEnabled: ["left", "right", "down"],
  dpadRepeat: true,
  actions: [
    { code: "ArrowUp", key: "ArrowUp", label: "ROTAR" },
    { code: "Space", key: " ", label: "CAÍDA DURA" },
  ],
};

arkanoid.touchControls = {
  dpadEnabled: ["left", "right"],
  actions: [],
};

snake.touchControls = {
  dpadEnabled: ["up", "down", "left", "right"],
  actions: [],
};
```

```ts
// components/GamePlayer.tsx (nuevo estado local, sin tocar el contrato del motor)
const isTouch = useTouchDevice();
const [pauseMenuOpen, setPauseMenuOpen] = useState(false);
// en mobile, togglePause() además hace setPauseMenuOpen(true) al pausar
// y setPauseMenuOpen(false) al reanudar; FIN/SALIR viven dentro de ese panel
```

## Plan de implementación

1. ~~Crear `lib/useTouchDevice.ts` con el hook `useTouchDevice()`~~ **Hecho** (commit `747105b`): feature detection por `matchMedia("(pointer: coarse)")` / `"ontouchstart" in window`, sin uso todavía.
2. Agregar los tipos `TouchButton` (con `key` y `repeat`) y `TouchControlsConfig` en `lib/games/types.ts`, la propiedad opcional `touchControls` en `GameRegistryEntry` (`lib/games/registry.ts`) y completar los 4 valores (asteroides/tetris/arkanoid/snake) acordados en el modelo de datos. Sin uso todavía. Manual test: `npm run build` sin errores de tipos.
3. Crear `components/TouchControls.tsx`: D-pad con las 4 posiciones fijas hardcodeadas (deshabilitando las que no estén en `dpadEnabled`) y los botones de `actions`, cada botón despachando `new KeyboardEvent(type, { code, key, bubbles: true, cancelable: true })` sintéticos sobre `window` en `touchstart`/`touchend`/`touchcancel` (con repetición a intervalo fijo cuando `repeat`/`dpadRepeat` es `true`). Sin integrar a `GamePlayer` todavía.
4. Integrar `TouchControls` en `GamePlayer.tsx`: se renderiza debajo del canvas (en flujo, no superpuesto) cuando `useTouchDevice()` es `true` y `registryEntry.touchControls` existe; el mismo hook agrega la clase `touch-mode` al contenedor `.av-player`. Manual test: abrir cada uno de los 4 juegos con emulación de dispositivo táctil (Chrome DevTools → Toggle device toolbar) y verificar que los botones aparecen. **Verificación específica de Arkanoid:** confirmar que tocar el D-pad mueve la paleta — es el caso que depende de despachar `key` además de `code` (`arkanoid/engine.ts:63` filtra por `e.key`). **Verificación específica de Asteroids:** mantener presionado "DISPARAR" dispara en ráfaga en vez de una sola vez.
5. Agregar estilos en `app/globals.css`, todos anidados bajo `.av-player.touch-mode` (nunca reglas globales sobre `.crt-screen`/`.game-canvas`/`.game-canvas-fixed`/`.next-piece-canvas` fuera de ese scope): layout en columna (HUD → canvas → canvas secundario → `TouchControls`), `.touch-controls`, `.touch-dpad`, `.touch-action` con `touch-action: none`, y tamaño de botones por `clamp()` que se compacta en media queries de poca altura de viewport. Dentro de `TouchControls`, distribución tipo joystick (D-pad a la izquierda, acciones a la derecha, en fila) cuando el juego tiene botones de acción (Asteroids, Tetris); D-pad centrado, sin fila, cuando no los tiene (Arkanoid, Snake). Manual test: comparar visualmente en emulación mobile contra el mockup de referencia, confirmar que Asteroids y Tetris muestran el D-pad a la izquierda y las acciones a la derecha, que Arkanoid y Snake mantienen el D-pad centrado, y que en escritorio (sin `touch-mode`) no cambió nada.
6. Corregir el escalado responsive de Tetris y Snake, **solo dentro de `.av-player.touch-mode`**: `.crt-screen` deja de forzar `aspect-ratio: 4/3` y cada juego usa su aspect ratio real (1:2 Tetris, 1:1 Snake, 4:3 Asteroids/Arkanoid) con `max-width: 100%` + `max-height` acotada para dejar siempre espacio a `TouchControls` debajo; reposicionar `.next-piece-canvas` en flujo, debajo del canvas principal, reemplazando el offset fijo `left: calc(50% + 174px)` (solo en `touch-mode`). Los atributos `width`/`height` del `<canvas>` no cambian. Manual test: en emulación mobile angosta (375px) y en viewport bajo (375×667), Tetris y Snake no desbordan horizontalmente, el canvas secundario es visible completo debajo del principal, y en ningún caso `TouchControls` se superpone o queda tapado por el canvas.
7. HUD simplificado en mobile en `GamePlayer.tsx`: cuando `isTouch` es `true`, ocultar la fila "Jugador" y colapsar PAUSA/FIN/SALIR en un único botón de PAUSA que pausa el motor y abre un panel (`pauseMenuOpen`) con REANUDAR/FIN/SALIR. Manual test: en emulación mobile, el HUD muestra solo Puntuación + stats + selector de skin + botón de pausa, y tocar pausa detiene el juego y abre el menú con las 3 acciones.
8. Repaso final: `npm run build` sin errores de tipos. Probar manualmente en emulación mobile (375px, 414px, 768px) y en un viewport bajo (375×667, el caso más ajustado para Tetris) los 4 juegos completos: D-pad y botones de acción controlan el motor sosteniendo el dedo (incluyendo repetición en Tetris y en "DISPARAR" de Asteroids), la paleta de Arkanoid responde al D-pad, ningún canvas desborda horizontalmente, el canvas secundario de Tetris es visible y proporcionalmente idéntico al de escritorio, los controles nunca solapan el canvas, el HUD simplificado y el menú de pausa funcionan, y el selector de skin sigue funcionando. Confirmar que en escritorio (sin emulación táctil) todo se ve y comporta exactamente igual que antes del spec (sin D-pad, sin HUD simplificado, sin clase `touch-mode`).

## Criterios de aceptación

- [x] Existe `lib/useTouchDevice.ts` con el hook `useTouchDevice()` basado en feature detection táctil.
- [x] Existen los tipos `TouchButton` (con `code`, `key` y `repeat` opcional) y `TouchControlsConfig` en `lib/games/types.ts`, y `touchControls` está definido en `GameRegistryEntry` para los 4 juegos (asteroides, tetris, arkanoid, snake) con los valores acordados.
- [x] Existe `components/TouchControls.tsx`, que siempre renderiza las 4 posiciones del D-pad (las no habilitadas para el juego actual se muestran deshabilitadas, no ocultas).
- [x] En un dispositivo/emulación táctil, `TouchControls` aparece debajo del canvas, en flujo, en los 4 juegos; en un dispositivo sin touch, no aparece en ninguno.
- [x] Mantener presionado un botón de dirección o de acción activa la acción correspondiente de forma sostenida (igual que `keydown`/`keyup`), y soltar el dedo la detiene.
- [x] **En Arkanoid**, tocar y mantener el D-pad mueve la paleta (el evento sintético incluye `key`, no solo `code`, porque el motor filtra por `e.key`).
- [x] En Tetris, mantener presionado un botón del D-pad repite el movimiento a intervalo fijo mientras se sostiene, sin necesidad de tocar repetidamente.
- [x] En Asteroids, mantener presionado "DISPARAR" dispara en ráfaga a intervalo fijo (no una sola vez por toque).
- [x] En Asteroids, es posible mantener presionado "AVANZAR" y tocar "DISPARAR" al mismo tiempo (dos dedos, dos botones) sin que uno cancele al otro.
- [x] **En Asteroids y Tetris**, `TouchControls` se distribuye en fila con el D-pad a la izquierda y los botones de acción a la derecha (estilo joystick). **En Arkanoid y Snake**, el D-pad permanece centrado, sin distribución en fila.
- [x] **En escritorio (sin emulación táctil)**, el CSS de `.crt-screen`, `.game-canvas`, `.game-canvas-fixed` y `.next-piece-canvas` no cambia respecto al comportamiento anterior a este spec (todo el CSS nuevo cuelga de `.av-player.touch-mode`).
- [x] En emulación mobile de 375px de ancho, ningún canvas de los 4 juegos desborda horizontalmente la pantalla.
- [x] **En Tetris móvil**, el canvas conserva su relación de aspecto 1:2 y se ve proporcionalmente idéntico al de escritorio (mismo dibujo, solo reducido por CSS, sin cambiar los atributos `width`/`height` del canvas ni las constantes del motor).
- [x] El canvas secundario de "siguiente pieza" de Tetris es visible completo en emulación mobile de 375px, ubicado debajo del canvas principal (en flujo, sin offset fijo en px).
- [x] **En Snake móvil**, el canvas es cuadrado (1:1), sin la deformación a 4:3 que impone `.crt-screen` en escritorio.
- [x] **En ningún juego, en ningún viewport probado (incluido uno bajo, ej. 375×667), `TouchControls` se superpone al canvas ni lo tapa**; ambos quedan siempre visibles y accesibles en flujo vertical.
- [x] En emulación táctil, el HUD del reproductor oculta la fila "Jugador" y muestra Puntuación, los stats del juego, el selector de skin y un único botón de PAUSA.
- [x] Tocar el botón de PAUSA en mobile pausa el motor y abre un panel con REANUDAR, FIN y SALIR; tocar REANUDAR reanuda el juego y cierra el panel.
- [x] En escritorio (sin emulación táctil), el HUD y los botones PAUSA/FIN/SALIR se ven y comportan exactamente igual que antes de este spec.
- [x] El selector de skin sigue funcionando igual en los 4 juegos, tanto en desktop como en emulación táctil.
- [x] Salir del reproductor (`SALIR` en desktop, o desde el panel de pausa en mobile) sigue cancelando el loop del motor y removiendo listeners, sin fugas.
- [x] `npm run build` compila sin errores de tipos.

## Decisiones

- **Sí:** botones virtuales (D-pad + acción) en vez de gestos (swipe/drag). Consistente entre los 4 juegos, incluye acciones que se deben mantener presionadas, y es lo que pidió el usuario con una referencia visual concreta.
- **No:** gestos táctiles directos sobre el canvas. Más difícil de unificar entre los 4 motores y de sostener una acción continua (avanzar en Asteroids, mover paleta en Arkanoid).
- **Sí:** detección automática por feature detection (`pointer: coarse` / `ontouchstart`) en vez de breakpoint de ancho o toggle manual. Un tablet con teclado Bluetooth no necesita el D-pad aunque tenga pantalla ancha; un celular angosto sin touch (no existe en la práctica, pero el criterio es más correcto) tampoco lo mostraría por error.
- **Sí:** despachar `KeyboardEvent` sintéticos desde los botones táctiles en vez de agregar un método nuevo a `ArcadeGameEngine`. Cero cambios en los 4 motores existentes; toda la lógica nueva es aditiva (hook + componente + config de registry).
- **Sí:** D-pad con las 4 posiciones fijas hardcodeadas en `TouchControls.tsx` (código y label de cada dirección iguales en los 4 juegos), y el registry solo declara qué posiciones están activas por juego (`dpadEnabled`). Los 4 motores ya mapean sus direcciones 1:1 a `ArrowUp/Down/Left/Right`, así que duplicar código/label por juego en el registry sería redundante.
- **Sí:** el D-pad siempre muestra la cruz completa (4 posiciones), deshabilitando en vez de ocultar las direcciones que un juego no usa. Mantiene una forma visual consistente entre los 4 juegos, según lo pedido explícitamente por el usuario.
- **Sí:** distribución tipo joystick (D-pad a la izquierda, botones de acción a la derecha) solo en los juegos con `actions.length > 0` (Asteroids, Tetris); D-pad centrado, sin fila, en los juegos sin botones de acción (Arkanoid, Snake). Replicar la separación lateral en juegos sin botones de acción no aporta nada y descentraría la cruceta sin necesidad, dado que esos juegos solo requieren mover; el criterio se deriva directamente de `actions.length` en vez de agregar una bandera nueva de configuración por juego.
- **Sí:** en Asteroids, dentro del grupo de acciones (ambas del lado derecho), "DISPARAR" se ubica más a la izquierda y "AVANZAR" más a la derecha. `TouchControls` renderiza `actions` en el orden del arreglo, así que este orden se define únicamente en `registry.ts` (`asteroides.touchControls.actions`), sin lógica nueva en el componente.
- **Sí:** repetición de `keydown` sintético a intervalo fijo en el D-pad de Tetris (`dpadRepeat`) y en el botón "DISPARAR" de Asteroids (`repeat` por botón), porque ambos motores reaccionan a `keydown` discreto/edge-detection en vez de leer un estado booleano por frame; los demás no la necesitan porque ya sostienen la acción mientras el botón está activo.
- **Sí:** despachar `key` además de `code` en los `KeyboardEvent` sintéticos. Arkanoid filtra por `e.key` (`lib/games/arkanoid/engine.ts:63`); sin ese campo, sus botones táctiles no moverían la paleta pese a que el resto del spec asumía que bastaba con `code`.
- **Sí:** clase `touch-mode` en `.av-player`, aplicada por el mismo `useTouchDevice()` que gobierna el D-pad y el HUD simplificado, como único gancho para todo el CSS de escalado nuevo. Garantiza que el escritorio no cambie ni un píxel, porque ninguna regla nueva alcanza al DOM sin esa clase.
- **Sí:** canvas en flujo normal (no `position: absolute`) dentro de `.touch-mode`, con `max-height` reservando espacio para `TouchControls` debajo. Es la forma estructural de asegurar que los controles nunca se superpongan al canvas, en vez de calcular offsets manuales.
- **Sí:** botones dimensionados con `clamp()` y compactados automáticamente por media query de altura de viewport, en vez de una bandera de configuración por juego. Resuelve el caso más exigente (Tetris, canvas 1:2) sin acoplar el tamaño de los botones a un juego específico.
- **No:** cambiar los atributos `width`/`height` del `<canvas>` ni las constantes internas de los motores (`COLS`/`ROWS`/`BLOCK` de Tetris, `W`/`H` de Asteroids, `CELL` de Snake) para "reducir" el canvas. Reducir solo por CSS mantiene el dibujo idéntico proporcionalmente al de escritorio y no toca ningún motor.
- **Sí:** HUD simplificado y menú de pausa en mobile bajo el mismo criterio de detección táctil que el D-pad, en vez de un breakpoint de ancho aparte. Un solo concepto de "modo mobile" en toda la pantalla del juego, sin dos criterios distintos que puedan desincronizarse.
- **Sí:** el botón de PAUSA en mobile pausa y abre el menú en un solo toque, en vez de un ícono aparte de "más opciones". Menos botones compitiendo por espacio en una pantalla angosta y consistente con el hecho de que en mobile no tiene sentido buscar otra acción sin pausar primero.
- **Sí:** escalar Tetris y Snake con el mismo patrón CSS que ya usan Asteroids/Arkanoid (`max-width:100%`/`height:auto`), respetando su aspect ratio real en vez de forzar el 4:3 de `.crt-screen`, aplicado solo dentro de `.touch-mode`. Reutiliza un patrón ya validado en vez de inventar uno nuevo, sin tocar el layout de escritorio.
- **No:** forzar o sugerir orientación landscape. El usuario prefirió dejarlo libre; el canvas ya se adapta a portrait como se ve en la captura de referencia.
- **No:** soporte multi-touch explícito como feature separada. Cada botón maneja sus propios eventos `touchstart`/`touchend` de forma independiente, así que presionar dos botones con dos dedos a la vez ya funciona sin lógica adicional.

## Riesgos

| Riesgo                                                                                                                                                                                                                                                        | Mitigación                                                                                                                                                                                                                                       |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Al tocar los botones táctiles, el navegador podría interpretar el gesto como scroll/zoom de la página en vez de una pulsación de botón, especialmente en pulsaciones sostenidas.                                                                              | `touch-action: none` en los botones de `TouchControls` y `preventDefault()` en `touchstart`, mismo patrón que ya usan los motores para las teclas de flecha (`PREVENT_DEFAULT_CODES`).                                                           |
| El intervalo fijo de repetición de `keydown` en Tetris podría sentirse muy lento o muy rápido comparado con el key-repeat real del sistema operativo del usuario.                                                                                             | Se ajusta el intervalo de forma manual probando en emulación mobile durante el paso 3 del plan; no necesita coincidir exactamente con ningún valor de SO, solo sentirse jugable.                                                                 |
| Un dispositivo híbrido (laptop con pantalla táctil y mouse/teclado) podría activar `useTouchDevice()` y mostrar el D-pad de forma innecesaria para un usuario que prefiere teclado.                                                                           | Aceptado como limitación conocida del criterio de feature detection; está fuera de alcance el toggle manual para ese caso (ver "Fuera de alcance").                                                                                              |
| El reposicionamiento del canvas secundario de Tetris (`.next-piece-canvas`, hoy con offset fijo) podría romper el layout de escritorio si el cambio de CSS no queda acotado correctamente.                                                                    | Se verifica explícitamente en el paso 8 del plan que el layout de escritorio (sin emulación táctil) se ve idéntico al actual antes de cerrar el spec.                                                                                            |
| Los `KeyboardEvent` sintéticos despachados sobre `window` podrían, en teoría, ser capturados por algún listener global no relacionado con el motor del juego.                                                                                                 | Hoy no existe ningún otro listener de `keydown`/`keyup` en `window` fuera de los 4 motores de juego (verificado en el código actual); si se agrega uno en el futuro, deberá filtrar por contexto/foco.                                           |
| Si el evento sintético solo lleva `code`, Arkanoid no reacciona: filtra por `e.key` (`arkanoid/engine.ts:63`), no por `e.code` como los otros 3 motores.                                                                                                      | Cada `TouchButton` y cada entrada de `DPAD_BUTTONS` declara `key` además de `code`; el paso 4 del plan incluye verificación específica de que el D-pad mueve la paleta de Arkanoid.                                                              |
| Una reserva de alto (`max-height`) mal calculada en `.touch-mode` podría recortar el canvas o dejar `TouchControls` fuera de la pantalla en viewports bajos (celulares en landscape o con teclado/notch grandes).                                             | Se verifica explícitamente en un viewport bajo (375×667) durante los pasos 6 y 8 del plan, no solo en anchos angostos.                                                                                                                           |
| Arkanoid calcula la posición de la paleta con `getBoundingClientRect()` y `scaleX = canvas.width / rect.width` (`arkanoid/engine.ts:82-90`); al reducir el canvas por CSS dentro de `.touch-mode`, ese cálculo debe seguir devolviendo coordenadas correctas. | El cálculo ya es proporcional al tamaño renderizado (no asume 1:1 con los atributos del canvas), así que en teoría no requiere cambios; se verifica igualmente moviendo la paleta con mouse/touch emulado sobre el canvas reducido en el paso 8. |

## Lo que **no** está en este spec

- Soporte por gestos (swipe/drag) como alternativa o complemento al D-pad.
- Toggle manual para forzar mostrar/ocultar los controles táctiles o el HUD simplificado en dispositivos sin touch.
- Forzar o sugerir un cambio de orientación del dispositivo.
- Vibración/haptic feedback al presionar los botones.
- Controles táctiles para juegos futuros fuera de los 4 actuales.
- Rediseño visual adicional del D-pad más allá de lo acordado (iconografía elaborada, animaciones custom).
- Tests automatizados.

Cada uno de estos, si se necesita, va en su propio spec futuro.
