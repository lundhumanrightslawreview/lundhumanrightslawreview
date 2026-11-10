import Link from "next/link";
import { FileText, Heart } from "lucide-react";
import { categoryLabel, categoryTone } from "@/lib/categories";
import type { Article } from "@/lib/types";
import { cn, formatDate, initials, truncate } from "@/lib/utils";

export function ArticleCard({ article }: { article: Article }) {
  return (
    <article className="group card-shadow relative flex h-full flex-col overflow-hidden rounded-2xl border border-stone-200/80 bg-white transition duration-200 hover:-translate-y-0.5 hover:border-bronze-300 hover:shadow-[0_14px_32px_-16px_rgba(15,36,56,0.35)]">
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/?categoria=${article.category}`}
            className={cn(
              "relative z-10 inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ring-inset transition hover:brightness-[0.97]",
              categoryTone(article.category),
            )}
          >
            {categoryLabel(article.category)}
          </Link>
          <span className="text-[11px] text-stone-400">
            {formatDate(article.created_at)}
          </span>
        </div>

        <h3 className="mt-3 font-serif text-[1.3rem] leading-snug tracking-tight text-navy-900">
          <Link
            href={`/articulos/${article.id}`}
            className="decoration-bronze-300 decoration-1 underline-offset-4 transition after:absolute after:inset-0 after:content-[''] group-hover:underline"
          >
            {article.title}
          </Link>
        </h3>

        <p className="mt-2 text-sm leading-relaxed text-stone-600">
          {truncate(article.abstract, 190) || "No abstract available."}
        </p>

        <div className="mt-auto flex items-center justify-between gap-3 pt-5">
          <div className="flex min-w-0 items-center gap-2">
            {article.author_avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={article.author_avatar_url}
                alt=""
                width={26}
                height={26}
                referrerPolicy="no-referrer"
                className="size-[26px] shrink-0 rounded-full object-cover ring-1 ring-stone-200"
              />
            ) : (
              <span className="grid size-[26px] shrink-0 place-items-center rounded-full bg-bronze-100 text-[10px] font-semibold text-bronze-700">
                {initials(article.author_name)}
              </span>
            )}
            <span className="truncate text-xs font-medium text-stone-600">
              {article.author_name ?? "Author"}
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-3 text-[11px] text-stone-400">
            <span className="inline-flex items-center gap-1" title="Likes">
              <Heart className="size-3.5" aria-hidden />
              {article.like_count}
            </span>
            <span className="inline-flex items-center gap-1" title="PDF">
              <FileText className="size-3.5" aria-hidden />
              PDF
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
