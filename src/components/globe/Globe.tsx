"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { GlobeCity, GlobeRoute, LabelPosition } from "./scene";
import styles from "./Globe.module.css";

export type GlobeRouteView = GlobeRoute & { id: string; label: string; detail: string; href: string };

type Props = {
  label: string;
  routesLabel: string;
  cities: (GlobeCity & { name: string })[];
  routes: GlobeRouteView[];
  /** Route drawn in the static fallback image. */
  fallbackRoute: string;
};

const CYCLE_MS = 7000;

/** WebGL only where it's cheap and wanted: wide screens, capable devices, motion allowed. */
function canRun3D() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  if (!window.matchMedia("(min-width: 1000px) and (pointer: fine)").matches) return false;
  const nav = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };
  if (nav.connection?.saveData) return false;
  if ((nav.hardwareConcurrency ?? 8) < 4 || (nav.deviceMemory ?? 8) < 4) return false;
  return Boolean(document.createElement("canvas").getContext("webgl2"));
}

function readColors() {
  const style = getComputedStyle(document.documentElement);
  const read = (name: string) => style.getPropertyValue(name).trim();
  return { ink: read("--ink"), signal: read("--signal"), paper: read("--paper") };
}

type GlobeHandle = ReturnType<typeof import("./scene").createGlobe>;

export function Globe({ label, routesLabel, cities, routes, fallbackRoute }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const labelRefs = useRef(new Map<string, HTMLSpanElement>());
  const globeRef = useRef<GlobeHandle | undefined>(undefined);
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState(0);
  const [autoplay, setAutoplay] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canRun3D()) return;

    let cancelled = false;
    const cleanups: Array<() => void> = [];

    // City labels are positioned directly from the render loop, outside React.
    const placeLabels = (labels: LabelPosition[]) => {
      const shown = new Set<string>();
      for (const { code, x, y, visible } of labels) {
        const el = labelRefs.current.get(code);
        if (!el) continue;
        el.style.transform = `translate(${x}px, ${y}px)`;
        el.dataset.visible = String(visible);
        shown.add(code);
      }
      labelRefs.current.forEach((el, code) => !shown.has(code) && (el.dataset.visible = "false"));
    };

    // Wait until the page is idle so three.js never competes with first paint.
    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 300));
    idle(async () => {
      const { createGlobe } = await import("./scene");
      if (cancelled) return;
      const globe = createGlobe(canvas, {
        colors: readColors(),
        cities,
        routes,
        onLabels: placeLabels,
        onDrag: setDragging,
      });
      globeRef.current = globe;
      setReady(true);

      const visibility = new IntersectionObserver(([entry]) =>
        entry.isIntersecting && !document.hidden ? globe.play() : globe.pause(),
      );
      visibility.observe(canvas);

      const resize = new ResizeObserver(() => globe.resize());
      resize.observe(canvas);

      const onPointer = (event: PointerEvent) =>
        globe.setPointer(event.clientX / window.innerWidth - 0.5, event.clientY / window.innerHeight - 0.5);
      window.addEventListener("pointermove", onPointer, { passive: true });

      const scheme = window.matchMedia("(prefers-color-scheme: dark)");
      const onScheme = () => globe.setColors(readColors());
      scheme.addEventListener("change", onScheme);

      const onHidden = () => (document.hidden ? globe.pause() : globe.play());
      document.addEventListener("visibilitychange", onHidden);

      cleanups.push(
        () => visibility.disconnect(),
        () => resize.disconnect(),
        () => window.removeEventListener("pointermove", onPointer),
        () => scheme.removeEventListener("change", onScheme),
        () => document.removeEventListener("visibilitychange", onHidden),
      );
    });

    return () => {
      cancelled = true;
      cleanups.forEach((cleanup) => cleanup());
      globeRef.current?.dispose();
      globeRef.current = undefined;
    };
  }, [cities, routes]);

  useEffect(() => {
    globeRef.current?.setRoute(active);
  }, [active]);

  // Routes cycle on their own until the visitor picks one (or is hovering them).
  useEffect(() => {
    if (!ready || !autoplay || hovered || dragging) return;
    const timer = window.setTimeout(() => setActive((i) => (i + 1) % routes.length), CYCLE_MS);
    return () => window.clearTimeout(timer);
  }, [ready, autoplay, hovered, dragging, active, routes.length]);

  const shown = ready ? routes[active] : (routes.find((route) => route.id === fallbackRoute) ?? routes[0]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.globe} data-ready={ready} role="img" aria-label={label}>
        {/* eslint-disable-next-line @next/next/no-img-element -- static SVG, no optimisation needed */}
        <img
          src="/globe.svg"
          alt=""
          className={styles.fallback}
          width={400}
          height={400}
          fetchPriority="low"
        />
        <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
        <div className={styles.labels} aria-hidden="true">
          {cities.map((city) => (
            <span
              key={city.code}
              ref={(el) => {
                if (el) labelRefs.current.set(city.code, el);
                else labelRefs.current.delete(city.code);
              }}
              className={`mono ${styles.city}`}
              data-visible="false"
            >
              {city.name}
            </span>
          ))}
        </div>
      </div>

      <div
        className={styles.legend}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        onFocus={() => setHovered(true)}
        onBlur={() => setHovered(false)}
      >
        {ready && (
          <div className={styles.tabs} role="group" aria-label={routesLabel}>
            {routes.map((route, i) => (
              <button
                key={route.id}
                type="button"
                className={`mono ${styles.tab}`}
                aria-pressed={i === active}
                onClick={() => {
                  setActive(i);
                  setAutoplay(false);
                }}
              >
                <span>{String(i + 1).padStart(2, "0")}</span>
                {route.label}
              </button>
            ))}
            {autoplay && !hovered && !dragging && (
              <span key={active} className={styles.timer} style={{ animationDuration: `${CYCLE_MS}ms` }} />
            )}
          </div>
        )}
        <p className={styles.caption} aria-live="polite">
          <Link href={shown.href} className={styles.captionLink}>
            <strong>{shown.label}</strong> · {shown.detail} <span aria-hidden="true">→</span>
          </Link>
        </p>
      </div>
    </div>
  );
}
