import { createClient as createBrowserClient } from "@/lib/supabase/client";

export async function saveScore(gameId: string, playerName: string, score: number): Promise<void> {
  const supabase = createBrowserClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { error } = await supabase.from("scores").insert({
    game_id: gameId,
    player_name: playerName,
    score,
    user_id: session?.user.id ?? null,
  });

  if (error) throw error;
}
