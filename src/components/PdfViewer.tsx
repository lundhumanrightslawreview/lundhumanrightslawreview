import { Download, ExternalLink, FileText } from "lucide-react";

export function PdfViewer({
  viewUrl,
  downloadUrl,
  title,
}: {
  viewUrl: string | null;
  downloadUrl: string | null;
  title: string;
}) {
  if (!viewUrl) {
    return (
      <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center">
        <FileText className="mx-auto size-8 text-stone-300" aria-hidden />
        <p className="mt-3 text-sm text-stone-500">
          The PDF is not available right now.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 bg-stone-50/70 px-4 py-2.5">
        <span className="inline-flex items-center gap-2 text-xs font-medium tracking-wide text-stone-500 uppercase">
          <FileText className="size-3.5" aria-hidden />
          PDF document
        </span>
        <div className="flex items-center gap-2">
          <a
            href={viewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-navy-700 transition hover:bg-navy-50"
          >
            <ExternalLink className="size-3.5" aria-hidden />
            Open
          </a>
          {downloadUrl ? (
            <a
              href={downloadUrl}
              className="inline-flex items-center gap-1.5 rounded-full bg-navy-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-navy-800"
            >
              <Download className="size-3.5" aria-hidden />
              Download
            </a>
          ) : null}
        </div>
      </div>

      <object
        data={`${viewUrl}#view=FitH`}
        type="application/pdf"
        aria-label={`PDF preview: ${title}`}
        className="h-[70vh] min-h-[520px] w-full bg-stone-100"
      >
        <div className="p-10 text-center">
          <p className="text-sm text-stone-600">
            Your browser cannot display the PDF inline.
          </p>
          <a
            href={viewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex rounded-full bg-navy-900 px-4 py-2 text-sm font-medium text-white"
          >
            Open the PDF in a new tab
          </a>
        </div>
      </object>
    </div>
  );
}
