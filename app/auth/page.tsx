import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Auth from "@/components/Auth";

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // El callback redirige acá con ?error cuando falla el intercambio de código,
  // incluso si la sesión previa sigue viva: en ese caso no ocultamos el mensaje.
  if (user && !error) {
    redirect("/biblioteca");
  }

  return <Auth />;
}
