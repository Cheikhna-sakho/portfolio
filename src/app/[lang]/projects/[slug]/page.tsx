import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjectDetail } from "@/components/ProjectDetail";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { hasLocale, locales, localizedPath } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getProject, getProjects, t } from "@/lib/content";

export const dynamicParams = false;
export const generateStaticParams = () => getProjects().map((project) => ({ slug: project.slug }));

export async function generateMetadata({ params }: PageProps<"/[lang]/projects/[slug]">): Promise<Metadata> {
  const { lang, slug } = await params;
  const project = getProject(slug);
  if (!hasLocale(lang) || !project) return {};
  const description = t(project.tagline, lang);
  return {
    title: t(project.title, lang),
    description,
    alternates: {
      canonical: localizedPath(lang, "projects", slug),
      languages: Object.fromEntries(locales.map((l) => [l, localizedPath(l, "projects", slug)])),
    },
    openGraph: { title: t(project.title, lang), description, type: "article" },
  };
}

export default async function ProjectPage({ params }: PageProps<"/[lang]/projects/[slug]">) {
  const { lang, slug } = await params;
  const project = getProject(slug);
  if (!hasLocale(lang) || !project) notFound();
  const dict = await getDictionary(lang);

  const projects = getProjects();
  const next = projects[(projects.findIndex((p) => p.slug === slug) + 1) % projects.length];

  return (
    <>
      <Header
        locale={lang}
        dict={dict}
        alternateHref={localizedPath(lang === "fr" ? "en" : "fr", "projects", slug)}
      />
      <main id="main">
        <ProjectDetail locale={lang} dict={dict} project={project} next={next} />
      </main>
      <Footer dict={dict} />
    </>
  );
}
