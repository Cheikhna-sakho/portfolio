import type { CSSProperties } from "react";
import Image from "next/image";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { t, type Profile } from "@/lib/content";
import { ScrollWords } from "./ScrollWords";
import { SectionHeading } from "./SectionHeading";
import styles from "./About.module.css";

type Props = { locale: Locale; dict: Dictionary; profile: Profile };

export function About({ locale, dict, profile }: Props) {
  const [statement, ...rest] = profile.about;
  return (
    <section id="about" className={`chapter ${styles.section}`} aria-labelledby="about-title">
      <div className="container">
        <SectionHeading id="about-title" kicker={dict.about.kicker} title={dict.about.title} index={4} />
        <div className={styles.layout}>
          {profile.photo && (
            <figure className={styles.photo} data-reveal="">
              <Image
                src={profile.photo.src}
                width={profile.photo.width}
                height={profile.photo.height}
                alt={t(profile.photo.alt, locale)}
                sizes="(min-width: 1000px) 340px, 62vw"
              />
              <figcaption className="mono">
                {profile.name} · {t(profile.location, locale).split(" · ")[0]}
              </figcaption>
            </figure>
          )}
          <div>
            <ScrollWords text={t(statement, locale)} className={styles.statement} />
            <div className={styles.text}>
              {rest.map((paragraph, i) => (
                <p key={i} data-reveal="" style={{ "--delay": i } as CSSProperties}>
                  {t(paragraph, locale)}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
