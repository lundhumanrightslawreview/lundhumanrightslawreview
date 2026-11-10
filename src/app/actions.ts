"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { error?: string };

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Borra un artículo y su PDF.
 * Autorización en servidor: dueño del artículo o administrador.
 */
export async function deleteArticle(articleId: string): Promise<ActionResult> {
  if (!UUID_RE.test(articleId)) {
    return { error: "Invalid article." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Your session has expired. Please sign in again." };
  }

  const admin = createAdminClient();

  const { data: article } = await admin
    .from("articles")
    .select("id, author_id, pdf_path")
    .eq("id", articleId)
    .maybeSingle();

  if (!article) {
    return { error: "This article no longer exists." };
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  const canDelete = article.author_id === user.id || profile?.is_admin === true;

  if (!canDelete) {
    return { error: "Only the author or the administrator can delete this article." };
  }

  // Primero el PDF, luego la fila: si el fichero falla, no dejamos la fila huérfana.
  const { error: storageError } = await admin.storage
    .from("articles")
    .remove([article.pdf_path]);

  if (storageError) {
    return { error: `The PDF could not be deleted: ${storageError.message}` };
  }

  const { error: deleteError } = await admin.from("articles").delete().eq("id", articleId);

  if (deleteError) {
    return { error: `The article could not be deleted: ${deleteError.message}` };
  }

  revalidatePath("/");
  revalidatePath("/mis-articulos");
  revalidatePath(`/articulos/${articleId}`);

  redirect("/mis-articulos?borrado=1");
}
