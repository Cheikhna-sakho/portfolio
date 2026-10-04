import type { Dictionary } from "@/i18n/dictionaries";
import styles from "./Footer.module.css";

export function Footer({ dict }: { dict: Dictionary }) {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <p>© {new Date().getFullYear()} Cheikhna Sakho</p>
        <p>{dict.footer.built}</p>
      </div>
    </footer>
  );
}
