"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Section = "our-day" | "details" | "rsvp";
export function GardenHeader({ letter = false }: { letter?: boolean }) {
  const [active, setActive] = useState<Section>("our-day");
  useEffect(() => {
    if (letter) return;
    let frame = 0;
    function update() {
      frame = 0;
      let current: Section = "our-day";
      for (const id of ["our-day", "details", "rsvp"] as const) {
        const section = document.getElementById(id);
        if (section && section.getBoundingClientRect().top <= window.innerHeight * 0.35) current = id;
      }
      setActive(current);
    }
    function schedule() { if (!frame) frame = requestAnimationFrame(update); }
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    schedule();
    return () => { window.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule); cancelAnimationFrame(frame); };
  }, [letter]);
  return <nav className="garden-nav" aria-label={letter ? "Invitation navigation" : "Celebration navigation"}>
    <Link className="garden-monogram" href={letter ? "/" : "#welcome"} aria-label="Isabelle's invitation">I<span aria-hidden="true">&#10023;</span></Link>
    <span className="garden-nav-date">17 NOV 2026</span>
    <div className="garden-nav-links">{letter ? <Link href="/">View invitation <span aria-hidden="true">&#8599;</span></Link> : ([ ["our-day", "Our day"], ["details", "Details"], ["rsvp", "RSVP"] ] as const).map(([id, label]) => <a key={id} href={`#${id}`} aria-current={active === id ? "location" : undefined} className={active === id ? "is-active" : ""}>{label}</a>)}</div>
  </nav>;
}
