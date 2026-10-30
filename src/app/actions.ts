"use server";

import { getDb } from "@/lib/db";
import { bucketKey, hitRateLimit, LIMITS, pruneRateLimits } from "@/lib/rate-limit";
import { getRsvpByKey, submitRsvp } from "@/lib/rsvp";
import { z } from "zod";
import { respond, getInviteByToken } from "@/lib/godparents";
import { clientIp } from "@/lib/session";
import { isRsvpOpen } from "@/lib/time";
import { firstError, formFields, godparentSchema, personNameSchema, rsvpSchema } from "@/lib/validation";
import type { GodparentRole } from "@/content/event";

export type RsvpState =
  | { status: "idle" }
  | { status: "success"; attending: boolean; duplicateName: boolean }
  | { status: "closed" }
  | { status: "error"; message: string };

export async function submitRsvpAction(_prev: RsvpState, formData: FormData): Promise<RsvpState> {
  const parsed = rsvpSchema.safeParse(formFields(formData, ["name", "attending", "submissionKey", "website"]));
  if (!parsed.success) return { status: "error", message: firstError(parsed.error) };
  const input = parsed.data;

  // Honeypot: real guests never see this field. Pretend success, store nothing.
  if (input.website) return { status: "success", attending: input.attending === "yes", duplicateName: false };

  if (!isRsvpOpen()) return { status: "closed" };

  try {
    const db = await getDb();
    const limit = await hitRateLimit(db, bucketKey("rsvp", await clientIp()), LIMITS.rsvp);
    if (!limit.allowed) {
      return { status: "error", message: "That's a lot of replies at once. Please wait a few minutes and try again." };
    }
    const result = await submitRsvp(db, {
      name: input.name,
      attending: input.attending === "yes",
      submissionKey: input.submissionKey,
    });
    if (Math.random() < 0.02) await pruneRateLimits(db);
    return { status: "success", attending: input.attending === "yes", duplicateName: result.duplicateName };
  } catch (error) {
    // Deliberately no guest name in logs.
    console.error("RSVP submission failed:", (error as Error)?.name);
    return { status: "error", message: "We couldn't save your reply just now. Please try again in a moment." };
  }
}

// Restores a guest's own confirmation after a refresh.
export async function rsvpStatusAction(submissionKey: string): Promise<{ attending: boolean } | null> {
  const parsed = z.uuid().safeParse(submissionKey);
  if (!parsed.success) return null;
  try {
    return await getRsvpByKey(await getDb(), parsed.data);
  } catch {
    return null;
  }
}

export type GodparentState =
  | { status: "idle" }
  | { status: "success"; accepted: boolean }
  | { status: "error"; message: string };

export async function godparentAction(_prev: GodparentState, formData: FormData): Promise<GodparentState> {
  const fields = formFields(formData, ["decision", "submissionKey", "token", "role", "name", "website"]);
  const parsed = godparentSchema.safeParse({
    ...fields,
    token: fields.token || undefined,
    role: fields.role || undefined,
  });
  if (!parsed.success) return { status: "error", message: firstError(parsed.error) };
  const input = parsed.data;
  const accepted = input.decision === "accept";

  if (input.website) return { status: "success", accepted };

  try {
    const db = await getDb();
    const limit = await hitRateLimit(db, bucketKey("godparent", await clientIp()), LIMITS.godparent);
    if (!limit.allowed) {
      return { status: "error", message: "Please wait a few minutes and try again." };
    }

    let name: string;
    let role: GodparentRole | undefined = input.role;
    let inviteId: string | undefined;

    if (input.token) {
      const invite = await getInviteByToken(db, input.token);
      if (!invite) return { status: "error", message: "This invitation link is no longer valid." };
      name = invite.displayName;
      role = invite.role;
      inviteId = invite.id;
    } else {
      const parsedName = personNameSchema.safeParse(input.name ?? "");
      if (!parsedName.success) return { status: "error", message: firstError(parsedName.error) };
      name = parsedName.data;
    }

    await respond(db, { submissionKey: input.submissionKey, inviteId, name, role, accepted });
    return { status: "success", accepted };
  } catch (error) {
    console.error("Godparent response failed:", (error as Error)?.name);
    return { status: "error", message: "We couldn't save your answer just now. Please try again in a moment." };
  }
}
