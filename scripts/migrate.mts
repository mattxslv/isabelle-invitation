// Applies db/schema.sql to DATABASE_URL (or the local PGlite database).
// Usage: npm run db:migrate
import { applySchema, getDb } from "../src/lib/db";

const db = await getDb();
const count = await applySchema(db);
console.log(`Schema applied (${count} statements) to ${process.env.DATABASE_URL ? "DATABASE_URL" : "local PGlite (.data/pglite)"}.`);
