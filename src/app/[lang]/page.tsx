import { notFound } from "next/navigation";
import { About } from "@/components/About";
import { ChapterIndicator } from "@/components/ChapterIndicator";
import { Contact } from "@/components/Contact";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Journey } from "@/components/Journey";
import { Projects } from "@/components/Projects";
import { Skills } from "@/components/Skills";
import { hasLocale, localizedPath } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getJourney, getProfile, getProjects, getSkills } from "@/lib/content";

export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const profile = getProfile();

  return (
    <>
      <Header locale={lang} dict={dict} alternateHref={localizedPath(lang === "fr" ? "en" : "fr")} />
      <main id="main">
        <Hero locale={lang} dict={dict} profile={profile} />
        <Projects locale={lang} dict={dict} projects={getProjects()} />
        <Journey locale={lang} dict={dict} steps={getJourney()} />
        <Skills locale={lang} dict={dict} groups={getSkills()} />
        <About locale={lang} dict={dict} profile={profile} />
        <Contact locale={lang} dict={dict} profile={profile} />
      </main>
      <Footer dict={dict} />
      <ChapterIndicator
        chapters={(["projects", "journey", "skills", "about", "contact"] as const).map((id) => ({
          id,
          label: dict[id].kicker,
        }))}
      />
    </>
  );
}
