import { createHash } from "node:crypto";
import type { Db } from "./db";

export type Limit = { limit: number; windowSeconds: number };

export const LIMITS = {
  rsvp: { limit: 8, windowSeconds: 600 },
  godparent: { limit: 8, windowSeconds: 600 },
  loginIp: { limit: 10, windowSeconds: 900 },
  loginUsername: { limit: 6, windowSeconds: 900 },
} satisfies Record<string, Limit>;

// Fixed-window counter stored in Postgres so it holds across serverless instances.
export async function hitRateLimit(
  db: Db,
  bucket: string,
  { limit, windowSeconds }: Limit,
  now: Date = new Date(),
): Promise<{ allowed: boolean; hits: number }> {
  const windowMs = windowSeconds * 1000;
  const windowStart = new Date(Math.floor(now.getTime() / windowMs) * windowMs);
  const rows = await db.query<{ hits: number }>(
    `insert into rate_limits (bucket, window_start, hits) values ($1, $2, 1)
     on conflict (bucket, window_start) do update set hits = rate_limits.hits + 1
     returning hits`,
    [bucket, windowStart.toISOString()],
  );
  const hits = Number(rows[0]?.hits ?? 1);
  return { allowed: hits <= limit, hits };
}

export async function pruneRateLimits(db: Db): Promise<void> {
  await db.query(`delete from rate_limits where window_start < now() - interval '1 day'`);
}

// Buckets never contain raw IPs or usernames, only salted hashes.
export function bucketKey(scope: string, value: string): string {
  const salt = process.env.RATE_LIMIT_SALT ?? "isabelle-dev-salt";
  const digest = createHash("sha256").update(`${salt}:${scope}:${value}`).digest("base64url");
  return `${scope}:${digest.slice(0, 32)}`;
}
