import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  FileText,
  Flag,
  Mail,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { ArticleCard } from "@/components/ArticleCard";
import { DeleteArticleButton } from "@/components/DeleteArticleButton";
import { LikeButton } from "@/components/LikeButton";
import { PdfViewer } from "@/components/PdfViewer";
import { ReportButton } from "@/components/ReportButton";
import { getCurrentProfile } from "@/lib/auth";
import { categoryLabel, categoryTone } from "@/lib/categories";
import { SITE, SITE_URL } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { REPORT_REASON_LABELS, type Article, type Report } from "@/lib/types";
import { cn, formatBytes, formatDate, initials } from "@/lib/utils";

type PageProps = { params: Promise<{ id: string }> };

function fileSlug(title: string): string {
  return (
    title
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60)
      .toLowerCase() || "article"
  );
}

async function getArticle(id: string): Promise<Article | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("articles_public")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  return (data as Article | null) ?? null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const article = await getArticle(id);

  if (!article) {
    return { title: "Article not found" };
  }

  return {
    title: article.title,
    description: article.abstract ?? `${article.title} — ${SITE.name}`,
    openGraph: {
      type: "article",
      title: article.title,
      description: article.abstract ?? SITE.description,
      publishedTime: article.created_at,
      authors: article.author_name ? [article.author_name] : undefined,
    },
  };
}

export default async function ArticlePage({ params }: PageProps) {
  const { id } = await params;
  const article = await getArticle(id);

  if (!article) notFound();

  const supabase = await createClient();
  const profile = await getCurrentProfile();
  const isOwner = profile?.id === article.author_id;
  const isAdmin = profile?.is_admin === true;

  // URL firmada (1 h) generada en servidor: el bucket es privado.
  let viewUrl: string | null = null;
  let downloadUrl: string | null = null;
  let storageError: string | null = null;

  try {
    const admin = createAdminClient();
    const [view, download] = await Promise.all([
      admin.storage.from("articles").createSignedUrl(article.pdf_path, 60 * 60),
      admin.storage
        .from("articles")
        .createSignedUrl(article.pdf_path, 60 * 60, {
          download: `${fileSlug(article.title)}.pdf`,
        }),
    ]);

    viewUrl = view.data?.signedUrl ?? null;
    downloadUrl = download.data?.signedUrl ?? null;
  } catch (error) {
    storageError = error instanceof Error ? error.message : "Unknown error";
  }

  let liked = false;
  if (profile) {
    const { data: like } = await supabase
      .from("article_likes")
      .select("article_id")
      .eq("article_id", article.id)
      .eq("user_id", profile.id)
      .maybeSingle();
    liked = Boolean(like);
  }

  const { data: relatedData } = await supabase
    .from("articles_public")
    .select("*")
    .eq("category", article.category)
    .neq("id", article.id)
    .order("created_at", { ascending: false })
    .limit(3);

  const related = (relatedData ?? []) as Article[];

  let reports: Report[] = [];
  if (isAdmin) {
    try {
      const admin = createAdminClient();
      const { data } = await admin
        .from("article_reports")
        .select("id, article_id, reporter_email, reason, details, status, created_at")
        .eq("article_id", article.id)
        .order("created_at", { ascending: false });
      reports = (data ?? []) as Report[];
    } catch {
      reports = [];
    }
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ScholarlyArticle",
    headline: article.title,
    abstract: article.abstract ?? undefined,
    author: article.author_name
      ? { "@type": "Person", name: article.author_name }
      : undefined,
    datePublished: article.created_at,
    inLanguage: "en",
    url: `${SITE_URL}/articulos/${article.id}`,
    publisher: { "@type": "Organization", name: SITE.name },
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Link
        href={article.category ? `/?categoria=${article.category}` : "/"}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-500 transition hover:text-navy-900"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        {categoryLabel(article.category)}
      </Link>

      <header className="mt-5 border-b border-stone-200 pb-8">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ring-inset",
              categoryTone(article.category),
            )}
          >
            {categoryLabel(article.category)}
          </span>
          <span className="inline-flex items-center gap-1.5 text-[11px] text-stone-400">
            <CalendarDays className="size-3.5" aria-hidden />
            {formatDate(article.created_at)}
          </span>
          {article.pdf_size_bytes ? (
            <span className="inline-flex items-center gap-1.5 text-[11px] text-stone-400">
              <FileText className="size-3.5" aria-hidden />
              {formatBytes(article.pdf_size_bytes)}
            </span>
          ) : null}
          {article.report_count > 0 && isAdmin ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 ring-1 ring-amber-200 ring-inset">
              <Flag className="size-3" aria-hidden />
              {article.report_count} report{article.report_count === 1 ? "" : "s"}
            </span>
          ) : null}
        </div>

        <h1 className="mt-4 max-w-4xl font-serif text-3xl leading-[1.15] tracking-tight text-navy-900 sm:text-4xl lg:text-[2.75rem]">
          {article.title}
        </h1>

        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-stone-600">
          <span className="inline-flex items-center gap-2">
            {article.author_avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={article.author_avatar_url}
                alt=""
                width={28}
                height={28}
                referrerPolicy="no-referrer"
                className="size-7 rounded-full object-cover ring-1 ring-stone-200"
              />
            ) : (
              <span className="grid size-7 place-items-center rounded-full bg-bronze-100 text-[10px] font-semibold text-bronze-700">
                {initials(article.author_name)}
              </span>
            )}
            <span className="font-medium text-navy-900">{article.author_name ?? "Author"}</span>
          </span>
          <span className="text-stone-300">·</span>
          <span>Master&apos;s Programme in Human Rights, Lund</span>
        </div>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-12">
        {/* -------------------------------------------------------- COLUMNA */}
        <div className="space-y-8 lg:col-span-8">
          {article.abstract ? (
            <section className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
              <h2 className="text-[10px] font-semibold tracking-[0.16em] text-bronze-600 uppercase">
                Abstract
              </h2>
              <p className="mt-3 text-[15px] leading-relaxed whitespace-pre-line text-stone-700">
                {article.abstract}
              </p>
            </section>
          ) : null}

          <PdfViewer viewUrl={viewUrl} downloadUrl={downloadUrl} title={article.title} />

          {storageError ? (
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
              <div>
                <p className="font-medium">The PDF link could not be generated.</p>
                <p className="mt-1 text-xs text-amber-800">
                  This usually means <code className="rounded bg-white px-1">SUPABASE_SERVICE_ROLE_KEY</code>{" "}
                  is missing. Detail: {storageError}
                </p>
              </div>
            </div>
          ) : null}
        </div>

        {/* --------------------------------------------------------- LATERAL */}
        <aside className="space-y-5 lg:col-span-4">
          <div className="rounded-2xl border border-stone-200 bg-white p-5">
            <h2 className="text-[10px] font-semibold tracking-[0.16em] text-stone-400 uppercase">
              Authorship
            </h2>
            <div className="mt-3 flex items-center gap-3">
              {article.author_avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={article.author_avatar_url}
                  alt=""
                  width={44}
                  height={44}
                  referrerPolicy="no-referrer"
                  className="size-11 rounded-full object-cover ring-1 ring-stone-200"
                />
              ) : (
                <span className="grid size-11 place-items-center rounded-full bg-bronze-100 text-sm font-semibold text-bronze-700">
                  {initials(article.author_name)}
                </span>
              )}
              <div className="min-w-0">
                <p className="truncate font-medium text-navy-900">
                  {article.author_name ?? "Author"}
                </p>
                <p className="text-xs text-stone-500">Master&apos;s student</p>
              </div>
            </div>

            {article.author_email ? (
              <a
                href={`mailto:${article.author_email}`}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-medium text-navy-800 transition hover:border-bronze-300 hover:bg-white"
              >
                <Mail className="size-3.5" aria-hidden />
                {article.author_email}
              </a>
            ) : (
              <p className="mt-4 flex items-center gap-2 rounded-xl bg-stone-50 px-3 py-2 text-[11px] text-stone-500">
                <ShieldCheck className="size-3.5 shrink-0" aria-hidden />
                Contact not public. Write to the administrator if you need to reach
                the author.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white p-5">
            <h2 className="text-[10px] font-semibold tracking-[0.16em] text-stone-400 uppercase">
              Was it useful?
            </h2>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <LikeButton
                articleId={article.id}
                initialCount={article.like_count}
                initialLiked={liked}
                isAuthenticated={Boolean(profile)}
              />
              <ReportButton
                articleId={article.id}
                articleTitle={article.title}
                isAuthenticated={Boolean(profile)}
                defaultEmail={profile?.email ?? null}
              />
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-stone-400">
              A report notifies the author and the administrator by email. It does not
              remove the article automatically.
            </p>

            {isOwner || isAdmin ? (
              <div className="mt-4 border-t border-stone-100 pt-4">
                <DeleteArticleButton
                  articleId={article.id}
                  label={isOwner ? "Delete my article" : "Remove (admin)"}
                />
              </div>
            ) : null}
          </div>

          <div className="rounded-2xl bg-navy-900 p-5 text-navy-100">
            <p className="font-serif text-base text-white">Publish your work</p>
            <p className="mt-2 text-xs leading-relaxed text-navy-200">
              If you have finished a course essay graded AB, you can add it to the
              catalogue in two minutes.
            </p>
            <Link
              href={profile ? "/subir" : "/auth/login"}
              className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-bronze-500 px-4 py-2 text-xs font-medium text-white transition hover:bg-bronze-400"
            >
              {profile ? "Upload a PDF" : "Sign in with Google"}
            </Link>
          </div>
        </aside>
      </div>

      {/* ------------------------------------------------ PANEL DE ADMIN */}
      {isAdmin ? (
        <section className="mt-12 rounded-2xl border border-amber-200 bg-amber-50/50 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-serif text-lg text-navy-900">
              Reports received ({reports.length})
            </h2>
            <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-amber-700 ring-1 ring-amber-200 ring-inset">
              Administrators only
            </span>
          </div>

          {reports.length === 0 ? (
            <p className="mt-3 text-sm text-stone-500">
              This article has no open reports.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {reports.map((report) => (
                <li key={report.id} className="rounded-xl border border-amber-200 bg-white p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-medium text-navy-900">
                      {REPORT_REASON_LABELS[report.reason] ?? report.reason}
                    </span>
                    <span className="text-[11px] text-stone-400">
                      {formatDate(report.created_at)} · {report.status}
                    </span>
                  </div>
                  {report.details ? (
                    <p className="mt-1.5 text-sm whitespace-pre-line text-stone-600">
                      {report.details}
                    </p>
                  ) : null}
                  {report.reporter_email ? (
                    <p className="mt-2 text-[11px] text-stone-400">
                      Reporter contact: {report.reporter_email}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {/* ----------------------------------------------------------- RELACIONADOS */}
      {related.length > 0 ? (
        <section className="mt-14">
          <h2 className="font-serif text-xl text-navy-900">More on this subject</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <ArticleCard key={item.id} article={item} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
