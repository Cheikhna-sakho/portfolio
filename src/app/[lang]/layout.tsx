import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { notFound } from "next/navigation";
import { hasLocale, locales, localizedPath, siteUrl } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { Motion } from "@/components/Motion";
import "../globals.css";

// Self-hosted (OFL) so builds never depend on a font CDN.
const inter = localFont({
  src: "../../fonts/inter-latin-wght-normal.woff2",
  variable: "--font-inter",
  weight: "100 900",
  display: "swap",
});
const grotesk = localFont({
  src: "../../fonts/space-grotesk-latin-wght-normal.woff2",
  variable: "--font-grotesk",
  weight: "300 700",
  display: "swap",
});
const plexMono = localFont({
  src: [
    { path: "../../fonts/ibm-plex-mono-latin-400-normal.woff2", weight: "400" },
    { path: "../../fonts/ibm-plex-mono-latin-500-normal.woff2", weight: "500" },
  ],
  variable: "--font-plex-mono",
  display: "swap",
});

export const generateStaticParams = () => locales.map((lang) => ({ lang }));
export const dynamicParams = false;

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3eee4" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1626" },
  ],
};

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = await getDictionary(lang);
  return {
    metadataBase: new URL(siteUrl),
    title: { default: dict.meta.title, template: `%s · Cheikhna Sakho` },
    description: dict.meta.description,
    authors: [{ name: "Cheikhna Sakho" }],
    alternates: {
      canonical: localizedPath(lang),
      languages: Object.fromEntries(locales.map((l) => [l, localizedPath(l)])),
    },
    openGraph: {
      type: "website",
      siteName: "Cheikhna Sakho",
      locale: lang === "fr" ? "fr_FR" : "en_US",
      title: dict.meta.title,
      description: dict.meta.description,
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function LangLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);

  return (
    <html lang={lang} className={`${inter.variable} ${grotesk.variable} ${plexMono.variable}`}>
      <body>
        <a className="skip-link" href="#main">
          {dict.nav.skip}
        </a>
        {children}
        <Motion />
      </body>
    </html>
  );
}
