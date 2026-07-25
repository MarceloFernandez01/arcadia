import Library from "@/components/Library";
import { getAllGames } from "@/lib/games";

export default async function BibliotecaPage() {
  const games = await getAllGames();
  return <Library games={games} />;
}
