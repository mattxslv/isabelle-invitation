/* eslint-disable @next/next/no-img-element -- local animated SVG assets */
"use client";

import { useEffect, useRef, useState } from "react";
import { godparents } from "@/content/event";
import { Corner } from "./deco";
import { Butterfly } from "./butterfly";
import { HeartRule, WaxSeal } from "./ornaments";

export function Envelope({ greeting }: { greeting: string }) {
  const [opened, setOpened] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  function open() {
    if (opened) return;
    setOpened(true);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    timer.current = setTimeout(() => {
      const letter = document.getElementById("godparent-letter");
      letter?.scrollIntoView({ behavior: reduce ? "instant" : "smooth", block: "start" });
      const heading = document.getElementById("letter-heading");
      heading?.focus({ preventScroll: true });
    }, reduce ? 0 : 1700);
  }
  return (
    <section className={`gp-scene tap-envelope ${opened ? "is-open" : ""}`} aria-label="A little letter for you">
      <div className="gp-sticky">
        <Corner pos="tl" eager width="clamp(110px, 30vw, 18rem)" />
        <Butterfly tone="lavender" size={36} className="left-[12%] bottom-[15%]" />
        <Butterfly tone="blush" size={36} className="right-[12%] bottom-[20%]" />
        <div className="gp-intro px-6">
          <p className="script gold-text text-[clamp(2.6rem,11vw,3.4rem)] leading-[1.2]">{godparents.eyebrow}</p>
          <p className="eyebrow mt-3">For my {greeting}</p>
        </div>
        <button type="button" className="envelope" onClick={open} aria-label="Open your letter from Isabelle" aria-expanded={opened} aria-controls="godparent-letter">
          <span className="env-back" />
          <span className="env-flap-open" />
          <span className="env-letter"><span className="px-4"><span className="script gold-text block text-[clamp(2rem,9vw,2.6rem)] leading-[1.15]">{godparents.envelopeTitle}</span><HeartRule className="mt-2" /></span></span>
          <span className="env-front" />
          <span className="env-flap" />
          <span className="env-seal"><WaxSeal letter="I" /></span>
        </button>
        <p className="envelope-hint"><img src="/animations/bell.svg" width={24} height={24} alt="" />{opened ? "A little love, just for you…" : "Tap the seal to open your letter"}</p>
      </div>
    </section>
  );
}
