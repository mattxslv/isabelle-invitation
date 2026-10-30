"use client";

import { startTransition, useActionState, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { rsvpStatusAction, submitRsvpAction, type RsvpState } from "@/app/actions";
import { event } from "@/content/event";
import { isRsvpOpen } from "@/lib/time";
import { Celebration } from "./celebration";
import { Lightbox } from "./lightbox";
import { HeartRule, Icon } from "./ornaments";
import { fullPhoto, Photo } from "./photo";
import { useNow } from "./use-now";

const copy = event.rsvp;
const RECEIPT_KEY = "isabelle-rsvp-receipt";

// The browser keeps only its own random submission key. On refresh we ask the
// server about that key alone, so no other guest's data is ever exposed.
const noopSubscribe = () => () => {};
function useStoredReceipt(): string | null {
  return useSyncExternalStore(
    noopSubscribe,
    () => {
      try {
        return window.localStorage.getItem(RECEIPT_KEY);
      } catch {
        return null;
      }
    },
    () => null,
  );
}

type Confirmed = { attending: boolean; duplicateName: boolean; fresh: boolean };

export function RsvpForm() {
  const [state, formAction, pending] = useActionState<RsvpState, FormData>(submitRsvpAction, { status: "idle" });
  const [name, setName] = useState("");
  const [attending, setAttending] = useState<"yes" | "no" | null>(null);
  const [restored, setRestored] = useState<Confirmed | null>(null);
  const [checked, setChecked] = useState(false);
  // The success result the guest moved past with "Reply for another guest".
  const [dismissedFor, setDismissedFor] = useState<RsvpState | null>(null);
  // One key per distinct answer: a retried request is recognized by the
  // server, while a changed answer becomes a new submission.
  const key = useRef<string | null>(null);
  const receipt = useStoredReceipt();
  const now = useNow();

  useEffect(() => {
    if (!receipt || checked || state.status === "success") return;
    let cancelled = false;
    rsvpStatusAction(receipt).then((found) => {
      if (cancelled) return;
      if (found) setRestored({ attending: found.attending, duplicateName: false, fresh: false });
      else window.localStorage.removeItem(RECEIPT_KEY);
      setChecked(true);
    });
    return () => {
      cancelled = true;
    };
  }, [receipt, checked, state.status]);

  const fresh = state.status === "success" && state !== dismissedFor;
  useEffect(() => {
    if (fresh && key.current) {
      try {
        window.localStorage.setItem(RECEIPT_KEY, key.current);
      } catch {
        /* private mode: confirmation simply won't persist */
      }
    }
  }, [fresh]);

  const anotherGuest = () => {
    try {
      window.localStorage.removeItem(RECEIPT_KEY);
    } catch {
      /* ignore */
    }
    key.current = null;
    setName("");
    setAttending(null);
    setRestored(null);
    setChecked(true);
    setDismissedFor(state);
  };

  if (state.status === "success" && fresh) {
    return <RsvpConfirmed attending={state.attending} duplicateName={state.duplicateName} fresh onAnother={anotherGuest} />;
  }
  if (restored) return <RsvpConfirmed {...restored} onAnother={anotherGuest} />;
  if (receipt && !checked) {
    return <p className="prose-soft py-10 text-center" role="status">Loading your reply...</p>;
  }

  const closed = state.status === "closed" || (now !== null && !isRsvpOpen(new Date(now)));
  if (closed) {
    return (
      <div className="card px-6 py-6 text-center" role="status">
        <p className="font-display text-xl italic">{copy.closedText}</p>
      </div>
    );
  }

  const ready = name.trim().length > 0 && attending !== null;

  return (
    <form
      onSubmit={(e) => {
        // Submitting through a transition (not <form action>) keeps the typed
        // answers in place if the server reports an error.
        e.preventDefault();
        if (!ready || pending) return;
        const formData = new FormData(e.currentTarget);
        key.current ??= crypto.randomUUID();
        formData.set("submissionKey", key.current);
        startTransition(() => formAction(formData));
      }}
      className="space-y-4 text-left"
      noValidate
    >
      <div>
        <label htmlFor="rsvp-name" className="mb-1.5 block font-medium">
          Your full name
        </label>
        <input
          id="rsvp-name"
          name="name"
          className="field"
          autoComplete="name"
          maxLength={100}
          required
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            key.current = null;
          }}
          placeholder="e.g. Maria Santos"
        />
      </div>

      <fieldset>
        <legend className="mb-1.5 font-medium">Will you be joining us?</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              ["yes", copy.yesLabel],
              ["no", copy.noLabel],
            ] as const
          ).map(([value, label]) => (
            <label key={value} className="choice">
              <input
                type="radio"
                name="attending"
                value={value}
                required
                checked={attending === value}
                onChange={() => {
                  setAttending(value);
                  key.current = null;
                }}
              />
              <span className="dot" aria-hidden="true">
                <Icon name="check" size={14} strokeWidth={2.4} className="text-white" />
              </span>
              <span className="text-[1.0625rem]">{label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Honeypot: hidden from people, tempting to bots. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>

      <div role="status" aria-live="polite" className="min-h-[1.5rem] text-center">
        {state.status === "error" && (
          <p role="alert" className="font-medium text-[#9b3d52]">
            {state.message}
          </p>
        )}
        {pending && <span className="sr-only">Sending your RSVP</span>}
      </div>

      <button type="submit" className="btn btn-primary w-full" disabled={!ready || pending} aria-busy={pending}>
        <Icon name="send" size={20} />
        {pending ? "Sending..." : "Send RSVP"}
      </button>
      {!ready && (
        <p className="text-center text-[0.95rem] text-ink-soft">Add your name and choose an answer to send your RSVP.</p>
      )}

      <p className="pt-1 text-center text-[0.9rem] leading-relaxed text-ink-soft">{copy.privacy}</p>
    </form>
  );
}

// Shown only after the server has saved the reply (or a saved reply was found
// for this browser). "Yes" gets the thank-you and a petal drift; "No" gets a
// quiet, respectful note with no celebration.
function RsvpConfirmed({
  attending,
  duplicateName,
  fresh,
  onAnother,
}: Confirmed & { onAnother: () => void }) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (fresh) heading.current?.focus();
  }, [fresh]);
  const c = event.closing;
  const name = event.celebrant.shortName;

  return (
    <div className="enter text-center" aria-live="polite">
      {fresh && attending && <Celebration />}
      {attending ? (
        <>
          <div className="mx-auto w-40">
            <Lightbox full={fullPhoto("closing")} alt={`${name} smiling in a pink dress`} label={`Enlarge photo of ${name} smiling`}>
              <span className="block overflow-hidden rounded-b-[1.4rem] rounded-t-full border-[5px] border-paper shadow-[0_20px_40px_-24px_rgb(88_69_54/0.5)] ring-1 ring-gold/40">
                <Photo id="closing" alt={`${name} smiling in a pink dress`} sizes="160px" className="block h-auto w-full" />
              </span>
            </Lightbox>
          </div>
          <h3 ref={heading} tabIndex={-1} className="script gold-text mt-5 px-2 pb-1 text-[3.6rem] leading-[1.15] outline-none">
            {c.heading}!
          </h3>
          <HeartRule className="mt-1" />
          <p className="prose-soft mx-auto mt-4 max-w-[26rem]">Your RSVP is saved. {c.text}</p>
        </>
      ) : (
        <>
          <Icon name="heart" size={30} className="mx-auto text-gold" />
          <h3 ref={heading} tabIndex={-1} className="heading mt-3 !text-[2rem] outline-none">
            Thank you for letting us know
          </h3>
          <HeartRule className="mt-3" />
          <p className="prose-soft mx-auto mt-4 max-w-[26rem]">
            Your reply is saved. You will be missed, and we are so grateful for your love and prayers for Isabelle. If your
            plans change, please let the family know.
          </p>
        </>
      )}
      {duplicateName && (
        <p className="mt-3 text-[0.95rem] text-ink-soft">
          We already had a reply under this name, so we saved this one too. The family will see both.
        </p>
      )}
      <p className="mt-6 font-display text-xl italic">{c.signoff}</p>
      <p className="script gold-text px-2 pb-2 text-[3rem] leading-[1.2]">{c.signature}</p>
      <button type="button" onClick={onAnother} className="mt-2 min-h-11 text-[0.95rem] text-plum underline underline-offset-4">
        Reply for another guest
      </button>
    </div>
  );
}
