-- Opcional. Solo hace falta si en el futuro se quiere apuntar el
-- Supabase CLI (`supabase link` + `supabase db push`) al proyecto de
-- producción. Sin esto, el CLI vería el historial de migraciones vacío
-- e intentaría reaplicar 001_games_and_scores.sql sobre tablas que ya
-- existen (creadas por 001_bootstrap_produccion.sql) y fallaría.
--
-- Registra como "ya aplicadas" las mismas versiones que están aplicadas
-- en desarrollo, sin ejecutar su contenido (el estado final ya lo dejó
-- 001_bootstrap_produccion.sql).
--
-- Ejecutar en el SQL Editor de PRODUCCIÓN, después de 001_bootstrap_produccion.sql.
--
-- El schema supabase_migrations no viene de fábrica en un proyecto nuevo:
-- lo crea el propio Supabase CLI la primera vez que corre una migración
-- contra el proyecto (create schema + create table). Como acá no se usó
-- el CLI, hay que crearlo a mano con la misma estructura antes de insertar.

create schema if not exists supabase_migrations;

create table if not exists supabase_migrations.schema_migrations (
  version text not null primary key,
  statements text[],
  name text
);

insert into supabase_migrations.schema_migrations (version, name)
values
  ('20260724211607', 'games_and_scores'),
  ('20260727025624', 'seed_tetris'),
  ('20260728204940', 'seed_arkanoid'),
  ('20260728233117', 'seed_snake'),
  ('20260801235538', '005_seed_frogger'),
  ('20260817034406', '006_security_hardening'),
  ('20260817034536', '006_security_hardening_public_revoke')
on conflict (version) do nothing;
