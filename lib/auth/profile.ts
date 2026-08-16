import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

/**
 * Server-only profile helpers. Every read/write goes through the request-
 * scoped Supabase server client, so RLS enforces that a user can only ever see
 * or modify their own profile. No service-role key is used.
 */

/**
 * Returns the signed-in user's profile, or null if they have no session or no
 * profile row yet. Does NOT throw on a missing profile (that is an expected
 * onboarding state).
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, organization_id, full_name, role, created_at, updated_at")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    // A missing row is onboarding-incomplete, not a failure.
    return null;
  }
  return (data as Profile | null) ?? null;
}

/**
 * Ensures the signed-in user has a profile row. If one already exists it is
 * returned unchanged; otherwise a minimal admin profile is created (organization
 * linked later during onboarding). Uses the caller's session, so RLS permits the
 * insert (id = auth.uid()).
 */
export async function ensureProfile(): Promise<Profile | null> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const existing = await getCurrentProfile();
  if (existing) return existing;

  const fullName =
    (user.user_metadata?.full_name as string | undefined)?.trim() || "";

  const { data, error } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      full_name: fullName,
      role: "admin",
      organization_id: null,
    })
    .select("id, organization_id, full_name, role, created_at, updated_at")
    .maybeSingle();

  if (error) {
    // Concurrent insert (race) may have just succeeded; refetch rather than throw.
    return getCurrentProfile();
  }
  return (data as Profile | null) ?? null;
}

/** True if the signed-in user's profile is already linked to an organization. */
export async function hasOrganization(): Promise<boolean> {
  const profile = await getCurrentProfile();
  return Boolean(profile?.organization_id);
}

/** The signed-in user's resolved organization (or null). RLS-isolated. */
export async function getCurrentOrganization(): Promise<{
  id: string;
  name: string;
  type: string;
} | null> {
  const supabase = createClient();
  const profile = await getCurrentProfile();
  if (!profile?.organization_id) return null;

  const { data, error } = await supabase
    .from("organizations")
    .select("id, name, type")
    .eq("id", profile.organization_id)
    .maybeSingle();

  if (error || !data) return null;
  return data as { id: string; name: string; type: string };
}
