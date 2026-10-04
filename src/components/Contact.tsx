import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Profile } from "@/lib/content";
import { CopyEmail } from "./CopyEmail";
import { SectionHeading } from "./SectionHeading";
import styles from "./Contact.module.css";

type Props = { locale: Locale; dict: Dictionary; profile: Profile };

export function Contact({ locale, dict, profile }: Props) {
  const links = [
    { label: "GitHub", href: profile.links.github },
    { label: "LinkedIn", href: profile.links.linkedin },
  ].filter((link): link is { label: string; href: string } => Boolean(link.href));

  return (
    <section id="contact" className={`chapter ${styles.section}`} aria-labelledby="contact-title">
      <div className={styles.marquee} aria-hidden="true">
        <div className={styles.track}>
          {[0, 1].map((copy) => (
            <span key={copy}>{Array.from({ length: 3 }, () => `${dict.contact.marquee} ✦ `).join("")}</span>
          ))}
        </div>
      </div>
      <div className="container">
        <SectionHeading
          id="contact-title"
          kicker={dict.contact.kicker}
          title={dict.contact.title}
          intro={dict.contact.intro}
          index={5}
        />
        <div className={styles.slip} data-reveal="">
          <a href={`mailto:${profile.email}`} className={`mono ${styles.email}`}>
            {profile.email}
          </a>
          <div className={styles.actions}>
            <a href={`mailto:${profile.email}`} className={styles.primary}>
              {dict.contact.email}
            </a>
            <CopyEmail email={profile.email} label={dict.contact.copy} done={dict.contact.copied} />
            <a href={profile.cv[locale]} className={styles.ghost} download>
              {dict.contact.cv} <span aria-hidden="true">↓</span>
            </a>
          </div>
          <ul className={styles.links}>
            {links.map((link) => (
              <li key={link.label}>
                <a href={link.href} rel="me noopener" target="_blank">
                  {link.label} <span aria-hidden="true">↗</span>
                </a>
              </li>
            ))}
            {profile.showPhone && profile.phone && (
              <li>
                <a href={`tel:${profile.phone.replace(/\s/g, "")}`}>
                  {dict.contact.phone} · {profile.phone}
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>
    </section>
  );
}
