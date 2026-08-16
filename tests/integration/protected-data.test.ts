import { describe, it, expect } from "vitest";
import { anonClient, hasSupabaseEnv } from "./supabase";

/**
 * T7 / T8 (protected dashboard data) and T14 (organization isolation, anon level)
 * — verified at the data layer against the live project.
 *
 * An UNAUTHENTICATED browser holds the anon key. RLS must ensure it can read
 * nothing from any protected table and write nothing to `profiles`. The seed
 * organization "Greenfield Public School" must therefore be invisible to it,
 * proving no data leaks to logged-out visitors.
 *
 * Runs against the real project with the anon key only. Skips cleanly when no
 * Supabase env is present.
 */
describe.skipIf(!hasSupabaseEnv)("Protected data is unreadable/writable by anon (T7/T8/T14)", () => {
  const client = anonClient();

  it("anon cannot read any profiles", async () => {
    const { data, error } = await client.from("profiles").select("id");
    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
    expect(data).toHaveLength(0);
  });

  it("anon cannot read the seed organization (T14 anon-level)", async () => {
    const { data, error } = await client
      .from("organizations")
      .select("id, name")
      .eq("name", "Greenfield Public School");
    expect(error).toBeNull();
    expect(data).toHaveLength(0);
  });

  it("anon cannot read classes or students (Phase 3 tables guarded too)", async () => {
    const classes = await client.from("classes").select("id");
    expect(classes.error).toBeNull();
    expect(classes.data).toHaveLength(0);

    const students = await client.from("students").select("id");
    expect(students.error).toBeNull();
    expect(students.data).toHaveLength(0);
  });

  it("anon cannot insert into profiles (RLS write block)", async () => {
    const { error } = await client.from("profiles").insert({
      id: "00000000-0000-0000-0000-000000000000",
      full_name: "attacker",
    });
    // RLS must reject the write (policy violation), never silently succeed.
    expect(error).not.toBeNull();
  });

  it("anon cannot read attendance even if it existed", async () => {
    const { data, error } = await client.from("attendance").select("id");
    expect(error).toBeNull();
    expect(data).toHaveLength(0);
  });
});
