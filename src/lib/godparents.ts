import { randomBytes } from "node:crypto";
import { toIso, type Db } from "./db";
import type { GodparentRole } from "@/content/event";

export type Invite = {
  id: string;
  token: string;
  displayName: string;
  role: GodparentRole;
  createdAt: string;
  response: { accepted: boolean; updatedAt: string } | null;
};

type InviteRow = {
  id: string;
  token: string;
  display_name: string;
  role: GodparentRole;
  created_at: unknown;
  accepted: boolean | null;
  updated_at: unknown;
};

const INVITE_SELECT = `
  select i.id, i.token, i.display_name, i.role, i.created_at, r.accepted, r.updated_at
  from godparent_invites i
  left join godparent_responses r on r.invite_id = i.id`;

function toInvite(r: InviteRow): Invite {
  return {
    id: r.id,
    token: r.token,
    displayName: r.display_name,
    role: r.role,
    createdAt: toIso(r.created_at),
    response: r.accepted === null ? null : { accepted: r.accepted, updatedAt: toIso(r.updated_at) },
  };
}

export async function createInvite(db: Db, input: { displayName: string; role: GodparentRole }): Promise<Invite> {
  const token = randomBytes(18).toString("base64url");
  const rows = await db.query<{ id: string; created_at: unknown }>(
    `insert into godparent_invites (token, display_name, role) values ($1, $2, $3) returning id, created_at`,
    [token, input.displayName, input.role],
  );
  return {
    id: rows[0].id,
    token,
    displayName: input.displayName,
    role: input.role,
    createdAt: toIso(rows[0].created_at),
    response: null,
  };
}

export async function getInviteByToken(db: Db, token: string): Promise<Invite | null> {
  const rows = await db.query<InviteRow>(`${INVITE_SELECT} where i.token = $1`, [token]);
  return rows[0] ? toInvite(rows[0]) : null;
}

export async function listInvites(db: Db): Promise<Invite[]> {
  const rows = await db.query<InviteRow>(`${INVITE_SELECT} order by i.created_at desc`);
  return rows.map(toInvite);
}

export async function deleteInvite(db: Db, id: string): Promise<boolean> {
  return (await db.query(`delete from godparent_invites where id = $1 returning id`, [id])).length > 0;
}

// Personal invites keep one answer that can be changed later. Open-link
// answers are idempotent per submission and kept as separate rows.
export async function respond(
  db: Db,
  input: { submissionKey: string; inviteId?: string; name: string; role?: GodparentRole; accepted: boolean },
): Promise<{ id: string }> {
  if (input.inviteId) {
    const rows = await db.query<{ id: string }>(
      `insert into godparent_responses (submission_key, invite_id, name, role, accepted)
       values ($1, $2, $3, $4, $5)
       on conflict (invite_id) do update
         set accepted = excluded.accepted, updated_at = now()
       returning id`,
      [input.submissionKey, input.inviteId, input.name, input.role ?? null, input.accepted],
    );
    return { id: rows[0].id };
  }
  const rows = await db.query<{ id: string }>(
    `insert into godparent_responses (submission_key, name, role, accepted)
     values ($1, $2, $3, $4)
     on conflict (submission_key) do nothing
     returning id`,
    [input.submissionKey, input.name, input.role ?? null, input.accepted],
  );
  if (rows[0]) return { id: rows[0].id };
  const existing = await db.query<{ id: string }>(`select id from godparent_responses where submission_key = $1`, [
    input.submissionKey,
  ]);
  return { id: existing[0].id };
}

export type ResponseRow = {
  id: string;
  name: string;
  role: GodparentRole | null;
  accepted: boolean;
  personal: boolean;
  updatedAt: string;
};

export async function listResponses(db: Db): Promise<ResponseRow[]> {
  const rows = await db.query<{
    id: string;
    name: string;
    role: GodparentRole | null;
    accepted: boolean;
    invite_id: string | null;
    updated_at: unknown;
  }>(
    `select id, name, role, accepted, invite_id, updated_at from godparent_responses order by updated_at desc`,
  );
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    role: r.role,
    accepted: r.accepted,
    personal: r.invite_id !== null,
    updatedAt: toIso(r.updated_at),
  }));
}

export async function deleteResponse(db: Db, id: string): Promise<boolean> {
  return (await db.query(`delete from godparent_responses where id = $1 returning id`, [id])).length > 0;
}
