"use server";

import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { z } from "zod";
import { authenticate } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { createInvite, deleteInvite, deleteResponse } from "@/lib/godparents";
import { bucketKey, hitRateLimit, LIMITS } from "@/lib/rate-limit";
import { deleteRsvp } from "@/lib/rsvp";
import { clientIp, endAdminSession, requireAdmin, startAdminSession } from "@/lib/session";
import { firstError, formFields, inviteSchema, loginSchema } from "@/lib/validation";

export type LoginState = { error?: string; username?: string };

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const fields = formFields(formData, ["username", "password"]);
  // Returned so the form can refill it: React resets form fields after an action.
  const username = (fields.username ?? "").slice(0, 200);
  const parsed = loginSchema.safeParse(fields);
  if (!parsed.success) return { error: firstError(parsed.error), username };

  const db = await getDb();
  const [byIp, byUsername] = await Promise.all([
    hitRateLimit(db, bucketKey("login-ip", await clientIp()), LIMITS.loginIp),
    hitRateLimit(db, bucketKey("login-username", parsed.data.username), LIMITS.loginUsername),
  ]);
  if (!byIp.allowed || !byUsername.allowed) {
    return { error: "Too many sign-in attempts. Please wait 15 minutes and try again.", username };
  }

  const admin = await authenticate(db, parsed.data.username, parsed.data.password);
  if (!admin) return { error: "That username and password don't match a family account.", username };

  await startAdminSession(admin.id);
  redirect("/admin");
}

export async function logoutAction() {
  await endAdminSession();
  redirect("/admin/login");
}

const idSchema = z.uuid();

function idFrom(formData: FormData): string | null {
  const parsed = idSchema.safeParse(formData.get("id"));
  return parsed.success ? parsed.data : null;
}

export async function deleteRsvpAction(formData: FormData) {
  await requireAdmin();
  const id = idFrom(formData);
  if (id) await deleteRsvp(await getDb(), id);
  refresh();
}

export async function deleteResponseAction(formData: FormData) {
  await requireAdmin();
  const id = idFrom(formData);
  if (id) await deleteResponse(await getDb(), id);
  refresh();
}

export async function deleteInviteAction(formData: FormData) {
  await requireAdmin();
  const id = idFrom(formData);
  if (id) await deleteInvite(await getDb(), id);
  refresh();
}

export type InviteState = { error?: string; created?: { token: string; displayName: string } };

export async function createInviteAction(_prev: InviteState, formData: FormData): Promise<InviteState> {
  await requireAdmin();
  const parsed = inviteSchema.safeParse(formFields(formData, ["displayName", "role"]));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const invite = await createInvite(await getDb(), parsed.data);
  refresh();
  return { created: { token: invite.token, displayName: invite.displayName } };
}
