export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://localhost:3000";

export const SITE = {
  name: "Lund Human Rights Law Review",
  shortName: "LHRLR",
  university: "Lund University",
  programme: "Master's Programme in International Human Rights Law",
  tagline: "Master's essays, in the open.",
  description:
    "A student-run academic repository from the Lund University Master's Programme in Human Rights: essays graded AB and referenced in OSCOLA.",
} as const;

export function assertSupabaseEnv(): void {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      "Incomplete configuration: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local (see .env.example).",
    );
  }
}
