import { PGlite } from "@electric-sql/pglite";
import { applySchema, type Db } from "@/lib/db";

// Fresh in-memory Postgres with the real schema applied.
export async function testDb(): Promise<Db & { pg: PGlite }> {
  const pg = new PGlite();
  const db = {
    pg,
    async query<T>(text: string, params: unknown[] = []) {
      return (await pg.query<T>(text, params)).rows;
    },
  };
  await applySchema(db);
  return db;
}

export const uuid = () => crypto.randomUUID();
