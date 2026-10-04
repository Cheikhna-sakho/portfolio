"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import type Lenis from "lenis";

/**
 * Site-wide motion: smooth scrolling (Lenis) and scroll reveals for any
 * [data-reveal] element. Does nothing when the user prefers reduced motion.
 */
export function Motion() {
  const lenisRef = useRef<Lenis | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const root = document.documentElement;
    root.dataset.motion = "on";

    // Smooth scrolling only with a mouse or trackpad: touch scrolling is already
    // native-smooth, so phones never download Lenis.
    let cancelled = false;
    if (window.matchMedia("(pointer: fine)").matches) {
      import("lenis").then(({ default: Lenis }) => {
        if (cancelled) return;
        lenisRef.current = new Lenis({ autoRaf: true, anchors: true, lerp: 0.11 });
      });
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          (entry.target as HTMLElement).dataset.inview = "";
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    const observeAll = () =>
      document.querySelectorAll("[data-reveal]:not([data-inview])").forEach((el) => observer.observe(el));
    observeAll();

    // Client navigations swap page content: pick up the new elements.
    const mutations = new MutationObserver(observeAll);
    mutations.observe(document.body, { childList: true, subtree: true });

    return () => {
      delete root.dataset.motion;
      cancelled = true;
      lenisRef.current?.destroy();
      lenisRef.current = null;
      observer.disconnect();
      mutations.disconnect();
    };
  }, []);

  // Lenis keeps its own scroll position: re-sync it after each route change,
  // landing on the hash target when there is one (e.g. /fr#projects).
  // Lenis already honours the CSS scroll-padding-top, so no offset here.
  useEffect(() => {
    const lenis = lenisRef.current;
    if (!lenis) return;
    lenis.resize();
    const target = window.location.hash ? document.querySelector(window.location.hash) : null;
    lenis.scrollTo(target instanceof HTMLElement ? target : 0, { immediate: true });
  }, [pathname]);

  return null;
}
