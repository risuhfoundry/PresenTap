import type { PostAuthDestination } from "@/lib/types";

/**
 * User-facing auth error message. Converts raw Supabase errors into safe,
 * non-enumerating messages. NEVER returns the raw error string, the SQL, the
 * email, or any secret — this prevents leaking whether an account exists or
 * exposing internal errors.
 */
export function normalizeAuthError(error: unknown): string {
  if (!error || typeof error !== "object") {
    return "Something went wrong. Please try again.";
  }

  const code = "code" in error ? String((error as { code?: unknown }).code) : "";
  const message =
    "message" in error ? String((error as { message?: unknown }).message) : "";

  switch (code) {
    case "invalid_credentials":
      return "Invalid email or password.";
    case "email_not_confirmed":
      return "Please confirm your email address before signing in. Check your inbox for a confirmation link.";
    case "user_already_exists":
    case "user_already_registered":
      return "An account with this email already exists. Try signing in instead.";
    case "weak_password":
      return "Password is too weak. Use at least 8 characters with a letter and a number.";
    case "signup_disabled":
      return "Sign-ups are currently disabled. Contact support.";
    case "forgot_password_disabled":
      return "Password reset is currently unavailable. Contact support.";
    case "too_many_requests":
      return "Too many attempts. Please wait a moment and try again.";
    case "otp_expired":
    case "expired":
      return "This link has expired. Please request a new one.";
    case "validation_failed":
      return "Please check your details and try again.";
    default:
      break;
  }

  // Fall back to safe substring matching on the message (still no raw passthrough).
  const lower = message.toLowerCase();
  if (lower.includes("password")) return "Invalid email or password.";
  if (lower.includes("email") && lower.includes("confirm"))
    return "Please confirm your email address before signing in.";
  if (lower.includes("already") && lower.includes("exist"))
    return "An account with this email already exists. Try signing in instead.";
  if (lower.includes("weak"))
    return "Password is too weak. Use at least 8 characters with a letter and a number.";

  return "Something went wrong. Please try again.";
}

/**
 * Where to send a user after authentication, based on whether their profile is
 * already linked to an organization. Used by login/signup flows and middleware.
 */
export function routeForOnboarding(hasOrganization: boolean): PostAuthDestination {
  return hasOrganization ? "/dashboard" : "/setup/organization";
}
