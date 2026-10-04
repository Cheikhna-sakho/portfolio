import type { CSSProperties } from "react";
import styles from "./ScrollWords.module.css";

/**
 * A statement that lights up word by word as it scrolls through the viewport.
 * Pure CSS (scroll-driven animations): no JavaScript, and browsers without
 * support simply show the finished sentence.
 */
export function ScrollWords({ text, className }: { text: string; className?: string }) {
  const words = text.split(" ");
  return (
    <p className={`${styles.statement} ${className ?? ""}`}>
      {words.map((word, i) => (
        <span key={i} style={{ "--p": i / words.length } as CSSProperties}>
          {word}{" "}
        </span>
      ))}
    </p>
  );
}
