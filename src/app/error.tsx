"use client";

import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <span className="mx-auto grid size-12 place-items-center rounded-full bg-amber-50 text-amber-600">
        <TriangleAlert className="size-5" aria-hidden />
      </span>
      <h1 className="mt-5 font-serif text-2xl text-navy-900">Something went wrong</h1>
      <p className="mt-3 text-sm leading-relaxed text-stone-600">
        We could not load this page. If you have just set up the project, check that
        you ran <code className="rounded bg-stone-100 px-1">supabase/schema.sql</code>{" "}
        and that the keys in <code className="rounded bg-stone-100 px-1">.env.local</code>{" "}
        are correct.
      </p>
      {error.digest ? (
        <p className="mt-2 text-[11px] text-stone-400">Reference: {error.digest}</p>
      ) : null}

      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-full bg-navy-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-navy-800"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-full border border-stone-300 bg-white px-5 py-2.5 text-sm font-medium text-navy-800"
        >
          Go to the catalogue
        </Link>
      </div>
    </div>
  );
}
