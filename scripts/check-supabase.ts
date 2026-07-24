import { createClient } from "@supabase/supabase-js";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    console.error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. Completa .env.local.",
    );
    process.exit(1);
  }

  const supabase = createClient(url, key);

  const { error } = await supabase.auth.getSession();

  if (error) {
    console.error("Conexión a Supabase falló:", error.message);
    process.exit(1);
  }

  console.log("Conexión a Supabase exitosa (credenciales válidas).");
}

main();
