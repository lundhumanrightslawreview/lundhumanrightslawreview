import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MailX, Info } from "lucide-react";
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

      {/* OPEN ACCESS NOTICE ADDED HERE */}
      <div className="mt-6 flex items-start gap-3 rounded-lg border border-blue-100 bg-blue-50/50 p-4 text-sm text-blue-900">
        <Info className="mt-0.5 size-5 shrink-0 text-blue-600" aria-hidden />
        <div>
          <p className="font-semibold text-blue-950">Open Access Publishing (CC BY-NC 4.0)</p>
          <p className="mt-1 leading-relaxed text-blue-800">
            By publishing on this platform, you retain full copyright of your work while agreeing to distribute it under a{" "}
            <a 
              href="https://creativecommons.org/licenses/by-nc/4.0/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="font-medium underline decoration-blue-300 underline-offset-2 hover:text-blue-950"
            >
              Creative Commons Attribution-NonCommercial 4.0 International License
            </a>. 
            This ensures your peers can freely read, share, and cite your work, while strictly prohibiting anyone from using it for commercial purposes.
          </p>
        </div>
      </div>
      {/* END OF NOTICE */}

      <div className="mt-8">
        <UploadForm authorName={displayName(profile)} />
      </div>
    </div>
  );
}
