import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { t, type Step } from "@/lib/content";
import { SectionHeading } from "./SectionHeading";
import styles from "./Journey.module.css";

type Props = { locale: Locale; dict: Dictionary; steps: Step[] };

export function Journey({ locale, dict, steps }: Props) {
  return (
    <section id="journey" className={`container ${styles.section}`} aria-labelledby="journey-title">
      <SectionHeading
        id="journey-title"
        kicker={dict.journey.kicker}
        title={dict.journey.title}
        intro={dict.journey.intro}
        index={2}
      />
      <div className={styles.track}>
        <span className={styles.rail} aria-hidden="true" />
        <span className={styles.fill} aria-hidden="true" />
        <ol className={styles.steps}>
          {steps.map((step) => (
            <li
              key={step.id}
              className={styles.step}
              data-kind={step.kind}
              data-reveal=""
              aria-current={step.kind === "milestone" ? "step" : undefined}
            >
              <span className={styles.node} aria-hidden="true" />
              <div className={styles.meta}>
                <span className={`mono ${styles.status}`}>{t(step.status, locale)}</span>
                <span className={`mono ${styles.period}`}>{t(step.period, locale)}</span>
              </div>
              <div className={styles.body}>
                <h3>{t(step.title, locale)}</h3>
                {(step.org || step.place) && (
                  <p className={styles.org}>
                    {[step.org, step.place && t(step.place, locale)].filter(Boolean).join(" · ")}
                  </p>
                )}
                <p className={styles.summary}>{t(step.summary, locale)}</p>
                {step.points.length > 0 && (
                  <ul className={styles.points}>
                    {step.points.map((point) => (
                      <li key={t(point, "en")}>{t(point, locale)}</li>
                    ))}
                  </ul>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
