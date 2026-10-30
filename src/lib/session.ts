import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "./db";
import { createSession, deleteSession, findSessionAdmin, SESSION_DAYS, type Admin } from "./auth";

const secure = process.env.NODE_ENV === "production";
// __Host- binds the cookie to this exact origin over HTTPS.
const COOKIE = secure ? "__Host-isabelle_admin" : "isabelle_admin";

export async function startAdminSession(adminId: string) {
  const db = await getDb();
  const { token, expiresAt } = await createSession(db, adminId);
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
    maxAge: SESSION_DAYS * 86400,
  });
}

export async function getCurrentAdmin(): Promise<Admin | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  return findSessionAdmin(await getDb(), token);
}

// Every admin page and action calls this; never trust the client.
export async function requireAdmin(): Promise<Admin> {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

export async function endAdminSession() {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (token) await deleteSession(await getDb(), token);
  store.delete(COOKIE);
}

export async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}
