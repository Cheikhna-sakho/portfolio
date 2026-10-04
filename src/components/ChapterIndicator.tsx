"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./ChapterIndicator.module.css";

type Chapter = { id: string; label: string };

/**
 * Fixed tracking readout ("02 / 05 · Delivered") that follows the scroll,
 * like a parcel's live status. Purely visual: the header nav stays the
 * accessible way to move between sections.
 */
export function ChapterIndicator({ chapters }: { chapters: Chapter[] }) {
  const [active, setActive] = useState(-1);
  const barRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const sections = chapters
      .map((chapter) => document.getElementById(chapter.id))
      .filter((el): el is HTMLElement => Boolean(el));

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(sections.indexOf(entry.target as HTMLElement));
        }
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    sections.forEach((section) => observer.observe(section));

    // Leaving the first chapter upwards means we're back in the hero.
    const onScroll = () => {
      const first = sections[0];
      if (first && first.getBoundingClientRect().top > window.innerHeight * 0.5) setActive(-1);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (barRef.current) barRef.current.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, [chapters]);

  const current = chapters[active];
  return (
    <div className={styles.indicator} data-visible={active >= 0} aria-hidden="true">
      <span className="mono">
        {String(Math.max(active, 0) + 1).padStart(2, "0")} / {String(chapters.length).padStart(2, "0")}
      </span>
      <span className={styles.label}>{current?.label}</span>
      <span className={styles.track}>
        <span ref={barRef} className={styles.bar} />
      </span>
    </div>
  );
}
