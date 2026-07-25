# Spec 06 — Leaderboard y tabla de juegos en Supabase

- **Estado:** Implementado
- **Dependencias:** 04-integracion-supabase (clientes Supabase), 05-asteroids-game (único juego con puntaje real hoy)
- **Fecha:** 2026-07-24
- **Objetivo:** Migrar el catálogo de juegos y los puntajes de `lib/data.ts`/`localStorage` a tablas reales `games` y `scores` en Supabase, de modo que el Salón de la Fama (`HallOfFame.tsx`) consulte el ranking directamente desde Supabase (no desde datos simulados) y el guardado de Asteroids escriba puntajes reales en la tabla `scores`, sin autenticación real todavía.

## Alcance

### Incluye

- Migración SQL (`supabase/migrations/`) que crea `games` y `scores` con las políticas RLS descritas en el modelo de datos, aplicada vía MCP de Supabase.
- Seed de `games`: **una sola fila**, `asteroides` (copiando los valores actuales de su entrada en `GAMES` de `lib/data.ts`: título, descripciones, cat `SHOOTER`, cover, color, `best_seed: 0`, `plays_seed: '0'`).
- `lib/data.ts`: se quita la entrada `asteroides` de `GAMES` (se migra por completo a Supabase, sin quedar duplicada como hardcode); el resto de los juegos (`bloque-buster`, `caida`, `serpentina`, `gloton`, `rocas`) se queda hardcodeado igual que hoy.
- `lib/games.ts`:
  - `getAllGames()`: combina `GAMES` (mock, estático de `lib/data.ts`) + filas reales de `games` en Supabase, con `best`/`plays` resueltos (`MAX(score)`/`COUNT(*)` de `scores` si hay filas, si no `best_seed`/`plays_seed`). Usado por Home/Biblioteca.
  - `getRealGames()`: trae únicamente las filas de la tabla `games` en Supabase (sin combinar con `lib/data.ts`). Usado exclusivamente por `HallOfFame`.
  - `getGameById(id)`: busca primero en Supabase; si no está, cae a `GAMES` de `lib/data.ts`.
- `lib/scores.ts`: `getTopScores(gameId, limit=12)` (server) y `saveScore(gameId, playerName, score)` (client, vía `lib/supabase/client.ts`), que inserta en `scores` con `user_id: null`.
- `app/page.tsx`, `app/biblioteca/page.tsx`, `app/salon/page.tsx`, `app/juego/[id]/page.tsx`, `app/jugar/[id]/page.tsx` pasan a ser Server Components async que llaman a `getAllGames()`/`getRealGames()`/`getGameById()`/`getTopScores()` y pasan los datos como props.
- `Home.tsx`, `Library.tsx` reciben `games` (de `getAllGames()`) como prop en vez de importar `GAMES` directamente.
- `HallOfFame.tsx`: los tabs se generan **solo** a partir de `getRealGames()` — ningún juego hardcodeado de `lib/data.ts` aparece en el Salón de la Fama. Cada tab consulta `getTopScores(gameId)`; si no hay filas, muestra un mensaje de estado vacío (ej. "SÉ EL PRIMERO EN ENTRAR AL SALÓN DE LA FAMA") reutilizando las clases CSS ya existentes del componente (`hall-table`, `pixel`, mismo espaciado/tipografía que el resto de `av-hall`) — nunca se usa `seededScores` como relleno en este componente.
- `app/juego/[id]/page.tsx` (`GameDetail`): para `asteroides` usa `getTopScores(id)` (top real); para el resto de los juegos sigue usando `seededScores` como hoy — sin cambios ahí.
- `GamePlayer.tsx`:
  - El input de nombre del modal de fin de partida ("TUS INICIALES") se precompleta desde `localStorage.getItem("av_player_name")` si existe; si no, cae al `displayName` actual (`useAvUser()?.name` o "INVITADO").
  - `saveScore` (solo para `asteroides`) inserta en `scores` vía Supabase con `game_id: "asteroides"`, `player_name` = valor del input, `score` real, `user_id: null` — reemplaza el guardado en `localStorage` (`av_scores`) para este juego.
  - Al guardar, también persiste el nombre escrito en `localStorage.setItem("av_player_name", name)` para la próxima partida.
- Cualquier juego funcional futuro (con motor real, como se hizo con Asteroids en el spec 05) se agrega directamente a la tabla `games` de Supabase, no a `lib/data.ts`.

### No incluye (fuera de alcance)

- Autenticación real — `scores_public_insert`/`games_public_insert`/`games_public_update` quedan abiertos a cualquiera; se restringen a usuarios autenticados en un spec futuro cuando exista Supabase Auth real.
- **Limpieza de puntajes de jugadores invitados**: cuando se implemente la autenticación real (spec futuro), se deberá limpiar la tabla `scores` para eliminar los registros guardados por usuarios no autenticados (invitados) acumulados durante este spec.
- Migrar el resto de los juegos hardcodeados a Supabase — se quedan en `lib/data.ts` mientras no tengan motor real.
- Guardado real de puntaje para juegos distintos de `asteroides` — siguen sin motor real, no aplica.
- Borrado de juegos o de puntajes ya guardados (no hay políticas de `delete` en `games` ni en `scores`).
- Ranking global agregado (todos los juegos mezclados) — el leaderboard es solo por juego real.
- **Realtime** (suscripciones en vivo a cambios de `scores`/`games`) — el leaderboard se actualiza al navegar/recargar o cambiar de tab, no en tiempo real mientras otro jugador guarda un puntaje. Queda para un spec futuro, siguiendo el mismo criterio que el spec 04 dejó Realtime explícitamente fuera de alcance.
- **Paginación del leaderboard** — `getTopScores` trae un top fijo de 12 filas por juego, sin manera de ver puntajes más allá de ese top. Queda para un spec futuro si se necesita ver el listado completo.
- Migrar `CATS` (categorías) o `PLAYERS` (nombres de relleno de `seededScores`) a Supabase — quedan como constantes locales en `lib/data.ts`.
- Tests automatizados.

## Modelo de datos

```sql
-- Tabla: games (solo juegos con motor real, ej. asteroides)
create table games (
  id text primary key,
  title text not null,
  short text not null,
  long text not null,
  cat text not null check (cat in ('ARCADE','PUZZLE','SHOOTER','VERSUS')),
  cover text not null,
  color text not null check (color in ('cyan','magenta','green','yellow')),
  best_seed integer not null default 0,
  plays_seed text not null default '0',
  created_at timestamptz not null default now()
);

-- Tabla: scores
create table scores (
  id uuid primary key default gen_random_uuid(),
  game_id text not null references games(id),
  user_id uuid null references auth.users(id), -- nulo por ahora (sin auth real)
  player_name text not null,
  score integer not null,
  created_at timestamptz not null default now()
);

create index scores_game_id_score_idx on scores (game_id, score desc);

-- RLS: games (insert/update públicos abiertos, sin delete)
alter table games enable row level security;

create policy "games_public_read" on games
  for select using (true);

create policy "games_public_insert" on games
  for insert with check (true);

create policy "games_public_update" on games
  for update using (true) with check (true);
-- Sin política de delete: no se pueden borrar juegos desde la app.

-- RLS: scores (select/insert públicos, sin update/delete)
alter table scores enable row level security;

create policy "scores_public_read" on scores
  for select using (true);

create policy "scores_public_insert" on scores
  for insert with check (true);
-- Sin políticas de update/delete: nadie puede modificar ni borrar puntajes ya guardados.

-- Seed (única fila)
insert into games (id, title, short, long, cat, cover, color, best_seed, plays_seed)
values ('asteroides', '<título actual>', '<short actual>', '<long actual>', 'SHOOTER', '<cover actual>', '<color actual>', 0, '0');
-- Valores exactos = los que hoy tiene la entrada "asteroides" en GAMES de lib/data.ts.
```

**Cómo se resuelven `best`/`plays` en la UI:**

- `best` real = `MAX(score)` en `scores` para ese `game_id`; si no hay filas, se usa `best_seed`.
- `plays` real = `COUNT(*)` en `scores` para ese `game_id`; si es `0`, se usa `plays_seed`.

El tipo `Game` de `lib/data.ts` se mantiene igual (mismos campos, `best`/`plays` ya resueltos, no crudos); `ScoreRow` también se mantiene para `seededScores` y para el resultado de `getTopScores`.

## Plan de implementación

1. **Migración SQL.** Crear `supabase/migrations/NNN_games_and_scores.sql` con las tablas `games`/`scores`, índices, RLS (incluyendo `games_public_insert`/`games_public_update`) y el `insert` de seed de la fila `asteroides`. Aplicarla vía `apply_migration` del MCP de Supabase. El sistema sigue igual (la app no consume las tablas todavía).
2. **Capa de datos.** Crear `lib/games.ts` (`getAllGames()`, `getRealGames()`, `getGameById(id)`) y `lib/scores.ts` (`getTopScores(gameId, limit=12)` server, `saveScore(gameId, playerName, score)` client), usando `lib/supabase/server.ts`/`client.ts` existentes. Todavía sin uso en componentes.
3. **Páginas a Server Components async.** Convertir `app/page.tsx`, `app/biblioteca/page.tsx`, `app/salon/page.tsx` para llamar a `getAllGames()`/`getRealGames()` y pasar los datos como props a `Home`, `Library`, `HallOfFame`. `app/juego/[id]/page.tsx` y `app/jugar/[id]/page.tsx` reemplazan su import síncrono de `GAMES` por `getGameById(id)`.
4. **Componentes reciben props en vez de importar `GAMES`.** Actualizar `Home.tsx` y `Library.tsx` para recibir `games` por props, quitando el import directo de `GAMES`. `lib/data.ts` pierde la entrada `asteroides` de `GAMES`.
5. **Leaderboard real y exclusivo en `HallOfFame`.** `app/salon/page.tsx` pasa `getRealGames()` como prop a `HallOfFame`, que genera un tab por cada uno y consulta `getTopScores(gameId)` para todos (sin rama de `seededScores`); si no hay filas, muestra el estado vacío con las clases CSS existentes.
6. **Guardado real de Asteroids.** En `GamePlayer.tsx`, al montar el modal de fin de partida, precompletar el input `name` leyendo `localStorage.getItem("av_player_name")` (si existe). Al presionar "GUARDAR PUNTUACIÓN", `saveScore` llama a `lib/scores.ts` (client) insertando en `scores` con `game_id: "asteroides"`, `player_name: name`, `score` real, `user_id: null`; además escribe `localStorage.setItem("av_player_name", name)`.
7. **`GameDetail`/`/juego/asteroides` con top real.** `app/juego/[id]/page.tsx` usa `getTopScores(id)` en vez de `seededScores` cuando `id === "asteroides"`.
8. **Repaso final.** `npm run build` sin errores de tipos; probar en el navegador: `/biblioteca` y `/` muestran juegos combinados (mock + `asteroides` desde Supabase) sin duplicados, `/salon` muestra solo el tab `asteroides` (estado vacío si no hay partidas, top real tras guardar una), `/juego/asteroides` muestra el mismo top real, y el resto de los juegos siguen mostrando sus datos de ejemplo sin romperse.

## Criterios de aceptación

- [x] Existen las tablas `games` y `scores` en Supabase (verificable con `list_tables`), con RLS habilitado: `games` con `games_public_read`/`games_public_insert`/`games_public_update` (sin `delete`); `scores` con `scores_public_read`/`scores_public_insert` (sin `update`/`delete`).
- [x] La tabla `games` contiene exactamente una fila (`asteroides`), con los mismos valores (título, descripciones, cat, cover, color) que tenía su entrada en `GAMES` antes de migrarla.
- [x] `lib/data.ts` ya no incluye la entrada `asteroides` en `GAMES`; el resto de los juegos (`bloque-buster`, `caida`, `serpentina`, `gloton`, `rocas`) siguen ahí sin cambios.
- [x] `getAllGames()` devuelve la lista combinada (mock de `lib/data.ts` + `asteroides` desde Supabase) y `/`, `/biblioteca` muestran los mismos juegos que antes, sin duplicados ni faltantes.
- [x] `getGameById("asteroides")` resuelve desde Supabase; `getGameById()` para cualquier otro id resuelve desde `GAMES`.
- [x] El input de nombre en el modal de fin de partida se precompleta con el valor guardado en `localStorage` (`av_player_name`) si existe una partida previa guardada; si no existe, se precompleta como hoy (`displayName`).
- [x] Al jugar una partida de Asteroids y presionar "GUARDAR PUNTUACIÓN", se inserta una fila nueva en `scores` (`game_id: "asteroides"`, `player_name` = valor del input, `score` real, `user_id: null`) — verificable con una consulta a la tabla. El nombre escrito queda persistido en `localStorage` (`av_player_name`).
- [x] `/salon` muestra un tab únicamente por cada juego real (Supabase) — ningún juego hardcodeado de `lib/data.ts` aparece en el Salón de la Fama.
- [x]Con solo `asteroides` en la tabla `games`, `/salon` muestra un único tab; al agregar un futuro juego real a Supabase, aparece automáticamente un tab nuevo sin tocar código de `HallOfFame.tsx`.
- [x] Si la tabla `scores` no tiene filas para un juego real, `/salon` muestra el mensaje de estado vacío en ese tab, con el mismo estilo visual (tipografía pixel, colores, espaciado) que el resto del Salón de la Fama — no un texto plano sin formato.
- [x] `/salon`, tab "ASTEROIDES", muestra el top real de `scores` (ordenado de mayor a menor), incluyendo la partida recién guardada tras recargar.
- [x] `/juego/asteroides` muestra el mismo top real de `scores` que el Salón de la Fama.
- [x] `best`/`plays` de `asteroides` en Home/Biblioteca reflejan `MAX(score)`/`COUNT(*)` real de `scores` una vez existe al menos una partida guardada; antes de la primera partida, muestran `best_seed`/`plays_seed`.
- [x] `npm run build` compila sin errores de tipos tras convertir las páginas a Server Components async y actualizar los componentes a recibir props.
- [x] Ningún otro juego (aparte de `asteroides`) aparece en la tabla `games` de Supabase.

## Decisiones tomadas y descartadas

- **Tabla `games` solo con `asteroides`, no con todo el catálogo**, en vez de migrar todos los juegos hardcodeados, porque el usuario decidió explícitamente que Supabase solo aloja juegos con motor real; los juegos mock siguen en `lib/data.ts` hasta que tengan motor real propio.
- **`getAllGames()` combina `lib/data.ts` + Supabase** para Home/Biblioteca, en vez de que la app dependa de una sola fuente, para no perder los juegos mock existentes mientras se migra gradualmente juego por juego a medida que cada uno recibe un motor real.
- **`getRealGames()` separado de `getAllGames()`** para `HallOfFame`, porque el Salón de la Fama debe mostrar solo competencia real (decisión posterior del usuario), mientras que Home/Biblioteca sí deben listar todos los juegos (mock + reales).
- **RLS de `scores` con `insert` público abierto** (sin autenticación), en vez de bloquear el guardado hasta tener auth real, porque el usuario prefirió tener el leaderboard funcional ahora y aceptó el riesgo de puntajes falsos como conocido y temporal.
- **RLS de `games` con `insert`/`update` públicos abiertos**, en vez de dejarla de solo lectura (decisión inicial), porque el usuario decidió explícitamente revertir esa restricción y permitir que la app pueda crear/modificar juegos directamente desde el cliente por ahora. Mismo riesgo aceptado que `scores`.
- **`user_id` nulo en `scores`** en vez de omitir la columna, para no tener que hacer una migración de esquema separada cuando exista autenticación real: la columna ya queda lista (`references auth.users(id)`), solo se empieza a poblar más adelante.
- **`best_seed`/`plays_seed` como columnas de respaldo** en vez de recalcular siempre desde `scores`, para que `asteroides` no muestre `best`/`plays` en cero antes de que exista la primera partida real guardada. Se cargan en `0`/`'0'` (no con un valor de ejemplo alto) porque es el único juego con datos reales desde el inicio.
- **`player_name` viene del input editable del modal** (persistido en `localStorage` bajo `av_player_name`), en vez de usar siempre `useAvUser()?.name`, porque el usuario pidió explícitamente recordar el nombre escrito para no tener que retiparlo en cada partida, dado que no hay autenticación real que ya provea un nombre fijo y confiable.
- **Salón de la Fama muestra solo juegos reales**, en vez de listar también los mock con `seededScores`, porque el usuario decidió que ese espacio debe reflejar únicamente competencia real entre jugadores; los juegos sin motor real siguen visibles en Home/Biblioteca/detalle, pero no compiten por un puesto en el ranking.
- **Sin `SUPABASE_SERVICE_ROLE_KEY`** en este spec, manteniendo la decisión ya tomada en el spec 04: el seed inicial de `asteroides` se hace vía migración con el MCP, no desde código de la app.
- **Limpieza de puntajes de invitados pospuesta**, en vez de resolverla ahora con una columna `is_guest` o similar, porque el usuario indicó explícitamente que esa limpieza se hará junto con el spec de autenticación real, no antes.
- **Sin Realtime ni paginación** en este spec, siguiendo el mismo criterio de reducir alcance que el spec 04 aplicó a Realtime/Edge Functions; ambos quedan para specs futuros si se necesitan.

## Riesgos identificados

- **`scores_public_insert`/`games_public_insert`/`games_public_update` abiertos sin autenticación.** Cualquiera con la clave pública (`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`) puede insertar puntajes falsos, o crear/modificar juegos, directo contra Supabase. Mitigación: aceptado como riesgo temporal y documentado; se cierra en el spec futuro de autenticación real, que además hará la limpieza de puntajes de invitados.
- **Migración parcial del catálogo (`asteroides` en Supabase, el resto en `lib/data.ts`).** `getAllGames()` combina dos fuentes con formas de acceso distintas (`getGameById` primero busca en Supabase y si no está cae a `GAMES`); un error en ese orden de resolución podría hacer que `asteroides` no se encuentre o aparezca duplicado. Mitigación: cubierto explícitamente en los criterios de aceptación ("sin duplicados ni faltantes").
- **`user_id` nulo y `player_name` sin validación.** Al no haber auth real, no hay forma de impedir que `player_name` sea arbitrario o suplantado (cualquiera puede escribir el nombre que quiera). Mitigación: no aplica en este spec (documentado como limitación conocida, se resuelve junto con la autenticación real).
- **Conversión de páginas síncronas a Server Components async.** `Home`, `Library` y `HallOfFame` pasan de recibir datos síncronos (`import { GAMES }`) a depender de fetch a Supabase vía props; si `getAllGames()`/`getRealGames()` falla (por ejemplo caída de red/credenciales), esas páginas quedarían sin datos. Mitigación: no se agrega manejo de error especial en este spec (consistente con que el resto de la app tampoco maneja fallos de Supabase); un fallo de conexión se refleja como error de build/runtime visible, no silencioso.
- **Divergencia entre `best`/`plays` reales y `*_seed`.** Si `MAX(score)`/`COUNT(*)` de `scores` para `asteroides` devuelve un valor menor al `best_seed` inicial, el leaderboard podría "bajar" el mejor puntaje mostrado. Mitigación: el seed de `asteroides` se carga con `best_seed: 0`/`plays_seed: '0'`, ya que es el único juego con datos reales desde el inicio y no necesita relleno cosmético.
