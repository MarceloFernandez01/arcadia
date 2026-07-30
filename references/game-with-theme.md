# Juegos con skin aplicado

Memoria del agente `skin-designer` (`.claude/agents/skin-designer.md`). Los skins canónicos de la
plataforma son `clasico` (default), `retro` y `neon`. El agente trabaja un solo juego por invocación:
antes de tocar código lee este archivo para saber qué juegos ya tienen los skins aplicados y cuáles
siguen pendientes; al terminar un juego mueve su fila de `## Pendientes` a `## Con skin` y agrega sus
mediciones a `## Contraste verificado`. Nunca se reescribe el archivo entero: solo se agregan filas o
se mueven entre secciones.

## Con skin

| Fecha      | Juego (id) | Skins                      | Default | Origen de color  | Notas                                                                                                        |
| ---------- | ---------- | --------------------------- | ------- | ----------------- | ------------------------------------------------------------------------------------------------------------- |
| 2026-07-30 | tetris     | retro, normal, pastel, neon | retro   | paleta en código  | Preexistente al agente. `normal` debe renombrarse a `clasico` y quedar como default al pasar por el agente.    |

## Pendientes

| Fecha      | Juego (id) | Skins | Default | Origen de color                                              | Notas                                                                                                                            |
| ---------- | ---------- | ----- | ------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| 2026-07-30 | asteroides | —     | —       | literales hexadecimales inline                                  | Sin infraestructura de skins. `create()` en `registry.ts` descarta `initialColorScheme`: corregir al implementar.                    |
| 2026-07-30 | arkanoid   | —     | —       | sprite (`spritesheet-breakout.png`)                             | Colores viven en el PNG, no en código. Requiere teñir el spritesheet por skin (canvas offscreen + `globalCompositeOperation`).       |
| 2026-07-30 | snake      | —     | —       | sprite (fruta, `fruits.png`) + literal (serpiente `#ffd54f`)    | Fruta es sprite; serpiente es literal en código. Requiere teñir `fruits.png` y mover el color de la serpiente a paleta.              |

## Contraste verificado

| Juego | Skin | Color | Fondo | Razón |
| ----- | ---- | ----- | ----- | ----- |
| _(sin mediciones todavía; se completa cuando el agente aplica el primer skin nuevo)_ | | | | |
