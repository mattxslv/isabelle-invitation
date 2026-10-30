"use client";

import { useActionState, useMemo, useState } from "react";
import type { Invite, ResponseRow } from "@/lib/godparents";
import type { RsvpRow } from "@/lib/rsvp";
import { formatManila } from "@/lib/time";
import { createInviteAction, deleteInviteAction, deleteResponseAction, deleteRsvpAction, type InviteState } from "./actions";

type Counts = { total: number; attending: number; declined: number };

export function Dashboard({
  rsvps,
  counts,
  responses,
  invites,
}: {
  rsvps: RsvpRow[];
  counts: Counts;
  responses: ResponseRow[];
  invites: Invite[];
}) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? rsvps.filter((r) => r.guestName.toLowerCase().includes(q)) : rsvps;
  }, [query, rsvps]);

  return (
    <div className="mt-8 space-y-12">
      <section aria-labelledby="rsvp-title">
        <h2 id="rsvp-title" className="subheading">
          Event RSVPs
        </h2>
        <dl className="mt-4 grid grid-cols-3 gap-3 text-center">
          {[
            ["Replies", counts.total],
            ["Attending", counts.attending],
            ["Declined", counts.declined],
          ].map(([label, value]) => (
            <div key={label} className="card px-2 py-4">
              <dt className="text-[0.85rem] uppercase tracking-wider text-ink-soft">{label}</dt>
              <dd className="font-display text-4xl font-medium">{value}</dd>
            </div>
          ))}
        </dl>

        <label htmlFor="search" className="mt-6 block font-medium">
          Search by name
        </label>
        <input
          id="search"
          type="search"
          className="field mt-1.5"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type a name"
        />
        <p className="mt-2 text-[0.9rem] text-ink-soft" aria-live="polite">
          Showing {filtered.length} of {rsvps.length}
        </p>

        <ul className="mt-3 space-y-2">
          {filtered.map((r) => (
            <li key={r.id} className="card flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{r.guestName}</p>
                <p className="text-[0.9rem] text-ink-soft">
                  <span className={r.attending ? "text-[#3f6b3a]" : "text-[#9b3d52]"}>
                    {r.attending ? "Attending" : "Can't make it"}
                  </span>
                  {" · "}
                  {formatManila(r.createdAt)}
                  {r.duplicate && <span className="ml-2 rounded-full bg-lavender px-2 py-0.5 text-[0.8rem]">same name twice</span>}
                </p>
              </div>
              <ConfirmDelete action={deleteRsvpAction} id={r.id} what={`RSVP from ${r.guestName}`} />
            </li>
          ))}
          {filtered.length === 0 && <li className="prose-soft py-6 text-center">No replies yet.</li>}
        </ul>
      </section>

      <section aria-labelledby="gp-title">
        <h2 id="gp-title" className="subheading">
          Godparent answers
        </h2>
        <ul className="mt-4 space-y-2">
          {responses.map((r) => (
            <li key={r.id} className="card flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">
                  {r.name}
                  {r.role && <span className="ml-2 text-[0.9rem] font-normal capitalize text-ink-soft">{r.role}</span>}
                </p>
                <p className="text-[0.9rem] text-ink-soft">
                  <span className={r.accepted ? "text-[#3f6b3a]" : "text-[#9b3d52]"}>{r.accepted ? "Said yes" : "Declined"}</span>
                  {" · "}
                  {r.personal ? "personal link" : "open link"}
                  {" · "}
                  {formatManila(r.updatedAt)}
                </p>
              </div>
              <ConfirmDelete action={deleteResponseAction} id={r.id} what={`answer from ${r.name}`} />
            </li>
          ))}
          {responses.length === 0 && <li className="prose-soft py-6 text-center">No answers yet.</li>}
        </ul>
      </section>

      <InviteManager invites={invites} />
    </div>
  );
}

function ConfirmDelete({ action, id, what }: { action: (formData: FormData) => Promise<void>; id: string; what: string }) {
  const [confirming, setConfirming] = useState(false);
  if (!confirming) {
    return (
      <button type="button" className="min-h-11 rounded-full px-3 text-[0.95rem] text-[#9b3d52] underline-offset-4 hover:underline" onClick={() => setConfirming(true)} aria-label={`Delete ${what}`}>
        Delete
      </button>
    );
  }
  return (
    <form action={action} className="flex items-center gap-1">
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="min-h-11 rounded-full bg-[#9b3d52] px-3 text-[0.9rem] font-medium text-white" aria-label={`Confirm deleting ${what}`}>
        Confirm
      </button>
      <button type="button" className="min-h-11 rounded-full px-3 text-[0.9rem]" onClick={() => setConfirming(false)}>
        Keep
      </button>
    </form>
  );
}

function InviteManager({ invites }: { invites: Invite[] }) {
  const [state, action, pending] = useActionState<InviteState, FormData>(createInviteAction, {});
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (token: string) => {
    const url = `${window.location.origin}/godparents/invite/${token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(token);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      window.prompt("Copy this link:", url);
    }
  };

  return (
    <section aria-labelledby="invites-title">
      <h2 id="invites-title" className="subheading">
        Personal godparent links
      </h2>
      <p className="prose-soft mt-2 text-[0.95rem]">
        Make a private link that greets someone by name. Open links also work: <code>/godparents/ninong</code>,{" "}
        <code>/godparents/ninang</code>, or <code>/godparents</code>.
      </p>

      <form action={action} className="card mt-4 grid gap-3 px-4 py-4 sm:grid-cols-[1fr_auto_auto] sm:items-end">
        <div>
          <label htmlFor="displayName" className="mb-1 block font-medium">
            Name as Isabelle would say it
          </label>
          <input id="displayName" name="displayName" required maxLength={100} className="field" placeholder="e.g. Maria" />
        </div>
        <div>
          <label htmlFor="role" className="mb-1 block font-medium">
            Role
          </label>
          <select id="role" name="role" required className="field" defaultValue="">
            <option value="" disabled>
              Choose
            </option>
            <option value="ninang">Ninang</option>
            <option value="ninong">Ninong</option>
          </select>
        </div>
        <button type="submit" className="btn btn-primary !text-lg" disabled={pending}>
          {pending ? "Creating..." : "Create link"}
        </button>
        <div role="status" aria-live="polite" className="sm:col-span-3">
          {state.error && <p className="font-medium text-[#9b3d52]">{state.error}</p>}
          {state.created && <p>Link for {state.created.displayName} is ready below.</p>}
        </div>
      </form>

      <ul className="mt-3 space-y-2">
        {invites.map((inv) => (
          <li key={inv.id} className="card flex flex-wrap items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="font-semibold">
                <span className="capitalize">{inv.role}</span> {inv.displayName}
              </p>
              <p className="text-[0.9rem] text-ink-soft">
                {inv.response ? (inv.response.accepted ? "Said yes" : "Declined") : "No answer yet"}
              </p>
            </div>
            <button type="button" className="btn btn-ghost !min-h-11 !px-4 !text-base" onClick={() => copy(inv.token)}>
              {copied === inv.token ? "Copied!" : "Copy link"}
            </button>
            <ConfirmDelete action={deleteInviteAction} id={inv.id} what={`link for ${inv.displayName}`} />
          </li>
        ))}
      </ul>
    </section>
  );
}
