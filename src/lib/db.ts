// Minimal database access shared by the app, scripts, and tests.
//
// Production: Neon serverless Postgres over HTTP (DATABASE_URL).
// Local dev without DATABASE_URL: PGlite (Postgres in WASM) stored in .data/.
// Tests: in-memory PGlite. All three run the same SQL.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { neon } from "@neondatabase/serverless";

export interface Db {
  query<T = Record<string, unknown>>(text: string, params?: unknown[]): Promise<T[]>;
}

export function neonDb(url: string): Db {
  const sql = neon(url);
  return {
    async query<T>(text: string, params: unknown[] = []) {
      return (await sql.query(text, params)) as T[];
    },
  };
}

export async function pgliteDb(dataDir?: string): Promise<Db> {
  const { PGlite } = await import("@electric-sql/pglite");
  const pg = new PGlite(dataDir);
  const db: Db = {
    async query<T>(text: string, params: unknown[] = []) {
      return (await pg.query<T>(text, params)).rows;
    },
  };
  await applySchema(db);
  return db;
}

export function schemaStatements(sql: string): string[] {
  return sql
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n")
    .split(/;\s*(?:\n|$)/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function applySchema(db: Db): Promise<number> {
  const sql = readFileSync(join(process.cwd(), "db", "schema.sql"), "utf8");
  const statements = schemaStatements(sql);
  for (const statement of statements) {
    await db.query(statement);
  }
  return statements.length;
}

const globalForDb = globalThis as unknown as { __isabelleDb?: Promise<Db> };

export function getDb(): Promise<Db> {
  globalForDb.__isabelleDb ??= (async () => {
    const url = process.env.DATABASE_URL;
    if (url) return neonDb(url);
    if (process.env.NODE_ENV === "production") {
      throw new Error("DATABASE_URL must be set in production.");
    }
    return pgliteDb(join(process.cwd(), ".data", "pglite"));
  })();
  return globalForDb.__isabelleDb;
}

export function toIso(value: unknown): string {
  return value instanceof Date ? value.toISOString() : new Date(String(value)).toISOString();
}
