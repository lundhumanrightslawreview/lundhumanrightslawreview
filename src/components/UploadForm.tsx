"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import {
  AlertCircle,
  FileText,
  Loader2,
  Lock,
  Mail,
  UploadCloud,
  X,
} from "lucide-react";
import { CATEGORIES } from "@/lib/categories";
import { createClient } from "@/lib/supabase/client";
import { cn, formatBytes } from "@/lib/utils";

const MAX_BYTES = 10 * 1024 * 1024;

type Stage = "idle" | "uploading" | "saving";

function readableStorageError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("payload too large") || lower.includes("exceeded the maximum")) {
    return "The PDF exceeds the 10 MB limit.";
  }
  if (lower.includes("mime type") || lower.includes("invalid mime")) {
    return "The file must be a PDF.";
  }
  if (lower.includes("row-level security") || lower.includes("policy")) {
    return "Your account is not allowed to publish. Check that your profile exists (@student.lu.se).";
  }
  if (lower.includes("duplicate key")) {
    return "That file had already been uploaded. Please try again.";
  }
  return `The PDF could not be uploaded: ${message}`;
}

export function UploadForm({ authorName }: { authorName: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [abstract, setAbstract] = useState("");
  const [showEmail, setShowEmail] = useState(false);
  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState<string | null>(null);

  const busy = stage !== "idle";

  function pickFile(candidate: File | null) {
    setError(null);
    if (!candidate) return;

    const isPdf =
      candidate.type === "application/pdf" || candidate.name.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      setError("Only PDF files are accepted.");
      return;
    }
    if (candidate.size > MAX_BYTES) {
      setError(`The PDF is ${formatBytes(candidate.size)} and the maximum is 10 MB.`);
      return;
    }
    setFile(candidate);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const cleanTitle = title.trim();

    if (cleanTitle.length < 5) {
      setError("The title must be at least 5 characters long.");
      return;
    }
    if (!category) {
      setError("Select a subject.");
      return;
    }
    if (!file) {
      setError("Attach your article as a PDF.");
      return;
    }

    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Your session has expired. Please sign in with Google again.");
      return;
    }

    setStage("uploading");

    const path = `${user.id}/${crypto.randomUUID()}.pdf`;

    const { error: uploadError } = await supabase.storage
      .from("articles")
      .upload(path, file, {
        contentType: "application/pdf",
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      setError(readableStorageError(uploadError.message));
      setStage("idle");
      return;
    }

    setStage("saving");

    const { data: inserted, error: insertError } = await supabase
      .from("articles")
      .insert({
        author_id: user.id,
        title: cleanTitle,
        category,
        abstract: abstract.trim() ? abstract.trim() : null,
        pdf_path: path,
        pdf_size_bytes: file.size,
        show_email: showEmail,
      })
      .select("id")
      .single();

    if (insertError) {
      // Limpieza: si la fila no se creó, el PDF no debe quedarse huérfano.
      await supabase.storage.from("articles").remove([path]);
      setError(`The article could not be saved: ${insertError.message}`);
      setStage("idle");
      return;
    }

    router.push(`/articulos/${inserted.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* 1. PDF */}
      <section className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
        <header className="flex items-baseline justify-between gap-3">
          <h2 className="font-serif text-lg text-navy-900">1 · The document</h2>
          <span className="text-xs text-stone-400">PDF · max. 10 MB</span>
        </header>

        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            pickFile(event.dataTransfer.files?.[0] ?? null);
          }}
          className={cn(
            "mt-4 rounded-xl border-2 border-dashed p-6 text-center transition",
            dragging
              ? "border-bronze-400 bg-bronze-50"
              : file
                ? "border-emerald-200 bg-emerald-50/40"
                : "border-stone-300 bg-stone-50/60",
          )}
        >
          <input
            ref={inputRef}
            id="pdf"
            type="file"
            accept="application/pdf,.pdf"
            className="sr-only"
            onChange={(event) => pickFile(event.target.files?.[0] ?? null)}
            disabled={busy}
          />

          {file ? (
            <div className="flex flex-col items-center gap-3">
              <span className="grid size-11 place-items-center rounded-full bg-white text-emerald-600 ring-1 ring-emerald-200">
                <FileText className="size-5" aria-hidden />
              </span>
              <div>
                <p className="text-sm font-medium break-all text-navy-900">{file.name}</p>
                <p className="text-xs text-stone-500">{formatBytes(file.size)}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  if (inputRef.current) inputRef.current.value = "";
                }}
                disabled={busy}
                className="inline-flex items-center gap-1 text-xs font-medium text-stone-500 hover:text-red-600"
              >
                <X className="size-3.5" /> Remove
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <span className="grid size-11 place-items-center rounded-full bg-white text-bronze-600 ring-1 ring-stone-200">
                <UploadCloud className="size-5" aria-hidden />
              </span>
              <div>
                <p className="text-sm text-stone-600">Drag your PDF here</p>
                <p className="text-xs text-stone-400">or</p>
              </div>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={busy}
                className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-navy-800 transition hover:border-bronze-400"
              >
                Select file
              </button>
            </div>
          )}
        </div>

        <p className="mt-3 text-xs leading-relaxed text-stone-500">
          Upload the final version, with footnotes in OSCOLA and without personal
          data belonging to third parties.
        </p>
      </section>

      {/* 2. Metadatos */}
      <section className="space-y-5 rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
        <h2 className="font-serif text-lg text-navy-900">2 · Article details</h2>

        <div>
          <label htmlFor="title" className="text-sm font-medium text-stone-700">
            Title <span className="text-bronze-600">*</span>
          </label>
          <input
            id="title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={200}
            required
            placeholder="e.g. Climate Litigation before the European Court of Human Rights"
            className="mt-1.5 w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm outline-none focus:border-bronze-400 focus:ring-2 focus:ring-bronze-100"
            disabled={busy}
          />
          <p className="mt-1 text-right text-[11px] text-stone-400">{title.length}/200</p>
        </div>

        <div>
          <label htmlFor="category" className="text-sm font-medium text-stone-700">
            Subject <span className="text-bronze-600">*</span>
          </label>
          <select
            id="category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            required
            className="mt-1.5 w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-bronze-400 focus:ring-2 focus:ring-bronze-100"
            disabled={busy}
          >
            <option value="">Select a subject…</option>
            {CATEGORIES.map((option) => (
              <option key={option.slug} value={option.slug}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="abstract" className="text-sm font-medium text-stone-700">
            Abstract{" "}
            <span className="font-normal text-stone-400">(recommended, max. 1200)</span>
          </label>
          <textarea
            id="abstract"
            value={abstract}
            onChange={(event) => setAbstract(event.target.value)}
            rows={5}
            maxLength={1200}
            placeholder="Research question, legal framework, main argument and conclusion."
            className="mt-1.5 w-full resize-y rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm leading-relaxed outline-none focus:border-bronze-400 focus:ring-2 focus:ring-bronze-100"
            disabled={busy}
          />
          <p className="mt-1 text-right text-[11px] text-stone-400">{abstract.length}/1200</p>
        </div>
      </section>

      {/* 3. Privacidad */}
      <section className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
        <h2 className="font-serif text-lg text-navy-900">3 · Contact and authorship</h2>

        <div className="mt-4 flex items-start gap-3 rounded-xl bg-stone-50 p-4">
          <Mail className="mt-0.5 size-4 shrink-0 text-stone-400" aria-hidden />
          <div className="text-xs leading-relaxed text-stone-500">
            You are publishing as{" "}
            <span className="font-medium text-navy-900">{authorName}</span>, the name
            on your Google account. Your email is never shown unless you allow it
            below.
          </div>
        </div>

        <label className="mt-5 flex cursor-pointer items-start justify-between gap-4">
          <span>
            <span className="block text-sm font-medium text-stone-800">
              Show my contact email to readers?
            </span>
            <span className="mt-0.5 block text-xs text-stone-500">
              If you turn this off, your email is not rendered anywhere and only the
              administrator sees it, to notify you about reports.
            </span>
          </span>

          <span className="relative mt-0.5 inline-flex shrink-0">
            <input
              type="checkbox"
              checked={showEmail}
              onChange={(event) => setShowEmail(event.target.checked)}
              disabled={busy}
              className="peer sr-only"
              aria-label="Show my contact email"
            />
            <span className="flex h-6 w-11 rounded-full bg-stone-300 transition peer-checked:bg-bronze-500 peer-focus-visible:ring-2 peer-focus-visible:ring-bronze-300 peer-focus-visible:ring-offset-2" />
            <span className="absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow-sm transition peer-checked:translate-x-5" />
          </span>
        </label>

        <p className="mt-4 flex items-start gap-2 rounded-lg bg-navy-50/60 p-3 text-[11px] leading-relaxed text-navy-700">
          <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          You can only delete your own articles. The administrator may withdraw any
          content after a report.
        </p>
      </section>

      {error ? (
        <p className="flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-stone-400">
          By publishing you confirm that the text is yours and may be shared openly.
        </p>
        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-full bg-navy-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-navy-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {busy ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              {stage === "uploading" ? "Uploading PDF…" : "Publishing…"}
            </>
          ) : (
            "Publish article"
          )}
        </button>
      </div>
    </form>
  );
}
