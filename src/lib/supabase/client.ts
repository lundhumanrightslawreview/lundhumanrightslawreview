import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL, assertSupabaseEnv } from "@/lib/env";

/**
 * Cliente de Supabase para componentes de cliente ("use client").
 * Usa la clave anónima: todas las operaciones pasan por RLS.
 */
export function createClient() {
  assertSupabaseEnv();
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
