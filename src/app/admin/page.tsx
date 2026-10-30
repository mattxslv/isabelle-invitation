import type { Metadata } from "next";
import { Suspense } from "react";
import { event } from "@/content/event";
import { getDb } from "@/lib/db";
import { listInvites, listResponses } from "@/lib/godparents";
import { listRsvps, summarize } from "@/lib/rsvp";
import { requireAdmin } from "@/lib/session";
import { Dashboard } from "./dashboard";
import { logoutAction } from "./actions";

export const metadata: Metadata = {
  title: "Family dashboard",
  referrer: "no-referrer",
};

export default function AdminPage() {
  return (
    <main className="mx-auto max-w-[48rem] px-5 py-10">
      <Suspense fallback={<p className="prose-soft text-center">Loading replies...</p>}>
        <AdminContent />
      </Suspense>
    </main>
  );
}

async function AdminContent() {
  const admin = await requireAdmin();
  const db = await getDb();
  const [rsvps, responses, invites] = await Promise.all([listRsvps(db), listResponses(db), listInvites(db)]);
  const unverifiedMaps = [event.christening, event.reception].filter((v) => !v.map.verified).map((v) => v.venue);

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Isabelle&rsquo;s family</p>
          <h1 className="heading mt-1 !text-[2.2rem]">Replies</h1>
        </div>
        <form action={logoutAction} className="text-right">
          <p className="text-[0.9rem] text-ink-soft">{admin.username}</p>
          <button type="submit" className="mt-1 font-medium text-plum underline underline-offset-4">
            Sign out
          </button>
        </form>
      </header>

      {unverifiedMaps.length > 0 && (
        <p className="mt-6 rounded-2xl bg-blush/70 px-4 py-3 text-[0.95rem]">
          Before sharing: the map links for {unverifiedMaps.join(" and ")} are provisional searches. Confirm the exact pins
          and update <code>src/content/event.ts</code>.
        </p>
      )}

      <Dashboard rsvps={rsvps} counts={summarize(rsvps)} responses={responses} invites={invites} />
    </>
  );
}
