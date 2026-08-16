"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/profile";
import { safeDbErrorMessage } from "@/lib/db-error";
import {
  studentSchema,
  normalizeStudentValues,
  type StudentValues,
} from "@/lib/students/schemas";

/**
 * Student mutations (Phase 3). All run on the server with the request-scoped
 * Supabase client, so RLS enforces per-tenant isolation and only the anon/
 * publishable key is used.
 *
 * SECURITY (Rules.md §4.6): `organization_id` is derived server-side from the
 * authenticated session, never from the client. Before linking a student to a
 * class we re-select the class through RLS — a class the caller cannot see (i.e.
 * another organization's class) returns null and is rejected, preventing
 * cross-org class assignment.
 *
 * `rfid_uid` is deliberately NOT set here (Phase 3 only displays RFID state;
 * enrollment is Phase 7). `id`, `created_at`, and `status` are also excluded
 * from edits; status changes only through the archive flow below.
 */

export type StudentActionState =
  | { ok: true }
  | { ok: false; error: string };

/** Resolves the caller's organization id, or null if onboarding is incomplete. */
async function requireOrgId(): Promise<string | null> {
  const profile = await getCurrentProfile();
  return profile?.organization_id ?? null;
}

/**
 * Confirms a class id belongs to the caller's org. RLS already scopes the SELECT,
 * so a null result means the class doesn't exist OR isn't the caller's. Either
 * way the student cannot be linked to it.
 */
async function verifyClassInOrg(classId: string): Promise<boolean> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("classes")
    .select("id")
    .eq("id", classId)
    .maybeSingle();
  if (error) return false;
  return Boolean(data);
}

export async function createStudentAction(
  values: StudentValues,
): Promise<StudentActionState> {
  const parsed = studentSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: "Please check the student details and try again." };
  }

  const organizationId = await requireOrgId();
  if (!organizationId) {
    return {
      ok: false,
      error: "Please finish setting up your organization first.",
    };
  }

  if (!(await verifyClassInOrg(parsed.data.class_id))) {
    return { ok: false, error: "Please choose a valid class." };
  }

  const supabase = createClient();
  const { error } = await supabase.from("students").insert({
    organization_id: organizationId,
    ...normalizeStudentValues(parsed.data),
  });

  if (error) {
    return {
      ok: false,
      error: safeDbErrorMessage(error, {
        uniqueConstraint: "uq_students_roll_active",
        uniqueMessage: "That roll number is already used in this class.",
      }),
    };
  }

  revalidatePath("/dashboard/students");
  revalidatePath(`/dashboard/classes/${parsed.data.class_id}`);
  revalidatePath("/dashboard/classes");
  return { ok: true };
}

export async function updateStudentAction(
  studentId: string,
  values: StudentValues,
): Promise<StudentActionState> {
  const parsed = studentSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: "Please check the student details and try again." };
  }

  const organizationId = await requireOrgId();
  if (!organizationId) {
    return {
      ok: false,
      error: "Please finish setting up your organization first.",
    };
  }

  if (!(await verifyClassInOrg(parsed.data.class_id))) {
    return { ok: false, error: "Please choose a valid class." };
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("students")
    .update(normalizeStudentValues(parsed.data))
    .eq("id", studentId)
    .select("id, class_id")
    .maybeSingle();

  if (error) {
    return {
      ok: false,
      error: safeDbErrorMessage(error, {
        uniqueConstraint: "uq_students_roll_active",
        uniqueMessage: "That roll number is already used in this class.",
      }),
    };
  }
  if (!data) {
    return { ok: false, error: "Student not found." };
  }

  revalidatePath("/dashboard/students");
  revalidatePath(`/dashboard/students/${studentId}`);
  revalidatePath(`/dashboard/classes/${parsed.data.class_id}`);
  revalidatePath("/dashboard/classes");
  return { ok: true };
}

export async function archiveStudentAction(
  studentId: string,
): Promise<StudentActionState> {
  const organizationId = await requireOrgId();
  if (!organizationId) {
    return {
      ok: false,
      error: "Please finish setting up your organization first.",
    };
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("students")
    .update({ status: "archived" })
    .eq("id", studentId)
    .select("id, class_id")
    .maybeSingle();

  if (error) {
    return { ok: false, error: safeDbErrorMessage(error) };
  }
  if (!data) {
    return { ok: false, error: "Student not found." };
  }

  revalidatePath("/dashboard/students");
  revalidatePath(`/dashboard/students/${studentId}`);
  revalidatePath(`/dashboard/classes/${data.class_id}`);
  revalidatePath("/dashboard/classes");
  return { ok: true };
}
