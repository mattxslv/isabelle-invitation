// Family admin authentication: scrypt password hashes and opaque
// database-backed sessions. Only SHA-256 hashes of session tokens are stored.
import { createHash, randomBytes, scrypt as scryptCb, timingSafeEqual, type ScryptOptions } from "node:crypto";
import type { Db } from "./db";
import { ADMIN_IDLE_MS } from "./session-policy";

const scrypt = (password: string, salt: Buffer, keylen: number, options: ScryptOptions) =>
  new Promise<Buffer>((resolve, reject) =>
    scryptCb(password, salt, keylen, options, (err, key) => (err ? reject(err) : resolve(key))),
  );

const PARAMS = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
const KEYLEN = 64;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(password.normalize("NFKC"), salt, KEYLEN, PARAMS);
  return ["scrypt", PARAMS.N, PARAMS.r, PARAMS.p, salt.toString("base64url"), key.toString("base64url")].join("$");
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, n, r, p, saltB64, keyB64] = stored.split("$");
  if (scheme !== "scrypt" || !saltB64 || !keyB64) return false;
  const expected = Buffer.from(keyB64, "base64url");
  const actual = await scrypt(password.normalize("NFKC"), Buffer.from(saltB64, "base64url"), expected.length, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
    maxmem: PARAMS.maxmem,
  });
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

// Used when the username is unknown so response time does not reveal accounts.
const DUMMY_HASH = "scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA$" + "A".repeat(86);

export type Admin = { id: string; username: string };

export async function authenticate(db: Db, username: string, password: string): Promise<Admin | null> {
  const rows = await db.query<{ id: string; username: string; password_hash: string }>(
    `select id, username, password_hash from admin_users where username = $1`,
    [username.trim().toLowerCase()],
  );
  const user = rows[0];
  const ok = await verifyPassword(password, user?.password_hash ?? DUMMY_HASH);
  return user && ok ? { id: user.id, username: user.username } : null;
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("base64url");
}

export async function createSession(db: Db, adminId: string, now: Date = new Date()) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(now.getTime() + ADMIN_IDLE_MS);
  await db.query(`insert into admin_sessions (token_hash, admin_id, expires_at) values ($1, $2, $3)`, [
    hashToken(token),
    adminId,
    expiresAt.toISOString(),
  ]);
  // Opportunistic cleanup of this admin's expired sessions.
  await db.query(`delete from admin_sessions where admin_id = $1 and expires_at < $2`, [adminId, now.toISOString()]);
  return { token, expiresAt };
}

export async function findSessionAdmin(db: Db, token: string, now: Date = new Date()): Promise<Admin | null> {
  if (!token || token.length > 100) return null;
  const rows = await db.query<Admin>(
    `select u.id, coalesce(u.username, u.email) as username
     from admin_sessions s join admin_users u on u.id = s.admin_id
     where s.token_hash = $1 and s.expires_at > $2`,
    [hashToken(token), now.toISOString()],
  );
  return rows[0] ?? null;
}

export async function deleteSession(db: Db, token: string): Promise<void> {
  await db.query(`delete from admin_sessions where token_hash = $1`, [hashToken(token)]);
}

// Activity extends a live session; an expired session can never be revived.
export async function touchSession(db: Db, token: string, now: Date = new Date()): Promise<Date | null> {
  if (!token || token.length > 100) return null;
  const expiresAt = new Date(now.getTime() + ADMIN_IDLE_MS);
  const rows = await db.query<{ token_hash: string }>(
    `update admin_sessions set expires_at = $3 where token_hash = $1 and expires_at > $2 returning token_hash`,
    [hashToken(token), now.toISOString(), expiresAt.toISOString()],
  );
  return rows.length ? expiresAt : null;
}

export async function upsertAdmin(db: Db, username: string, password: string): Promise<Admin> {
  const hash = await hashPassword(password);
  const rows = await db.query<Admin>(
    `insert into admin_users (username, password_hash) values ($1, $2)
     on conflict (username) do update set password_hash = excluded.password_hash
     returning id, username`,
    [username.trim().toLowerCase(), hash],
  );
  // A password change signs out every existing session for that admin.
  await db.query(`delete from admin_sessions where admin_id = $1`, [rows[0].id]);
  return rows[0];
}
