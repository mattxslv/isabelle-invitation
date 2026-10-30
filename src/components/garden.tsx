/* eslint-disable @next/next/no-img-element -- imported animated SVG, served locally */
import Link from "next/link";
import type { CSSProperties } from "react";
import { event } from "@/content/event";
import { Icon } from "./ornaments";

const LIGHTS = [
  [8, 18, 14, -2], [89, 12, 19, -6], [5, 55, 11, -4],
  [92, 47, 13, -8], [14, 85, 17, -1], [84, 78, 12, -5],
];

export function GardenLights({ className = "" }: { className?: string }) {
  return <div className={`garden-lights ${className}`} aria-hidden="true">
    {LIGHTS.map(([left, top, size, delay], i) => <span key={i} className="garden-light sway" style={{left:`${left}%`,top:`${top}%`,width:size,animationDelay:`${delay}s`,animationDuration:`${8+i}s`} as CSSProperties}>
      <img src="/animations/sparkle.svg" width={size} height={size} alt="" loading="lazy" />
    </span>)}
  </div>;
}

export function GardenHeader({ letter = false }: { letter?: boolean }) {
  return <nav className="garden-nav" aria-label={letter ? "Invitation navigation" : "Celebration navigation"}>
    <Link className="garden-monogram" href={letter ? "/" : "#welcome"} aria-label="Isabelle's invitation">I<span aria-hidden="true">&#10023;</span></Link>
    <span className="garden-nav-date">17 NOV 2026</span>
    <div className="garden-nav-links">
      {letter ? <Link href="/">View invitation <span aria-hidden="true">&#10023;</span></Link> : <><a href="#our-day">Our day</a><a href="#details">Details</a><a className="nav-reply" href="#rsvp">RSVP</a></>}
    </div>
  </nav>;
}

export function ChapterLabel({ children }: { children: React.ReactNode }) {
  return <p className="chapter-label"><span aria-hidden="true" />{children}<span aria-hidden="true" /></p>;
}

export function DayOverview() {
  return <section id="our-day" className="day-overview" aria-labelledby="day-heading" data-reveal>
    <ChapterLabel>A day to remember</ChapterLabel>
    <h2 id="day-heading" className="heading">Two beautiful beginnings</h2>
    <div className="day-timeline">
      {[{id:"christening",icon:"font" as const,time:event.christening.time,title:"A little faith",label:"The christening"},{id:"reception",icon:"cake" as const,time:event.reception.time,title:"A whole lot of joy",label:"The celebration"}].map(item=><a key={item.id} href={`#${item.id}`} className="day-stop">
        <span className="day-icon"><Icon name={item.icon} size={30} /></span>
        <span className="day-time">{item.time.replace(/\s*(AM|PM)$/i,"")} <small>{item.time.match(/(AM|PM)$/i)?.[1]}</small></span>
        <span className="day-title">{item.title}</span>
        <span className="day-description">{item.label} <span aria-hidden="true">↗</span></span>
      </a>)}
    </div>
  </section>;
}
