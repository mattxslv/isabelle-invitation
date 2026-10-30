/* eslint-disable @next/next/no-img-element -- imported animated SVG, served locally */
import type { CSSProperties } from "react";
import { event } from "@/content/event";
import { Icon } from "./ornaments";
import { Butterfly } from "./butterfly";

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

export { GardenHeader } from "./garden-header";

export function ChapterLabel({ children }: { children: React.ReactNode }) {
  return <p className="chapter-label"><span aria-hidden="true" />{children}<span aria-hidden="true" /></p>;
}

export function DayOverview() {
  return <section id="our-day" className="day-overview" aria-labelledby="day-heading" data-reveal>
    <Butterfly tone="lavender" size={28} tilt={-12} path={3} delay={2} className="left-[2%] top-[56%]" />
    <Butterfly tone="blush" size={30} tilt={15} path={4} delay={4} className="right-[2%] top-[56%]" />
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
