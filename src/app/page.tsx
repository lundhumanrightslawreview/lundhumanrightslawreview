import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  PenLine,
  SearchX,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { ArticleCard } from "@/components/ArticleCard";
import { getCurrentProfile } from "@/lib/auth";
import { CATEGORIES, categoryLabel, isCategorySlug } from "@/lib/categories";
import { SITE } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { Article } from "@/lib/types";

type RawSearchParams = Record<string, string | string[] | undefined>;

const PAGE_SIZE = 9;

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

/** Limpia el término para que no rompa la sintaxis de filtros de PostgREST. */
function escapeFilterValue(value: string): string {
  return value.replace(/[(),.*:%"\\]/g, " ").replace(/\s+/g, " ").trim();
}

export const metadata: Metadata = {
  title: "Article catalogue",
  description: SITE.description,
};

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const params = await searchParams;
  const q = first(params.q).trim().slice(0, 80);
  const rawCategory = first(params.categoria);
  const category = isCategorySlug(rawCategory) ? rawCategory : "";
  const page = Math.max(1, Number.parseInt(first(params.pagina) || "1", 10) || 1);
  const hasFilters = Boolean(q || category);

  const [supabase, profile] = await Promise.all([createClient(), getCurrentProfile()]);

  // Destacados aleatorios solo en la portada limpia.
  let featured: Article[] = [];
  if (!hasFilters && page === 1) {
    const { data } = await supabase.rpc("random_public_articles", { p_limit: 3 });
    featured = (data ?? []) as Article[];
  }

  let request = supabase.from("articles_public").select("*", { count: "exact" });

  if (q) {
    const term = escapeFilterValue(q);
    if (term) {
      request = request.or(`title.ilike.%${term}%,abstract.ilike.%${term}%`);
    }
  }
  if (category) {
    request = request.eq("category", category);
  }

  const from = (page - 1) * PAGE_SIZE;
  const { data, count, error } = await request
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  const articles = (data ?? []) as Article[];
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const listing =
    !hasFilters && page === 1
      ? articles.filter((article) => !featured.some((item) => item.id === article.id))
      : articles;

  const hrefFor = (nextPage: number) => {
    const query = new URLSearchParams();
    if (q) query.set("q", q);
    if (category) query.set("categoria", category);
    if (nextPage > 1) query.set("pagina", String(nextPage));
    const suffix = query.toString();
    return suffix ? `/?${suffix}` : "/";
  };

  return (
    <>
      {/* ---------------------------------------------------------------- HERO */}
      <section className="relative overflow-hidden border-b border-stone-200 bg-gradient-to-b from-white via-white to-paper">
        <div className="hero-grid pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-4 py-14 sm:py-20">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-bronze-200 bg-bronze-50 px-3 py-1 text-[10px] font-semibold tracking-[0.14em] text-bronze-700 uppercase">
              <Sparkles className="size-3" aria-hidden />
              {SITE.university} · {SITE.programme}
            </p>

            <h1 className="mt-6 font-serif text-[2.6rem] leading-[1.06] tracking-tight text-navy-900 sm:text-6xl">
              International Human Rights Law,
              <br className="hidden sm:block" />{" "}
              <span className="text-bronze-600">written by students</span>.
            </h1>

            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-stone-600 sm:text-xl">
              An open, decentralised review: the articles from Lund's Master's Programme in
              International Human Rights Law, graded AB (passed with distinction) and cited 
              in OSCOLA, available to anyone. The only gatekeeper is academic excellence.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href={profile ? "/subir" : "/auth/login"}
                className="inline-flex items-center gap-2 rounded-full bg-navy-900 px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-navy-800"
              >
                <PenLine className="size-4" aria-hidden />
                {profile ? "Publish my article" : "Sign in with @student.lu.se"}
              </Link>
              <Link
                href="#publicaciones"
                className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-6 py-3 text-sm font-medium text-navy-800 transition hover:border-bronze-400 hover:text-bronze-700"
              >
                <BookOpen className="size-4" aria-hidden />
                Browse publications
              </Link>
            </div>

            <dl className="mt-10 grid max-w-sm grid-cols-2 gap-6 border-t border-stone-200 pt-6">
              <div>
                <dt className="text-[10px] font-semibold tracking-[0.14em] text-stone-400 uppercase">
                  Articles
                </dt>
                <dd className="mt-1 font-serif text-2xl text-navy-900">{total}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-semibold tracking-[0.14em] text-stone-400 uppercase">
                  Subjects
                </dt>
                <dd className="mt-1 font-serif text-2xl text-navy-900">{CATEGORIES.length}</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4">
        {error ? (
          <div className="mt-8 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
            <div>
              <p className="font-medium">The database is not responding yet.</p>
              <p className="mt-1 text-amber-800">
                Check that you ran <code className="rounded bg-white px-1">supabase/schema.sql</code>{" "}
                and that the environment variables are correct. Detail: {error.message}
              </p>
            </div>
          </div>
        ) : null}

        {/* ---------------------------------------------------- DESTACADOS */}
        {featured.length > 0 ? (
          <section className="pt-14" aria-labelledby="destacados">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold tracking-[0.16em] text-bronze-600 uppercase">
                  Rotating selection
                </p>
                <h2 id="destacados" className="mt-1 font-serif text-2xl text-navy-900 sm:text-3xl">
                  Featured
                </h2>
              </div>
              <Link
                href="/?pagina=1#publicaciones"
                className="hidden shrink-0 items-center gap-1 text-xs font-medium text-stone-500 hover:text-navy-900 sm:inline-flex"
              >
                View all <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </section>
        ) : null}

        {/* ------------------------------------------------------- CATÁLOGO */}
        <section id="publicaciones" className="scroll-mt-28 pt-14 pb-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold tracking-[0.16em] text-bronze-600 uppercase">
                {hasFilters ? "Results" : "Full catalogue"}
              </p>
              <h2 className="mt-1 font-serif text-2xl text-navy-900 sm:text-3xl">
                {hasFilters ? "Search" : "Recent publications"}
              </h2>
              {hasFilters ? (
                <p className="mt-2 text-sm text-stone-500">
                  {total} {total === 1 ? "article" : "articles"}
                  {q ? (
                    <>
                      {" "}
                      for <span className="font-medium text-navy-900">“{q}”</span>
                    </>
                  ) : null}
                  {category ? (
                    <>
                      {" "}
                      in <span className="font-medium text-navy-900">{categoryLabel(category)}</span>
                    </>
                  ) : null}
                  {" · "}
                  <Link href="/" className="text-bronze-600 underline underline-offset-2">
                    clear filters
                  </Link>
                </p>
              ) : (
                <p className="mt-2 text-sm text-stone-500">
                  Sorted from newest to oldest.
                </p>
              )}
            </div>

            {profile ? (
              <Link
                href="/subir"
                className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-4 py-2 text-xs font-medium text-navy-800 transition hover:border-bronze-400"
              >
                <PenLine className="size-3.5" aria-hidden />
                Add mine
              </Link>
            ) : null}
          </div>

          {listing.length > 0 ? (
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {listing.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-2xl border border-dashed border-stone-300 bg-white/60 px-6 py-16 text-center">
              <SearchX className="mx-auto size-8 text-stone-300" aria-hidden />
              <h3 className="mt-4 font-serif text-lg text-navy-900">
                {hasFilters ? "No results for this search" : "No articles published yet"}
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-stone-500">
                {hasFilters
                  ? "Try other keywords or explore another subject from the menu above."
                  : "Be the first to publish. All you need is your @student.lu.se account and the final PDF."}
              </p>
              <Link
                href={hasFilters ? "/" : profile ? "/subir" : "/auth/login"}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-navy-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-navy-800"
              >
                {hasFilters ? "View the full catalogue" : profile ? "Publish now" : "Sign in"}
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
          )}

          {totalPages > 1 ? (
            <nav
              className="mt-10 flex items-center justify-center gap-2"
              aria-label="Pagination"
            >
              {page > 1 ? (
                <Link
                  href={hrefFor(page - 1)}
                  className="rounded-full border border-stone-300 bg-white px-4 py-2 text-xs font-medium text-stone-600 transition hover:border-bronze-400"
                >
                  Previous
                </Link>
              ) : null}
              <span className="px-2 text-xs text-stone-400">
                Page {page} of {totalPages}
              </span>
              {page < totalPages ? (
                <Link
                  href={hrefFor(page + 1)}
                  className="rounded-full border border-stone-300 bg-white px-4 py-2 text-xs font-medium text-stone-600 transition hover:border-bronze-400"
                >
                  Next
                </Link>
              ) : null}
            </nav>
          ) : null}
        </section>
      </div>
    </>
  );
}
