import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, FileText, Heart, PenLine, ShieldAlert } from "lucide-react";
import { DeleteArticleButton } from "@/components/DeleteArticleButton";
import { getCurrentProfile } from "@/lib/auth";
import { categoryLabel } from "@/lib/categories";
import { createClient } from "@/lib/supabase/server";
import type { Article } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "My articles",
};

export default async function MyArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ borrado?: string }>;
}) {
  const { borrado } = await searchParams;
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/auth/login?next=/mis-articulos");
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("articles_public")
    .select("*")
    .eq("author_id", profile.id)
    .order("created_at", { ascending: false });

  const articles = (data ?? []) as Article[];
  const totalLikes = articles.reduce((sum, article) => sum + article.like_count, 0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.16em] text-bronze-600 uppercase">
            Your activity
          </p>
          <h1 className="mt-2 font-serif text-3xl tracking-tight text-navy-900 sm:text-4xl">
            My articles
          </h1>
          <p className="mt-2 text-sm text-stone-500">
            {articles.length} {articles.length === 1 ? "publication" : "publications"} ·{" "}
            {totalLikes} likes received
          </p>
        </div>

        <Link
          href="/subir"
          className="inline-flex items-center gap-2 rounded-full bg-navy-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-navy-800"
        >
          <PenLine className="size-4" aria-hidden />
          Publish another
        </Link>
      </div>

      {borrado === "1" ? (
        <p className="mt-6 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Article deleted successfully, along with its PDF.
        </p>
      ) : null}

      {profile.is_admin ? (
        <p className="mt-6 flex items-start gap-2 rounded-xl border border-bronze-200 bg-bronze-50 px-4 py-3 text-xs text-bronze-700">
          <ShieldAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          You have the administrator role: you can withdraw any article from its detail
          page and see the reports received there.
        </p>
      ) : null}

      {articles.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-stone-300 bg-white/70 px-6 py-16 text-center">
          <FileText className="mx-auto size-8 text-stone-300" aria-hidden />
          <h2 className="mt-4 font-serif text-lg text-navy-900">
            You have not published anything yet
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-stone-500">
            Upload the PDF of your final essay: it will be in the catalogue in under
            two minutes.
          </p>
          <Link
            href="/subir"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-navy-900 px-5 py-2.5 text-sm font-medium text-white"
          >
            Upload my first article <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {articles.map((article) => (
            <li
              key={article.id}
              className="flex flex-col gap-4 rounded-2xl border border-stone-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-bronze-600">
                  {categoryLabel(article.category)}
                </p>
                <Link
                  href={`/articulos/${article.id}`}
                  className="mt-1 block truncate font-serif text-lg text-navy-900 hover:underline"
                >
                  {article.title}
                </Link>
                <p className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-stone-400">
                  <span>{formatDate(article.created_at)}</span>
                  <span className="inline-flex items-center gap-1">
                    <Heart className="size-3" aria-hidden />
                    {article.like_count}
                  </span>
                  {article.report_count > 0 ? (
                    <span className="inline-flex items-center gap-1 text-amber-600">
                      <ShieldAlert className="size-3" aria-hidden />
                      {article.report_count} report{article.report_count === 1 ? "" : "s"}
                    </span>
                  ) : null}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <Link
                  href={`/articulos/${article.id}`}
                  className="rounded-full border border-stone-200 px-4 py-2 text-xs font-medium text-navy-800 transition hover:border-bronze-300"
                >
                  View
                </Link>
                <DeleteArticleButton articleId={article.id} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
