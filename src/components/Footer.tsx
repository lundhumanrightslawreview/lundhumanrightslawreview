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
            {/* LINK A GITHUB AGREGADO AQUÍ */}
            <li className="pt-2">
              <a 
                href="https://github.com/lundhumanrightslawreview/lundhumanrightslawreview" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center gap-1.5 text-stone-500 hover:text-navy-900 hover:underline"
              >
                <svg viewBox="0 0 24 24" className="size-4 fill-current" aria-hidden="true">
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.
