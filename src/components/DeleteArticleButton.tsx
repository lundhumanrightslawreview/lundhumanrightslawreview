"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { deleteArticle } from "@/app/actions";
import { cn } from "@/lib/utils";

export function DeleteArticleButton({
  articleId,
  label = "Delete",
  className,
}: {
  articleId: string;
  label?: string;
  className?: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    const confirmed = window.confirm(
      "Delete this article and its PDF? This action cannot be undone.",
    );
    if (!confirmed) return;

    setPending(true);
    setError(null);

    try {
      const result = await deleteArticle(articleId);
      if (result?.error) {
        setError(result.error);
        setPending(false);
        return;
      }
      router.refresh();
    } catch {
      // Los redirects de las Server Actions se propagan como excepción de control.
      router.refresh();
    }
  }

  return (
    <div className={cn("flex flex-col items-start gap-1", className)}>
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3.5 py-2 text-xs font-medium text-stone-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-60"
      >
        {pending ? (
          <Loader2 className="size-3.5 animate-spin" aria-hidden />
        ) : (
          <Trash2 className="size-3.5" aria-hidden />
        )}
        {pending ? "Deleting…" : label}
      </button>
      {error ? <span className="text-[11px] text-red-600">{error}</span> : null}
    </div>
  );
}
