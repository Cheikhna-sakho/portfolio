import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { localizedPath } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { MobileMenu } from "./MobileMenu";
import styles from "./Header.module.css";

type Props = {
  locale: Locale;
  dict: Dictionary;
  /** Same page in the other language. */
  alternateHref: string;
};

const sections = ["projects", "journey", "skills", "about", "contact"] as const;

export function Header({ locale, dict, alternateHref }: Props) {
  const home = localizedPath(locale);
  const other = locale === "fr" ? "en" : "fr";
  const links = sections.map((id) => ({ href: `${home}#${id}`, label: dict.nav[id] }));

  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        <Link href={home} className={styles.brand}>
          <span className={styles.dot} aria-hidden="true" />
          Cheikhna Sakho
        </Link>
        <nav aria-label="Navigation" className={styles.nav}>
          <ul>
            {links.map((link) => (
              <li key={link.href}>
                <Link href={link.href}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <Link href={alternateHref} hrefLang={other} lang={other} className={`mono ${styles.lang}`}>
          <span className={locale === "fr" ? styles.active : undefined}>FR</span>
          <span>/</span>
          <span className={locale === "en" ? styles.active : undefined}>EN</span>
          <span className="visually-hidden"> · {dict.nav.switchTo}</span>
        </Link>
        <MobileMenu links={links} openLabel={dict.nav.open} closeLabel={dict.nav.close} />
      </div>
    </header>
  );
}
