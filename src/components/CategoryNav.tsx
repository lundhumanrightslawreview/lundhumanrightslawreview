"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CATEGORIES } from "@/lib/categories";
import { cn } from "@/lib/utils";

const base =
  "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium whitespace-nowrap transition";
const idle =
  "border-stone-200 bg-white/70 text-stone-600 hover:border-bronze-300 hover:bg-white hover:text-navy-900";
const active = "border-navy-900 bg-navy-900 text-white shadow-xs";

export function CategoryNav() {
  const searchParams = useSearchParams();
  const current = searchParams.get("categoria");

  return (
    <nav aria-label="Subjects" className="border-t border-stone-200/70">
      <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 py-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Link href="/" className={cn(base, current ? idle : active)}>
          All subjects
        </Link>
        {CATEGORIES.map((category) => (
          <Link
            key={category.slug}
            href={`/?categoria=${category.slug}`}
            className={cn(base, current === category.slug ? active : idle)}
            aria-current={current === category.slug ? "page" : undefined}
          >
            {category.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
