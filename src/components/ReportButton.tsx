"use client";

import { useState } from "react";
import { Flag, X } from "lucide-react";
import { REPORT_REASONS, type ReportReason } from "@/lib/types";

type Status = "idle" | "sending" | "sent" | "error";

export function ReportButton({
  articleId,
  articleTitle,
  isAuthenticated,
  defaultEmail,
}: {
  articleId: string;
  articleTitle: string;
  isAuthenticated: boolean;
  defaultEmail?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>("plagiarism");
  const [details, setDetails] = useState("");
  const [email, setEmail] = useState(defaultEmail ?? "");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // honeypot

  function close() {
    if (status === "sending") return;
    setOpen(false);
    if (status === "sent") {
      setStatus("idle");
      setDetails("");
      setMessage("");
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setMessage("");

    try {
      const response = await fetch("/api/reportes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articleId,
          reason,
          details,
          email: isAuthenticated ? undefined : email,
          website,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        emailSent?: boolean;
      };

      if (!response.ok) {
        setStatus("error");
        setMessage(payload.error ?? "The report could not be sent. Please try again.");
        return;
      }

      setStatus("sent");
      setMessage(
        payload.emailSent === false
          ? "Report recorded. The email notification will go out as soon as the email service is configured."
          : "Report sent. The author and the administrator have been notified.",
      );
    } catch {
      setStatus("error");
      setMessage("Network error. Check your connection and try again.");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-600 transition hover:border-bronze-400 hover:text-bronze-700"
      >
        <Flag className="size-4" aria-hidden />
        Report
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-navy-950/50 p-4 backdrop-blur-sm sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="report-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) close();
          }}
        >
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="report-title" className="font-serif text-xl text-navy-900">
                  Report this article
                </h2>
                <p className="mt-1 text-sm text-stone-500">
                  “{articleTitle.slice(0, 80)}
                  {articleTitle.length > 80 ? "…" : ""}”
                </p>
              </div>
              <button
                type="button"
                onClick={close}
                className="rounded-full p-1 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
                aria-label="Close"
              >
                <X className="size-5" />
              </button>
            </div>

            {status === "sent" ? (
              <div className="mt-6 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">
                {message}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                <fieldset className="space-y-2">
                  <legend className="text-sm font-medium text-stone-700">Reason</legend>
                  {REPORT_REASONS.map((option) => (
                    <label
                      key={option.value}
                      className="flex cursor-pointer items-start gap-3 rounded-xl border border-stone-200 p-3 transition hover:border-bronze-300 has-checked:border-bronze-400 has-checked:bg-bronze-50/50"
                    >
                      <input
                        type="radio"
                        name="reason"
                        value={option.value}
                        checked={reason === option.value}
                        onChange={() => setReason(option.value)}
                        className="mt-1 size-4 accent-bronze-600"
                      />
                      <span>
                        <span className="block text-sm font-medium text-navy-900">
                          {option.label}
                        </span>
                        <span className="block text-xs text-stone-500">{option.hint}</span>
                      </span>
                    </label>
                  ))}
                </fieldset>

                <div>
                  <label htmlFor="report-details" className="text-sm font-medium text-stone-700">
                    Details <span className="font-normal text-stone-400">(optional)</span>
                  </label>
                  <textarea
                    id="report-details"
                    value={details}
                    onChange={(event) => setDetails(event.target.value)}
                    rows={3}
                    maxLength={1000}
                    placeholder="Specific page or section, original source…"
                    className="mt-1 w-full resize-y rounded-xl border border-stone-300 px-3 py-2 text-sm outline-none focus:border-bronze-400 focus:ring-2 focus:ring-bronze-100"
                  />
                </div>

                {!isAuthenticated ? (
                  <div>
                    <label htmlFor="report-email" className="text-sm font-medium text-stone-700">
                      Your email <span className="font-normal text-stone-400">(optional)</span>
                    </label>
                    <input
                      id="report-email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="so the administrator can reply to you"
                      className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2 text-sm outline-none focus:border-bronze-400 focus:ring-2 focus:ring-bronze-100"
                    />
                  </div>
                ) : null}

                {/* Honeypot anti-bots: invisible para personas. */}
                <input
                  type="text"
                  name="website"
                  value={website}
                  onChange={(event) => setWebsite(event.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden
                  className="hidden"
                />

                {status === "error" ? (
                  <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{message}</p>
                ) : null}

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={close}
                    className="rounded-full px-4 py-2 text-sm font-medium text-stone-500 transition hover:bg-stone-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={status === "sending"}
                    className="rounded-full bg-navy-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-navy-800 disabled:opacity-60"
                  >
                    {status === "sending" ? "Sending…" : "Send report"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
