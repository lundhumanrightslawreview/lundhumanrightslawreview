"use client";

import { Search } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

export function SearchBar({ className }: { className?: string }) {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") ?? "";

  return (
    <form action="/" role="search" className={cn("relative w-full max-w-md", className)}>
      <label htmlFor="site-search" className="sr-only">
        Search articles
      </label>
      <Search
        className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-stone-400"
        aria-hidden
      />
      <input
        id="site-search"
        type="search"
        name="q"
        key={query}
        defaultValue={query}
        placeholder="Search by title, abstract or author…"
        maxLength={80}
        className="h-10 w-full rounded-full border border-stone-200 bg-white pr-4 pl-10 text-sm text-ink shadow-xs transition placeholder:text-stone-400 focus:border-bronze-400 focus:ring-2 focus:ring-bronze-100 focus:outline-none"
      />
    </form>
  );
}
