import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { setupTwoOrgs, hasE2EEnv } from "./supabase";

/**
 * Phase 3 E2E — Classes & Students domain (T1–T20).
 *
 * Runs against the dedicated E2E Supabase project with the anon key only, so RLS
 * enforces organization isolation for real. Covers class CRUD, student CRUD,
 * archived hiding, student counts, duplicate-roll rejection, class assignment,
 * RFID display, DB-backed search (name/roll/identifier), class filter, and
 * cross-org (A/B) isolation for both READ and MODIFY on classes and students.
 *
 * Skips cleanly when E2E_SUPABASE_URL / E2E_SUPABASE_ANON_KEY are absent.
 */

const e2eEnabled = hasE2EEnv;

interface StudentSeed {
  full_name: string;
  roll_number?: string;
  student_identifier?: string;
  rfid_uid?: string;
  status?: "active" | "archived";
}

async function insertStudent(
  client: SupabaseClient,
  organizationId: string,
  classId: string,
  seed: StudentSeed,
) {
  return client
    .from("students")
    .insert({
      organization_id: organizationId,
      class_id: classId,
      full_name: seed.full_name,
      roll_number: seed.roll_number ?? null,
      student_identifier: seed.student_identifier ?? null,
      rfid_uid: seed.rfid_uid ?? null,
      status: seed.status ?? "active",
    })
    .select("id, full_name, roll_number, student_identifier, rfid_uid, status, class_id")
    .single();
}

describe.skipIf(!e2eEnabled)("Phase 3 E2E — Classes & Students (T1–T20)", () => {
  let ctx: Awaited<ReturnType<typeof setupTwoOrgs>>;
  let classAId: string;
  let classA2Id: string;
  let archivedStudentId: string;

  beforeAll(async () => {
    const tag = `${Date.now()}`;
    ctx = await setupTwoOrgs(tag);
    const { orgA } = ctx;

    const cA = await orgA.client
      .from("classes")
      .insert({ organization_id: orgA.orgId, name: "Math", section: "A" })
      .select("id")
      .single();
    if (cA.error || !cA.data) throw new Error(`create class A failed: ${cA.error?.message}`);
    classAId = cA.data.id;

    const cA2 = await orgA.client
      .from("classes")
      .insert({ organization_id: orgA.orgId, name: "Science", section: "B" })
      .select("id")
      .single();
    if (cA2.error || !cA2.data) throw new Error(`create class A2 failed`);
    classA2Id = cA2.data.id;

    // Roster for counting / search / filter tests.
    await insertStudent(orgA.client, orgA.orgId, classAId, {
      full_name: "Alpha One",
      roll_number: "A1",
      student_identifier: "ID-ALPHA",
    });
    await insertStudent(orgA.client, orgA.orgId, classAId, {
      full_name: "Beta Two",
      roll_number: "B2",
      student_identifier: "ID-BETA",
    });
    await insertStudent(orgA.client, orgA.orgId, classAId, {
      full_name: "Zoe Unique",
      roll_number: "Z123",
      student_identifier: "ID-ZOE",
      rfid_uid: "AA:BB:CC:DD",
    });
    await insertStudent(orgA.client, orgA.orgId, classA2Id, {
      full_name: "Gamma Three",
      roll_number: "G3",
      student_identifier: "ID-GAMMA",
    });
    const arch = await insertStudent(orgA.client, orgA.orgId, classAId, {
      full_name: "Archived Pupil",
      status: "archived",
    });
    if (arch.data) archivedStudentId = arch.data.id;
  });

  afterAll(async () => {
    await ctx?.cleanup();
  });

  // ── Class CRUD (T1–T4) ────────────────────────────────────────────────────
  it("T1: create a class persists a row in the caller's org", async () => {
    const { orgA } = ctx;
    const created = await orgA.client
      .from("classes")
      .insert({ organization_id: orgA.orgId, name: "History", section: "C" })
      .select("id, name, section, status")
      .single();
    expect(created.error).toBeNull();
    expect(created.data?.name).toBe("History");
    expect(created.data?.status).toBe("active");
  });

  it("T2: the created class is readable in the list", async () => {
    const { orgA } = ctx;
    const { data, error } = await orgA.client
      .from("classes")
      .select("id, name")
      .eq("name", "Math");
    expect(error).toBeNull();
    expect(data?.some((c) => c.id === classAId)).toBe(true);
  });

  it("T3: updating a class changes its stored name", async () => {
    const { orgA } = ctx;
    const upd = await orgA.client
      .from("classes")
      .update({ name: "Mathematics" })
      .eq("id", classAId)
      .select("name")
      .single();
    expect(upd.error).toBeNull();
    expect(upd.data?.name).toBe("Mathematics");

    const reread = await orgA.client
      .from("classes")
      .select("name")
      .eq("id", classAId)
      .single();
    expect(reread.data?.name).toBe("Mathematics");
  });

  it("T4: archiving a class sets status to archived", async () => {
    const { orgA } = ctx;
    const arch = await orgA.client
      .from("classes")
      .update({ status: "archived" })
      .eq("id", classA2Id)
      .select("status")
      .single();
    expect(arch.error).toBeNull();
    expect(arch.data?.status).toBe("archived");
  });

  // ── Archived hiding (T5 class, T10 student) ────────────────────────────────
  it("T5: an archived class is hidden from the active list", async () => {
    const { orgA } = ctx;
    const active = await orgA.client
      .from("classes")
      .select("id")
      .eq("status", "active");
    expect(active.error).toBeNull();
    expect(active.data?.some((c) => c.id === classA2Id)).toBe(false);

    const archived = await orgA.client
      .from("classes")
      .select("id")
      .eq("status", "archived");
    expect(archived.data?.some((c) => c.id === classA2Id)).toBe(true);
  });

  // ── Student counts (T6) ───────────────────────────────────────────────────
  it("T6: active student count for a class excludes archived students", async () => {
    const { orgA } = ctx;
    const { data, error } = await orgA.client
      .from("students")
      .select("class_id")
      .eq("status", "active");
    expect(error).toBeNull();
    const rows = (data as { class_id: string }[]) ?? [];
    const tally: Record<string, number> = {};
    for (const r of rows) tally[r.class_id] = (tally[r.class_id] ?? 0) + 1;
    // classA has Alpha, Beta, Zoe active (3); Gamma is in classA2; archived excluded.
    expect(tally[classAId]).toBe(3);
    expect(tally[classA2Id]).toBe(1);
  });

  // ── Student CRUD (T7 create+assignment, T8 read, T9 update, T10 archive) ──
  it("T7: create a student assigns it to a class", async () => {
    const { orgA } = ctx;
    const created = await insertStudent(orgA.client, orgA.orgId, classAId, {
      full_name: "Delta Four",
      roll_number: "D4",
    });
    expect(created.error).toBeNull();
    expect(created.data?.class_id).toBe(classAId);
  });

  it("T8: the created student is readable", async () => {
    const { orgA } = ctx;
    const { data, error } = await orgA.client
      .from("students")
      .select("full_name")
      .eq("full_name", "Delta Four");
    expect(error).toBeNull();
    expect(data?.length).toBeGreaterThan(0);
  });

  it("T9: updating a student changes its stored name", async () => {
    const { orgA } = ctx;
    const found = await orgA.client
      .from("students")
      .select("id")
      .eq("full_name", "Delta Four")
      .single();
    expect(found.data).not.toBeNull();
    const id = found.data!.id;
    const upd = await orgA.client
      .from("students")
      .update({ full_name: "Delta Four Updated" })
      .eq("id", id)
      .select("full_name")
      .single();
    expect(upd.error).toBeNull();
    expect(upd.data?.full_name).toBe("Delta Four Updated");
  });

  it("T10: an archived student is hidden from the active list", async () => {
    const { orgA } = ctx;
    const active = await orgA.client
      .from("students")
      .select("id")
      .eq("status", "active")
      .eq("id", archivedStudentId);
    expect(active.data?.length).toBe(0);
    const archived = await orgA.client
      .from("students")
      .select("id")
      .eq("status", "archived")
      .eq("id", archivedStudentId);
    expect(archived.data?.length).toBe(1);
  });

  // ── Duplicate roll (T11) ───────────────────────────────────────────────────
  it("T11: a duplicate active roll number in the same class is rejected", async () => {
    const { orgA } = ctx;
    const dup = await orgA.client
      .from("students")
      .insert({
        organization_id: orgA.orgId,
        class_id: classAId,
        full_name: "Another A1",
        roll_number: "A1", // already used by Alpha One in classA
        status: "active",
      });
    expect(dup.error).not.toBeNull();
    expect(dup.error?.code).toBe("23505");
  });

  // ── RFID display (T12) ─────────────────────────────────────────────────────
  it("T12: reading a student surfaces its RFID registration state (display only)", async () => {
    const { orgA } = ctx;
    const { data, error } = await orgA.client
      .from("students")
      .select("rfid_uid, full_name")
      .eq("full_name", "Zoe Unique")
      .single();
    expect(error).toBeNull();
    expect(data?.rfid_uid).toBe("AA:BB:CC:DD");
  });

  // ── Search (T13 name, T14 roll, T15 identifier) ────────────────────────────
  it("T13: search by name returns the matching student", async () => {
    const { orgA } = ctx;
    const { data, error } = await orgA.client
      .from("students")
      .select("id")
      .or(`full_name.ilike.%Zoe%`);
    expect(error).toBeNull();
    expect(data?.length).toBe(1);
  });

  it("T14: search by roll number returns the matching student", async () => {
    const { orgA } = ctx;
    const { data, error } = await orgA.client
      .from("students")
      .select("id")
      .or(`roll_number.ilike.%Z123%`);
    expect(error).toBeNull();
    expect(data?.length).toBe(1);
  });

  it("T15: search by student identifier returns the matching student", async () => {
    const { orgA } = ctx;
    const { data, error } = await orgA.client
      .from("students")
      .select("id")
      .or(`student_identifier.ilike.%ID-ZOE%`);
    expect(error).toBeNull();
    expect(data?.length).toBe(1);
  });

  // ── Filter by class (T16) ──────────────────────────────────────────────────
  it("T16: filtering by class_id returns only that class's students", async () => {
    const { orgA } = ctx;
    const { data, error } = await orgA.client
      .from("students")
      .select("id, class_id")
      .eq("status", "active")
      .eq("class_id", classA2Id);
    expect(error).toBeNull();
    expect(data?.length).toBe(1);
    expect(data?.[0]?.class_id).toBe(classA2Id);
  });

  // ── Org A/B isolation — classes (T17 read, T18 modify) ─────────────────────
  it("T17: Org B cannot READ Org A's class", async () => {
    const { orgB } = ctx;
    const { data, error } = await orgB.client
      .from("classes")
      .select("id")
      .eq("id", classAId);
    expect(error).toBeNull();
    expect(data).toHaveLength(0);
  });

  it("T18: Org B cannot MODIFY Org A's class", async () => {
    const { orgB } = ctx;
    const upd = await orgB.client
      .from("classes")
      .update({ name: "pwned" })
      .eq("id", classAId)
      .select("id")
      .maybeSingle();
    expect(upd.error).toBeNull(); // RLS denies silently (0 rows), no error
    expect(upd.data).toBeNull();

    // And Org A still sees the original, unmodified name.
    const reread = await ctx.orgA.client
      .from("classes")
      .select("name")
      .eq("id", classAId)
      .single();
    expect(reread.data?.name).toBe("Mathematics");
  });

  // ── Org A/B isolation — students (T19 read, T20 modify) ────────────────────
  it("T19: Org B cannot READ Org A's student", async () => {
    const { orgB } = ctx;
    const { data, error } = await orgB.client
      .from("students")
      .select("id")
      .eq("full_name", "Zoe Unique");
    expect(error).toBeNull();
    expect(data).toHaveLength(0);
  });

  it("T20: Org B cannot MODIFY Org A's student", async () => {
    const { orgB } = ctx;
    const upd = await orgB.client
      .from("students")
      .update({ full_name: "pwned" })
      .eq("full_name", "Zoe Unique")
      .select("id")
      .maybeSingle();
    expect(upd.error).toBeNull();
    expect(upd.data).toBeNull();

    const reread = await ctx.orgA.client
      .from("students")
      .select("full_name")
      .eq("full_name", "Zoe Unique")
      .single();
    expect(reread.data?.full_name).toBe("Zoe Unique");
  });
});
