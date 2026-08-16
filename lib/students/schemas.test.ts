import { describe, it, expect } from "vitest";
import {
  studentSchema,
  normalizeStudentValues,
  STUDENT_NAME_MAX,
  STUDENT_TEXT_MAX,
} from "@/lib/students/schemas";

const UUID = "11111111-1111-1111-1111-111111111111";

/**
 * Lock the student validation contract (Phase 3). Runs on both client and server.
 * Critically, `rfid_uid` MUST NOT be accepted by this schema — RFID enrollment is
 * a later phase and is display-only here. A regression that lets rfid_uid through
 * would reopen a Phase 3 out-of-scope write.
 */
describe("studentSchema", () => {
  it("requires a full name", () => {
    const r = studentSchema.safeParse({ full_name: "", class_id: UUID });
    expect(r.success).toBe(false);
  });

  it("rejects an over-long full name", () => {
    const r = studentSchema.safeParse({ full_name: "x".repeat(STUDENT_NAME_MAX + 1), class_id: UUID });
    expect(r.success).toBe(false);
  });

  it("requires a valid class uuid", () => {
    const r = studentSchema.safeParse({ full_name: "Ada", class_id: "not-a-uuid" });
    expect(r.success).toBe(false);
  });

  it("accepts a valid student with optionals omitted", () => {
    const r = studentSchema.safeParse({ full_name: "Ada", class_id: UUID });
    expect(r.success).toBe(true);
  });

  it("accepts empty-string optionals", () => {
    const r = studentSchema.safeParse({
      full_name: "Ada",
      class_id: UUID,
      roll_number: "",
      student_identifier: "",
    });
    expect(r.success).toBe(true);
  });

  it("rejects an over-long roll number", () => {
    const r = studentSchema.safeParse({ full_name: "Ada", class_id: UUID, roll_number: "x".repeat(STUDENT_TEXT_MAX + 1) });
    expect(r.success).toBe(false);
  });

  it("STRIPs rfid_uid — RFID is never set through this form (Phase 3 scope)", () => {
    const r = studentSchema.safeParse({
      full_name: "Ada",
      class_id: UUID,
      rfid_uid: "AA:BB:CC:DD",
    });
    expect(r.success).toBe(true);
    if (r.success) {
      // The parsed result must not carry rfid_uid to the database layer.
      expect(("rfid_uid" in r.data)).toBe(false);
    }
  });
});

describe("normalizeStudentValues", () => {
  it("trims the name and converts blanks to null", () => {
    const out = normalizeStudentValues({
      full_name: "  Ada  ",
      class_id: UUID,
      roll_number: "  ",
      student_identifier: "",
    });
    expect(out).toEqual({
      full_name: "Ada",
      class_id: UUID,
      roll_number: null,
      student_identifier: null,
    });
  });

  it("keeps provided optional values trimmed", () => {
    const out = normalizeStudentValues({
      full_name: "Ada",
      class_id: UUID,
      roll_number: " 12 ",
      student_identifier: "S-1",
    });
    expect(out.roll_number).toBe("12");
    expect(out.student_identifier).toBe("S-1");
  });
});
