/* eslint-disable @next/next/no-img-element -- photos are optimized at build time */
import type { CSSProperties, ReactNode } from "react";
import { event } from "@/content/event";
import { calendarUrl } from "@/content/calendar";
import { Butterfly } from "@/components/butterfly";
import { Countdown } from "@/components/countdown";
import { ChurchPhoto, Corner, Deco, EdgeBouquet, Garland } from "@/components/deco";
import { Lightbox } from "@/components/lightbox";
import { Flourish, GoldFrame, HeartRule, Icon, IconSprigs, type IconName } from "@/components/ornaments";
import { fullPhoto, Photo } from "@/components/photo";
import { RsvpForm } from "@/components/rsvp-form";
import { ChapterLabel, DayOverview, GardenHeader, GardenLights } from "@/components/garden";
import { ScrollFx } from "@/components/scroll-fx";
import { StartupLogo } from "@/components/startup-logo";

const delay = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

export default function InvitationPage() {
  return (
    <main className="garden-page relative">
      <StartupLogo />
      <ScrollFx />
      <GardenHeader />
      <Hero />
      <DayOverview />
      <div className="event-chapters">
        <Christening />
        <Reception />
      </div>
      <Details />
      <Rsvp />
    </main>
  );
}

/* ------------------------------------------------------------------ hero */

function Hero() {
  const c = event.celebrant;
  return (
    <section id="welcome" className="garden-hero relative overflow-hidden pb-14 pt-[6.75rem] sm:pt-32" data-scene="exit" aria-labelledby="hero-name">
      <GardenLights />
      <Corner pos="tl" eager width="clamp(150px, 44vw, 24rem)">
        <Butterfly tone="lavender" size={44} tilt={-12} path={1} dur={12} flap={3.4} appear={1.2} className="left-[90%] top-[4%]" />
      </Corner>
      <Corner pos="tr" eager width="clamp(140px, 40vw, 21rem)">
        <Butterfly tone="blush" size={38} tilt={14} path={2} dur={10} flap={2.8} delay={1.5} appear={2.1} className="right-[96%] top-[24%]" />
      </Corner>

      <div className="hero-composition layer mx-auto px-6 text-center">
        <div className="hero-portrait-group">
        <p className="invited-pill eyebrow enter" style={delay(150)}>
          You&rsquo;re Invited
        </p>
        <HeartRule className="enter mt-2" />

        <div className="enter relative mx-auto mt-7 w-fit" style={delay(300)}>
          <div className="scene-exit relative">
            <Deco art="spray-blush" eager className="spray-drift-l -bottom-[14%] -left-[38%] w-[95%] -rotate-12" />
            <Deco art="spray-lavender" eager className="spray-drift-r -right-[38%] -top-[10%] w-[85%] rotate-[168deg]" />
            <Butterfly tone="periwinkle" size={36} tilt={-20} path={3} dur={13} flap={3.8} delay={3} appear={3.4} className="-left-[9%] bottom-[26%]" />
            <Lightbox
              full={fullPhoto("hero")}
              alt={`Portrait of ${c.shortName} in a white dress and bow`}
              label={`Enlarge ${c.shortName}'s portrait`}
              className="layer"
              oval
            >
              <span className="portrait garden-portrait block">
                <span className="portrait-photo block">
                  <Photo id="hero" alt={`Portrait of ${c.shortName} in a white dress and bow`} sizes="(max-width: 480px) 74vw, 312px" priority />
                </span>
                <GoldFrame className="portrait-frame" />
              </span>
            </Lightbox>
            <Butterfly tone="lavender" size={42} tilt={18} path={2} dur={14} delay={2} appear={0.7} className="bfly-front -right-[5%] top-[9%]" />
            <Butterfly tone="blush" size={34} tilt={-16} path={4} dur={12} delay={4} appear={1.1} className="bfly-front -left-[3%] bottom-[10%]" />
          </div>
        </div>

        <p className="photo-whisper">A little smile, a lifetime of love</p>
        </div>
        <div className="hero-copy">
        <h1 id="hero-name" className="enter relative mt-7" style={delay(500)}>
          <Butterfly tone="ivory" size={28} tilt={16} path={1} dur={15} appear={1.4} className="bfly-front -right-1 -top-1" />
          <span className="script gold-text block px-2 pb-2 pt-1 text-[clamp(2.75rem,14.6vw,4.6rem)] leading-[1.15]">
            {c.displayFirst}
          </span>
          <span className="caps block text-[1.3rem] tracking-[0.3em] text-gold-ink">{c.displayLast}</span>
        </h1>

        <p className="celebration-title caps enter mx-auto mt-4 max-w-[17rem] text-[1.05rem] leading-snug text-ink" style={delay(620)}>
          {event.title}
        </p>

        <p className="enter mt-5" style={delay(720)}>
          <span className="flex items-center justify-center gap-3">
            <span className="h-px w-10 flex-none bg-gold/60" aria-hidden="true" />
            <span className="eyebrow !tracking-[0.28em]">{event.weekday}</span>
            <span className="h-px w-10 flex-none bg-gold/60" aria-hidden="true" />
          </span>
          <span className="sr-only">, </span>
          <span className="mt-1 block font-display text-[1.75rem] font-medium leading-tight">{event.dateLong}</span>
        </p>

        <Flourish className="enter mx-auto mt-4" style={delay(800)} />

        <div className="enter mt-5" style={delay(880)}>
          <Countdown />
        </div>

        <p
          className="enter mx-auto mt-10 max-w-[18rem] text-balance font-display text-[1.65rem] italic leading-snug text-ink"
          style={delay(980)}
        >
          {event.tagline}
        </p>
        <HeartRule className="enter mt-4" />
        <div className="hero-actions enter" style={delay(1050)}><a href="#rsvp" className="btn btn-primary"><Icon name="envelope" size={19} />Join the celebration</a><a className="btn btn-ghost calendar-link" href={calendarUrl} target="_blank" rel="noopener noreferrer" aria-label="Save the date in Google Calendar"><Icon name="heart" size={18} />Save the date</a></div>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- shared */

function SectionIntro({ icon, id, heading, text }: { icon: IconName; id: string; heading: string; text: string }) {
  return (
    <div data-reveal-stagger className="text-center">
      <ChapterLabel>{id === "christening-heading" ? "01 · A little faith" : id === "reception-heading" ? "02 · A little magic" : "With love, from our family"}</ChapterLabel>
      <IconSprigs icon={icon} />
      <h2 id={id} className="heading mt-3">
        {heading}
      </h2>
      <p className="prose-soft mx-auto mt-4 max-w-[26rem]">{text}</p>
    </div>
  );
}

function VenueCard({
  icon,
  label,
  time,
  venue,
  address,
  mapUrl,
}: {
  icon: IconName;
  label: string;
  time: string;
  venue: string;
  address: string;
  mapUrl: string;
}) {
  return (
    <div className="card venue-card relative z-[1] px-6 pb-6 pt-5 text-center" data-reveal="zoom">
      <Butterfly tone={icon === "font" ? "lavender" : "blush"} size={30} tilt={12} path={3} delay={2} className="bfly-front -right-1 -top-3" />
      <Icon name={icon} size={30} strokeWidth={1.3} className="mx-auto text-gold" />
      <p className="eyebrow mt-2 !text-[0.85rem]">{label}</p>
      <p className="venue-time mt-2 font-display font-medium leading-tight"><span>{time.replace(/\s*(AM|PM)$/i, "")}</span>{" "}<span className="venue-period">{time.match(/(AM|PM)$/i)?.[1]}</span></p>
      <p className="mt-1 font-display text-[1.4rem] font-semibold leading-tight">{venue}</p>
      <p className="prose-soft mt-1">{address}</p>
      <a
        className="btn btn-primary mt-5 w-full"
        href={mapUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Get directions to ${venue} (opens Google Maps)`}
      >
        <Icon name="pin" size={20} />
        Get Directions
      </a>
    </div>
  );
}

function Column({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`layer mx-auto max-w-[30rem] px-6 ${className}`}>{children}</div>;
}

/* ------------------------------------------------------------ christening */

function Christening() {
  const c = event.christening;
  return (
    <section id="christening" className="garden-chapter relative pb-14 pt-20" aria-labelledby="christening-heading">
      <GardenLights />
      <Butterfly tone="ivory" size={30} tilt={12} path={2} delay={3} className="right-[6%] top-2" />
      <EdgeBouquet side="left" tone="lavender">
        <Butterfly tone="periwinkle" size={36} tilt={-10} path={4} dur={11} flap={3} delay={2} appear={0.8} className="left-[78%] -top-[2%]" />
      </EdgeBouquet>
      <Column>
        <SectionIntro icon="cross" id="christening-heading" heading={c.heading} text={c.text} />
        <div data-scene="enter" className="mt-7">
          <div className="scene-rise">
            <div data-reveal="unveil">
              <ChurchPhoto />
            </div>
          </div>
        </div>
        <div className="mt-6">
          <VenueCard icon="font" label={c.label} time={c.time} venue={c.venue} address={c.address} mapUrl={c.map.url} />
        </div>
      </Column>
    </section>
  );
}

/* -------------------------------------------------------------- reception */

function Reception() {
  const r = event.reception;
  const name = event.celebrant.shortName;
  return (
    <section id="reception" className="garden-chapter relative pb-14 pt-20" aria-labelledby="reception-heading">
      <GardenLights />
      <Butterfly tone="periwinkle" size={30} tilt={-15} path={1} delay={5} className="left-[5%] top-2" />
      <EdgeBouquet side="right" tone="blush" arrangement="spray">
        <Butterfly tone="lavender" size={40} tilt={12} path={2} dur={12} flap={3.3} delay={4} appear={1} className="right-[78%] -top-[2%]" />
      </EdgeBouquet>
      <Column>
        <SectionIntro icon="cake" id="reception-heading" heading={r.heading} text={r.text} />
        <div data-scene="enter" className="mt-7">
          <div className="scene-tilt">
            <Lightbox
              full={fullPhoto("birthday")}
              alt={`${name} in a pink and lavender dress at her birthday photoshoot`}
              label={`Enlarge ${name}'s birthday photo`}
            >
              <span data-reveal="unveil" className="birthday-frame block overflow-hidden rounded-[1.4rem] border-[6px] border-paper shadow-[0_24px_50px_-26px_rgb(88_69_54/0.5)]">
                <Photo
                  id="birthday"
                  alt={`${name} in a pink and lavender dress at her birthday photoshoot`}
                  sizes="(max-width: 480px) 88vw, 432px"
                  className="block h-auto w-full"
                />
              </span>
            </Lightbox>
          </div>
        </div>
        <p className="photo-whisper mt-4">Our little girl, turning one</p>
        <div className="mt-6">
          <VenueCard icon="cake" label={r.label} time={r.time} venue={r.venue} address={r.address} mapUrl={r.map.url} />
        </div>
        <div data-scene="enter" className="mt-7">
          <figure className="scene-rise relative m-0">
            <Lightbox full={{avif:"/venues/st-bernard-clean.avif",webp:"/venues/st-bernard-clean.webp",width:1200,height:762}} alt="St. Bernard Subdivision entrance" label="Enlarge the St. Bernard entrance photo"><span className="venue-landmark"><img src="/venues/st-bernard-clean.webp" alt="Actual entrance to St. Bernard Subdivision, with its yellow guardhouse and iron gates" width={1200} height={762} loading="lazy" /></span></Lightbox>
            <Butterfly tone="blush" size={34} tilt={-8} path={3} dur={9} flap={2.6} delay={1} appear={1.6} className="right-[30%] top-[4%]" />
            <figcaption className="eyebrow mt-3 text-center !text-[0.78rem] !tracking-[0.2em]">{r.landmark}</figcaption>
          </figure>
        </div>
      </Column>
    </section>
  );
}

/* ---------------------------------------------------------------- details */

function DetailCard({ icon, title, from, children }: { icon: IconName; title: string; from: "left" | "right"; children: ReactNode }) {
  return (
    <div className="card detail-card px-5 py-6" data-reveal={from}>
      <div className="flex items-center gap-3">
        <span className="grid size-11 flex-none place-items-center rounded-full bg-lavender/70 text-plum" aria-hidden="true">
          <Icon name={icon} size={24} strokeWidth={1.3} />
        </span>
        <h3 className="subheading">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Details() {
  const d = event.details;
  return (
    <section id="details" className="garden-details relative pb-14 pt-20" aria-labelledby="details-heading">
      <Butterfly tone="blush" size={32} tilt={8} path={3} delay={2} className="right-[5%] top-3" />
      <EdgeBouquet side="left" tone="blush" arrangement="compact">
        <Butterfly tone="ivory" size={36} tilt={-6} path={1} dur={14} flap={3.6} delay={5} appear={1.4} className="left-[78%] top-0" />
      </EdgeBouquet>
      <Column>
        <div className="text-center" data-reveal-stagger>
          <ChapterLabel>03 · The thoughtful little things</ChapterLabel>
          <IconSprigs icon="bow" />
          <h2 id="details-heading" className="heading mt-3">
            {d.heading}
          </h2>
        </div>

        <div className="details-grid mt-8 space-y-5">
          <DetailCard icon="dress" title={d.dressCode.heading} from="left">
            <dl className="mt-4 grid grid-cols-2 gap-3" data-reveal-stagger>
              {d.dressCode.rows.map((row, i) => (
                <div key={row.who} className="flex flex-col items-center rounded-2xl bg-paper/90 px-2 py-4 text-center ring-1 ring-gold/20">
                  <span className="grid size-11 place-items-center rounded-full bg-lavender/60 text-plum" aria-hidden="true">
                    <Icon name={i === 0 ? "shirt" : "bow"} size={24} strokeWidth={1.3} />
                  </span>
                  <dt className="mt-2 font-semibold leading-snug">{row.who}</dt>
                  <dd className="prose-soft mt-0.5 text-[0.95rem] leading-snug">{row.what}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 flex items-start gap-3 rounded-2xl bg-blush/70 px-4 py-3 font-medium">
              <Icon name="ban" size={24} className="mt-0.5 flex-none text-[#a34d66]" />
              <span>{d.dressCode.note}</span>
            </p>
          </DetailCard>

          <DetailCard icon="gift" title={d.gifts.heading} from="right">
            <p className="prose-soft mt-2">{d.gifts.text}</p>
            <ul className="mt-4 grid grid-cols-2 gap-3" data-reveal-stagger>
              {d.gifts.items.map((item) => (
                <li key={item.label} className="flex flex-col items-center gap-2 rounded-2xl bg-paper/90 px-2 py-4 text-center ring-1 ring-gold/20">
                  <span className="grid size-12 place-items-center rounded-full bg-lavender/60 text-plum" aria-hidden="true">
                    <Icon name={item.icon} size={26} strokeWidth={1.3} />
                  </span>
                  <span className="text-[0.95rem] leading-snug">{item.label}</span>
                </li>
              ))}
            </ul>
          </DetailCard>

          <DetailCard icon="heart" title={d.reminders.heading} from="left">
            <p className="prose-soft mt-2">{d.reminders.text}</p>
            <ul className="mt-4 grid grid-cols-2 gap-3" aria-hidden="true" data-reveal-stagger>
              {d.reminders.items.map((item) => (
                <li key={item.label} className="flex flex-col items-center gap-2 text-center">
                  <span className="grid size-14 place-items-center rounded-full bg-blush/60 text-plum ring-1 ring-plum/15">
                    <Icon name={item.icon} size={28} strokeWidth={1.3} />
                  </span>
                  <span className="text-[0.92rem] leading-snug text-ink-soft">{item.label}</span>
                </li>
              ))}
            </ul>
          </DetailCard>
        </div>
      </Column>
    </section>
  );
}

/* ------------------------------------------------------------------ rsvp */

function Rsvp() {
  const r = event.rsvp;
  return (
    <section id="rsvp" className="garden-rsvp relative pt-20" aria-labelledby="rsvp-heading">
      <EdgeBouquet side="right" tone="lavender" arrangement="spray">
        <Butterfly tone="periwinkle" size={38} tilt={10} path={4} dur={10} flap={3.1} delay={2.5} appear={1.2} className="right-[78%] top-0" />
      </EdgeBouquet>
      <Column>
        <SectionIntro icon="envelope" id="rsvp-heading" heading={r.heading} text={r.text} />
        <div className="rsvp-paper mt-7" data-reveal>
          <RsvpForm />
        </div>
      </Column>
      <Garland className="mt-12">
        <Butterfly tone="lavender" size={42} tilt={-14} path={2} dur={13} flap={3.5} delay={6} appear={0.8} className="left-[18%] top-[6%]" />
        <Butterfly tone="blush" size={34} tilt={16} path={1} dur={11} flap={2.9} delay={3} appear={2.4} className="right-[20%] top-[14%]" />
      </Garland>
    </section>
  );
}
