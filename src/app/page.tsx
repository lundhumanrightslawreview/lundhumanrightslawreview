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
              An open, decentralised review: the essays from Lund's Master's Programme in
              International Human Rights
