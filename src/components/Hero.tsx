import type { CSSProperties } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { localizedPath } from "@/i18n/config";
import { getGlobe, t, type Profile } from "@/lib/content";
import { Globe } from "./globe/Globe";
import { SplitText } from "./SplitText";
import styles from "./Hero.module.css";

type Props = { locale: Locale; dict: Dictionary; profile: Profile };

const delay = (n: number) => ({ "--delay": n }) as CSSProperties;

export function Hero({ locale, dict, profile }: Props) {
  const globe = getGlobe();
  const cities = Object.entries(globe.cities).map(([code, city]) => ({ code, ...city }));
  const routes = globe.routes.map((route) => ({
    ...route,
    label: t(route.label, locale),
    detail: t(route.detail, locale),
    href:
      typeof route.href === "string"
        ? `${localizedPath(locale)}${route.href}`
        : localizedPath(locale, "projects", route.href.project),
  }));

  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <div className={`container ${styles.grid}`}>
        <div className={styles.copy}>
          <div className={`fade-load ${styles.label}`} style={delay(0)}>
            <dl className={styles.tracking}>
              <div>
                <dt>{dict.hero.trackingLabel}</dt>
                <dd className="mono">{profile.tracking}</dd>
              </div>
              <div>
                <dt>{dict.hero.statusLabel}</dt>
                <dd className={styles.status}>
                  <span className={styles.pulse} aria-hidden="true" />
                  {t(profile.availability.label, locale)}
                </dd>
              </div>
            </dl>
            <p className={styles.detail}>{t(profile.availability.detail, locale)}</p>
          </div>

          <p className={`mono fade-load ${styles.name}`} style={delay(1)}>
            {profile.name} · {t(profile.role, locale)}
          </p>
          <SplitText
            as="h1"
            id="hero-title"
            onLoad
            text={t(profile.headline, locale)}
            className={styles.title}
          />
          <p className={`fade-load ${styles.intro}`} style={delay(3)}>
            {t(profile.intro, locale)}
          </p>

          <div className={`fade-load ${styles.actions}`} style={delay(4)}>
            <a href="#contact" className={styles.primary}>
              {dict.hero.cta}
            </a>
            <a href={profile.cv[locale]} className={styles.secondary} download>
              {dict.hero.cv} <span aria-hidden="true">↓</span>
            </a>
          </div>
        </div>

        <div className={`fade-load ${styles.visual}`} style={delay(2)}>
          <Globe
            label={dict.hero.globe}
            routesLabel={dict.hero.routes}
            cities={cities}
            routes={routes}
            fallbackRoute="next"
          />
        </div>
      </div>

      <div className="container">
        <ul className={`fade-load ${styles.metrics}`} style={delay(6)}>
          {profile.heroMetrics.map((metric) => (
            <li key={t(metric.label, "en")}>
              <span className={`mono ${styles.value}`}>{t(metric.value, locale)}</span>
              <span className={styles.metricLabel}>{t(metric.label, locale)}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
