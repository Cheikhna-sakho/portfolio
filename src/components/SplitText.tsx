import type { CSSProperties, ElementType } from "react";

type Props = {
  as?: ElementType;
  text: string;
  className?: string;
  id?: string;
  /** Animate on page load (above the fold) instead of on scroll. */
  onLoad?: boolean;
};

/**
 * Heading whose words rise one by one. The full sentence stays in an
 * aria-label so screen readers read it once, not word by word.
 */
export function SplitText({ as: Tag = "h2", text, className, id, onLoad = false }: Props) {
  const words = text.split(" ");
  const reveal = onLoad ? {} : { "data-reveal": "" };
  return (
    <Tag
      id={id}
      className={`${onLoad ? "split-load" : "split"} ${className ?? ""}`}
      aria-label={text}
      {...reveal}
    >
      {words.map((word, i) => (
        <span key={i}>
          <span className="w" aria-hidden="true">
            <span style={{ "--i": i } as CSSProperties}>{word}</span>
          </span>
          {i < words.length - 1 && " "}
        </span>
      ))}
    </Tag>
  );
}
