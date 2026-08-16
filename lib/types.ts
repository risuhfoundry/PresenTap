/**
 * Shared domain types mirroring the Supabase schema (supabase/migrations).
 * Kept in sync with Backend Schema.md. These describe the row shapes returned
 * by the authenticated client (RLS limits them to the caller's own data).
 */

export type OrganizationType = "school" | "college";

export type ProfileRole = "admin" | "teacher";

export interface Organization {
  id: string;
  name: string;
  type: OrganizationType;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  organization_id: string | null;
  full_name: string;
  role: ProfileRole;
  created_at: string;
  updated_at: string;
}

/** Authentication state derived from the Supabase session. */
export interface AuthSessionInfo {
  userId: string;
  email: string | null;
  fullName: string | null;
}

/** Where to send a user after they authenticate, based on onboarding state. */
export type PostAuthDestination = "/setup/organization" | "/dashboard";
