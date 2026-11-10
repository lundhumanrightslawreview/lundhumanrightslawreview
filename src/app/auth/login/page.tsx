import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, GraduationCap, ShieldCheck } from "lucide-react";
import { signInWithGoogle } from "@/app/auth/actions";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in with your Lund University Google account.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16 sm:py-24">
      <div className="text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-navy-900 text-bronze-200">
          <GraduationCap className="size-7" aria-hidden />
        </span>
        <h1 className="mt-6 font-serif text-3xl tracking-tight text-navy-900">
          Sign in
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-stone-600">
          Sign in with your <strong>@student.lu.se</strong> Google account to publish
          articles and like them.
        </p>
      </div>

      {error === "dominio" ? (
        <p className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          That account is not in the <strong>@student.lu.se</strong> domain. Use your
          Lund student email.
        </p>
      ) : null}
      {error === "oauth" ? (
        <p className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          Google sign-in could not be completed. Please try again.
        </p>
      ) : null}

      <form action={signInWithGoogle} className="mt-8">
        <input type="hidden" name="next" value={safeNext} />
        <button
          type="submit"
          className="inline-flex w-full items-center justify-center gap-3 rounded-full bg-navy-900 px-6 py-3.5 text-sm font-medium text-white transition hover:bg-navy-800"
        >
          <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
            <path
              fill="#fff"
              d="M21.35 11.1h-9.18v2.98h5.27c-.23 1.5-1.74 4.4-5.27 4.4-3.17 0-5.75-2.62-5.75-5.85s2.58-5.85 5.75-5.85c1.8 0 3.01.77 3.7 1.43l2.52-2.43C16.66 4.1 14.7 3.2 12.17 3.2 6.98 3.2 2.8 7.38 2.8 12.57s4.18 9.37 9.37 9.37c5.41 0 8.99-3.8 8.99-9.16 0-.62-.07-1.09-.16-1.68z"
            />
          </svg>
          Continue with Google
        </button>
      </form>

      <div className="mt-6 flex items-start gap-2 rounded-xl bg-stone-100/70 p-4 text-[11px] leading-relaxed text-stone-500">
        <ShieldCheck className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        Only @student.lu.se addresses are accepted. The domain is verified twice: on
        the way back from Google and in the database. Your email is never shown in the
        catalogue unless you allow it when publishing.
      </div>

      <Link
        href="/"
        className="mt-8 inline-flex items-center justify-center gap-1.5 text-xs font-medium text-stone-500 transition hover:text-navy-900"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        Back to the catalogue
      </Link>
    </div>
  );
}
