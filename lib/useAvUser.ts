"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { type AvUser, resolveAvUserName } from "./avUser";

export function useAvUser(): AvUser | null {
  const [user, setUser] = useState<AvUser | null>(null);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session ? { name: resolveAvUserName(session.user) } : null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session ? { name: resolveAvUserName(session.user) } : null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return user;
}
