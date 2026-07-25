import HallOfFame from "@/components/HallOfFame";
import { getRealGames } from "@/lib/games";
import { getTopScores } from "@/lib/scores.server";
import type { ScoreRow } from "@/lib/data";

export default async function SalonPage() {
  const games = await getRealGames();
  const scoresEntries = await Promise.all(
    games.map(async (game) => [game.id, await getTopScores(game.id)] as const),
  );
  const scoresByGame: Record<string, ScoreRow[]> = Object.fromEntries(scoresEntries);

  return <HallOfFame games={games} scoresByGame={scoresByGame} />;
}
