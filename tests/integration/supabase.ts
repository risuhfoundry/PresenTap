import fs from "node:fs";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Shared harness for live integration tests (Phases.md Phase 2 → Step 21).
 *
 * These tests talk to the real Supabase project using ONLY the anon/publishable
 * key — exactly the credential a browser would hold. They never load (and the
 * repo never commits) the service-role key, so they cannot bypass RLS and
 * therefore exercise the SAME isolation guarantees the app relies on.
 *
 * Supabase env is read from the process (Vitest auto-loads .env files) and, as a
 * fallback, from .env.local so the tests run no matter how the runner loads env.
 */

function loadEnvLocal(): void {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return;
  }
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

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** True when the project credentials are available. Live suites self-skip when false. */
export const hasSupabaseEnv = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

/** An unauthenticated client — the exact posture of a logged-out browser. */
export function anonClient(): SupabaseClient {
  if (!hasSupabaseEnv) throw new Error("Supabase env not configured");
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
