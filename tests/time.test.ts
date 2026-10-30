import { describe, expect, it } from "vitest";
import { event } from "@/content/event";
import { countdown, isRsvpOpen } from "@/lib/time";

describe("RSVP cutoff (Philippine time)", () => {
  it("is open until the last second of November 13 in Manila", () => {
    expect(isRsvpOpen(new Date("2026-11-13T23:59:59+08:00"))).toBe(true);
    expect(isRsvpOpen(new Date("2026-11-14T00:00:00+08:00"))).toBe(false);
  });

  it("uses Manila time even when the server clock is in UTC", () => {
    // 2026-11-13 16:30 UTC is 2026-11-14 00:30 in Manila.
    expect(isRsvpOpen(new Date("2026-11-13T16:30:00Z"))).toBe(false);
    expect(isRsvpOpen(new Date("2026-11-13T15:30:00Z"))).toBe(true);
  });

  it("matches the configured deadline", () => {
    expect(event.rsvp.deadline).toBe("2026-11-13T23:59:59+08:00");
  });
});

describe("countdown", () => {
  it("counts down to 10:30 AM Manila on November 17", () => {
    const now = Date.parse("2026-11-16T10:29:30+08:00");
    expect(countdown(now)).toEqual({ phase: "before", days: 1, hours: 0, minutes: 0, seconds: 30 });
  });

  it("never shows negative numbers once the event starts", () => {
    expect(countdown(Date.parse("2026-11-17T10:30:00+08:00"))).toEqual({ phase: "during" });
    expect(countdown(Date.parse("2026-11-17T18:00:00+08:00"))).toEqual({ phase: "during" });
    expect(countdown(Date.parse("2026-11-18T00:00:00+08:00"))).toEqual({ phase: "after" });
  });
});
