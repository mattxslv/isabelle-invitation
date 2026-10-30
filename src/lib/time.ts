import { TIMEZONE, event } from "@/content/event";

export function isRsvpOpen(now: Date = new Date(), deadline: string = event.rsvp.deadline): boolean {
  return now.getTime() <= Date.parse(deadline);
}

export type CountdownPhase =
  | { phase: "before"; days: number; hours: number; minutes: number; seconds: number }
  | { phase: "during" }
  | { phase: "after" };

export function countdown(
  now: number,
  startsAt: string = event.startsAt,
  endsAt: string = event.endsAt,
): CountdownPhase {
  const start = Date.parse(startsAt);
  const end = Date.parse(endsAt);
  if (now >= end) return { phase: "after" };
  if (now >= start) return { phase: "during" };
  let rest = Math.floor((start - now) / 1000);
  const days = Math.floor(rest / 86400);
  rest -= days * 86400;
  const hours = Math.floor(rest / 3600);
  rest -= hours * 3600;
  const minutes = Math.floor(rest / 60);
  return { phase: "before", days, hours, minutes, seconds: rest - minutes * 60 };
}

const manilaFormat = new Intl.DateTimeFormat("en-PH", {
  timeZone: TIMEZONE,
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export function formatManila(iso: string): string {
  return manilaFormat.format(new Date(iso));
}
