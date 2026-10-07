import type { CSSProperties } from "react";
import { ViewTransition } from "react";
import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { localizedPath } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { t, type Project } from "@/lib/content";
import { Metrics } from "./Metrics";
import { Stack } from "./Stack";
import styles from "./ProjectDetail.module.css";

type Props = { locale: Locale; dict: Dictionary; project: Project; next: Project };

const delay = (n: number) => ({ "--delay": n }) as CSSProperties;

export function ProjectDetail({ locale, dict, project, next }: Props) {
  const links = [
    { href: project.links.demo, label: dict.projects.demo, primary: true },
    { href: project.links.code, label: dict.projects.code, primary: false },
    { href: project.links.codeSecondary, label: dict.projects.codeSecondary, primary: false },
  ].filter((link): link is { href: string; label: string; primary: boolean } => Boolean(link.href));

  const slip = [
    { label: dict.projects.problem, text: t(project.problem, locale) },
    { label: dict.projects.solution, text: t(project.solution, locale) },
    { label: dict.projects.role, text: t(project.role, locale) },
  ];

  return (
    <article>
      <header className={`container ${styles.hero}`}>
        <Link href={`${localizedPath(locale)}#projects`} className={`mono fade-load ${styles.back}`}>
          <span aria-hidden="true">←</span> {dict.projects.back}
        </Link>
        <div className={`mono fade-load ${styles.meta}`} style={delay(0)}>
          <span>{dict.projects.context[project.context]}</span>
          <span>{project.year}</span>
        </div>
        <ViewTransition name={`project-${project.slug}`} share="project-morph" default="none">
          <h1 className={styles.title}>{t(project.title, locale)}</h1>
        </ViewTransition>
        <p className={`fade-load ${styles.tagline}`} style={delay(1)}>
          {t(project.tagline, locale)}
        </p>
        {(links.length > 0 || project.links.note) && (
          <div className={`fade-load ${styles.links}`} style={delay(2)}>
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener"
                className={link.primary ? styles.primary : styles.ghost}
              >
                {link.label} <span aria-hidden="true">↗</span>
              </a>
            ))}
            {project.links.note && <p className={styles.note}>{t(project.links.note, locale)}</p>}
          </div>
        )}
      </header>

      {project.metrics.length > 0 && (
        <section className={`container ${styles.block}`} aria-label={dict.projects.metrics}>
          <div data-reveal="" className={styles.metrics}>
            <Metrics locale={locale} metrics={project.metrics} label={dict.projects.metrics} />
          </div>
        </section>
      )}

      <section className={`container ${styles.block}`}>
        <ol className={styles.slip}>
          {slip.map((part, i) => (
            <li key={part.label} data-reveal="" style={delay(i)}>
              <h2 className={`mono ${styles.slipLabel}`}>
                <span>{String(i + 1).padStart(2, "0")}</span> {part.label}
              </h2>
              <p>{part.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {project.highlights.length > 0 && (
        <section className={`container ${styles.block}`} aria-labelledby="highlights">
          <h2 id="highlights" className={styles.subtitle} data-reveal="">
            {dict.projects.highlights}
          </h2>
          <ul className={styles.highlights}>
            {project.highlights.map((item, i) => (
              <li key={t(item, "en")} data-reveal="" style={delay(i)}>
                {t(item, locale)}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className={`container ${styles.block}`} aria-labelledby="stack">
        <h2 id="stack" className={styles.subtitle} data-reveal="">
          {dict.projects.stack}
        </h2>
        <div data-reveal="">
          <Stack items={project.stack} label={dict.projects.stack} />
        </div>
      </section>

      <nav className={styles.next} aria-label={dict.projects.next}>
        <Link href={localizedPath(locale, "projects", next.slug)} className={`container ${styles.nextLink}`}>
          <span className={`mono ${styles.nextLabel}`}>{dict.projects.next}</span>
          <span className={styles.nextTitle}>
            {t(next.title, locale)} <span aria-hidden="true">→</span>
          </span>
        </Link>
      </nav>
    </article>
  );
}
