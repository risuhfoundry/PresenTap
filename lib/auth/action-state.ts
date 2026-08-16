/**
 * Result contract returned by authentication Server Actions. The action either
 * succeeds (with an optional `needsConfirmation` flag for signup when email
 * confirmation is required) or returns a single safe, user-facing error string.
 * Server Actions that navigate call `redirect()` and never return.
 *
 * `ok` is the discriminant so callers can narrow safely under TypeScript's
 * `strict` mode: `if (result && !result.ok) { result.error }` narrows to the
 * error variant, and `if (result && result.ok) { result.needsConfirmation }`
 * narrows to the success variant.
 */
export type AuthActionState =
  | { ok: true; needsConfirmation?: boolean }
  | { ok: false; error: string };
