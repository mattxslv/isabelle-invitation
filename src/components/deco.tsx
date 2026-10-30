import type { CSSProperties, ReactNode } from "react";

export type ArtName = "corner" | "spray-blush" | "spray-lavender" | "garland" | "edge-blush" | "edge-lavender" | "gate";

const SIZES: Record<ArtName, [number, number]> = {
  corner: [640, 640],
  "spray-blush": [660, 500],
  "spray-lavender": [660, 500],
  garland: [1500, 460],
  "edge-blush": [360, 420],
  "edge-lavender": [360, 420],
  gate: [1000, 510],
};

function Art({ art, eager = false }: { art: ArtName; eager?: boolean }) {
  const [width, height] = SIZES[art];
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static pre-rendered art
    <img
      src={`/art/${art}.webp`}
      alt=""
      width={width}
      height={height}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      draggable={false}
    />
  );
}

// Free-floating watercolor spray (all edges fade softly).
export function Deco({ art, className = "", style, eager = false }: { art: ArtName; className?: string; style?: CSSProperties; eager?: boolean }) {
  return (
    <div className={`deco ${className}`} style={style} aria-hidden="true">
      <div className="floral-spray" data-reveal="floral"><Art art={art} eager={eager} /></div>
    </div>
  );
}

type CornerPos = "tl" | "tr" | "bl" | "br";

// Bouquet that grows in from a corner of its positioned parent. It is pinned a
// few pixels past both edges so the painted edge never shows, and sways around
// that corner instead of drifting away from it.
export function Corner({
  pos,
  width = "clamp(150px, 44vw, 22rem)",
  eager = false,
  children,
}: {
  pos: CornerPos;
  width?: string;
  eager?: boolean;
  children?: ReactNode;
}) {
  const style: CSSProperties = { width, [pos[0] === "t" ? "top" : "bottom"]: -6, [pos[1] === "l" ? "left" : "right"]: -6 };
  const flip = `${pos[1] === "r" ? "mirror-x" : ""} ${pos[0] === "b" ? "mirror-y" : ""}`;
  return (
    <div className={`deco sway sway-${pos}`} style={style} aria-hidden="true">
      <div className={`floral-corner ${flip}`} data-reveal="floral" style={{ transformOrigin: `${pos[1] === "l" ? "0%" : "100%"} ${pos[0] === "t" ? "0%" : "100%"}` }}>
        <Art art="corner" eager={eager} />
      </div>
      {children}
    </div>
  );
}

// Bouquet growing in from the left or right page edge, straddling the top of
// its section so it sits in the gap between sections, never beside text.
export function EdgeBouquet({ side, tone = "blush", children }: { side: "left" | "right"; tone?: "blush" | "lavender"; children?: ReactNode }) {
  return (
    <div className={`deco edge-bouquet sway sway-${side === "left" ? "l" : "r"}`} style={{ [side]: -6 }} aria-hidden="true">
      <div className={`bloom-${side} ${side === "right" ? "mirror-x" : ""}`} data-reveal="bloom">
        <Art art={tone === "blush" ? "edge-blush" : "edge-lavender"} />
      </div>
      {children}
    </div>
  );
}

// Full-width floral border in normal flow, so it never covers text.
export function Garland({ className = "", children }: { className?: string; children?: ReactNode }) {
  const [width, height] = SIZES.garland;
  return (
    <div className={`floral-footer relative select-none ${className}`} aria-hidden="true">
      <div className="floral-garland" data-reveal="floral">
      {/* eslint-disable-next-line @next/next/no-img-element -- static pre-rendered art */}
      <img
        src="/art/garland.webp"
        alt=""
        width={width}
        height={height}
        loading="lazy"
        decoding="async"
        draggable={false}
        className="pointer-events-none relative left-1/2 block h-auto w-[max(100%,40rem)] max-w-none -translate-x-1/2"
      />
      </div>
      {children}
    </div>
  );
}

export function Illustration({ art, className = "" }: { art: "gate"; className?: string }) {
  const [width, height] = SIZES[art];
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static pre-rendered art
    <img
      src={`/art/${art}.webp`}
      alt=""
      aria-hidden="true"
      width={width}
      height={height}
      loading="lazy"
      decoding="async"
      draggable={false}
      className={`block h-auto w-full select-none ${className}`}
    />
  );
}

// Photograph of the actual parish church (Wikimedia Commons, CC BY-SA 4.0).
export function ChurchPhoto() {
  const widths = [384, 576, 768];
  return (
    <figure className="m-0">
      <span className="block overflow-hidden rounded-[1.4rem] border-[6px] border-paper shadow-[0_24px_50px_-28px_rgb(88_69_54/0.45)]">
        <picture>
          <source type="image/avif" srcSet={widths.map((w) => `/venues/church-${w}.avif ${w}w`).join(", ")} sizes="(max-width: 480px) 88vw, 432px" />
          <img
            src="/venues/church-576.webp"
            srcSet={widths.map((w) => `/venues/church-${w}.webp ${w}w`).join(", ")}
            sizes="(max-width: 480px) 88vw, 432px"
            alt="Facade of St. Michael The Archangel Parish in San Miguel, Tarlac City"
            width={768}
            height={860}
            loading="lazy"
            decoding="async"
            className="block h-auto w-full"
          />
        </picture>
      </span>
    </figure>
  );
}
