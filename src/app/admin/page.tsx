import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { event } from "@/content/event";
import { getDb } from "@/lib/db";
import { listResponses } from "@/lib/godparents";
import { listRsvps } from "@/lib/rsvp";
import { requireAdmin } from "@/lib/session";
import { Dashboard } from "./dashboard";
import { logoutAction } from "./actions";
import { MonogramLoader } from "@/components/monogram-loader";
import { AdminSessionGuard } from "@/components/admin-session-guard";

export const metadata: Metadata = { title: "Guest list", referrer: "no-referrer" };

export default function AdminPage() {
  return <main className="admin-page"><div className="admin-shell">
    <Suspense fallback={<div className="admin-loader-screen"><MonogramLoader label="Loading guest list" /></div>}><AdminContent /></Suspense>
  </div></main>;
}

async function AdminContent() {
  await connection();
  await requireAdmin();
  const db = await getDb();
  const [rsvps, responses] = await Promise.all([listRsvps(db), listResponses(db)]);
  return <>
    <AdminSessionGuard />
    <header className="admin-header">
      <div className="admin-brand"><Link className="garden-monogram admin-monogram" href="/" aria-label="Isabelle's invitation">I<span aria-hidden="true">&#10023;</span></Link><div><p className="admin-eyebrow">Isabelle&rsquo;s celebration</p><h1>Guest list</h1><p className="admin-event-date">{event.dateLong}</p></div></div>
      <form action={logoutAction}><button type="submit" className="admin-signout"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M9 4H5v16h4M14 8l4 4-4 4M8 12h10" strokeLinecap="round" strokeLinejoin="round" /></svg>Sign out</button></form>
    </header>
    <div className="admin-intro"><p>See who&rsquo;s celebrating with Isabelle.</p><Link href="/" target="_blank">View invitation <span aria-hidden="true">&#8599;</span></Link></div>
    <Dashboard rsvps={rsvps} responses={responses} />
  </>;
}
