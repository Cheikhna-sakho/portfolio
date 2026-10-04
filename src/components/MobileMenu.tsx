"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import styles from "./Header.module.css";

type Props = { links: { href: string; label: string }[]; openLabel: string; closeLabel: string };

export function MobileMenu({ links, openLabel, closeLabel }: Props) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        className={styles.menuButton}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="visually-hidden">{open ? closeLabel : openLabel}</span>
        <span className={styles.burger} data-open={open} aria-hidden="true" />
      </button>
      <nav id={panelId} className={styles.panel} data-open={open} aria-label="Menu" hidden={!open}>
        <ol>
          {links.map((link, i) => (
            <li key={link.href} style={{ "--i": i } as React.CSSProperties}>
              <span className="mono">{String(i + 1).padStart(2, "0")}</span>
              <Link href={link.href} onClick={() => setOpen(false)}>
                {link.label}
              </Link>
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
