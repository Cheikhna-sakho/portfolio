import type { CSSProperties } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { t, type Skills as SkillGroups } from "@/lib/content";
import { SectionHeading } from "./SectionHeading";
import styles from "./Skills.module.css";

type Props = { locale: Locale; dict: Dictionary; groups: SkillGroups };

export function Skills({ locale, dict, groups }: Props) {
  return (
    <section id="skills" className={`container chapter ${styles.section}`} aria-labelledby="skills-title">
      <SectionHeading id="skills-title" kicker={dict.skills.kicker} title={dict.skills.title} index={3} />
      <dl className={styles.manifest}>
        {groups.map((group, i) => (
          <div
            key={t(group.group, "en")}
            className={styles.row}
            data-reveal=""
            style={{ "--delay": i } as CSSProperties}
          >
            <dt>{t(group.group, locale)}</dt>
            <dd>
              <ul className={styles.items}>
                {group.items.map((item) => (
                  <li key={item} className="mono">
                    {item}
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
