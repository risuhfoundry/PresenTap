import { createClient } from "@/lib/supabase/server";
import type { StudentRow, StudentWithClass } from "@/lib/types";

/**
 * Server-only data access for students (Phase 3). All queries run through the
 * request-scoped Supabase client, so RLS limits results to the caller's
 * organization. Search/filter are pushed down to PostgREST (database-backed),
 * so we never pull the whole student table into the app to search it.
 *
 * No mutation logic here (that lives in `lib/students/actions.ts`).
 */

const STUDENT_SELECT = [
  "id",
  "organization_id",
  "class_id",
  "full_name",
  "roll_number",
  "student_identifier",
  "rfid_uid",
  "status",
  "created_at",
  "updated_at",
  "classes(name, section)",
].join(", ");

/** Escapes LIKE wildcards and neutralizes commas (which would break `.or`). */
function likePattern(q: string): string {
  const escaped = q
    .trim()
    .replace(/[\\%_]/g, (ch) => `\\${ch}`)
    .replace(/,/g, "");
  return `%${escaped}%`;
}

type StudentJoinRow = StudentRow & {
  classes: { name: string | null; section: string | null } | null;
};

/** Maps a joined row into the flat `StudentWithClass` shape. */
function mapStudent(row: StudentJoinRow): StudentWithClass {
  const { classes, ...rest } = row;
  return {
    ...rest,
    class_name: classes?.name ?? null,
    class_section: classes?.section ?? null,
  };
}

export interface ListStudentsOptions {
  /** Free-text search across full_name, roll_number, student_identifier. */
  q?: string;
  /** Filter to a single class. */
  classId?: string;
  /** When false (default), only active students are returned. */
  includeArchived?: boolean;
}

/** Searchable, filterable student list for the org (database-backed). */
export async function listStudents(
  options: ListStudentsOptions = {},
): Promise<StudentWithClass[]> {
  const supabase = createClient();
  let query = supabase.from("students").select(STUDENT_SELECT);

  if (!options.includeArchived) {
    query = query.eq("status", "active");
  }
  if (options.classId) {
    query = query.eq("class_id", options.classId);
  }
  if (options.q && options.q.trim().length > 0) {
    const pat = likePattern(options.q);
    query = query.or(
      `full_name.ilike.${pat},roll_number.ilike.${pat},student_identifier.ilike.${pat}`,
    );
  }

  query = query.order("full_name", { ascending: true });

  const { data, error } = await query;
  if (error) {
    throw new Error(`Unable to load students. (${error.code ?? "db_error"})`);
  }
  const rows = (data as unknown as StudentJoinRow[] | null) ?? [];
  return rows.map(mapStudent);
}

/** A single student by id with its class, or null if missing / not in the org. */
export async function getStudentById(id: string): Promise<StudentWithClass | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("students")
    .select(STUDENT_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) {
    throw new Error(`Unable to load this student. (${error.code ?? "db_error"})`);
  }
  if (!data) return null;
  return mapStudent(data as unknown as StudentJoinRow);
}

/** Students belonging to a specific class (optionally including archived). */
export async function listStudentsForClass(
  classId: string,
  includeArchived = false,
): Promise<StudentWithClass[]> {
  return listStudents({ classId, includeArchived });
}
