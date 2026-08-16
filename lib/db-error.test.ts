import { describe, it, expect } from "vitest";
import { safeDbErrorMessage } from "@/lib/db-error";

/**
 * Verifies that raw Postgres/Supabase errors are mapped to safe, user-facing
 * strings and never leak the raw error, SQL, or constraint names to callers.
 */
describe("safeDbErrorMessage", () => {
  it("maps unique_violation (23505) to a generic duplicate message", () => {
    expect(
      safeDbErrorMessage({ code: "23505", message: "duplicate key value" }),
    ).toBe("That value is already in use.");
  });

  it("maps a named unique violation to its specific message", () => {
    expect(
      safeDbErrorMessage(
        { code: "23505", message: "violates unique constraint uq_students_roll_active" },
        {
          uniqueConstraint: "uq_students_roll_active",
          uniqueMessage: "That roll number is already used in this class.",
        },
      ),
    ).toBe("That roll number is already used in this class.");
  });

  it("maps check_violation (23514) to an invalid-details message", () => {
    expect(safeDbErrorMessage({ code: "23514", message: "check" })).toBe(
      "Some details are invalid. Please check the fields.",
    );
  });

  it("maps foreign_key_violation (23503) to a reference message", () => {
    expect(safeDbErrorMessage({ code: "23503", message: "fk" })).toBe(
      "The selected reference is no longer valid.",
    );
  });

  it("maps insufficient_privilege (42501) to a permission message", () => {
    expect(safeDbErrorMessage({ code: "42501", message: "permission" })).toBe(
      "You do not have permission to do that.",
    );
  });

  it("falls back to a generic message for unknown codes", () => {
    expect(safeDbErrorMessage({ code: "XXXX", message: "secret detail" })).toBe(
      "Something went wrong. Please try again.",
    );
  });

  it("never echoes the raw error text", () => {
    const msg = safeDbErrorMessage({
      code: "42P01",
      message: "relation students does not exist",
    });
    expect(msg).not.toContain("students");
    expect(msg).toBe("Something went wrong. Please try again.");
  });
});
