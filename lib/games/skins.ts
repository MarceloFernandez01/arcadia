export type SkinId = "clasico" | "retro" | "neon";

export const SKIN_IDS: SkinId[] = ["clasico", "retro", "neon"];

export const CANONICAL_SKINS: { id: SkinId; label: string }[] = [
  { id: "clasico", label: "Clásico" },
  { id: "retro", label: "Retro" },
  { id: "neon", label: "Neón" },
];

export function isSkinId(value: string): value is SkinId {
  return (SKIN_IDS as string[]).includes(value);
}

export function skinStorageKey(gameId: string): string {
  return `av_color_scheme_${gameId}`;
}

/**
 * Resuelve el skin efectivo priorizando el valor recibido, luego el persistido y por último el
 * default. Un valor legado desconocido (por ejemplo `"normal"`) se reescribe en localStorage para
 * que el selector y el motor no queden desincronizados.
 */
export function resolveSkin(initial: string | undefined, gameId: string): SkinId {
  if (initial && isSkinId(initial)) return initial;

  let stored: string | null = null;
  try {
    stored = localStorage.getItem(skinStorageKey(gameId));
  } catch {
    // localStorage no disponible
  }
  if (stored && isSkinId(stored)) return stored;

  const fallback = SKIN_IDS[0];
  if (initial || stored) {
    try {
      localStorage.setItem(skinStorageKey(gameId), fallback);
    } catch {
      // localStorage no disponible
    }
  }
  return fallback;
}
