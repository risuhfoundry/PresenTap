import { createClient } from "@/lib/supabase/server";
import type { ClassRow, ClassWithStudentCount } from "@/lib/types";

/**
 * Server-only data access for classes (Phase 3). Every query runs through the
 * request-scoped Supabase client, so RLS limits results to the caller's
 * organization — we never filter by organization_id in application code.
 *
 * This module holds NO mutation logic (that lives in `lib/classes/actions.ts`)
 * and NO presentational logic (that lives in components).
 */

/** All classes for the org, optionally including archived. RLS-scoped. */
export async function listClasses(
  includeArchived = false,
): Promise<ClassRow[]> {
  const supabase = createClient();
  let query = supabase
    .from("classes")
    .select("id, organization_id, name, section, academic_year, room, status, created_at, updated_at")
    .order("name", { ascending: true });

  if (!includeArchived) {
    query = query.eq("status", "active");
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`Unable to load classes. (${error.code ?? "db_error"})`);
  }
  return (data as ClassRow[] | null) ?? [];
}

/** A single class by id, or null if it doesn't exist / isn't in the org. */
export async function getClassById(id: string): Promise<ClassRow | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("classes")
    .select("id, organization_id, name, section, academic_year, room, status, created_at, updated_at")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    throw new Error(`Unable to load this class. (${error.code ?? "db_error"})`);
  }
  return (data as ClassRow | null) ?? null;
}

/**
 * A map of `class_id → active student count` for the whole org, computed with a
 * SINGLE query (no N+1). We fetch only `class_id` for active students and tally
 * in JS. For MVP-scale orgs this is one small round-trip; the active-students
 * index keeps it fast.
 */
export async function getActiveStudentCountByClass(): Promise<
  Record<string, number>
> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("students")
    .select("class_id")
    .eq("status", "active");
  if (error) {
    throw new Error(
      `Unable to count students. (${error.code ?? "db_error"})`,
    );
  }
  const rows = (data as { class_id: string }[] | null) ?? [];
  const counts: Record<string, number> = {};
  for (const row of rows) {
    if (!row.class_id) continue;
    counts[row.class_id] = (counts[row.class_id] ?? 0) + 1;
  }
  return counts;
}

/**
 * Classes annotated with their active student count. Used by the class list and
 * (indirectly) for the count shown on the class detail header.
 */
export async function listClassesWithStudentCounts(
  includeArchived = false,
): Promise<ClassWithStudentCount[]> {
  const [classes, counts] = await Promise.all([
    listClasses(includeArchived),
    getActiveStudentCountByClass(),
  ]);
  return classes.map((klass) => ({
    ...klass,
    studentCount: counts[klass.id] ?? 0,
  }));
}
