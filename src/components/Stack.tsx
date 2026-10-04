import styles from "./Stack.module.css";

export function Stack({ items, label }: { items: string[]; label: string }) {
  return (
    <ul className={styles.list} aria-label={label}>
      {items.map((item) => (
        <li key={item} className="mono">
          {item}
        </li>
      ))}
    </ul>
  );
}
