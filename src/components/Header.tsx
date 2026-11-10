import Image from "next/image";
import Link from "next/link";
import { LogOut, PlusCircle, UserRound } from "lucide-react";
import { Suspense } from "react";
import { signOut } from "@/app/auth/actions";
import { getCurrentProfile } from "@/lib/auth";
import { SITE } from "@/lib/env";
import { displayName, initials } from "@/lib/utils";
import { CategoryNav } from "./CategoryNav";
import { SearchBar } from "./SearchBar";

function SearchFallback() {
  return (
    <div className="h-10 w-full max-w-md rounded-full border border-stone-200 bg-white/70" />
  );
}

export async function Header() {
  const profile = await getCurrentProfile();

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-paper/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 lg:h-[4.5rem] lg:gap-6">
        <Link href="/" className="group flex min-w-0 items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-navy-900 text-bronze-200 ring-1 ring-navy-900/10 transition group-hover:bg-navy-800">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-5"
              aria-hidden
            >
              <path d="M12 3v18M7 21h10M5 7h14M5 7l-2 5a3 3 0 0 0 6 0L7 7M19 7l2 5a3 3 0 0 1-6 0l4-5" />
            </svg>
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block truncate font-serif text-[0.95rem] font-semibold tracking-tight text-navy-900 sm:text-lg">
              {SITE.name}
            </span>
            <span className="hidden text-[10px] font-medium tracking-[0.16em] text-stone-500 uppercase sm:block">
              {SITE.university} · Master&apos;s Programme in Human Rights
            </span>
          </span>
        </Link>

        <div className="hidden flex-1 justify-center md:flex">
          <Suspense fallback={<SearchFallback />}>
            <SearchBar />
          </Suspense>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2 md:ml-0">
          {profile ? (
            <>
              <Link
                href="/subir"
                className="inline-flex h-10 items-center gap-1.5 rounded-full bg-navy-900 px-3.5 text-sm font-medium text-white transition hover:bg-navy-800 sm:px-4"
              >
                <PlusCircle className="size-4" aria-hidden />
                <span className="hidden sm:inline">Publish</span>
              </Link>

              <Link
                href="/mis-articulos"
                className="group flex items-center gap-2 rounded-full border border-stone-200 bg-white py-1 pr-1 pl-1 transition hover:border-bronze-300"
                title={`${displayName(profile)} — my articles`}
              >
                {profile.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt=""
                    width={30}
                    height={30}
                    className="size-[30px] rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="grid size-[30px] place-items-center rounded-full bg-bronze-100 text-[11px] font-semibold text-bronze-700">
                    {initials(profile.full_name ?? profile.email)}
                  </span>
                )}
                <span className="hidden max-w-[9rem] truncate pr-2 text-xs font-medium text-stone-600 group-hover:text-navy-900 lg:block">
                  {displayName(profile)}
                </span>
              </Link>

              <form action={signOut}>
                <button
                  type="submit"
                  className="grid size-9 place-items-center rounded-full text-stone-400 transition hover:bg-stone-100 hover:text-navy-900"
                  title="Sign out"
                  aria-label="Sign out"
                >
                  <LogOut className="size-4" />
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="inline-flex h-10 items-center gap-2 rounded-full bg-navy-900 px-4 text-sm font-medium text-white transition hover:bg-navy-800"
              >
                <UserRound className="size-4" aria-hidden />
                Sign in with @student.lu.se
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="px-4 pb-2.5 md:hidden">
        <Suspense fallback={<SearchFallback />}>
          <SearchBar className="max-w-none" />
        </Suspense>
      </div>

      <Suspense
        fallback={<div className="h-11 border-t border-stone-200/70" aria-hidden />}
      >
        <CategoryNav />
      </Suspense>
    </header>
  );
}
