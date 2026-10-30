import { event, TIMEZONE } from "./event";

const day = event.startsAt.slice(0, 10);
const nextDay = new Date(Date.parse(`${day}T00:00:00Z`) + 86400_000).toISOString().slice(0, 10);

// Reserve the celebration date; the invitation does not specify an end time.
export const calendarUrl = "https://calendar.google.com/calendar/r/eventedit?" + new URLSearchParams({
  action: "TEMPLATE",
  text: `${event.celebrant.shortName}'s First Birthday & Christening`,
  dates: `${day.replaceAll("-", "")}/${nextDay.replaceAll("-", "")}`,
  stz: TIMEZONE,
  etz: TIMEZONE,
  location: `${event.christening.venue}, ${event.christening.address}`,
  details: `Christening: ${event.christening.time} at ${event.christening.venue}.\nReception: ${event.reception.time} at ${event.reception.venue}, ${event.reception.address}.\nAll times are Philippine time.\nhttps://isabelle-invitation.vercel.app`,
}).toString();
