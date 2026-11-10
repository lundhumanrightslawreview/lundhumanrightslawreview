import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MailX } from "lucide-react";
import { UploadForm } from "@/components/UploadForm";
import { getCurrentProfile } from "@/lib/auth";
import { displayName, isAllowedEmail } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Publish an article",
  description:
    "Upload your master's essay as a PDF: title, subject and an abstract. @student.lu.se accounts only.",
};

export default async function UploadPage() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/auth/login?next=/subir");
  }

  if (!isAllowedEmail(profile.email)) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-amber-50 text-amber-600">
          <MailX className="size-5" aria-hidden />
        </span>
        <h1 className="mt-5 font-serif text-2xl text-navy-900">Account not authorised</h1>
        <p className="mt-3 text-sm leading-relaxed text-stone-600">
          Only <strong>@student.lu.se</strong> email addresses can publish. You are
          signed in as <strong>{profile.email}</strong>.
        </p>
        <p className="mt-2 text-sm text-stone-500">
          Sign out and sign in again with your Lund University account.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-full bg-navy-900 px-5 py-2.5 text-sm font-medium text-white"
        >
          Back to the catalogue
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <Link
        href="/"
        className="text-xs font-medium text-stone-500 transition hover:text-navy-900"
      >
        ← Back to the catalogue
      </Link>

      <header className="mt-4">
        <p className="text-[10px] font-semibold tracking-[0.16em] text-bronze-600 uppercase">
          New publication
        </p>
        <h1 className="mt-2 font-serif text-3xl leading-tight tracking-tight text-navy-900 sm:text-4xl">
          Publish your article
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-600">
          Upload the final PDF, choose the subject and decide whether to show your
          email. Your name is taken from the Google account you signed in with.
        </p>
      </header>

      <div className="mt-8">
        <UploadForm authorName={displayName(profile)} />
      </div>
    </div>
  );
}
