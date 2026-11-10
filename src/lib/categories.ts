export const CATEGORIES = [
  { slug: "international-law", label: "International Law" },
  { slug: "international-human-rights-law", label: "International Human Rights Law" },
  { slug: "humanitarian-law", label: "Humanitarian Law" },
  { slug: "human-rights-and-remedies", label: "Human Rights and Remedies" },
  { slug: "human-rights-and-cultural-diversity", label: "Human Rights and Cultural Diversity" },
  { slug: "democratic-policing-and-human-rights", label: "Democratic Policing and Human Rights" },
  {
    slug: "human-rights-law-environment-and-climate-change",
    label: "Human Rights Law, the Environment and Climate Change",
  },
  { slug: "business-and-human-rights", label: "Business and Human Rights" },
  { slug: "migration-law", label: "Migration Law" },
  { slug: "european-fundamental-rights-law", label: "European Fundamental Rights Law" },
  { slug: "international-criminal-law", label: "International Criminal Law" },
  { slug: "contemporary-human-rights-issues", label: "Contemporary Human Rights Issues" },
  { slug: "human-rights-in-practice", label: "Human Rights in Practice" },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]["slug"];

const BY_SLUG = new Map(CATEGORIES.map((category) => [category.slug, category]));

export function isCategorySlug(value: string | undefined | null): value is CategorySlug {
  return !!value && BY_SLUG.has(value as CategorySlug);
}

export function categoryLabel(value: string): string {
  return BY_SLUG.get(value as CategorySlug)?.label ?? value;
}

/** Accent color per category (chips), always within the Lund palette. */
export function categoryTone(value: string): string {
  const tones = [
    "bg-navy-50 text-navy-700 ring-navy-100",
    "bg-bronze-50 text-bronze-700 ring-bronze-100",
    "bg-stone-100 text-stone-700 ring-stone-200",
  ];
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) hash = (hash * 31 + value.charCodeAt(i)) % 997;
  return tones[hash % tones.length];
}