"use client";

import Link from "next/link";
import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { godparentAction, type GodparentState } from "@/app/actions";
import { godparents, type GodparentRole } from "@/content/event";
import { Celebration } from "./celebration";
import { Icon } from "./ornaments";

export function GodparentResponse({
  token,
  role,
  needsName,
  previous,
}: {
  token?: string;
  role?: GodparentRole;
  needsName: boolean;
  previous?: { accepted: boolean } | null;
}) {
  const [state, formAction, pending] = useActionState<GodparentState, FormData>(godparentAction, { status: "idle" });
  const [name, setName] = useState("");
  const [choice, setChoice] = useState<"accept" | "decline" | null>(null);
  const [changing, setChanging] = useState(false);
  const key = useRef<string | null>(null);

  if (state.status === "success") return <Answered accepted={state.accepted} fresh />;
  if (previous && !changing) {
    return (
      <div>
        <Answered accepted={previous.accepted} />
        <button type="button" className="btn btn-ghost mt-4 w-full" onClick={() => setChanging(true)}>
          Change my answer
        </button>
      </div>
    );
  }

  const nameMissing = needsName && name.trim().length === 0;

  const submit = (decision: "accept" | "decline", form: HTMLFormElement) => {
    if (nameMissing || pending) return;
    const formData = new FormData(form);
    if (key.current === null || choice !== decision) key.current = crypto.randomUUID();
    setChoice(decision);
    formData.set("decision", decision);
    formData.set("submissionKey", key.current);
    startTransition(() => formAction(formData));
  };

  return (
    <form
      className="space-y-4 text-left"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
        submit(submitter?.value === "decline" ? "decline" : "accept", e.currentTarget);
      }}
    >
      {token && <input type="hidden" name="token" value={token} />}
      {role && <input type="hidden" name="role" value={role} />}
      {needsName && (
        <div>
          <label htmlFor="gp-name" className="mb-1.5 block font-medium">
            Your name
          </label>
          <input
            id="gp-name"
            name="name"
            className="field"
            autoComplete="name"
            maxLength={100}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              key.current = null;
            }}
            placeholder="So we know who said yes"
          />
        </div>
      )}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
      </div>

      <div className="grid gap-3">
        <button type="submit" value="accept" className="btn btn-primary w-full" disabled={nameMissing || pending} aria-busy={pending && choice === "accept"}>
          <Icon name="heart" size={20} />
          {pending && choice === "accept" ? "Sending..." : godparents.acceptLabel}
        </button>
        <button type="submit" value="decline" className="btn btn-ghost w-full" disabled={nameMissing || pending} aria-busy={pending && choice === "decline"}>
          {pending && choice === "decline" ? "Sending..." : godparents.declineLabel}
        </button>
      </div>
      {nameMissing && <p className="text-center text-[0.95rem] text-ink-soft">Add your name first, then choose an answer.</p>}
      <div role="status" aria-live="polite" className="min-h-[1.5rem] text-center">
        {state.status === "error" && (
          <p role="alert" className="font-medium text-[#9b3d52]">
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}

function Answered({ accepted, fresh = false }: { accepted: boolean; fresh?: boolean }) {
  const heading = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (fresh) heading.current?.focus({ preventScroll: true });
  }, [fresh]);

  return (
    <div className={`gp-answer text-center ${fresh ? "is-fresh" : ""}`}>
      {fresh && accepted && <Celebration />}
      <p ref={heading} tabIndex={-1} className="script gold-text px-2 pb-1 text-5xl leading-[1.2] outline-none">
        {accepted ? "Thank you!" : "Thank you"}
      </p>
      <p className="prose-soft mt-3">{accepted ? godparents.acceptedText : godparents.declinedText}</p>
      {!fresh && (
        <p className="mt-3 text-[0.95rem] text-ink-soft">
          You answered {accepted ? "yes" : "that you can't"}. You can change it below if anything changes.
        </p>
      )}
      <p className="mt-4 text-[0.95rem] text-ink-soft">{godparents.separateNote}</p>
      <Link href="/#rsvp" className="btn btn-ghost mt-4 w-full">
        <Icon name="envelope" size={20} />
        Open the invitation
      </Link>
    </div>
  );
}
