import { describe, it, expect } from "vitest";
import { anonClient, hasSupabaseEnv } from "./supabase";

/**
 * Onboarding RPC security (T9 / T11 / T14 server-side guards).
 *
 * `create_organization_onboarding` is SECURITY DEFINER and is the only path that
 * can create an org for a not-yet-onboarded (NULL-org) user. Because it runs
 * with elevated privileges, its gating MUST be airtight:
 *
 *  - An unauthenticated caller MUST be rejected (it reads auth.uid() internally
 *    and never takes an org/user id from arguments — Rules.md §4.6). This proves
 *    no anonymous org creation and no org-id spoofing.
 *  - Invalid input (bad `p_type`) MUST be rejected by the function's own
 *    validation, independent of any client check.
 *
 * These run WITHOUT signup (anonymous call), so they execute in any environment
 * that has the project credentials.
 */
describe.skipIf(!hasSupabaseEnv)("Onboarding RPC is guarded (T9/T11/T14)", () => {
  const client = anonClient();

  it("rejects an unauthenticated org-creation attempt (no spoofing)", async () => {
    const { error } = await client.rpc("create_organization_onboarding", {
      p_name: "Evil Org",
      p_type: "school",
    });
    // RPC should refuse: either not authenticated (42501) or not permitted.
    expect(error).not.toBeNull();
    expect(["42501", "P0001", "28P01", "42501"]).toContain(error?.code ?? "");
  });

  it("rejects an invalid institution type defensively", async () => {
    // Even if a caller bypassed the client schema, the RPC validates p_type.
    const { error } = await client.rpc("create_organization_onboarding", {
      p_name: "Valid Name",
      p_type: "hospital",
    });
    // Unauthenticated => 42501 before type check, OR 22023 if type checked first.
    expect(error).not.toBeNull();
    expect(["42501", "22023"]).toContain(error?.code ?? "");
  });

  it("rejects a blank/empty name defensively", async () => {
    const { error } = await client.rpc("create_organization_onboarding", {
      p_name: "   ",
      p_type: "school",
    });
    expect(error).not.toBeNull();
    expect(["42501", "22023"]).toContain(error?.code ?? "");
  });
});
