"use client";

import { useEffect } from "react";

// One small controller for all scroll motion. Native scrolling is never
// intercepted; we only read positions and write transforms / CSS variables.
//
//   [data-reveal], [data-reveal-stagger]  -> gets .is-in once on screen
//   [data-parallax="0.06"]                 -> drifts at that rate vs. its parent
//   [data-scene="sticky|enter|exit"]       -> receives --p from 0 to 1
export function ScrollFx() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const reveals = document.querySelectorAll<HTMLElement>("[data-reveal], [data-reveal-stagger]");

    let revealObserver: IntersectionObserver | undefined;
    if (reduce || !("IntersectionObserver" in window)) {
      reveals.forEach((el) => el.classList.add("is-in"));
    } else {
      revealObserver = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-in");
              revealObserver?.unobserve(entry.target);
            }
          }
        },
        { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
      );
      reveals.forEach((el) => revealObserver?.observe(el));
    }

    if (reduce) return () => revealObserver?.disconnect();

    const nav = navigator as Navigator & { deviceMemory?: number };
    const lowEnd = (nav.hardwareConcurrency ?? 8) <= 2 || (nav.deviceMemory ?? 8) <= 1;
    const parallax = lowEnd ? [] : Array.from(document.querySelectorAll<HTMLElement>("[data-parallax]"));
    const scenes = Array.from(document.querySelectorAll<HTMLElement>("[data-scene]"));

    // Only update elements near the viewport.
    const live = new Set<HTMLElement>();
    const nearObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const el = entry.target as HTMLElement;
          if (entry.isIntersecting) live.add(el);
          else live.delete(el);
        }
        schedule();
      },
      { rootMargin: "25% 0px 25% 0px" },
    );
    [...parallax, ...scenes].forEach((el) => nearObserver.observe(el));

    let frame = 0;
    const clamp = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

    const update = () => {
      frame = 0;
      const vh = window.innerHeight;
      for (const el of live) {
        if (el.dataset.parallax) {
          const box = (el.parentElement ?? el).getBoundingClientRect();
          const offset = (box.top + box.height / 2 - vh / 2) * Number(el.dataset.parallax);
          el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
        }
        const mode = el.dataset.scene;
        if (mode) {
          const r = el.getBoundingClientRect();
          let p = 1;
          if (mode === "sticky") p = clamp(-r.top / Math.max(1, r.height - vh));
          else if (mode === "enter") p = clamp((vh - r.top) / (vh * 0.7));
          else if (mode === "exit") p = clamp(-r.top / Math.max(1, r.height * 0.85));
          el.style.setProperty("--p", p.toFixed(3));
        }
      }
    };

    function schedule() {
      if (!frame) frame = requestAnimationFrame(update);
    }

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    schedule();

    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      cancelAnimationFrame(frame);
      nearObserver.disconnect();
      revealObserver?.disconnect();
    };
  }, []);

  return null;
}
