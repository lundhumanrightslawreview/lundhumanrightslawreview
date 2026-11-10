import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

/**
 * Usuario autenticado de la petición actual (deduplicado por request).
 * `getUser()` valida el JWT contra Supabase Auth; no confíes en `getSession()`.
 */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) return null;
  return user;
});

/** Perfil + rol del usuario actual (o null si es visitante). */
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, email, full_name, avatar_url, is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (data) return data as Profile;

  // Fallback por si el trigger de creación de perfil aún no ha corrido.
  return {
    id: user.id,
    email: user.email ?? "",
    full_name:
      (user.user_metadata?.full_name as string | undefined) ??
      (user.user_metadata?.name as string | undefined) ??
      null,
    avatar_url: (user.user_metadata?.avatar_url as string | undefined) ?? null,
    is_admin: false,
  };
});
