import fs from "node:fs";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Shared harness for Phase 3 E2E tests (tests/e2e/*).
 *
 * These run against the DEDICATED E2E Supabase project (ref lnzvzlkqxiqifrqfqafj),
 * a throwaway project that allows open signups so the full create→read→update→
 * archive and cross-org isolation flows can be exercised end to end without an
 * email allowlist.
 *
 * SECURITY: only the anon/publishable key is ever used here — exactly the
 * credential a browser holds. RLS is therefore enforced for real; these tests
 * cannot bypass tenant isolation and so prove the same guarantees the app relies
 * on. The service-role key is never present in this environment.
 *
 * Credentials are read from E2E_SUPABASE_URL / E2E_SUPABASE_ANON_KEY (set in
 * .env.local), with .env.local re-loaded as a fallback. The suite self-skips when
 * they are absent.
 */

function loadEnvLocal(): void {
  if (process.env.E2E_SUPABASE_URL && process.env.E2E_SUPABASE_ANON_KEY) return;
  const p = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(p)) return;
  const txt = fs.readFileSync(p, "utf8");
  for (const line of txt.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && m[1] && m[2] !== undefined && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}

loadEnvLocal();

export const E2E_URL = process.env.E2E_SUPABASE_URL ?? "";
export const E2E_ANON_KEY = process.env.E2E_SUPABASE_ANON_KEY ?? "";

/** True when the E2E project credentials are present. The suite self-skips when false. */
export const hasE2EEnv = Boolean(E2E_URL && E2E_ANON_KEY);

/** A fresh anon-key client (no session). Use for anon-isolation assertions. */
export function anonClient(): SupabaseClient {
  if (!hasE2EEnv) throw new Error("E2E Supabase env not configured");
  return createClient(E2E_URL, E2E_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** A session-holding client for a signed-up user. */
export function authClient(): SupabaseClient {
  if (!hasE2EEnv) throw new Error("E2E Supabase env not configured");
  return createClient(E2E_URL, E2E_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Signs up a brand-new user (open signups on the E2E project), asserts a live
 * session came back, and links them to a fresh organization via the onboarding
 * RPC (mirrors the app's Phase 2 onboarding). Returns the client, user id, and
 * org id. Caller is responsible for sign-out / cleanup.
 */
export async function createUserInNewOrg(
  email: string,
  password: string,
  orgName: string,
): Promise<{ client: SupabaseClient; userId: string; orgId: string }> {
  const client = authClient();
  const signup = await client.auth.signUp({
    email,
    password,
    options: { data: { full_name: orgName } },
  });
  if (signup.error) throw new Error(`signUp failed: ${signup.error.message}`);
  if (!signup.data.session) {
    throw new Error("signUp returned no session (email confirmation required on E2E project?).");
  }
  const userId = signup.data.user!.id;

  // The onboarding RPC expects a profile row for the caller (the app's signup
  // flow ensures one). Mirror that by upserting the profile first.
  const profileUpsert = await client
    .from("profiles")
    .upsert({ id: userId, full_name: orgName, role: "admin" }, { onConflict: "id" });
  if (profileUpsert.error) {
    throw new Error(`profile upsert failed: ${profileUpsert.error.message}`);
  }

  const rpc = await client.rpc("create_organization_onboarding", {
    p_name: orgName,
    p_type: "school",
  });
  if (rpc.error) throw new Error(`onboarding RPC failed: ${rpc.error.message}`);
  const orgId = (rpc.data?.[0]?.id as string) ?? null;
  if (!orgId) throw new Error("onboarding RPC returned no org id");

  return { client, userId, orgId };
}

const PASSWORD = "Testpass123";

/**
 * Phase 3 E2E entry point. Creates two isolated orgs (A and B) with one user each
 * and returns everything the class/student tests need. Cleans up sessions in the
 * returned `cleanup` function (cannot delete auth users from anon clients, but we
 * sign out and leave rows; the E2E project is disposable).
 */
export async function setupTwoOrgs(runTag: string) {
  const aEmail = `pt3-a-${runTag}@e2e.presentap.dev`;
  const bEmail = `pt3-b-${runTag}@e2e.presentap.dev`;
  const orgA = await createUserInNewOrg(aEmail, PASSWORD, `PT3 Org A ${runTag}`);
  const orgB = await createUserInNewOrg(bEmail, PASSWORD, `PT3 Org B ${runTag}`);
  return {
    orgA,
    orgB,
    async cleanup() {
      await orgA.client.auth.signOut().catch(() => {});
      await orgB.client.auth.signOut().catch(() => {});
    },
  };
}

export { PASSWORD };
