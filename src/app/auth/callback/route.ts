import { NextResponse, type NextRequest } from "next/server";
import { isAllowedEmail } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";

/**
 * Callback de OAuth: canjea el código por una sesión y aplica la restricción
 * de dominio. Es la primera barrera; el trigger de Postgres es la segunda.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const nextParam = url.searchParams.get("next") ?? "/";
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/";

  if (!code) {
    return NextResponse.redirect(new URL("/?error=oauth", url.origin));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL("/?error=oauth", url.origin));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isAllowedEmail(user?.email)) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/?error=dominio", url.origin));
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
