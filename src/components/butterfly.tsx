"use client";

import { useRef, useState, type CSSProperties } from "react";

export type ButterflyTone = "lavender" | "blush" | "ivory" | "periwinkle";

// Shared across instances: keep simultaneous flutters few for smoothness.
let active = 0;
const MAX_ACTIVE = 3;

// Decorative watercolor butterfly. Each one has its own flight path, wing
// rhythm, and entrance time so they never move in unison. Wings are two
// painted halves folded in 3D. A tap makes it flutter a short hop and settle.
export function Butterfly({
  tone = "lavender",
  size = 46,
  tilt = 0,
  path = 1,
  dur = 11,
  flap = 3.2,
  delay = 0,
  appear = 0.6,
  className = "",
  style,
}: {
  tone?: ButterflyTone;
  size?: number;
  tilt?: number;
  path?: 1 | 2 | 3 | 4;
  dur?: number;
  flap?: number;
  delay?: number;
  appear?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const hops = useRef(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [fluttering, setFluttering] = useState(false);

  const flutter = () => {
    if (fluttering || active >= MAX_ACTIVE) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    active += 1;
    hops.current += 1;
    // Deterministic short hops that stay close to home.
    const angle = hops.current * 2.399963 + tilt;
    const reach = 18 + (hops.current % 3) * 8;
    setOffset({ x: Math.round(Math.cos(angle) * reach), y: Math.round(Math.sin(angle) * reach * 0.6) - 8 });
    setFluttering(true);
    window.setTimeout(() => {
      setFluttering(false);
      active = Math.max(0, active - 1);
    }, 1300);
  };

  return (
    <span
      aria-hidden="true"
      className={`bfly ${fluttering ? "is-fluttering" : ""} ${className}`}
      onClick={flutter}
      style={
        {
          "--size": `${size}px`,
          "--tilt": `${tilt}deg`,
          "--dur": `${dur}s`,
          "--flap": `${flap}s`,
          "--delay": `${-delay}s`,
          "--appear": `${appear}s`,
          "--tx": `${offset.x}px`,
          "--ty": `${offset.y}px`,
          ...style,
        } as CSSProperties
      }
    >
      <span className={`bfly-path bfly-p${path}`}>
        <span className="bfly-body">
          {/* eslint-disable-next-line @next/next/no-img-element -- tiny static art */}
          <img className="wing wing-l" src={`/art/butterflies/${tone}-l.webp`} alt="" width={200} height={340} draggable={false} decoding="async" />
          {/* eslint-disable-next-line @next/next/no-img-element -- tiny static art */}
          <img className="wing wing-r" src={`/art/butterflies/${tone}-r.webp`} alt="" width={200} height={340} draggable={false} decoding="async" />
        </span>
      </span>
    </span>
  );
}
