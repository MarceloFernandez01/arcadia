import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

export interface AvUser {
  name: string;
}

export function resolveAvUserName(user: User): string {
  const metadata = user.user_metadata as Record<string, unknown>;
  const name = typeof metadata.name === "string" ? metadata.name : undefined;
  const fullName = typeof metadata.full_name === "string" ? metadata.full_name : undefined;
  const emailPrefix = user.email?.split("@")[0];
  return name ?? fullName ?? emailPrefix ?? "Jugador";
}

export async function clearAvUser() {
  const supabase = createClient();
  await supabase.auth.signOut();
}
