"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Heart } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function LikeButton({
  articleId,
  initialCount,
  initialLiked,
  isAuthenticated,
}: {
  articleId: string;
  initialCount: number;
  initialLiked: boolean;
  isAuthenticated: boolean;
}) {
  const router = useRouter();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    if (pending) return;

    if (!isAuthenticated) {
      router.push(`/auth/login?next=/articulos/${articleId}`);
      return;
    }

    const nextLiked = !liked;
    const previousCount = count;

    setLiked(nextLiked);
    setCount((value) => Math.max(0, value + (nextLiked ? 1 : -1)));
    setPending(true);
    setError(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLiked(!nextLiked);
      setCount(previousCount);
      setPending(false);
      router.push(`/auth/login?next=/articulos/${articleId}`);
      return;
    }

    const { error: requestError } = nextLiked
      ? await supabase
          .from("article_likes")
          .insert({ article_id: articleId, user_id: user.id })
      : await supabase
          .from("article_likes")
          .delete()
          .eq("article_id", articleId)
          .eq("user_id", user.id);

    if (requestError) {
      // 23505 = ya existía el like; no es un error real.
      if (requestError.code !== "23505") {
        setLiked(!nextLiked);
        setCount(previousCount);
        setError("Your like could not be saved.");
      }
      setPending(false);
      return;
    }

    setPending(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        aria-pressed={liked}
        aria-label={liked ? "Remove like" : "Like this article"}
        className={cn(
          "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition disabled:opacity-60",
          liked
            ? "border-bronze-300 bg-bronze-50 text-bronze-700"
            : "border-stone-300 bg-white text-stone-600 hover:border-bronze-400 hover:text-bronze-700",
        )}
      >
        <Heart className={cn("size-4", liked && "fill-bronze-500 text-bronze-500")} aria-hidden />
        {liked ? "Liked" : "Like"}
        <span className="tabular-nums text-stone-500">{count}</span>
      </button>
      {error ? <span className="text-[11px] text-red-600">{error}</span> : null}
    </div>
  );
}
