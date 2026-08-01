# Registro de revisión móvil

Memoria del agente `mobile-porter` (`.claude/agents/mobile-porter.md`). Convención append-only: nunca
se reescribe el archivo entero, solo se agregan filas o se mueve la fila del objetivo recién revisado
de `## Pendientes` a `## Revisado`.

## Pendientes

| Objetivo    | Ruta            | Tipo      | Riesgo conocido                                                             |
| ----------- | --------------- | --------- | ---------------------------------------------------------------------------- |
| Nav         | global          | Componente | Ya tiene tratamiento móvil (hamburguesa + panel deslizante); revisar detalles |
| Home        | `/`             | Página    | Ya es la página más trabajada en responsive; revisar detalles                |
| Library     | `/biblioteca`   | Página    | Padding lateral fijo `32px`; tilt de `GameCard` es solo `onMouseMove`, sin equivalente táctil |
| GameDetail  | `/juego/[id]`   | Página    | `.stat-strip` fija a `repeat(3,1fr)` sin colapsar en anchos angostos          |
| HallOfFame  | `/salon`        | Página    | `.hall-table` a 4 columnas (`50px 1fr 90px 90px`) apretada en 360px de ancho  |
| About       | `/about`        | Página    | Tratamiento parcial; revisar formulario y `.highlight-row`                   |
| Auth        | `/auth`         | Página    | Solo fluido (sin media queries); confirmar que basta                        |
| Footer      | `app/layout.tsx` | Componente | Padding fijo `20px 32px` inline, sin ajuste móvil                          |
| Asteroids   | `/jugar/asteroids` | Juego  | Ya con soporte táctil (specs 10/11); revisar detalles residuales             |
| Tetris      | `/jugar/tetris` | Juego     | Ya con soporte táctil (specs 10/11); revisar detalles residuales             |
| Arkanoid    | `/jugar/arkanoid` | Juego   | Ya con soporte táctil (specs 10/11); revisar detalles residuales             |
| Snake       | `/jugar/snake`  | Juego     | Ya con soporte táctil (specs 10/11); revisar detalles residuales             |

## Revisado

| Fecha | Objetivo | Anchos evaluados | Cambios aplicados | Verificado en dispositivo |
| ----- | -------- | ----------------- | ------------------ | -------------------------- |

## Hallazgos abiertos

| Objetivo | Hallazgo | Motivo por el que no se corrigió |
| -------- | -------- | ---------------------------------- |
