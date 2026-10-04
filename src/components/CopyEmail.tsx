"use client";

import { useState } from "react";
import styles from "./Contact.module.css";

type Props = { email: string; label: string; done: string };

export function CopyEmail({ email, label, done }: Props) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked (permissions, insecure context); the mailto link still works.
    }
  }

  return (
    <button type="button" onClick={copy} className={styles.ghost}>
      <span aria-live="polite">{copied ? done : label}</span>
    </button>
  );
}
