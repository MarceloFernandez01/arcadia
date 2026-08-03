# lib/games

### Motores de juego

Punto de extensión introducido en el SPEC 07, usado por los juegos actuales y futuros a implementar (Asteroids, Tetris, Arkanoid, Snake y más):

- `lib/games/types.ts` define la interfaz común `ArcadeGameEngine` (`start()/pause()/resume()/restart()/destroy()`, opcional `setColorScheme()`) y el estado de HUD flexible `EngineState` (`{ score, stats: { key, label, value }[] }`).
- `lib/games/registry.ts` es el mapa `id → { width, height, secondaryCanvas?, colorSchemes?, initialState, create() }` que resuelve cada motor.
- `components/GamePlayer.tsx` es genérico: instancia el motor a través del registry según `game.id`, renderiza el HUD desde `engineState.stats`, agrega el canvas secundario cuando la entrada lo declara (hoy solo Tetris) y el selector de esquema de color cuando hay `colorSchemes` (hoy los 4 juegos registrados: Asteroids, Tetris, Arkanoid, Snake). **No debe volver a hardcodear un motor específico.**
- Convención para un juego nuevo: motor en `lib/games/<id>/engine.ts`, assets propios en `public/games/<id>/`, portada en una clase `.cover-<slug>` de `app/globals.css`, canvas con clase `game-canvas` (o `game-canvas-fixed` si hay canvas secundario). El motor nunca dibuja sus propios overlays de "GAME OVER"/"PAUSA"; dispara `onGameOver(finalScore)` y React controla pausa/modal.
- La skill `/add-game` describe este mismo patrón en detalle y lo usa para generar specs de juegos nuevos.

#### Skins

Todo juego nuevo debe declarar, tarde o temprano, los 3 skins canónicos de la plataforma (`clasico`
default, `retro`, `neon`). El contrato compartido vive en `lib/games/skins.ts`: tipo `SkinId`, lista
`CANONICAL_SKINS` (`{id, label}[]`), `isSkinId()`, `skinStorageKey(gameId)` (clave de storage
`av_color_scheme_<gameId>`, reutiliza el nombre legado de "esquema de color") y `resolveSkin(initial,
gameId)`, que prioriza el valor recibido, luego lo guardado en `localStorage` y por último `clasico`,
reescribiendo cualquier valor legado desconocido. Cada juego define su propia paleta en
`lib/games/<id>/skins.ts` como `Record<SkinId, Palette>`, con un campo `glow` por skin (`0` en
`clasico`/`retro`, típicamente `12` en `neon`, usado como `shadowBlur`). Cuando el juego dibuja desde
un spritesheet (Arkanoid) o tiñe assets (Snake), el patrón es generar una hoja/asset teñido por skin en
un canvas offscreen y cachearlo (`Record<SkinId, HTMLCanvasElement>` o similar) en vez de teñir en cada
frame. Estado actual: Asteroids, Snake y Arkanoid ya migrados a este módulo compartido; **Tetris sigue
pendiente** (conserva su propia lista `retro/normal/pastel/neon` hardcodeada en `registry.ts` y no tiene
`lib/games/tetris/skins.ts`). El registry y `lib/games/types.ts` todavía usan la nomenclatura previa al
sistema de skins (`colorSchemes`, `initialColorScheme`, `setColorScheme`) en vez de `SkinId`; ver el
agente `skin-designer` en el CLAUDE.md de la raíz ("Agentes") y su memoria en `references/game-with-theme.md` para el detalle
juego por juego y el pendiente de Tetris.
