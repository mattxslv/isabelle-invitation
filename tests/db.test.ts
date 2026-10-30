import { beforeEach, describe, expect, it } from "vitest";
import { authenticate, createSession, deleteSession, findSessionAdmin, hashPassword, upsertAdmin, verifyPassword } from "@/lib/auth";
import { schemaStatements } from "@/lib/db";
import { createInvite, deleteInvite, getInviteByToken, listInvites, listResponses, respond } from "@/lib/godparents";
import { bucketKey, hitRateLimit } from "@/lib/rate-limit";
import { deleteRsvp, listRsvps, submitRsvp, summarize } from "@/lib/rsvp";
import { testDb, uuid } from "./helpers";

let db: Awaited<ReturnType<typeof testDb>>;

beforeEach(async () => {
  db = await testDb();
});

describe("schema", () => {
  it("is idempotent", async () => {
    const { applySchema } = await import("@/lib/db");
    await expect(applySchema(db)).resolves.toBeGreaterThan(5);
  });

  it("splits statements and drops comments", () => {
    expect(schemaStatements("-- hi\ncreate table a (x int);\n\nselect 1;\n")).toEqual(["create table a (x int)", "select 1"]);
  });
});

describe("RSVPs", () => {
  it("stores a reply and counts it", async () => {
    await submitRsvp(db, { name: "Maria Santos", attending: true, submissionKey: uuid() });
    await submitRsvp(db, { name: "Jun Cruz", attending: false, submissionKey: uuid() });
    const rows = await listRsvps(db);
    expect(rows).toHaveLength(2);
    expect(summarize(rows)).toEqual({ total: 2, attending: 1, declined: 1 });
  });

  it("treats a retried request as the same submission", async () => {
    const key = uuid();
    const first = await submitRsvp(db, { name: "Maria", attending: true, submissionKey: key });
    const retry = await submitRsvp(db, { name: "Maria", attending: true, submissionKey: key });
    expect(retry).toEqual({ id: first.id, replay: true, duplicateName: false });
    expect(await listRsvps(db)).toHaveLength(1);
  });

  it("keeps and flags a second reply under the same name instead of overwriting", async () => {
    await submitRsvp(db, { name: "Maria Santos", attending: true, submissionKey: uuid() });
    const second = await submitRsvp(db, { name: "maria  santos", attending: false, submissionKey: uuid() });
    expect(second.duplicateName).toBe(true);
    const rows = await listRsvps(db);
    expect(rows).toHaveLength(2);
    expect(rows.every((r) => r.duplicate)).toBe(true);
    expect(rows.map((r) => r.attending).sort()).toEqual([false, true]);
  });

  it("deletes a reply", async () => {
    const { id } = await submitRsvp(db, { name: "Maria", attending: true, submissionKey: uuid() });
    expect(await deleteRsvp(db, id)).toBe(true);
    expect(await listRsvps(db)).toHaveLength(0);
  });
});

describe("rate limiting", () => {
  it("allows up to the limit within a window, then blocks", async () => {
    const limit = { limit: 3, windowSeconds: 600 };
    const now = new Date("2026-11-01T10:00:00Z");
    const results = [];
    for (let i = 0; i < 4; i++) results.push((await hitRateLimit(db, "rsvp:x", limit, now)).allowed);
    expect(results).toEqual([true, true, true, false]);
  });

  it("resets in the next window and keeps buckets separate", async () => {
    const limit = { limit: 1, windowSeconds: 600 };
    const t0 = new Date("2026-11-01T10:00:00Z");
    expect((await hitRateLimit(db, "a", limit, t0)).allowed).toBe(true);
    expect((await hitRateLimit(db, "a", limit, t0)).allowed).toBe(false);
    expect((await hitRateLimit(db, "b", limit, t0)).allowed).toBe(true);
    expect((await hitRateLimit(db, "a", limit, new Date(t0.getTime() + 600_000))).allowed).toBe(true);
  });

  it("never stores raw IPs or emails in bucket names", () => {
    const bucket = bucketKey("rsvp", "203.0.113.7");
    expect(bucket).not.toContain("203.0.113.7");
    expect(bucket).toBe(bucketKey("rsvp", "203.0.113.7"));
  });
});

describe("admin authentication", () => {
  it("hashes and verifies passwords", async () => {
    const hash = await hashPassword("correct horse battery");
    expect(hash).not.toContain("correct");
    expect(await verifyPassword("correct horse battery", hash)).toBe(true);
    expect(await verifyPassword("wrong", hash)).toBe(false);
  });

  it("only signs in allowlisted admins with the right password", async () => {
    await upsertAdmin(db, "Family", "a-long-family-password");
    expect(await authenticate(db, "family", "a-long-family-password")).toMatchObject({ username: "family" });
    expect(await authenticate(db, "family", "nope")).toBeNull();
    expect(await authenticate(db, "stranger", "a-long-family-password")).toBeNull();
  });

  it("issues sessions that expire and can be revoked", async () => {
    const admin = await upsertAdmin(db, "family", "a-long-family-password");
    const now = new Date("2026-11-01T00:00:00Z");
    const { token } = await createSession(db, admin.id, now);
    expect(await findSessionAdmin(db, token, now)).toMatchObject({ id: admin.id });
    expect(await findSessionAdmin(db, token, new Date("2026-11-09T00:00:00Z"))).toBeNull();
    expect(await findSessionAdmin(db, "forged-token", now)).toBeNull();
    await deleteSession(db, token);
    expect(await findSessionAdmin(db, token, now)).toBeNull();
  });

  it("stores only a hash of the session token", async () => {
    const admin = await upsertAdmin(db, "family", "a-long-family-password");
    const { token } = await createSession(db, admin.id);
    const rows = await db.query<{ token_hash: string }>("select token_hash from admin_sessions");
    expect(rows[0].token_hash).not.toBe(token);
  });

  it("signs out existing sessions when the password changes", async () => {
    const admin = await upsertAdmin(db, "family", "a-long-family-password");
    const { token } = await createSession(db, admin.id);
    await upsertAdmin(db, "family", "another-long-password");
    expect(await findSessionAdmin(db, token)).toBeNull();
  });
});

describe("godparents", () => {
  it("creates personal invites with unguessable tokens", async () => {
    const invite = await createInvite(db, { displayName: "Maria", role: "ninang" });
    expect(invite.token.length).toBeGreaterThanOrEqual(24);
    expect(await getInviteByToken(db, invite.token)).toMatchObject({ displayName: "Maria", role: "ninang", response: null });
    expect(await getInviteByToken(db, "x".repeat(24))).toBeNull();
  });

  it("keeps one changeable answer per personal invite", async () => {
    const invite = await createInvite(db, { displayName: "Ben", role: "ninong" });
    await respond(db, { submissionKey: uuid(), inviteId: invite.id, name: "Ben", role: "ninong", accepted: false });
    await respond(db, { submissionKey: uuid(), inviteId: invite.id, name: "Ben", role: "ninong", accepted: true });
    const responses = await listResponses(db);
    expect(responses).toHaveLength(1);
    expect(responses[0]).toMatchObject({ accepted: true, personal: true });
    expect((await listInvites(db))[0].response?.accepted).toBe(true);
  });

  it("records open-link answers idempotently", async () => {
    const key = uuid();
    const a = await respond(db, { submissionKey: key, name: "Lito", accepted: true });
    const b = await respond(db, { submissionKey: key, name: "Lito", accepted: true });
    expect(a.id).toBe(b.id);
    expect(await listResponses(db)).toHaveLength(1);
  });

  it("removes answers along with a deleted invite", async () => {
    const invite = await createInvite(db, { displayName: "Ana", role: "ninang" });
    await respond(db, { submissionKey: uuid(), inviteId: invite.id, name: "Ana", accepted: true });
    await deleteInvite(db, invite.id);
    expect(await listResponses(db)).toHaveLength(0);
  });
});

describe("row level security", () => {
  it("denies other database roles any access to guest data", async () => {
    await submitRsvp(db, { name: "Maria", attending: true, submissionKey: uuid() });
    await db.query("create role anon_reader nologin");
    await db.query("grant usage on schema public to anon_reader");
    await db.query("set role anon_reader");
    try {
      await expect(db.query("select * from rsvps")).rejects.toThrow(/permission denied/);
      await expect(db.query("delete from rsvps")).rejects.toThrow(/permission denied/);
      await expect(db.query("select * from admin_users")).rejects.toThrow(/permission denied/);
    } finally {
      await db.query("reset role");
    }
  });

  it("returns no rows even if a role is later granted table access", async () => {
    await submitRsvp(db, { name: "Maria", attending: true, submissionKey: uuid() });
    await db.query("create role leaky nologin");
    await db.query("grant usage on schema public to leaky");
    await db.query("grant select on rsvps to leaky");
    await db.query("set role leaky");
    try {
      expect(await db.query("select * from rsvps")).toHaveLength(0);
    } finally {
      await db.query("reset role");
    }
  });
});
