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
values (
  'asteroides',
  'ASTEROIDES',
  'Sobrevive en un campo de asteroides sin bordes.',
  'Pilota una nave triangular en un espacio toroidal: los bordes del mapa se envuelven sobre sí mismos. Destruye rocas grandes para que se partan en fragmentos cada vez más pequeños y caza el power-up de disparo triple antes de perder tus tres vidas.',
  'SHOOTER',
  'cover-rocas',
  'cyan',
  0,
  '0'
);
