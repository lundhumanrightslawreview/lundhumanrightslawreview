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
          {/* CC LICENSE ADDED HERE */}
          <div className="mt-4 max-w-sm rounded bg-stone-50 p-3 text-xs leading-relaxed text-stone-500 border border-stone-100">
            <p>
              <strong>Open Access:</strong> All articles published on this platform are distributed under a{" "}
              <a 
                href="https://creativecommons.org/licenses/by-nc/4.0/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="underline hover:text-navy-900"
              >
                Creative Commons Attribution-NonCommercial 4.0 International License
              </a>.
            </p>
          </div>
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
            {/* LINK A GITHUB AHORA SÍ ESTÁ AQUÍ */}
            <li className="pt-2">
              <a 
                href="https://github.com/lundhumanrightslawreview/lundhumanrightslawreview" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center gap-1.5 text-stone-500 hover:text-navy-900 hover:underline"
              >
                <svg viewBox="0 0 24 24" className="size-4 fill-current" aria-hidden="true">
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                </svg>
                View Source Code
              </a>
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
