// Creates a family admin, or resets their password. The allowlist IS the
// admin_users table: only people added here can sign in. No credentials
// live in code.
//
//   npm run admin:create -- someone@example.com
//
// Prompts for the password (input hidden). For non-interactive use, set
// ADMIN_PASSWORD in the environment for that single command.
import { createInterface } from "node:readline";
import { Writable } from "node:stream";
import { upsertAdmin } from "../src/lib/auth";
import { applySchema, getDb } from "../src/lib/db";
import { loginSchema } from "../src/lib/validation";

function ask(question: string, hidden: boolean): Promise<string> {
  let muted = false;
  const output = new Writable({
    write(chunk, _enc, cb) {
      if (!muted) process.stdout.write(chunk);
      cb();
    },
  });
  const rl = createInterface({ input: process.stdin, output, terminal: true });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      if (hidden) process.stdout.write("\n");
      resolve(answer);
    });
    muted = hidden;
  });
}

const email = process.argv[2];
if (!email) {
  console.error("Usage: npm run admin:create -- someone@example.com");
  process.exit(1);
}

let password = process.env.ADMIN_PASSWORD ?? "";
if (!password) {
  password = await ask("Password (min 12 characters): ", true);
  const again = await ask("Repeat password: ", true);
  if (password !== again) {
    console.error("Passwords don't match.");
    process.exit(1);
  }
}
if (password.length < 12) {
  console.error("Please use at least 12 characters.");
  process.exit(1);
}

const parsed = loginSchema.safeParse({ email, password });
if (!parsed.success) {
  console.error(parsed.error.issues[0]?.message);
  process.exit(1);
}

const db = await getDb();
await applySchema(db);
const admin = await upsertAdmin(db, parsed.data.email, password);
console.log(`Admin ready: ${admin.email}. Existing sessions for this account were signed out.`);
