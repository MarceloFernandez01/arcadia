import { createClient } from "@/lib/supabase/server";
import type { Game } from "@/lib/data";
import type { SupabaseClient } from "@supabase/supabase-js";

interface SupabaseGameRow {
  id: string;
  title: string;
  short: string;
  long: string;
  cat: "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS";
  cover: string;
  color: "cyan" | "magenta" | "green" | "yellow";
  best_seed: number;
  plays_seed: string;
}

async function resolveGame(supabase: SupabaseClient, row: SupabaseGameRow): Promise<Game> {
  const { data, count } = await supabase
    .from("scores")
    .select("score", { count: "exact" })
    .eq("game_id", row.id)
    .order("score", { ascending: false })
    .limit(1);

  const hasScores = !!count && count > 0;

  return {
    id: row.id,
    title: row.title,
    short: row.short,
    long: row.long,
    cat: row.cat,
    cover: row.cover,
    color: row.color,
    best: hasScores ? (data![0].score as number) : row.best_seed,
    plays: hasScores ? String(count) : row.plays_seed,
  };
}

export async function getAllGames(): Promise<Game[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("games").select("*");

  return Promise.all(((data ?? []) as SupabaseGameRow[]).map((row) => resolveGame(supabase, row)));
}

export async function getGameById(id: string): Promise<Game | undefined> {
  const supabase = await createClient();
  const { data } = await supabase.from("games").select("*").eq("id", id).maybeSingle();

  if (!data) return undefined;

  return resolveGame(supabase, data as SupabaseGameRow);
}
