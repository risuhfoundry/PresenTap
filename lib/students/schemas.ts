import { z } from "zod";

/**
 * Validation for Student create/edit forms (Phase 3).
 *
 * Runs client-side (React Hook Form) AND is re-parsed server-side in the Server
 * Actions. Messages are user-facing and never echo raw input, SQL, or secrets.
 * Field bounds mirror the `students` table CHECK constraints in
 * `supabase/migrations/0005_students.sql` (full_name 1–120). `rfid_uid` is
 * deliberately EXCLUDED — RFID enrollment is a Phase 7 workflow and must not be
 * mutated here (see Phases.md Phase 3 scope).
 */

export const STUDENT_NAME_MAX = 120;
export const STUDENT_TEXT_MAX = 60;

export const studentSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(1, { message: "Student name is required." })
    .max(STUDENT_NAME_MAX, {
      message: `Student name must be ${STUDENT_NAME_MAX} characters or fewer.`,
    }),
  class_id: z
    .string()
    .uuid({ message: "Please choose a valid class." }),
  roll_number: z
    .string()
    .trim()
    .max(STUDENT_TEXT_MAX, {
      message: `Roll number must be ${STUDENT_TEXT_MAX} characters or fewer.`,
    })
    .optional()
    .or(z.literal("")),
  student_identifier: z
    .string()
    .trim()
    .max(STUDENT_TEXT_MAX, {
      message: `Student identifier must be ${STUDENT_TEXT_MAX} characters or fewer.`,
    })
    .optional()
    .or(z.literal("")),
});

export type StudentValues = z.infer<typeof studentSchema>;

/**
 * Coerce empty-string optionals to `null` and trim the name before persistence.
 * Keeps the payload consistent with the nullable columns.
 */
export function normalizeStudentValues(values: StudentValues): {
  full_name: string;
  class_id: string;
  roll_number: string | null;
  student_identifier: string | null;
} {
  const emptyToNull = (v: string | undefined | null): string | null =>
    v && v.trim().length > 0 ? v.trim() : null;
  return {
    full_name: values.full_name.trim(),
    class_id: values.class_id,
    roll_number: emptyToNull(values.roll_number),
    student_identifier: emptyToNull(values.student_identifier),
  };
}
