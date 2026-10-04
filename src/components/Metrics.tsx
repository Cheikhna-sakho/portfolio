import type { Locale } from "@/i18n/config";
import { t, type Project } from "@/lib/content";
import styles from "./Metrics.module.css";

type Props = { locale: Locale; metrics: Project["metrics"]; label: string };

/** Measured numbers in a data-sheet grid: the site's "evidence over assertion" block. */
export function Metrics({ locale, metrics, label }: Props) {
  if (metrics.length === 0) return null;
  return (
    <dl className={styles.grid} aria-label={label}>
      {metrics.map((metric) => (
        <div key={t(metric.label, "en")} className={styles.cell}>
          <dt className={styles.label}>{t(metric.label, locale)}</dt>
          <dd className={`mono ${styles.value}`}>{t(metric.value, locale)}</dd>
        </div>
      ))}
    </dl>
  );
}
