"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  forgotPasswordSchema,
  loginSchema,
  passwordSchema,
  signupSchema,
  type ForgotPasswordValues,
  type LoginValues,
  type SignupValues,
} from "@/lib/auth/schemas";
import {
  ensureProfile,
  hasOrganization,
} from "@/lib/auth/profile";
import { normalizeAuthError, routeForOnboarding } from "@/lib/auth/helpers";
import { createClient } from "@/lib/supabase/server";
import type { AuthActionState } from "@/lib/auth/action-state";

/**
 * Auth Server Actions (Phases.md Phase 2, Architecture.md §3.4).
 *
 * All mutations run on the server with the request-scoped Supabase client, so
 * RLS enforces per-tenant isolation and the anon/publishable key is the only
 * credential used. The service-role key is never imported here. Successful
 * actions call `redirect()`, so they never return a successful state object.
 */

/** Absolute origin (scheme + host) from request headers, for reset redirect. */
function getOrigin(): string {
  const h = headers();
  const host = h.get("host");
  if (!host) return "";
  const proto = h.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

/**
 * Sign up with email + password. On success with a live session (email
 * confirmation disabled) we create the profile and go to onboarding. When email
 * confirmation is required, the session is null and we return
 * `needsConfirmation`; the profile is created at first login instead.
 */
export async function signUpAction(
  values: SignupValues,
): Promise<AuthActionState> {
  const parsed = signupSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: "Please check your details and try again." };
  }
  const { fullName, email, password } = parsed.data;

  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });

  if (error) {
    return { ok: false, error: normalizeAuthError(error) };
  }

  if (data.session && data.user) {
    await ensureProfile();
    redirect(routeForOnboarding(false));
  }

  // Email confirmation pending: the profile is created at first login.
  return { ok: true, needsConfirmation: true };
}

/**
 * Sign in with email + password. On success we guarantee a profile row exists
 * (in case signup completed via email confirmation) and route by onboarding
 * state (organization linked?).
 */
export async function signInAction(
  values: LoginValues,
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: "Please enter your email and password." };
  }
  const { email, password } = parsed.data;

  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { ok: false, error: normalizeAuthError(error) };
  }

  if (data.session) {
    await ensureProfile();
    const onboarded = await hasOrganization();
    redirect(routeForOnboarding(onboarded));
  }

  return { ok: false, error: "Unable to sign in right now. Please try again." };
}

/**
 * Request a password reset email. We always return success, regardless of
 * whether the address exists, so we never enumerate accounts.
 */
export async function forgotPasswordAction(
  values: ForgotPasswordValues,
): Promise<AuthActionState> {
  const parsed = forgotPasswordSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: "Please enter a valid email address." };
  }
  const { email } = parsed.data;

  const supabase = createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${getOrigin()}/auth/callback?next=/update-password`,
  });

  if (error) {
    return { ok: false, error: normalizeAuthError(error) };
  }

  return { ok: true };
}

/** Sign out the current session and return to the login page. */
export async function signOutAction(): Promise<void> {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

/**
 * Set a new password from the reset/recovery flow. On success, route by
 * onboarding state. (Used by /update-password.)
 */
export async function updatePasswordAction(password: string): Promise<void> {
  const parsed = passwordSchema.safeParse(password);
  if (!parsed.success) {
    redirect("/update-password?error=invalid");
  }

  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data });

  if (error) {
    redirect(
      `/update-password?error=${encodeURIComponent(normalizeAuthError(error))}`,
    );
  }

  const onboarded = await hasOrganization();
  redirect(routeForOnboarding(onboarded));
}
