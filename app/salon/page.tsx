import HallOfFame from "@/components/HallOfFame";
import { getAllGames } from "@/lib/games";
import { getTopScores, getUserBestScore } from "@/lib/scores.server";
import { createClient } from "@/lib/supabase/server";
import type { ScoreRow } from "@/lib/data";

export default async function SalonPage() {
  const games = await getAllGames();
  const scoresEntries = await Promise.all(
    games.map(async (game) => [game.id, await getTopScores(game.id)] as const),
  );
  const scoresByGame: Record<string, ScoreRow[]> = Object.fromEntries(scoresEntries);

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const yourBestByGame: Record<string, ScoreRow | null> = {};
  if (session) {
    const bestEntries = await Promise.all(
      games.map(
        async (game) => [game.id, await getUserBestScore(game.id, session.user.id)] as const,
      ),
    );
    Object.assign(yourBestByGame, Object.fromEntries(bestEntries));
  }

  return <HallOfFame games={games} scoresByGame={scoresByGame} yourBestByGame={yourBestByGame} />;
}
