import type { CSSProperties } from "react";
import { ViewTransition } from "react";
import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { localizedPath } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { t, type Project } from "@/lib/content";
import { Metrics } from "./Metrics";
import { SectionHeading } from "./SectionHeading";
import { Stack } from "./Stack";
import styles from "./Projects.module.css";

type Props = { locale: Locale; dict: Dictionary; projects: Project[] };

export function Projects({ locale, dict, projects }: Props) {
  const featured = projects.filter((p) => p.featured);
  const others = projects.filter((p) => !p.featured);

  return (
    <section id="projects" className={styles.section} aria-labelledby="projects-title">
      <div className="container">
        <SectionHeading
          id="projects-title"
          kicker={dict.projects.kicker}
          title={dict.projects.title}
          intro={dict.projects.intro}
          index={1}
        />

        <ul className={styles.featured}>
          {featured.map((project, index) => {
            const href = localizedPath(locale, "projects", project.slug);
            return (
              <li
                key={project.slug}
                className={styles.card}
                style={{ "--stack": index, "--count": featured.length } as CSSProperties}
              >
                <div className={styles.cardMain}>
                  <div className={`mono ${styles.cardMeta}`}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <span>{dict.projects.context[project.context]}</span>
                    <span>{project.year}</span>
                  </div>
                  <h3 className={styles.cardTitle}>
                    <Link href={href} className={styles.cardLink}>
                      <ViewTransition name={`project-${project.slug}`} share="project-morph" default="none">
                        <span className={styles.titleText}>{project.title}</span>
                      </ViewTransition>
                    </Link>
                  </h3>
                  <p className={styles.tagline}>{t(project.tagline, locale)}</p>
                  <p className={styles.problem}>
                    <strong>{dict.projects.problem}.</strong> {t(project.problem, locale)}
                  </p>
                  <span className={styles.more} aria-hidden="true">
                    {dict.projects.details} <span className={styles.arrow}>→</span>
                  </span>
                </div>
                <div className={styles.cardSide}>
                  <Metrics locale={locale} metrics={project.metrics} label={dict.projects.metrics} />
                  <Stack items={project.stack} label={dict.projects.stack} />
                </div>
              </li>
            );
          })}
        </ul>

        {others.length > 0 && (
          <>
            <h3 className={styles.othersTitle} data-reveal="">
              {dict.projects.others}
            </h3>
            <ul className={styles.others}>
              {others.map((project, i) => (
                <li
                  key={project.slug}
                  className={styles.other}
                  data-reveal=""
                  style={{ "--delay": i } as CSSProperties}
                >
                  <div className={`mono ${styles.cardMeta}`}>
                    <span>{dict.projects.context[project.context]}</span>
                    <span>{project.year}</span>
                  </div>
                  <h4>
                    <Link href={localizedPath(locale, "projects", project.slug)} className={styles.cardLink}>
                      {project.title}
                    </Link>
                  </h4>
                  <p>{t(project.tagline, locale)}</p>
                  <Stack items={project.stack.slice(0, 5)} label={dict.projects.stack} />
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </section>
  );
}
