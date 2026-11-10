"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SITE_URL } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

function resolveBaseUrl(requestHeaders: Headers): string {
  const proto = requestHeaders.get("x-forwarded-proto") ?? "http";
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  return host ? `${proto}://${host}` : SITE_URL;
}

function safeNext(value: FormDataEntryValue | null): string {
  const raw = typeof value === "string" ? value : "/";
  // Solo rutas internas: evita open redirects.
  return raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";
}

/**
 * Inicia sesión con Google. `hd` restringe el selector de cuentas al dominio de
 * Lund, pero la validación real ocurre en el callback y en el trigger de la BD.
 */
export async function signInWithGoogle(formData: FormData) {
  const next = safeNext(formData.get("next"));
  const supabase = await createClient();
  const baseUrl = resolveBaseUrl(await headers());

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${baseUrl}/auth/callback?next=${encodeURIComponent(next)}`,
      queryParams: {
        hd: "student.lu.se",
        prompt: "select_account",
      },
    },
  });

  if (error || !data.url) {
    redirect("/?error=oauth");
  }

  redirect(data.url);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
