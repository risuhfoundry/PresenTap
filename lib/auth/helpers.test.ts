import { describe, it, expect } from "vitest";
import { normalizeAuthError, routeForOnboarding } from "@/lib/auth/helpers";

/**
 * T5 (safe error messages) — the error normalizer must NEVER pass through the
 * raw Supabase error string, the email, SQL, or any secret. It must collapse
 * every unknown error into a single generic message so the client cannot use it
 * to enumerate accounts or learn internal details.
 */

describe("normalizeAuthError", () => {
  it("never returns the raw error string", () => {
    const raw = "password authentication failed for user x@y.com: relation auth.users";
    const out = normalizeAuthError({ message: raw, code: "P0001" });
    expect(out).not.toContain("x@y.com");
    expect(out).not.toContain("relation");
    expect(out).not.toBe(raw);
  });

  it("maps invalid_credentials to a generic message (no enumeration)", () => {
    const out = normalizeAuthError({ code: "invalid_credentials", message: "Invalid login credentials" });
    expect(out).toBe("Invalid email or password.");
  });

  it("maps email_not_confirmed", () => {
    const out = normalizeAuthError({ code: "email_not_confirmed" });
    expect(out).toMatch(/confirm your email/i);
  });

  it("maps user_already_exists / registered", () => {
    expect(normalizeAuthError({ code: "user_already_exists" })).toMatch(/already exists/i);
    expect(normalizeAuthError({ code: "user_already_registered" })).toMatch(/already exists/i);
  });

  it("maps weak_password", () => {
    expect(normalizeAuthError({ code: "weak_password" })).toMatch(/at least 8 characters/i);
  });

  it("maps too_many_requests", () => {
    expect(normalizeAuthError({ code: "too_many_requests" })).toMatch(/too many attempts/i);
  });

  it("collapses any unknown error into the generic message", () => {
    expect(normalizeAuthError({ code: "ZZ999", message: "internal detail leak" })).toBe(
      "Something went wrong. Please try again.",
    );
  });

  it("handles a non-object error safely", () => {
    expect(normalizeAuthError(null)).toBe("Something went wrong. Please try again.");
    expect(normalizeAuthError("string error")).toBe("Something went wrong. Please try again.");
  });

  it("uses message-substring fallbacks without leaking the raw message", () => {
    const out = normalizeAuthError({ code: "x", message: "Password is incorrect" });
    expect(out).toBe("Invalid email or password.");
    expect(out).not.toContain("is incorrect");
  });
});

describe("routeForOnboarding", () => {
  it("routes non-onboarded users to setup (T3/T8 guard)", () => {
    expect(routeForOnboarding(false)).toBe("/setup/organization");
  });

  it("routes onboarded users to the dashboard", () => {
    expect(routeForOnboarding(true)).toBe("/dashboard");
  });
});
