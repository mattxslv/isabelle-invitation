import { Envelope } from "./envelope";
import { event, godparents, type GodparentRole } from "@/content/event";
import { Butterfly } from "./butterfly";
import { Garland } from "./deco";
import { GodparentResponse } from "./godparent-response";
import { Lightbox } from "./lightbox";
import { HeartRule, Icon, IconSprigs } from "./ornaments";
import { fullPhoto, Photo } from "./photo";
import { ScrollFx } from "./scroll-fx";

export type GodparentMode =
  | { kind: "generic" }
  | { kind: "role"; role: GodparentRole }
  | {
      kind: "invite";
      token: string;
      role: GodparentRole;
      displayName: string;
      previous: { accepted: boolean } | null;
    };

export function GodparentExperience({ mode }: { mode: GodparentMode }) {
  const roleKey = mode.kind === "generic" ? "generic" : mode.role;
  const role = godparents.roles[roleKey];
  const greeting = mode.kind === "invite" ? `${role.title} ${mode.displayName}` : role.title;
  const name = event.celebrant.shortName;

  return (
    <main className="relative">
      <ScrollFx />

      <Envelope greeting={greeting} />

      {/* 3. The letter. */}
      <section id="godparent-letter" className="letter-section relative pb-12 pt-12" aria-labelledby="letter-heading">
        <div className="layer mx-auto max-w-[30rem] px-6">
          <article className="card letter-card px-6 pb-10 pt-8 text-center" data-reveal>
            <div className="layer">
            <div className="mx-auto w-48">
              <Lightbox full={fullPhoto("letter")} alt={`${name} in a pink dress with a big pink bow`} label={`Enlarge photo of ${name}`}>
                <span className="block overflow-hidden rounded-t-full rounded-b-[1.4rem] border-[5px] border-paper shadow-[0_20px_40px_-24px_rgb(88_69_54/0.5)] ring-1 ring-gold/40">
                  <Photo id="letter" alt={`${name} in a pink dress with a big pink bow`} sizes="192px" className="block h-auto w-full" priority />
                </span>
              </Lightbox>
            </div>
            <h1 id="letter-heading" tabIndex={-1} className="script gold-text mt-6 px-2 pb-1 text-[clamp(2.4rem,10vw,3rem)] leading-[1.2]">
              Dear {greeting},
            </h1>
            <div className="mt-4 space-y-4 font-display text-[1.3rem] leading-relaxed text-ink" data-reveal-stagger>
              {godparents.letter.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
            <p className="mt-6 font-display text-xl italic">{godparents.signoff}</p>
            <p className="script gold-text px-2 pb-1 text-[2.8rem] leading-[1.2]">{godparents.signature}</p>
            <Icon name="heart" size={22} className="mx-auto mt-2 text-gold" />
            </div>
          </article>
        </div>
      </section>

      {/* 4. The question. */}
      <section className="relative pb-16 pt-6" aria-labelledby="question-heading">
        <Butterfly tone="periwinkle" size={38} tilt={10} path={1} dur={10} flap={3.1} delay={1} appear={0.6} className="right-[6%] top-2" />
        <Butterfly tone="blush" size={32} tilt={-12} path={3} dur={12} flap={2.7} delay={3} appear={1.8} className="left-[6%] top-4" />
        <div className="layer mx-auto max-w-[30rem] px-6 text-center" data-reveal>
          <IconSprigs icon="cross" size={36} />
          <h2 id="question-heading" className="script gold-text mt-3 px-2 pb-1 text-[clamp(3rem,13vw,3.8rem)] leading-[1.2]">
            {role.question}
          </h2>
          <HeartRule className="mt-1" />
          <p className="prose-soft mx-auto mt-4 max-w-[24rem]">
            {event.christening.time}, {event.dateLabel}
            <br />
            {event.christening.venue}
          </p>
          <div className="mt-7">
            <GodparentResponse
              token={mode.kind === "invite" ? mode.token : undefined}
              role={mode.kind === "generic" ? undefined : mode.role}
              needsName={mode.kind !== "invite"}
              previous={mode.kind === "invite" ? mode.previous : null}
            />
          </div>
        </div>
      </section>

      <Garland>
        <Butterfly tone="lavender" size={40} tilt={-14} path={2} dur={12} flap={3.4} delay={2} appear={1} className="left-[20%] top-[8%]" />
        <Butterfly tone="ivory" size={34} tilt={16} path={4} dur={10} flap={3} delay={6} appear={2.6} className="right-[22%] top-[16%]" />
      </Garland>
    </main>
  );
}
