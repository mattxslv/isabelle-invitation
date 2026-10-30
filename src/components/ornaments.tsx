import type React from "react";
import type { SVGProps } from "react";

// Gold line icons, drawn on a 24px grid.
const PATHS = {
  cross: "M12 3v18M7.5 8h9",
  font: "M5 10h14M6 10c0 4 2.6 6 6 6s6-2 6-6M12 16v3.5M8.5 21h7",
  cake: "M4 21h16M5 21v-6h14v6M5 15.5c1.2 1 2.3 1 3.5 0s2.3-1 3.5 0 2.3 1 3.5 0 2.3-1 3.5 0M7 15v-3.5h10V15M12 11.5V9",
  pin: "M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0C18.5 15.4 12 21 12 21zM12 12.3a2.3 2.3 0 1 0 0-4.6 2.3 2.3 0 0 0 0 4.6z",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3.2 2",
  dress: "M9.2 3 8.4 7l2.3 2.6L6 20.5h12L13.3 9.6 15.6 7l-.8-4M9.2 3c1.3 1.1 4.3 1.1 5.6 0",
  gift: "M4 11h16v10H4zM3 7.5h18V11H3zM12 7.5V21M12 7.5C10.6 4.6 7 4 7 6.2 7 7.4 9.4 7.5 12 7.5zM12 7.5c1.4-2.9 5-3.5 5-1.3 0 1.2-2.4 1.3-5 1.3z",
  envelope: "M3.5 6.5h17v11.5h-17zM4 7.2l8 6.3 8-6.3",
  bottle: "M10 3h4M10.6 3v3M13.4 3v3M9 6h6l1.2 3.2V20a1 1 0 0 1-1 1H8.8a1 1 0 0 1-1-1V9.2zM8 12.5h8.2M12 15.2c-.8 1-1.2 1.6-1.2 2.1a1.2 1.2 0 0 0 2.4 0c0-.5-.4-1.1-1.2-2.1z",
  diaper: "M3 7.5h18v2.8c0 5.7-4.5 8.7-9 8.7s-9-3-9-8.7zM3 10.3c3 0 5 2 6 5M21 10.3c-3 0-5 2-6 5",
  shirt: "M8.3 4 3.2 7l2 4 2.8-1.1V20h8V9.9l2.8 1.1 2-4L15.7 4c-.5 1.5-1.9 2.5-3.7 2.5S8.8 5.5 8.3 4z",
  heart: "M12 20s-7.2-4.5-7.2-10.2A4.1 4.1 0 0 1 12 7.2a4.1 4.1 0 0 1 7.2 2.6C19.2 15.5 12 20 12 20z",
  noKiss: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM5.6 5.6l12.8 12.8M7.6 12.4c1.5-1.6 2.8-1.6 4.4-.6 1.6-1 2.9-1 4.4.6-1.4 1.8-2.9 2.6-4.4 2.6s-3-.8-4.4-2.6z",
  sanitize: "M10 3h3.2l1.8 1M11.6 3v3M9.2 6h4.8v2M8.2 8h6.6a1.2 1.2 0 0 1 1.2 1.2v10.6a1.2 1.2 0 0 1-1.2 1.2H8.2A1.2 1.2 0 0 1 7 19.8V9.2A1.2 1.2 0 0 1 8.2 8zM10 14.5h3M11.5 13v3",
  noSmoke: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM5.6 5.6l12.8 12.8M5.5 12.5h9v2.8h-9zM16 12.5v2.8M18 12.5v2.8M16 10.5c0-1.4 1.6-1.4 1.6-2.8",
  mask: "M4 9.5c3-1.2 5.2-2 8-2s5 .8 8 2v3.8c0 3-4 5.2-8 5.2s-8-2.2-8-5.2zM4 10.5H2.5M20 10.5h1.5M8 11.5h8M8 14.5h8",
  send: "M20.5 3.5 10 14M20.5 3.5l-6.7 17-3.8-6.5-6.5-3.8z",
  check: "M5 12.5l4.2 4.2L19 7",
  bow: "M12 10c-2.2-3-6.3-4-7.3-1.8-.9 2 1.5 3.8 7.3 1.8zM12 10c2.2-3 6.3-4 7.3-1.8.9 2-1.5 3.8-7.3 1.8zM12 10l-3.2 9M12 10l3.2 9M12 11.3a1.3 1.3 0 1 0 0-2.6 1.3 1.3 0 0 0 0 2.6z",
  close: "M6 6l12 12M18 6 6 18",
  ban: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM5.6 5.6l12.8 12.8",
  external: "M14 4h6v6M20 4l-8.5 8.5M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5",
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({
  name,
  size = 24,
  strokeWidth = 1.4,
  ...props
}: { name: IconName; size?: number; strokeWidth?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path d={PATHS[name]} />
      {(name === "font" || name === "cake") && <>
        <image href="/animations/flame.png" x={8.5} y={name === "font" ? 0.5 : 0} width={7} height={9} className="flame-loop" />
        <path className="flame-still" d="M12 2c-1 1.6-1.7 2.5-1.7 3.3a1.7 1.7 0 0 0 3.4 0C13.7 4.5 13 3.6 12 2Z" />
      </>}
    </svg>
  );
}

// A small gold sprig with a heart, used between blocks.
export function Flourish({
  className = "",
  width = 150,
  style,
}: {
  className?: string;
  width?: number;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 160 22"
      width={width}
      height={(width * 22) / 160}
      className={className}
      style={style}
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="var(--color-gold)"
      strokeWidth="1.1"
      strokeLinecap="round"
    >
      <path d="M8 11h52M100 11h52" opacity="0.7" />
      <path d="M60 11c-6-5-12-5-16-1M60 11c-6 5-12 5-16 1M100 11c6-5 12-5 16-1M100 11c6 5 12 5 16 1" />
      <path d="M36 11c-3-3.5-7-3.5-9-.5M124 11c3-3.5 7-3.5 9-.5" opacity="0.8" />
      <path
        d="M80 16.5s-6-3.8-6-8.2a3.3 3.3 0 0 1 6-2 3.3 3.3 0 0 1 6 2c0 4.4-6 8.2-6 8.2z"
        fill="var(--color-blush)"
        stroke="var(--color-gold)"
      />
      <circle cx="68" cy="11" r="1.4" fill="var(--color-gold)" stroke="none" />
      <circle cx="92" cy="11" r="1.4" fill="var(--color-gold)" stroke="none" />
    </svg>
  );
}

// A gold leafy sprig; mirrored on the right of a centered icon.
function Sprig({ flip = false }: { flip?: boolean }) {
  return (
    <span className={`sprig ${flip ? "sprig-r" : "sprig-l"}`}>
    <svg
      viewBox="0 0 72 20"
      width="72"
      height="20"
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="var(--color-gold)"
      strokeWidth="1.1"
      strokeLinecap="round"
      style={flip ? { transform: "scaleX(-1)" } : undefined}
    >
      <path d="M4 11c14-1 34-1 62-1" opacity="0.75" />
      <path d="M50 10c-3-5-8-6-11-5 3 3 6 5 11 5zM36 10c-3 4-8 6-11 5 2-3 6-5 11-5zM22 10.5c-3-4-7-5-10-4 3 3 6 4 10 4z" fill="var(--color-sage)" />
      <circle cx="3" cy="11" r="1.6" fill="var(--color-gold)" stroke="none" />
    </svg>
    </span>
  );
}

export function IconSprigs({ icon, size = 34 }: { icon: IconName; size?: number }) {
  return (
    <div className="flex items-center justify-center gap-2 text-gold" aria-hidden="true">
      <Sprig />
      <span className="section-emblem"><Icon name={icon} size={size} strokeWidth={1.3} /></span>
      <Sprig flip />
    </div>
  );
}

export function HeartRule({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-3 ${className}`} aria-hidden="true">
      <span className="h-px w-14 bg-gradient-to-r from-transparent to-gold/60" />
      <Icon name="heart" size={16} className="text-gold" />
      <span className="h-px w-14 bg-gradient-to-l from-transparent to-gold/60" />
    </div>
  );
}

// Ornate gold oval frame drawn over the portrait.
export function GoldFrame({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 500" className={className} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="gold-frame" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8a6a44" />
          <stop offset="0.28" stopColor="#d9bd8c" />
          <stop offset="0.5" stopColor="#a78256" />
          <stop offset="0.72" stopColor="#e6cfa1" />
          <stop offset="1" stopColor="#8a6a44" />
        </linearGradient>
      </defs>
      <ellipse cx="200" cy="250" rx="186" ry="236" fill="none" stroke="url(#gold-frame)" strokeWidth="7" />
      <ellipse cx="200" cy="250" rx="176" ry="226" fill="none" stroke="url(#gold-frame)" strokeWidth="1.6" />
      <ellipse
        cx="200"
        cy="250"
        rx="194"
        ry="244"
        fill="none"
        stroke="#c9a874"
        strokeWidth="3.2"
        strokeDasharray="0 11"
        strokeLinecap="round"
      />
      {/* crest */}
      <g fill="none" stroke="url(#gold-frame)" strokeWidth="2.6" strokeLinecap="round">
        <path d="M200 26c-10-12-30-12-34 0-3 9 8 14 14 8M200 26c10-12 30-12 34 0 3 9-8 14-14 8" />
        <path d="M168 18c-14-2-24 4-28 12M232 18c14-2 24 4 28 12" />
      </g>
      <path
        d="M200 30s-10-6.5-10-13.5a5.5 5.5 0 0 1 10-3.2 5.5 5.5 0 0 1 10 3.2c0 7-10 13.5-10 13.5z"
        fill="#f6dfe4"
        stroke="url(#gold-frame)"
        strokeWidth="2.2"
      />
      {/* base flourish */}
      <g fill="none" stroke="url(#gold-frame)" strokeWidth="2.4" strokeLinecap="round">
        <path d="M200 478c-8 8-22 10-30 4M200 478c8 8 22 10 30 4" />
        <path d="M182 490c8-4 28-4 36 0" />
      </g>
      <circle cx="200" cy="482" r="4.5" fill="url(#gold-frame)" />
    </svg>
  );
}

export function WaxSeal({ letter = "I" }: { letter?: string }) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false" style={{ width: "100%", height: "100%" }}>
      <defs>
        <radialGradient id="wax" cx="40%" cy="35%" r="70%">
          <stop offset="0" stopColor="#e9cf98" />
          <stop offset="0.55" stopColor="#c09a5f" />
          <stop offset="1" stopColor="#8e6c3f" />
        </radialGradient>
      </defs>
      <path
        d="M50 4c8 0 10 5 17 7s12 0 16 7 0 11 3 18 8 9 8 14-5 8-8 14 1 11-3 18-9 5-16 7-9 7-17 7-10-5-17-7-12 0-16-7 0-11-3-18S2 56 2 50s5-8 8-14-1-11 3-18 9-5 16-7S42 4 50 4z"
        fill="url(#wax)"
      />
      <circle cx="50" cy="50" r="30" fill="none" stroke="#f3dfb4" strokeOpacity="0.55" strokeWidth="2" />
      <circle cx="50" cy="50" r="25" fill="none" stroke="#7e5f3c" strokeOpacity="0.35" strokeWidth="1.2" />
      <text
        x="50"
        y="63"
        textAnchor="middle"
        fontFamily="var(--font-cormorant), Georgia, serif"
        fontStyle="italic"
        fontWeight="600"
        fontSize="40"
        fill="#7e5f3c"
        fillOpacity="0.85"
      >
        {letter}
      </text>
    </svg>
  );
}
