"use client";

import { useState } from "react";

const MAX_POKEMON = 1025;

function spriteUrl(id: number) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
}

export default function PokemonCounterPage() {
  const [count, setCount] = useState(1);

  function handleClick() {
    setCount((prev) => (prev >= MAX_POKEMON ? 1 : prev + 1));
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-neutral-950 p-8 text-neutral-100">
      <p className="text-sm text-neutral-400">Pokémon #{count}</p>

      <img
        key={count}
        src={spriteUrl(count)}
        alt={`Pokémon #${count}`}
        className="h-64 w-64 object-contain"
      />

      <button
        onClick={handleClick}
        className="rounded-full bg-red-600 px-6 py-3 text-lg font-semibold text-white transition hover:bg-red-500 active:scale-95"
      >
        Siguiente Pokémon ({count})
      </button>
    </main>
  );
}
