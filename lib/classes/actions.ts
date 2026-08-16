"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/profile";
import { safeDbErrorMessage } from "@/lib/db-error";
import {
  classSchema,
  normalizeClassValues,
  type ClassValues,
} from "@/lib/classes/schemas";

/**
 * Class mutations (Phase 3). All run on the server with the request-scoped
 * Supabase client, so RLS enforces per-tenant isolation and only the anon/
 * publishable key is used. The service-role key is never imported here.
 *
 * `organization_id` is NEVER taken from the client. It is derived server-side
 * from the authenticated session (Rules.md §4.6). The insert/update payload also
 * excludes `id`, `created_at`, and `status` — status changes only through the
 * archive flow below.
 *
 * Server Actions that mutate return a typed `ClassActionState` (they do not
 * redirect, so the calling client component can close its dialog and refresh).
 */

export type ClassActionState =
  | { ok: true }
  | { ok: false; error: string };

/** Resolves the caller's organization id, or null if onboarding is incomplete. */
async function requireOrgId(): Promise<string | null> {
  const profile = await getCurrentProfile();
  return profile?.organization_id ?? null;
}

export async function createClassAction(
  values: ClassValues,
): Promise<ClassActionState> {
  const parsed = classSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: "Please check the class details and try again." };
  }

  const organizationId = await requireOrgId();
  if (!organizationId) {
    return {
      ok: false,
      error: "Please finish setting up your organization first.",
    };
  }

  const supabase = createClient();
  const { error } = await supabase.from("classes").insert({
    organization_id: organizationId,
    ...normalizeClassValues(parsed.data),
  });

  if (error) {
    return { ok: false, error: safeDbErrorMessage(error) };
  }

  revalidatePath("/dashboard/classes");
  return { ok: true };
}

export async function updateClassAction(
  classId: string,
  values: ClassValues,
): Promise<ClassActionState> {
  const parsed = classSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: "Please check the class details and try again." };
  }

  const organizationId = await requireOrgId();
  if (!organizationId) {
    return {
      ok: false,
      error: "Please finish setting up your organization first.",
    };
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("classes")
    .update(normalizeClassValues(parsed.data))
    .eq("id", classId)
    .select("id")
    .maybeSingle();

  if (error) {
    return { ok: false, error: safeDbErrorMessage(error) };
  }
  if (!data) {
    return { ok: false, error: "Class not found." };
  }

  revalidatePath("/dashboard/classes");
  revalidatePath(`/dashboard/classes/${classId}`);
  return { ok: true };
}

export async function archiveClassAction(
  classId: string,
): Promise<ClassActionState> {
  const organizationId = await requireOrgId();
  if (!organizationId) {
    return {
      ok: false,
      error: "Please finish setting up your organization first.",
    };
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("classes")
    .update({ status: "archived" })
    .eq("id", classId)
    .select("id")
    .maybeSingle();

  if (error) {
    return { ok: false, error: safeDbErrorMessage(error) };
  }
  if (!data) {
    return { ok: false, error: "Class not found." };
  }

  revalidatePath("/dashboard/classes");
  revalidatePath(`/dashboard/classes/${classId}`);
  return { ok: true };
}
