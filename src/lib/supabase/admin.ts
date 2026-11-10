import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "@/lib/env";

/**
 * Cliente con la SERVICE_ROLE key. Se salta RLS.
 *
 * ⚠️ Solo puede usarse en el servidor (Route Handlers / Server Actions).
 * Nunca lo importes desde un componente "use client": la clave quedaría
 * expuesta en el navegador.
 */
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !serviceRoleKey) {
    throw new Error(
      "Incomplete configuration: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for server-side tasks.",
    );
  }

  return createSupabaseClient(SUPABASE_URL, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
