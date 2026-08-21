-- Bootstrap de producción para Arcade Vault.
-- Deja el proyecto de producción en el mismo estado final que dev tras
-- aplicar supabase/migrations/001_games_and_scores.sql .. 006_security_hardening.sql,
-- pero escrito directamente en el estado final (sin reproducir el ida y
-- vuelta de políticas que hacen 001 y luego 006).
--
-- Cómo usarlo: copiar todo este archivo y pegarlo en el SQL Editor del
-- proyecto de PRODUCCIÓN (no el de desarrollo), y ejecutar.
-- Es idempotente: se puede volver a correr sin romper nada (create table
-- if not exists, políticas recreadas con drop+create, catálogo con upsert).

-- ============ 1. Esquema ============

create table if not exists games (
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

create table if not exists scores (
  id uuid primary key default gen_random_uuid(),
  game_id text not null references games(id),
  user_id uuid null references auth.users(id),
  player_name text not null,
  score integer not null,
  created_at timestamptz not null default now()
);

create index if not exists scores_game_id_score_idx on scores (game_id, score desc);

-- ============ 2. RLS — estado final (equivalente a 001 + 006) ============

alter table games enable row level security;
alter table scores enable row level security;

drop policy if exists "games_public_read" on games;
drop policy if exists "games_public_insert" on games;   -- existía en 001, eliminada por 006
drop policy if exists "games_public_update" on games;   -- existía en 001, eliminada por 006
drop policy if exists "scores_public_read" on scores;
drop policy if exists "scores_public_insert" on scores;

create policy "games_public_read" on games
  for select using (true);
-- Sin insert/update/delete: el catálogo de games solo se gestiona por SQL.

create policy "scores_public_read" on scores
  for select using (true);

create policy "scores_public_insert" on scores
  for insert with check (auth.uid() = user_id);
-- Sin update/delete: nadie puede modificar ni borrar puntajes ya guardados.

-- ============ 3. Endurecimiento condicional ============
-- public.rls_auto_enable() la crea la plataforma Supabase, no las
-- migraciones de este repo. Si el proyecto de producción no la trae,
-- no hay nada que revocar.

do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke execute on function public.rls_auto_enable() from anon, authenticated, public;
  end if;
end $$;

-- ============ 4. Catálogo (5 juegos, texto tomado tal cual de dev) ============

insert into games (id, title, short, long, cat, cover, color, best_seed, plays_seed)
values
  (
    'asteroides',
    'ASTEROIDES',
    'Sobrevive en un campo de asteroides sin bordes.',
    'Pilota una nave triangular en un espacio toroidal: los bordes del mapa se envuelven sobre sí mismos. Destruye rocas grandes para que se partan en fragmentos cada vez más pequeños y caza el power-up de disparo triple antes de perder tus tres vidas.',
    'SHOOTER',
    'cover-rocas',
    'cyan',
    0,
    '0'
  ),
  (
    'tetris',
    'TETRIS',
    'El clásico rompecabezas de bloques que caen.',
    'Encaja las 7 piezas clásicas (más una pieza extra, la tuerca), gira con wall kicks, usa hard/soft drop y sube de nivel cada 10 líneas.',
    'PUZZLE',
    'cover-tetro',
    'magenta',
    0,
    '0'
  ),
  (
    'arkanoid',
    'ARKANOID',
    'Rompe bloques con la paleta y la pelota antes de que se te acaben las vidas.',
    'Controla la paleta con el mouse o las flechas para rebotar la pelota y destruir los bloques de 5 niveles con velocidad creciente. 3 vidas, 10 puntos por bloque, animación de explosión y sonidos al rebotar y romper.',
    'ARCADE',
    'cover-bricks',
    'green',
    0,
    '0'
  ),
  (
    'snake',
    'SNAKE',
    'Come frutas, crece y no choques contra tu propia cola.',
    'Controla la serpiente con las flechas o WASD para comer frutas retro y crecer. Los bordes del tablero funcionan como wrap-around; la única forma de perder es chocar contra tu propio cuerpo. La velocidad aumenta a medida que la serpiente crece.',
    'ARCADE',
    'cover-snake',
    'yellow',
    0,
    '0'
  ),
  (
    'frogger',
    'FROGGER',
    'Cruza la carretera y el río antes de que se agote el tiempo.',
    'Guía a la rana por cinco carriles de tráfico y luego por un río de troncos y tortugas hasta ocupar las cinco casillas de llegada. Cada avance suma puntos, llegar a casa con tiempo de sobra suma bonus y completar las cinco casillas sube de nivel con todo más rápido. Tres ranas, 30 segundos por intento.',
    'ARCADE',
    'cover-rana',
    'green',
    0,
    '0'
  )
on conflict (id) do update set
  title = excluded.title,
  short = excluded.short,
  long = excluded.long,
  cat = excluded.cat,
  cover = excluded.cover,
  color = excluded.color;

-- ============ 5. Verificación rápida ============
-- Ejecutar aparte para confirmar el resultado:
--
-- select count(*) from games;                       -- esperado: 5
-- select relname, relrowsecurity from pg_class
--   where relnamespace = 'public'::regnamespace and relkind = 'r';   -- ambas true
-- select tablename, policyname, cmd, with_check from pg_policies
--   where schemaname = 'public';                    -- exactamente 3 políticas
-- select to_regprocedure('public.rls_auto_enable()');  -- informativo
