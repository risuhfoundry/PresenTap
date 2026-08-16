import { describe, it, expect } from "vitest";
import {
  classSchema,
  normalizeClassValues,
  CLASS_NAME_MAX,
  CLASS_TEXT_MAX,
} from "@/lib/classes/schemas";

/**
 * Lock the class validation contract (Phase 3). These rules run on BOTH the
 * client form and the server action, so a regression here breaks the same path
 * the user hits.
 */
describe("classSchema", () => {
  it("requires a name", () => {
    const r = classSchema.safeParse({ name: "", section: "", academic_year: "", room: "" });
    expect(r.success).toBe(false);
  });

  it("rejects a name longer than the limit", () => {
    const r = classSchema.safeParse({ name: "x".repeat(CLASS_NAME_MAX + 1) });
    expect(r.success).toBe(false);
  });

  it("accepts a valid class with only a name", () => {
    const r = classSchema.safeParse({ name: "Grade 11" });
    expect(r.success).toBe(true);
  });

  it("allows empty-string optionals (treated as unset)", () => {
    const r = classSchema.safeParse({ name: "Physics", section: "", academic_year: "", room: "" });
    expect(r.success).toBe(true);
  });

  it("rejects an over-long section", () => {
    const r = classSchema.safeParse({ name: "Physics", section: "x".repeat(CLASS_TEXT_MAX + 1) });
    expect(r.success).toBe(false);
  });

  it("rejects an over-long academic year", () => {
    const r = classSchema.safeParse({ name: "Physics", academic_year: "x".repeat(CLASS_TEXT_MAX + 1) });
    expect(r.success).toBe(false);
  });
});

describe("normalizeClassValues", () => {
  it("trims the name and converts blanks to null", () => {
    const out = normalizeClassValues({
      name: "  Biology  ",
      section: "  ",
      academic_year: "",
      room: "Room 1",
    });
    expect(out).toEqual({
      name: "Biology",
      section: null,
      academic_year: null,
      room: "Room 1",
    });
  });

  it("keeps provided optional values trimmed", () => {
    const out = normalizeClassValues({
      name: "Math",
      section: " A ",
      academic_year: "2025-2026",
      room: "R2",
    });
    expect(out.section).toBe("A");
    expect(out.academic_year).toBe("2025-2026");
    expect(out.room).toBe("R2");
  });
});
