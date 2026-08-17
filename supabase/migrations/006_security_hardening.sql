-- games: ya no se puede insertar/actualizar vía API pública
drop policy if exists "games_public_insert" on games;
drop policy if exists "games_public_update" on games;

-- scores: insert solo si el user_id coincide con la sesión autenticada
drop policy if exists "scores_public_insert" on scores;
create policy "scores_public_insert" on scores
  for insert with check (auth.uid() = user_id);

-- rls_auto_enable: ya no invocable vía RPC público
-- (se revoca también de "public" porque Postgres otorga EXECUTE a public por
-- defecto al crear una función, y anon/authenticated heredan ese privilegio)
revoke execute on function public.rls_auto_enable() from anon, authenticated, public;
