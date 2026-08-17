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

export async function getUserBestScore(gameId: string, userId: string): Promise<ScoreRow | null> {
  const supabase = await createServerClient();
  const { data: best } = await supabase
    .from("scores")
    .select("player_name, score, created_at")
    .eq("game_id", gameId)
    .eq("user_id", userId)
    .order("score", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!best) return null;

  const { count } = await supabase
    .from("scores")
    .select("*", { count: "exact", head: true })
    .eq("game_id", gameId)
    .gt("score", best.score as number);

  return {
    rank: (count ?? 0) + 1,
    name: best.player_name as string,
    score: best.score as number,
    date: formatDate(best.created_at as string),
  };
}
