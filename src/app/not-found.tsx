import Link from "next/link";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <span className="mx-auto grid size-12 place-items-center rounded-full bg-stone-100 text-stone-400">
        <FileQuestion className="size-5" aria-hidden />
      </span>
      <h1 className="mt-5 font-serif text-2xl text-navy-900">
        This page does not exist
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-stone-600">
        The article may have been withdrawn, or the link may be misspelled.
      </p>
      <Link
        href="/"
        className="mt-7 inline-flex rounded-full bg-navy-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-navy-800"
      >
        Back to the catalogue
      </Link>
    </div>
  );
}
