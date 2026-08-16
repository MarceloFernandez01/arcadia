import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import UpdatePassword from "@/components/UpdatePassword";

export default async function ActualizarContrasenaPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/auth");
  }

  return <UpdatePassword />;
}
