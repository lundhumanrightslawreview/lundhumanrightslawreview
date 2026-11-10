import { Resend } from "resend";
import { REPORT_REASON_LABELS } from "@/lib/types";
import { SITE, SITE_URL } from "@/lib/env";

export type ReportEmailInput = {
  articleId: string;
  articleTitle: string;
  authorName: string | null;
  authorEmail: string | null;
  reason: string;
  details: string | null;
  reporterEmail: string | null;
  reporterIsAuthenticated: boolean;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildHtml(input: ReportEmailInput): string {
  const reason = escapeHtml(REPORT_REASON_LABELS[input.reason] ?? input.reason);
  const articleUrl = `${SITE_URL}/articulos/${input.articleId}`;
  const title = escapeHtml(input.articleTitle);
  const details = input.details
    ? `<p style="margin:0 0 8px;font-size:14px;color:#334155;">${escapeHtml(input.details).replace(/\n/g, "<br />")}</p>`
    : `<p style="margin:0 0 8px;font-size:14px;color:#94a3b8;">No additional details.</p>`;
  const contact = input.reporterEmail
    ? `<p style="margin:0;font-size:13px;color:#475569;">Reporter contact: <a href="mailto:${escapeHtml(input.reporterEmail)}" style="color:#8d5c35;">${escapeHtml(input.reporterEmail)}</a></p>`
    : `<p style="margin:0;font-size:13px;color:#94a3b8;">The reporter did not leave a contact email.</p>`;

  return `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:24px;background:#faf8f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e7e5e4;border-radius:16px;overflow:hidden;">
      <tr>
        <td style="background:#0f2438;padding:20px 24px;">
          <p style="margin:0;color:#ffffff;font-size:15px;font-weight:600;">${SITE.name}</p>
          <p style="margin:4px 0 0;color:#c2d3e6;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;">Report notice</p>
        </td>
      </tr>
      <tr>
        <td style="padding:24px;">
          <p style="margin:0 0 6px;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#ab7443;">Reason</p>
          <p style="margin:0 0 18px;font-size:18px;color:#0f2438;font-weight:600;">${reason}</p>

          <p style="margin:0 0 6px;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#94a3b8;">Article</p>
          <p style="margin:0 0 16px;font-size:15px;color:#1e293b;">${title}</p>

          <p style="margin:0 0 6px;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#94a3b8;">Details</p>
          ${details}

          <p style="margin:18px 0 0;padding:14px;background:#fbf5ee;border-left:3px solid #c28c5a;font-size:13px;line-height:1.6;color:#57534e;">
            This notice does not remove the publication. The author and the
            administrator must review the content and decide whether it should be
            taken down.
          </p>

          <p style="margin:20px 0 0;">
            <a href="${articleUrl}" style="display:inline-block;background:#0f2438;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:999px;font-size:13px;font-weight:600;">Open the article</a>
          </p>

          <p style="margin:18px 0 0;">${contact}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 24px;background:#faf8f4;border-top:1px solid #e7e5e4;">
          <p style="margin:0;font-size:11px;color:#a8a29e;">${SITE.university} · ${SITE.programme}</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/**
 * Envía el aviso al autor y una copia al administrador.
 * Si falta configuración o Resend falla, el reporte YA está guardado:
 * la función solo informa de si el correo salió.
 */
export async function sendReportEmails(
  input: ReportEmailInput,
): Promise<{ sent: boolean; skippedReason?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const adminEmail = process.env.ADMIN_EMAIL;
  const from = process.env.EMAIL_FROM ?? `${SITE.name} <no-reply@example.com>`;

  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY is not set: report saved without sending emails.");
    return { sent: false, skippedReason: "missing_api_key" };
  }

  const resend = new Resend(apiKey);
  const html = buildHtml(input);
  const subject = `[Report] ${REPORT_REASON_LABELS[input.reason] ?? input.reason} · ${input.articleTitle.slice(0, 80)}`;

  const recipients: string[] = [];
  if (input.authorEmail) recipients.push(input.authorEmail);
  if (adminEmail && adminEmail.toLowerCase() !== (input.authorEmail ?? "").toLowerCase()) {
    recipients.push(adminEmail);
  }

  if (recipients.length === 0) {
    return { sent: false, skippedReason: "no_recipients" };
  }

  const results = await Promise.allSettled(
    recipients.map((to) =>
      resend.emails.send({
        from,
        to,
        subject,
        html,
        replyTo: input.reporterEmail ?? adminEmail ?? undefined,
      }),
    ),
  );

  const delivered = results.some(
    (result) => result.status === "fulfilled" && !result.value.error,
  );

  results.forEach((result, index) => {
    if (result.status === "rejected") {
      console.error(`[email] Failed to send to ${recipients[index]}:`, result.reason);
    } else if (result.value.error) {
      console.error(`[email] Resend rejected ${recipients[index]}:`, result.value.error);
    }
  });

  return { sent: delivered };
}
