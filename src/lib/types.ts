export type Article = {
  id: string;
  title: string;
  category: string;
  abstract: string | null;
  pdf_path: string;
  pdf_size_bytes: number | null;
  like_count: number;
  report_count: number;
  created_at: string;
  author_id: string;
  author_name: string | null;
  author_avatar_url: string | null;
  author_email: string | null;
};

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  is_admin: boolean;
};

export const REPORT_REASONS = [
  {
    value: "plagiarism",
    label: "Plagiarism",
    hint: "The text reproduces someone else's work without attribution.",
  },
  {
    value: "incorrect_references",
    label: "Incorrect references",
    hint: "Citations do not follow OSCOLA or point to sources that do not exist.",
  },
  {
    value: "illegal_content",
    label: "Illegal content",
    hint: "Hate speech, personal data, defamation…",
  },
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number]["value"];

export type Report = {
  id: string;
  article_id: string;
  reporter_email: string | null;
  reason: string;
  details: string | null;
  status: string;
  created_at: string;
};

export const REPORT_REASON_LABELS: Record<string, string> = {
  plagiarism: "Plagiarism",
  incorrect_references: "Incorrect references",
  illegal_content: "Illegal content",
};
