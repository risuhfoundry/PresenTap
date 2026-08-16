import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { anonClient, hasSupabaseEnv, SUPABASE_URL, SUPABASE_ANON_KEY } from "./supabase";

/**
 * Full authenticated auth + onboarding flow (T1–T6, T9–T14).
 *
 * ── WHY THIS IS GATED (and skipped in this environment) ─────────────────────
 * The PresenTap Supabase project enforces an EMAIL DOMAIN ALLOWLIST, so
 * `auth.signUp` is rejected for arbitrary test addresses. This suite therefore
 * only runs when the operator explicitly opts in with:
 *
 *     RUN_E2E=1  E2E_EMAIL_DOMAIN=your-allowed-domain.com  npm run test
 *
 * plus an environment where sign-ups and email confirmation are enabled. It
 * exercises the EXACT behavior the app's Server Actions rely on, end to end:
 *
 *   T1  signup creates an auth user
 *   T2  profile row is created (ensureProfile) for the new user
 *   T3  before onboarding, profile.organization_id is NULL
 *   T4  sign-in with the correct password establishes a session
 *   T5  sign-in with a wrong password fails with a safe error
 *   T6  the session persists across getUser() calls
 *   T9  the onboarding RPC creates the organization
 *   T10 the user's profile is linked to that organization
 *   T11 a second call does NOT create a second org (duplicate prevention)
 *   T12 sign-out clears the session
 *   T13 a password-reset email can be requested
 *   T14 a different user cannot read the first user's organization (isolation)
 *
 * NOTE ON CLEANUP: these tests create real auth users in the target project.
 * Run them against a disposable/dev project, or clean up the created users
 * afterward. They deliberately use ONLY the anon key (no service role) so they
 * cannot bypass RLS while proving isolation.
 */
const e2eEnabled =
  process.env.RUN_E2E === "1" && hasSupabaseEnv && Boolean(process.env.E2E_EMAIL_DOMAIN);

// Deterministic-ish unique emails per run so parallel runs don't collide.
const run = `${Date.now()}`;
function emailFor(label: string): string {
  const domain = process.env.E2E_EMAIL_DOMAIN ?? "example.com";
  return `pt-e2e-${label}-${run}@${domain}`;
}
const PASSWORD = "Testpass123";

describe.skipIf(!e2eEnabled)("Full auth + onboarding flow (T1–T6, T9–T14)", () => {
  let client: SupabaseClient;
  let userALogin: { email: string; password: string };
  let userAId: string;
  let userAOrgId: string;
  let userB: SupabaseClient; // a second, distinct, signed-in user

  beforeAll(async () => {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // T1 — sign up user A.
    userALogin = { email: emailFor("a"), password: PASSWORD };
    const signup = await client.auth.signUp({
      email: userALogin.email,
      password: userALogin.password,
      options: { data: { full_name: "E2E User A" } },
    });
    expect(signup.error).toBeNull();
    expect(signup.data.user).not.toBeNull();
    userAId = signup.data.user!.id;

    // If email confirmation is required, there is no session and the rest of
    // the flow cannot proceed; surface that as a clear failure.
    expect(signup.data.session, "signUp must return a live session (disable email confirmation for E2E)").not.toBeNull();

    // T2 + T3 — ensure the profile exists and starts with a NULL organization_id.
    const profileUpsert = await client.from("profiles").upsert(
      { id: userAId, full_name: "E2E User A", role: "admin" },
      { onConflict: "id" },
    );
    expect(profileUpsert.error).toBeNull();

    const { data: beforeOnboarding } = await client
      .from("profiles")
      .select("organization_id")
      .eq("id", userAId)
      .single();
    // T3 — organization_id is NULL before onboarding completes.
    expect(beforeOnboarding?.organization_id ?? null).toBeNull();
  });

  afterAll(async () => {
    // Best-effort sign-out; cannot delete the auth users from the anon client.
    await client?.auth.signOut().catch(() => {});
    await userB?.auth.signOut().catch(() => {});
  });

  it("T1: signup produced a persisted auth user", async () => {
    const { data } = await client.auth.getUser();
    expect(data.user?.id).toBe(userAId);
  });

  it("T6: the session persists across getUser() calls", async () => {
    const a = await client.auth.getUser();
    const b = await client.auth.getUser();
    expect(a.data.user?.id).toBe(userAId);
    expect(b.data.user?.id).toBe(userAId);
  });

  it("T5: sign-in with a wrong password fails with a safe error", async () => {
    const probe = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const bad = await probe.auth.signInWithPassword({
      email: userALogin.email,
      password: "Wrongpass999",
    });
    expect(bad.error).not.toBeNull();
    expect(bad.data.session).toBeNull();
  });

  it("T4: sign-in with correct credentials establishes a session", async () => {
    const probe = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const ok = await probe.auth.signInWithPassword(userALogin);
    expect(ok.error).toBeNull();
    expect(ok.data.session).not.toBeNull();
  });

  it("T9: the onboarding RPC creates the organization", async () => {
    const rpc = await client.rpc("create_organization_onboarding", {
      p_name: "E2E Academy",
      p_type: "school",
    });
    expect(rpc.error).toBeNull();
    expect(rpc.data?.[0]?.created).toBe(true);
    userAOrgId = rpc.data![0].id;
    expect(userAOrgId).toBeTruthy();
  });

  it("T10: the user's profile is linked to the new organization", async () => {
    const { data, error } = await client
      .from("profiles")
      .select("organization_id")
      .eq("id", userAId)
      .single();
    expect(error).toBeNull();
    expect(data?.organization_id).toBe(userAOrgId);
  });

  it("T11: a repeat onboarding call does NOT create a second org (dedupe)", async () => {
    const first = await client.rpc("create_organization_onboarding", {
      p_name: "E2E Academy Reloaded",
      p_type: "school",
    });
    expect(first.error).toBeNull();
    expect(first.data?.[0]?.created).toBe(false);
    expect(first.data?.[0]?.id).toBe(userAOrgId);

    const { count, error } = await client
      .from("organizations")
      .select("id", { count: "exact", head: true });
    expect(error).toBeNull();
    expect(count).toBe(1);
  });

  it("T13: a password-reset email can be requested (no enumeration)", async () => {
    const { error } = await client.auth.resetPasswordForEmail(userALogin.email, {
      redirectTo: `${SUPABASE_URL}/auth/callback?next=/update-password`,
    });
    expect(error).toBeNull();
  });

  it("T12: sign-out clears the session", async () => {
    const out = await client.auth.signOut();
    expect(out.error).toBeNull();
    const me = await client.auth.getUser();
    expect(me.data.user).toBeNull();
  });

  it("T14: a different user cannot read user A's organization (isolation)", async () => {
    // Re-create user A's session for the later steps if needed is out of scope;
    // here we simply verify cross-tenant isolation with a fresh second user.
    userB = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const signupB = await userB.auth.signUp({
      email: emailFor("b"),
      password: PASSWORD,
      options: { data: { full_name: "E2E User B" } },
    });
    expect(signupB.error).toBeNull();
    expect(signupB.data.session).not.toBeNull();

    await userB.from("profiles").upsert(
      { id: signupB.data.user!.id, full_name: "E2E User B", role: "admin" },
      { onConflict: "id" },
    );

    // User B must NOT see User A's organization via RLS.
    const { data, error } = await userB
      .from("organizations")
      .select("id")
      .eq("id", userAOrgId);
    expect(error).toBeNull();
    expect(data).toHaveLength(0);
  });
});
