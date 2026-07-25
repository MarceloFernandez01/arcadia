import Home from "@/components/Home";
import { getAllGames } from "@/lib/games";

export default async function Page() {
  const games = await getAllGames();
  return <Home games={games} />;
}
