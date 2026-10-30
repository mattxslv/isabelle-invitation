import { describe, expect, it } from "vitest";
import { godparentSchema, inviteSchema, loginSchema, nameKey, normalizeName, rsvpSchema } from "@/lib/validation";

const key = "6f1d2c1e-8a8e-4c3e-9a55-0d5f1f3b2a10";

describe("normalizeName", () => {
  it("trims, collapses whitespace, and strips invisible characters", () => {
    expect(normalizeName("  Maria ​  Santos\n")).toBe("Maria Santos");
    expect(normalizeName("Ana‮reversed")).toBe("Anareversed");
  });
});

describe("nameKey", () => {
  it("matches the same person written differently", () => {
    expect(nameKey("José  Rizal.")).toBe(nameKey("jose rizal"));
    expect(nameKey("Tita Baby")).not.toBe(nameKey("Tito Baby"));
  });
});

describe("rsvpSchema", () => {
  it("accepts a valid reply", () => {
    const r = rsvpSchema.parse({ name: " Maria  Santos ", attending: "yes", submissionKey: key });
    expect(r).toEqual({ name: "Maria Santos", attending: "yes", submissionKey: key, website: "" });
  });

  it("requires a name with letters", () => {
    expect(rsvpSchema.safeParse({ name: "   ", attending: "yes", submissionKey: key }).success).toBe(false);
    expect(rsvpSchema.safeParse({ name: "!!!", attending: "yes", submissionKey: key }).success).toBe(false);
  });

  it("rejects names that are too long", () => {
    expect(rsvpSchema.safeParse({ name: "a".repeat(101), attending: "no", submissionKey: key }).success).toBe(false);
  });

  it("requires an explicit attendance answer (no default)", () => {
    const r = rsvpSchema.safeParse({ name: "Maria", submissionKey: key });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0]?.message).toBe("Please let us know if you can join us.");
    expect(rsvpSchema.safeParse({ name: "Maria", attending: "maybe", submissionKey: key }).success).toBe(false);
  });

  it("requires a submission key", () => {
    expect(rsvpSchema.safeParse({ name: "Maria", attending: "yes", submissionKey: "nope" }).success).toBe(false);
  });

  it("passes the honeypot value through for the action to check", () => {
    expect(rsvpSchema.parse({ name: "Bot", attending: "yes", submissionKey: key, website: "spam.example" }).website).toBe(
      "spam.example",
    );
  });
});

describe("godparent and admin schemas", () => {
  it("validates godparent decisions and tokens", () => {
    expect(godparentSchema.safeParse({ decision: "accept", submissionKey: key }).success).toBe(true);
    expect(godparentSchema.safeParse({ decision: "maybe", submissionKey: key }).success).toBe(false);
    expect(godparentSchema.safeParse({ decision: "accept", submissionKey: key, token: "../../etc" }).success).toBe(false);
  });

  it("validates invites and logins", () => {
    expect(inviteSchema.safeParse({ displayName: "Maria", role: "ninang" }).success).toBe(true);
    expect(inviteSchema.safeParse({ displayName: "Maria", role: "tita" }).success).toBe(false);
    expect(loginSchema.parse({ username: " Avilanes ", password: "x" }).username).toBe("avilanes");
  });
});
