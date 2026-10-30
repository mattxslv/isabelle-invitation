import { toIso, type Db } from "./db";
import { nameKey } from "./validation";

export type SubmitResult = { id: string; replay: boolean; duplicateName: boolean };

// Idempotent on submissionKey: a retried request returns the original row
// instead of inserting twice. A different submission under the same name is
// kept as its own row and flagged, never silently overwritten.
export async function submitRsvp(
  db: Db,
  input: { name: string; attending: boolean; submissionKey: string },
): Promise<SubmitResult> {
  const key = nameKey(input.name);
  const inserted = await db.query<{ id: string }>(
    `insert into rsvps (submission_key, guest_name, name_key, attending)
     values ($1, $2, $3, $4)
     on conflict (submission_key) do nothing
     returning id`,
    [input.submissionKey, input.name, key, input.attending],
  );

  let id = inserted[0]?.id;
  const replay = !id;
  if (!id) {
    const existing = await db.query<{ id: string }>(`select id from rsvps where submission_key = $1`, [
      input.submissionKey,
    ]);
    id = existing[0].id;
  }

  const others = await db.query<{ n: number }>(
    `select count(*)::int as n from rsvps where name_key = $1 and id <> $2`,
    [key, id],
  );
  return { id, replay, duplicateName: Number(others[0]?.n ?? 0) > 0 };
}

// Looks up one reply by its private submission key (a random UUID kept only
// in that guest's browser). Never reveals anything about other guests.
export async function getRsvpByKey(db: Db, submissionKey: string): Promise<{ attending: boolean } | null> {
  const rows = await db.query<{ attending: boolean }>(`select attending from rsvps where submission_key = $1`, [submissionKey]);
  return rows[0] ? { attending: rows[0].attending } : null;
}

export type RsvpRow = {
  id: string;
  guestName: string;
  attending: boolean;
  createdAt: string;
  duplicate: boolean;
};

export async function listRsvps(db: Db): Promise<RsvpRow[]> {
  const rows = await db.query<{
    id: string;
    guest_name: string;
    attending: boolean;
    created_at: unknown;
    dupes: number;
  }>(
    `select id, guest_name, attending, created_at,
            count(*) over (partition by name_key)::int as dupes
     from rsvps
     order by created_at desc`,
  );
  return rows.map((r) => ({
    id: r.id,
    guestName: r.guest_name,
    attending: r.attending,
    createdAt: toIso(r.created_at),
    duplicate: Number(r.dupes) > 1,
  }));
}

export function summarize(rows: RsvpRow[]) {
  const attending = rows.filter((r) => r.attending).length;
  return { total: rows.length, attending, declined: rows.length - attending };
}

export async function deleteRsvp(db: Db, id: string): Promise<boolean> {
  const rows = await db.query(`delete from rsvps where id = $1 returning id`, [id]);
  return rows.length > 0;
}
