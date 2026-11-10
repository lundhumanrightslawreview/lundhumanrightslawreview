/** true si el email es de un estudiante de Lund (@student.lu.se). */
export function isAllowedEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return /^[a-z0-9._%+-]+@student\.lu\.se$/i.test(email.trim());
}

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export function formatDate(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Stockholm",
  }).format(date);
}

export function formatBytes(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return "";
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function initials(name: string | null | undefined, fallback = "LU"): string {
  if (!name) return fallback;
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return fallback;
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function truncate(text: string | null | undefined, max = 220): string {
  if (!text) return "";
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length <= max ? clean : `${clean.slice(0, max - 1).trimEnd()}…`;
}

/** Nombre legible del autor a partir de su cuenta de Google. */
export function displayName(profile: { full_name?: string | null; email?: string | null } | null | undefined): string {
  if (!profile) return "Anonymous author";
  if (profile.full_name?.trim()) return profile.full_name.trim();
  if (profile.email) return profile.email.split("@")[0];
  return "Anonymous author";
}
