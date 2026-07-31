# SPEC 10 — Controles táctiles para juegos móviles

> **Estado:** Aprobado
> **Depende de:** SPEC 05 (asteroids-game), SPEC 07 (tetris-game), SPEC 08 (arkanoid-game), SPEC 09 (snake-game)
> **Fecha:** 2026-07-30
> **Objetivo:** Hacer jugables los 4 juegos actuales (Asteroids, Tetris, Arkanoid, Snake) en dispositivos móviles con pantalla táctil, agregando un D-pad y botones de acción debajo del canvas que despachan los mismos eventos de teclado que ya escucha cada motor, y adaptando el escalado de los canvases que hoy no se ajustan a pantallas angostas (Tetris y Snake).

## Alcance

**Incluye:**

- Hook de detección de dispositivo táctil (`lib/useTouchDevice.ts` o similar), basado en feature detection (`matchMedia("(pointer: coarse)")` / `"ontouchstart" in window`), reevaluado una sola vez al montar. Este mismo hook gobierna tanto el D-pad táctil como el HUD simplificado descritos abajo — un único criterio de "modo mobile" en toda la pantalla del juego.
- Componente genérico `components/TouchControls.tsx` que renderiza un D-pad (cruz direccional) + botones de acción circulares, configurado por juego desde el registry — no hardcodea ningún motor específico, siguiendo la misma convención que `colorSchemes`.
- Nueva propiedad opcional `touchControls` en `GameRegistryEntry` (`lib/games/registry.ts`), con la lista de botones de acción por juego y qué posiciones del D-pad están activas, cada una mapeada al `code` de teclado que ya escucha el motor correspondiente:
  - Asteroids: D-pad izq/der (rotar) + botón "AVANZAR" (`ArrowUp`) + botón "DISPARAR" (`Space`).
  - Tetris: D-pad izq/der/abajo (mover/soft drop) + botón "ROTAR" (`ArrowUp`) + botón "CAÍDA DURA" (`Space`).
  - Arkanoid: D-pad izq/der (mover paleta).
  - Snake: D-pad de 4 direcciones (`ArrowUp/Down/Left/Right`).
- Cada botón despacha `KeyboardEvent("keydown"/"keyup", { code })` sintéticos sobre `window` en `touchstart`/`touchend`/`touchcancel`, reutilizando sin cambios la lógica de los 4 motores existentes.
- Para Tetris (única acción discreta por `keydown`, sin lectura continua de estado por frame): mientras un botón del D-pad se mantiene presionado, se repiten los `keydown` sintéticos a intervalo fijo, imitando el key-repeat nativo del sistema operativo, hasta el `touchend`/`touchcancel`.
- El D-pad siempre renderiza sus 4 posiciones (cruz completa); la posición que un juego no usa se muestra deshabilitada, no se oculta.
- `TouchControls` se renderiza en `GamePlayer.tsx` debajo del `.crt` (no superpuesto al canvas), solo cuando el hook de detección táctil devuelve `true` y el juego tiene `touchControls` definido en el registry.
- **HUD simplificado en mobile** (mismo criterio de detección táctil): se oculta la fila "Jugador"; se mantienen Puntuación, los stats propios del motor (vidas/líneas/longitud/nivel según el juego) y el selector de skin. Los botones PAUSA/FIN/SALIR se colapsan en un único botón de PAUSA.
- Ese botón de PAUSA en mobile pausa el motor (igual que hoy) y además abre un panel/menú con REANUDAR, FIN y SALIR — las mismas acciones que en escritorio siguen siendo tres botones separados.
- Corrección del escalado responsive de Tetris y Snake (hoy con `.game-canvas-fixed`, tamaño fijo en píxeles sin adaptarse a pantallas angostas), aplicando el mismo patrón de escalado por CSS que ya usan Asteroids/Arkanoid (`.game-canvas`), respetando el aspect ratio real de cada uno (1:2 Tetris, 1:1 Snake) en vez de forzar el 4:3 actual de `.crt-screen`.
- Reposicionamiento del canvas secundario de "siguiente pieza" de Tetris (`.next-piece-canvas`, hoy con offset fijo `left: calc(50% + 174px)` que se sale de pantalla en mobile) para que se ubique debajo del canvas principal en vez de al costado.

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
const DPAD_BUTTONS = {
  up: { code: "ArrowUp", label: "▲" },
  down: { code: "ArrowDown", label: "▼" },
  left: { code: "ArrowLeft", label: "◀" },
  right: { code: "ArrowRight", label: "▶" },
} as const;
// las 4 posiciones siempre se renderizan (cruz completa); la posición no listada
// en dpadEnabled se muestra deshabilitada, no se oculta
```

```ts
// lib/games/types.ts (tipos nuevos, sin tocar ArcadeGameEngine existente)
export interface TouchButton {
  code: string; // KeyboardEvent.code a despachar, ej. "Space"
  label: string; // ej. "DISPARAR"
}

export interface TouchControlsConfig {
  dpadEnabled: ("up" | "down" | "left" | "right")[]; // posiciones activas de la cruz para este juego
  dpadRepeat?: boolean; // default false; true repite el keydown sintético a intervalo fijo mientras se mantiene presionado (solo Tetris)
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
  actions: [
    { code: "ArrowUp", label: "AVANZAR" },
    { code: "Space", label: "DISPARAR" },
  ],
};

tetris.touchControls = {
  dpadEnabled: ["left", "right", "down"],
  dpadRepeat: true,
  actions: [
    { code: "ArrowUp", label: "ROTAR" },
    { code: "Space", label: "CAÍDA DURA" },
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

1. Crear `lib/useTouchDevice.ts` con el hook `useTouchDevice()` (feature detection por `matchMedia("(pointer: coarse)")` / `"ontouchstart" in window`). Sin uso todavía. Manual test: `npm run build` compila.
2. Agregar los tipos `TouchButton` y `TouchControlsConfig` en `lib/games/types.ts`, la propiedad opcional `touchControls` en `GameRegistryEntry` (`lib/games/registry.ts`) y completar los 4 valores (asteroides/tetris/arkanoid/snake) acordados en el modelo de datos. Sin uso todavía. Manual test: `npm run build` sin errores de tipos.
3. Crear `components/TouchControls.tsx`: D-pad con las 4 posiciones fijas hardcodeadas (deshabilitando las que no estén en `dpadEnabled`) y los botones de `actions`, cada botón despachando `KeyboardEvent` sintéticos sobre `window` en `touchstart`/`touchend`/`touchcancel` (con repetición a intervalo fijo cuando `dpadRepeat` es `true`). Sin integrar a `GamePlayer` todavía.
4. Integrar `TouchControls` en `GamePlayer.tsx`: se renderiza debajo del `.crt` cuando `useTouchDevice()` es `true` y `registryEntry.touchControls` existe. Manual test: abrir cada uno de los 4 juegos con emulación de dispositivo táctil (Chrome DevTools → Toggle device toolbar) y verificar que los botones aparecen y controlan el motor.
5. Agregar estilos `.touch-controls`, `.touch-dpad`, `.touch-action` en `app/globals.css` (cruz direccional + botones de acción, sin superponerse al canvas). Manual test: comparar visualmente en emulación mobile contra el mockup de referencia.
6. Corregir el escalado responsive de Tetris y Snake (`.game-canvas-fixed`): aplicar `max-width:100%`/`height:auto` respetando su aspect ratio real, y reposicionar `.next-piece-canvas` debajo del canvas principal en vez de al costado con offset fijo. Manual test: en emulación mobile angosta (375px), Tetris y Snake no desbordan horizontalmente y el canvas secundario es visible.
7. HUD simplificado en mobile en `GamePlayer.tsx`: cuando `isTouch` es `true`, ocultar la fila "Jugador" y colapsar PAUSA/FIN/SALIR en un único botón de PAUSA que pausa el motor y abre un panel (`pauseMenuOpen`) con REANUDAR/FIN/SALIR. Manual test: en emulación mobile, el HUD muestra solo Puntuación + stats + selector de skin + botón de pausa, y tocar pausa detiene el juego y abre el menú con las 3 acciones.
8. Repaso final: `npm run build` sin errores de tipos. Probar manualmente en emulación mobile (375px, 414px, 768px) los 4 juegos completos: D-pad y botones de acción controlan el motor sosteniendo el dedo (incluyendo repetición en Tetris), ningún canvas desborda horizontalmente, el canvas secundario de Tetris es visible, el HUD simplificado y el menú de pausa funcionan, y el selector de skin sigue funcionando. Confirmar que en escritorio (sin emulación táctil) todo se ve y comporta exactamente igual que antes del spec (sin D-pad, sin HUD simplificado).

## Criterios de aceptación

- [ ] Existe `lib/useTouchDevice.ts` con el hook `useTouchDevice()` basado en feature detection táctil.
- [ ] Existen los tipos `TouchButton` y `TouchControlsConfig` en `lib/games/types.ts`, y `touchControls` está definido en `GameRegistryEntry` para los 4 juegos (asteroides, tetris, arkanoid, snake) con los valores acordados.
- [ ] Existe `components/TouchControls.tsx`, que siempre renderiza las 4 posiciones del D-pad (las no habilitadas para el juego actual se muestran deshabilitadas, no ocultas).
- [ ] En un dispositivo/emulación táctil, `TouchControls` aparece debajo del `.crt` en los 4 juegos; en un dispositivo sin touch, no aparece en ninguno.
- [ ] Mantener presionado un botón de dirección o de acción activa la acción correspondiente de forma sostenida (igual que `keydown`/`keyup`), y soltar el dedo la detiene.
- [ ] En Tetris, mantener presionado un botón del D-pad repite el movimiento a intervalo fijo mientras se sostiene, sin necesidad de tocar repetidamente.
- [ ] En Asteroids, es posible mantener presionado "AVANZAR" y tocar "DISPARAR" al mismo tiempo (dos dedos, dos botones) sin que uno cancele al otro.
- [ ] En emulación mobile de 375px de ancho, ningún canvas de los 4 juegos desborda horizontalmente la pantalla.
- [ ] El canvas secundario de "siguiente pieza" de Tetris es visible completo en emulación mobile de 375px, ubicado debajo del canvas principal.
- [ ] En emulación táctil, el HUD del reproductor oculta la fila "Jugador" y muestra Puntuación, los stats del juego, el selector de skin y un único botón de PAUSA.
- [ ] Tocar el botón de PAUSA en mobile pausa el motor y abre un panel con REANUDAR, FIN y SALIR; tocar REANUDAR reanuda el juego y cierra el panel.
- [ ] En escritorio (sin emulación táctil), el HUD y los botones PAUSA/FIN/SALIR se ven y comportan exactamente igual que antes de este spec.
- [ ] El selector de skin sigue funcionando igual en los 4 juegos, tanto en desktop como en emulación táctil.
- [ ] Salir del reproductor (`SALIR` en desktop, o desde el panel de pausa en mobile) sigue cancelando el loop del motor y removiendo listeners, sin fugas.
- [ ] `npm run build` compila sin errores de tipos.

## Decisiones

- **Sí:** botones virtuales (D-pad + acción) en vez de gestos (swipe/drag). Consistente entre los 4 juegos, incluye acciones que se deben mantener presionadas, y es lo que pidió el usuario con una referencia visual concreta.
- **No:** gestos táctiles directos sobre el canvas. Más difícil de unificar entre los 4 motores y de sostener una acción continua (avanzar en Asteroids, mover paleta en Arkanoid).
- **Sí:** detección automática por feature detection (`pointer: coarse` / `ontouchstart`) en vez de breakpoint de ancho o toggle manual. Un tablet con teclado Bluetooth no necesita el D-pad aunque tenga pantalla ancha; un celular angosto sin touch (no existe en la práctica, pero el criterio es más correcto) tampoco lo mostraría por error.
- **Sí:** despachar `KeyboardEvent` sintéticos desde los botones táctiles en vez de agregar un método nuevo a `ArcadeGameEngine`. Cero cambios en los 4 motores existentes; toda la lógica nueva es aditiva (hook + componente + config de registry).
- **Sí:** D-pad con las 4 posiciones fijas hardcodeadas en `TouchControls.tsx` (código y label de cada dirección iguales en los 4 juegos), y el registry solo declara qué posiciones están activas por juego (`dpadEnabled`). Los 4 motores ya mapean sus direcciones 1:1 a `ArrowUp/Down/Left/Right`, así que duplicar código/label por juego en el registry sería redundante.
- **Sí:** el D-pad siempre muestra la cruz completa (4 posiciones), deshabilitando en vez de ocultar las direcciones que un juego no usa. Mantiene una forma visual consistente entre los 4 juegos, según lo pedido explícitamente por el usuario.
- **Sí:** repetición de `keydown` sintético a intervalo fijo solo en Tetris (`dpadRepeat`), porque es el único motor que reacciona a `keydown` discreto en vez de leer un estado booleano por frame; los demás no la necesitan porque ya sostienen la acción mientras el botón está activo.
- **Sí:** HUD simplificado y menú de pausa en mobile bajo el mismo criterio de detección táctil que el D-pad, en vez de un breakpoint de ancho aparte. Un solo concepto de "modo mobile" en toda la pantalla del juego, sin dos criterios distintos que puedan desincronizarse.
- **Sí:** el botón de PAUSA en mobile pausa y abre el menú en un solo toque, en vez de un ícono aparte de "más opciones". Menos botones compitiendo por espacio en una pantalla angosta y consistente con el hecho de que en mobile no tiene sentido buscar otra acción sin pausar primero.
- **Sí:** escalar Tetris y Snake con el mismo patrón CSS que ya usan Asteroids/Arkanoid (`max-width:100%`/`height:auto`), respetando su aspect ratio real en vez de forzar el 4:3 de `.crt-screen`. Reutiliza un patrón ya validado en vez de inventar uno nuevo.
- **No:** forzar o sugerir orientación landscape. El usuario prefirió dejarlo libre; el canvas ya se adapta a portrait como se ve en la captura de referencia.
- **No:** soporte multi-touch explícito como feature separada. Cada botón maneja sus propios eventos `touchstart`/`touchend` de forma independiente, así que presionar dos botones con dos dedos a la vez ya funciona sin lógica adicional.

## Riesgos

| Riesgo                                                                                                                                                                                     | Mitigación                                                                                                                                                                                             |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Al tocar los botones táctiles, el navegador podría interpretar el gesto como scroll/zoom de la página en vez de una pulsación de botón, especialmente en pulsaciones sostenidas.           | `touch-action: none` en los botones de `TouchControls` y `preventDefault()` en `touchstart`, mismo patrón que ya usan los motores para las teclas de flecha (`PREVENT_DEFAULT_CODES`).                 |
| El intervalo fijo de repetición de `keydown` en Tetris podría sentirse muy lento o muy rápido comparado con el key-repeat real del sistema operativo del usuario.                          | Se ajusta el intervalo de forma manual probando en emulación mobile durante el paso 3 del plan; no necesita coincidir exactamente con ningún valor de SO, solo sentirse jugable.                       |
| Un dispositivo híbrido (laptop con pantalla táctil y mouse/teclado) podría activar `useTouchDevice()` y mostrar el D-pad de forma innecesaria para un usuario que prefiere teclado.        | Aceptado como limitación conocida del criterio de feature detection; está fuera de alcance el toggle manual para ese caso (ver "Fuera de alcance").                                                    |
| El reposicionamiento del canvas secundario de Tetris (`.next-piece-canvas`, hoy con offset fijo) podría romper el layout de escritorio si el cambio de CSS no queda acotado correctamente. | Se verifica explícitamente en el paso 8 del plan que el layout de escritorio (sin emulación táctil) se ve idéntico al actual antes de cerrar el spec.                                                  |
| Los `KeyboardEvent` sintéticos despachados sobre `window` podrían, en teoría, ser capturados por algún listener global no relacionado con el motor del juego.                              | Hoy no existe ningún otro listener de `keydown`/`keyup` en `window` fuera de los 4 motores de juego (verificado en el código actual); si se agrega uno en el futuro, deberá filtrar por contexto/foco. |

## Lo que **no** está en este spec

- Soporte por gestos (swipe/drag) como alternativa o complemento al D-pad.
- Toggle manual para forzar mostrar/ocultar los controles táctiles o el HUD simplificado en dispositivos sin touch.
- Forzar o sugerir un cambio de orientación del dispositivo.
- Vibración/haptic feedback al presionar los botones.
- Controles táctiles para juegos futuros fuera de los 4 actuales.
- Rediseño visual adicional del D-pad más allá de lo acordado (iconografía elaborada, animaciones custom).
- Tests automatizados.

Cada uno de estos, si se necesita, va en su propio spec futuro.
