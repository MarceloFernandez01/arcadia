import { createClient as createServerClient } from "@/lib/supabase/server";
import type { ScoreRow } from "@/lib/data";

function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${date.getFullYear()}`;
}

export async function getTopScores(gameId: string, limit = 12): Promise<ScoreRow[]> {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("scores")
    .select("player_name, score, created_at")
    .eq("game_id", gameId)
    .order("score", { ascending: false })
    .limit(limit);

  return (data ?? []).map((row, i) => ({
    rank: i + 1,
    name: row.player_name as string,
    score: row.score as number,
    date: formatDate(row.created_at as string),
  }));
}
