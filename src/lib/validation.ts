import { z } from "zod";

// Strips control, zero-width, and bidi-override characters, collapses
// whitespace. Output is still rendered through React, which escapes it.
const INVISIBLE = /[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]/gu;

export function normalizeName(raw: string): string {
  return raw.normalize("NFC").replace(INVISIBLE, "").replace(/\s+/g, " ").trim();
}

// Loose key for spotting the same guest replying twice ("Ana Cruz" vs "ana  cruz.").
export function nameKey(name: string): string {
  return normalizeName(name)
    .toLocaleLowerCase("en")
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/[^\p{L}\p{N} ]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

const personName = z
  .string({ error: "Please enter your name." })
  .max(400, "Please keep your name under 100 characters.")
  .transform(normalizeName)
  .pipe(
    z
      .string()
      .min(1, "Please enter your name.")
      .max(100, "Please keep your name under 100 characters.")
      .refine((v) => /\p{L}/u.test(v), "Please enter your name."),
  );

export const rsvpSchema = z.object({
  name: personName,
  attending: z.enum(["yes", "no"], { error: "Please let us know if you can join us." }),
  submissionKey: z.uuid({ error: "Something went wrong. Please refresh and try again." }),
  website: z.string().max(500).default(""),
});

export type RsvpInput = z.infer<typeof rsvpSchema>;

export const godparentSchema = z.object({
  decision: z.enum(["accept", "decline"], { error: "Please choose an answer." }),
  submissionKey: z.uuid({ error: "Something went wrong. Please refresh and try again." }),
  token: z
    .string()
    .regex(/^[A-Za-z0-9_-]{16,64}$/)
    .optional(),
  role: z.enum(["ninong", "ninang"]).optional(),
  name: z.string().max(400).optional(),
  website: z.string().max(500).default(""),
});

export const inviteSchema = z.object({
  displayName: personName,
  role: z.enum(["ninong", "ninang"], { error: "Please choose Ninong or Ninang." }),
});

export const loginSchema = z.object({
  username: z.string().trim().toLowerCase().min(1, "Please enter your username.").max(50).regex(/^[a-z0-9_.-]+$/, "Use letters, numbers, dots, underscores, or hyphens for your username."),
  password: z.string().min(1, "Please enter your password.").max(200),
});

export const personNameSchema = personName;

// FormData -> plain object of string fields only (files are ignored).
export function formFields(formData: FormData, keys: string[]): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = {};
  for (const key of keys) {
    const value = formData.get(key);
    out[key] = typeof value === "string" ? value : undefined;
  }
  return out;
}

export function firstError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Please check your answers and try again.";
}
