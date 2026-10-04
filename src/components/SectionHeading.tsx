import type { CSSProperties } from "react";
import { SplitText } from "./SplitText";
import styles from "./SectionHeading.module.css";

type Props = { id: string; kicker: string; title: string; intro?: string; index?: number };

export function SectionHeading({ id, kicker, title, intro, index }: Props) {
  return (
    <div className={styles.heading}>
      <p className={`mono ${styles.kicker}`} data-reveal="">
        {index !== undefined && <span className={styles.index}>{String(index).padStart(2, "0")}</span>}
        {kicker}
      </p>
      <SplitText id={id} text={title} />
      {intro && (
        <p className={styles.intro} data-reveal="" style={{ "--delay": 3 } as CSSProperties}>
          {intro}
        </p>
      )}
    </div>
  );
}
