import Link from "next/link";
import { SITE } from "@/lib/env";
import { CATEGORIES } from "@/lib/categories";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-stone-200 bg-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2">
          <p className="font-serif text-lg text-navy-900">{SITE.name}</p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-stone-500">
            A decentralised platform from the {SITE.programme} at {SITE.university}.
            We publish essays graded AB and referenced in OSCOLA so that the
            knowledge circulates.
          </p>
          <p className="mt-4 text-xs text-stone-400">
            An independent, student-run project. Not an official publication of
            Lund University.
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold tracking-[0.14em] text-stone-400 uppercase">
            Browse
          </p>
          <ul className="mt-3 space-y-2 text-sm text-stone-600">
            <li>
              <Link href="/" className="hover:text-navy-900 hover:underline">
                All publications
              </Link>
            </li>
            <li>
              <Link href="/subir" className="hover:text-navy-900 hover:underline">
                Publish an article
              </Link>
            </li>
            <li>
              <Link href="/mis-articulos" className="hover:text-navy-900 hover:underline">
                My articles
              </Link>
            </li>
            <li>
              <Link href="/auth/login" className="hover:text-navy-900 hover:underline">
                Sign in with @student.lu.se
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold tracking-[0.14em] text-stone-400 uppercase">
            Subjects
          </p>
          <ul className="mt-3 space-y-2 text-sm text-stone-600">
            {CATEGORIES.slice(0, 5).map((category) => (
              <li key={category.slug}>
                <Link
                  href={`/?categoria=${category.slug}`}
                  className="hover:text-navy-900 hover:underline"
                >
                  {category.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-stone-100">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-5 text-xs text-stone-400 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {SITE.name}
          </p>
          <p>Built by students, for students.</p>
        </div>
      </div>
    </footer>
  );
}
