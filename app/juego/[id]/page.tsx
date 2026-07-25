import { notFound } from "next/navigation";
import GameDetail from "@/components/GameDetail";
import { getGameById } from "@/lib/games";
import { getTopScores } from "@/lib/scores.server";

export default async function GameDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const game = await getGameById(id);

  if (!game) notFound();

  const scores = await getTopScores(id, 10);

  return <GameDetail game={game} scores={scores} />;
}
