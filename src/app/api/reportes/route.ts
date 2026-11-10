import { NextResponse } from "next/server";
import { sendReportEmails } from "@/lib/email";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { REPORT_REASONS } from "@/lib/types";

export const runtime = "nodejs";

const VALID_REASONS = new Set<string>(REPORT_REASONS.map((reason) => reason.value));
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Rate limit simple en memoria (5 reportes/hora por IP).
 * En Vercel cada instancia tiene su propia memoria: para producción seria,
 * cambia esto por Upstash Ratelimit o una tabla con índices.
 */
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();

function rateLimited(key: string): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((timestamp) => now - timestamp < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    hits.set(key, recent);
    return true;
  }
  recent.push(now);
  hits.set(key, recent);
  return false;
}

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const payload = (body ?? {}) as Record<string, unknown>;
  const articleId = typeof payload.articleId === "string" ? payload.articleId : "";
  const reason = typeof payload.reason === "string" ? payload.reason : "";
  const details = typeof payload.details === "string" ? payload.details.trim() : "";
  const email = typeof payload.email === "string" ? payload.email.trim() : "";
  const honeypot = typeof payload.website === "string" ? payload.website : "";

  // Bot: el campo oculto solo lo rellenan los scripts.
  if (honeypot) {
    return NextResponse.json({ ok: true, emailSent: false });
  }

  if (!UUID_RE.test(articleId)) {
    return NextResponse.json({ error: "Invalid article." }, { status: 400 });
  }
  if (!VALID_REASONS.has(reason)) {
    return NextResponse.json({ error: "Please select a valid reason." }, { status: 400 });
  }
  if (details.length > 1000) {
    return NextResponse.json({ error: "The details are too long." }, { status: 400 });
  }
  if (email && !EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: "That email address does not look valid." },
      { status: 400 },
    );
  }

  const ip = clientIp(request);
  if (rateLimited(ip)) {
    return NextResponse.json(
      { error: "You have sent several reports in a row. Please try again later." },
      { status: 429 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json(
      { error: "The reporting service is not configured." },
      { status: 503 },
    );
  }

  const { data: article } = await admin
    .from("articles")
    .select("id, title, author_id, is_published")
    .eq("id", articleId)
    .maybeSingle();

  if (!article || !article.is_published) {
    return NextResponse.json({ error: "This article does not exist." }, { status: 404 });
  }

  const { error: insertError } = await admin.from("article_reports").insert({
    article_id: article.id,
    reporter_id: user?.id ?? null,
    reporter_email: email || user?.email || null,
    reason,
    details: details || null,
  });

  if (insertError) {
    console.error("[reports] Could not save the report:", insertError);
    return NextResponse.json(
      { error: "The report could not be recorded. Please try again." },
      { status: 500 },
    );
  }

  const { data: author } = await admin
    .from("profiles")
    .select("full_name, email")
    .eq("id", article.author_id)
    .maybeSingle();

  const emailResult = await sendReportEmails({
    articleId: article.id,
    articleTitle: article.title,
    authorName: author?.full_name ?? null,
    authorEmail: author?.email ?? null,
    reason,
    details: details || null,
    reporterEmail: email || user?.email || null,
    reporterIsAuthenticated: Boolean(user),
  });

  return NextResponse.json({ ok: true, emailSent: emailResult.sent });
}
