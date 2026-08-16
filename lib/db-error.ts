/**
 * Maps raw Supabase/Postgres errors to safe, user-facing messages.
 *
 * SECURITY (Rules.md §4.4 / §4.6): we never return the raw error string, SQL,
 * constraint names (except as an internal hint), or secrets to the browser. The
 * raw error is only inspected server-side to pick a friendly message.
 *
 * Postgres error codes of interest:
 *  - 23505 unique_violation (e.g. duplicate roll number / rfid)
 *  - 23514 check_violation (e.g. name too long)
 *  - 23503 foreign_key_violation (e.g. class no longer exists)
 *  - 42501 insufficient_privilege (RLS denial)
 */
export interface DbErrorLike {
  code?: string | null;
  message?: string;
}

export function safeDbErrorMessage(
  error: DbErrorLike | unknown,
  hints?: { uniqueConstraint?: string; uniqueMessage?: string },
): string {
  const code =
    error && typeof error === "object" && "code" in error
      ? String((error as DbErrorLike).code ?? "")
      : "";
  const message =
    error && typeof error === "object" && "message" in error
      ? String((error as DbErrorLike).message ?? "").toLowerCase()
      : "";

  if (code === "23505") {
    if (hints?.uniqueConstraint && message.includes(hints.uniqueConstraint)) {
      return hints.uniqueMessage ?? "That value is already in use.";
    }
    return "That value is already in use.";
  }
  if (code === "23514") return "Some details are invalid. Please check the fields.";
  if (code === "23503") return "The selected reference is no longer valid.";
  if (code === "42501") return "You do not have permission to do that.";
  return "Something went wrong. Please try again.";
}
