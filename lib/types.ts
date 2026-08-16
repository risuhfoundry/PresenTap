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

// ─── Classes (Phase 3) ────────────────────────────────────────────────────

export type ClassStatus = "active" | "archived";

/** A row from the `classes` table (RLS limits it to the caller's org). */
export interface ClassRow {
  id: string;
  organization_id: string;
  name: string;
  section: string | null;
  academic_year: string | null;
  room: string | null;
  status: ClassStatus;
  created_at: string;
  updated_at: string;
}

/** A class row annotated with its (active) student count for list/detail views. */
export interface ClassWithStudentCount extends ClassRow {
  studentCount: number;
}

// ─── Students (Phase 3) ───────────────────────────────────────────────────

export type StudentStatus = "active" | "archived";

/** A row from the `students` table (RLS limits it to the caller's org). */
export interface StudentRow {
  id: string;
  organization_id: string;
  class_id: string;
  full_name: string;
  roll_number: string | null;
  student_identifier: string | null;
  rfid_uid: string | null;
  status: StudentStatus;
  created_at: string;
  updated_at: string;
}

/** A student row joined with its class display name for list/detail views. */
export interface StudentWithClass extends StudentRow {
  class_name: string | null;
  class_section: string | null;
}

/** RFID registration state derived from a student's `rfid_uid`. */
export type RfidStatus = "registered" | "unregistered";
