"use client";

import { useEffect, useState, type CSSProperties } from "react";

const SPRITES = ["blush-1", "lavender-1", "blossom-1", "blush-2", "ivory-1", "lavender-2", "blossom-2"];
const COUNT = 20;

// Deterministic but irregular spread (low-discrepancy sequences) so render
// stays pure while no two petals share size, speed, path, or timing.
const PIECES = Array.from({ length: COUNT }, (_, i) => {
  const a = (i * 0.6180339887 + 0.13) % 1;
  const b = (i * 0.7548776662 + 0.41) % 1;
  const c = (i * 0.5698402910 + 0.77) % 1;
  return {
    sprite: SPRITES[(i * 3) % SPRITES.length],
    x: `${(4 + a * 92).toFixed(1)}vw`,
    size: `${Math.round(16 + b * 22)}px`,
    duration: `${(5.2 + c * 3.4).toFixed(2)}s`,
    delay: `${(a * 2.4 + b * 0.6).toFixed(2)}s`,
    drift: `${Math.round((b - 0.5) * 220)}px`,
    rot: `${Math.round((c - 0.5) * 520)}deg`,
    sway: `sway-${1 + (i % 3)}`,
    swayDur: `${(1.6 + b * 1.6).toFixed(2)}s`,
    opacity: (0.75 + c * 0.25).toFixed(2),
  };
});

// A brief, one-time drift of watercolor petals after a confirmed "yes".
// Removes itself when done. Hidden entirely for reduced motion (see CSS).
export function Celebration({ gentle = false }: { gentle?: boolean }) {
  const [done, setDone] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setDone(true), 11500);
    return () => window.clearTimeout(t);
  }, []);

  if (done) return null;

  return (
    <div className={`celebration ${gentle ? "gentle-petals" : ""}`} aria-hidden="true">
      {(gentle ? PIECES.slice(0, 9) : PIECES).map((p, i) => (
        <span
          key={i}
          style={
            {
              "--x": p.x,
              "--s": p.size,
              "--dur": p.duration,
              "--delay": p.delay,
              "--drift": p.drift,
              "--rot": p.rot,
              "--sway-dur": p.swayDur,
              opacity: p.opacity,
            } as CSSProperties
          }
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- tiny static art */}
          <img className={p.sway} src={`/art/petals/${p.sprite}.webp`} alt="" width={120} height={120} decoding="async" />
        </span>
      ))}
    </div>
  );
}
