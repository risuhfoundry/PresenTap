import { z } from "zod";

/**
 * Validation for Class create/edit forms (Phase 3).
 *
 * These schemas run client-side (React Hook Form) AND are re-parsed server-side
 * in the Server Actions, so they are the single source of truth for what a class
 * may contain. Messages are user-facing and never echo raw input, SQL, or
 * secrets. Field bounds mirror the `classes` table CHECK constraints in
 * `supabase/migrations/0004_classes.sql` (name 1–60 chars; section/academic_year/
 * room are free text capped defensively).
 */

export const CLASS_NAME_MAX = 60;
export const CLASS_TEXT_MAX = 60;

/** Fields editable on a class (name/section/academic_year/room). Status and
 * identity columns are intentionally excluded — they change via the archive flow
 * or the database, never through this form. */
export const classSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: "Class name is required." })
    .max(CLASS_NAME_MAX, {
      message: `Class name must be ${CLASS_NAME_MAX} characters or fewer.`,
    }),
  section: z
    .string()
    .trim()
    .max(CLASS_TEXT_MAX, {
      message: `Section must be ${CLASS_TEXT_MAX} characters or fewer.`,
    })
    .optional()
    .or(z.literal("")),
  academic_year: z
    .string()
    .trim()
    .max(CLASS_TEXT_MAX, {
      message: `Academic year must be ${CLASS_TEXT_MAX} characters or fewer.`,
    })
    .optional()
    .or(z.literal("")),
  room: z
    .string()
    .trim()
    .max(CLASS_TEXT_MAX, {
      message: `Room must be ${CLASS_TEXT_MAX} characters or fewer.`,
    })
    .optional()
    .or(z.literal("")),
});

export type ClassValues = z.infer<typeof classSchema>;

/**
 * Coerce empty-string optionals to `null`/`undefined` before sending to the
 * database, and trim the required name. Keeps the payload consistent with the
 * nullable columns and avoids persisting empty strings.
 */
export function normalizeClassValues(values: ClassValues): {
  name: string;
  section: string | null;
  academic_year: string | null;
  room: string | null;
} {
  const emptyToNull = (v: string | undefined | null): string | null =>
    v && v.trim().length > 0 ? v.trim() : null;
  return {
    name: values.name.trim(),
    section: emptyToNull(values.section),
    academic_year: emptyToNull(values.academic_year),
    room: emptyToNull(values.room),
  };
}
