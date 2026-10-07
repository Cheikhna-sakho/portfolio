export const locales = ["fr", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "fr";

export const hasLocale = (value: string): value is Locale => (locales as readonly string[]).includes(value);

/**
 * Localized URL segments. The file system uses the English name
 * (app/[lang]/projects); the proxy rewrites the French one onto it.
 */
export const segments = {
  projects: { fr: "projets", en: "projects" },
} as const;

export type Segment = keyof typeof segments;

export function localizedPath(locale: Locale, segment?: Segment, slug?: string) {
  const parts: string[] = [locale];
  if (segment) parts.push(segments[segment][locale]);
  if (slug) parts.push(slug);
  return `/${parts.join("/")}`;
}

export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.cheikhnasakho.fr").replace(/\/$/, "");
