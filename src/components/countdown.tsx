"use client";

import { countdown } from "@/lib/time";
import { event } from "@/content/event";
import { useNow } from "./use-now";

const pad = (n: number) => String(n).padStart(2, "0");

export function Countdown() {
  const now = useNow();
  const state = now === null ? null : countdown(now);

  if (state && state.phase !== "before") {
    return (
      <div className="card px-6 py-5 text-center">
        <p className="font-display text-2xl italic text-ink">
          {state.phase === "during"
            ? "Today is the day! We are so happy to celebrate with you."
            : "Thank you for celebrating Isabelle with us."}
        </p>
      </div>
    );
  }

  const cells = [
    { label: "Days", value: state ? String(state.days) : "--" },
    { label: "Hours", value: state ? pad(state.hours) : "--" },
    { label: "Minutes", value: state ? pad(state.minutes) : "--" },
    { label: "Seconds", value: state ? pad(state.seconds) : "--" },
  ];

  return (
    <div className="card">
      <p className="sr-only">
        Counting down to the christening on {event.dateLabel} at {event.christening.time}.
      </p>
      <div className="countdown" aria-hidden="true">
        {cells.map((cell) => (
          <div key={cell.label}>
            <span className="num">{cell.value}</span>
            <span className="unit">{cell.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
