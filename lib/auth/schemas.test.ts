import { describe, it, expect } from "vitest";
import {
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  organizationSchema,
  passwordSchema,
  emailSchema,
  ORGANIZATION_TYPES,
} from "@/lib/auth/schemas";

/**
 * T1 (signup validation), T5 (invalid input handling) and the organization
 * schema are enforced by these Zod schemas on BOTH client and server. These
 * tests lock that contract so a regression in the rules fails loudly.
 */

describe("passwordSchema", () => {
  it("rejects passwords shorter than 8 characters", () => {
    const r = passwordSchema.safeParse("Ab1");
    expect(r.success).toBe(false);
  });

  it("rejects passwords with no number", () => {
    const r = passwordSchema.safeParse("Abcdefgh");
    expect(r.success).toBe(false);
  });

  it("rejects passwords with no letter", () => {
    const r = passwordSchema.safeParse("12345678");
    expect(r.success).toBe(false);
  });

  it("accepts a valid password", () => {
    const r = passwordSchema.safeParse("Secret123");
    expect(r.success).toBe(true);
  });

  it("rejects over-long passwords", () => {
    const r = passwordSchema.safeParse("a".repeat(73) + "1");
    expect(r.success).toBe(false);
  });
});

describe("emailSchema", () => {
  it("rejects an address without an @", () => {
    expect(emailSchema.safeParse("not-an-email").success).toBe(false);
  });

  it("normalizes to lowercase on success", () => {
    const r = emailSchema.safeParse("User@Example.COM");
    expect(r.success).toBe(true);
    if (r.success) expect(r.data).toBe("user@example.com");
  });
});

describe("signupSchema", () => {
  const base = { fullName: "Ada Lovelace", email: "ada@example.com", password: "Secret123" };

  it("accepts matching passwords", () => {
    expect(signupSchema.safeParse({ ...base, confirmPassword: "Secret123" }).success).toBe(true);
  });

  it("rejects mismatched passwords (T1 confirm match)", () => {
    const r = signupSchema.safeParse({ ...base, confirmPassword: "Different1" });
    expect(r.success).toBe(false);
    if (!r.success) {
      const issue = r.error.issues.find((i) => i.path.includes("confirmPassword"));
      expect(issue?.message).toBe("Passwords do not match.");
    }
  });

  it("rejects an empty full name", () => {
    expect(signupSchema.safeParse({ ...base, fullName: "   ", confirmPassword: "Secret123" }).success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("rejects a missing password", () => {
    expect(loginSchema.safeParse({ email: "a@b.com", password: "" }).success).toBe(false);
  });

  it("accepts valid credentials shape", () => {
    expect(loginSchema.safeParse({ email: "a@b.com", password: "whatever" }).success).toBe(true);
  });
});

describe("forgotPasswordSchema", () => {
  it("rejects an invalid email", () => {
    expect(forgotPasswordSchema.safeParse({ email: "nope" }).success).toBe(false);
  });

  it("accepts a valid email", () => {
    expect(forgotPasswordSchema.safeParse({ email: "a@b.com" }).success).toBe(true);
  });
});

describe("organizationSchema", () => {
  it("only allows the school/college enum (ORGANIZATION_TYPES)", () => {
    expect(ORGANIZATION_TYPES).toEqual(["school", "college"]);
  });

  it("rejects an invalid type", () => {
    const r = organizationSchema.safeParse({ name: "Greenfield", type: "hospital" });
    expect(r.success).toBe(false);
  });

  it("accepts type school", () => {
    expect(organizationSchema.safeParse({ name: "Greenfield", type: "school" }).success).toBe(true);
  });

  it("accepts type college", () => {
    expect(organizationSchema.safeParse({ name: "Greenfield", type: "college" }).success).toBe(true);
  });

  it("treats empty logoUrl as optional (no URL)", () => {
    expect(organizationSchema.safeParse({ name: "Greenfield", type: "school", logoUrl: "" }).success).toBe(true);
  });

  it("rejects a malformed logoUrl", () => {
    const r = organizationSchema.safeParse({ name: "Greenfield", type: "school", logoUrl: "not-a-url" });
    expect(r.success).toBe(false);
  });
});
