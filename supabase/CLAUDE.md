# supabase

- MCP de Supabase configurado en `.mcp.json` (proyecto `hcfjfjfqvnzwisurvbiz`); las migraciones se aplican con la tool `apply_migration` del MCP, nunca a mano.
- Migraciones versionadas en `supabase/migrations/`: `001_games_and_scores.sql` define el esquema y las políticas RLS; cada juego agrega solo su propio seed (`002_seed_tetris.sql`, `003_seed_arkanoid.sql`, `004_seed_snake.sql`). Un juego nuevo no debe tocar `001` ni las políticas existentes.
- El seed de un juego se aplica antes de escribir su motor: eso deja el juego visible en `/biblioteca` y `/salon` desde el inicio, aunque todavía no sea jugable.
- `npx tsx scripts/check-supabase.ts` valida la conexión usando las variables de `.env.local` (plantilla en `.env.template`).
