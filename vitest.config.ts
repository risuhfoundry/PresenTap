import { defineConfig } from "vitest/config";
import path from "node:path";

/**
 * Vitest configuration (Phases.md Phase 2 → Step 21 tests).
 *
 * - `environment: "node"` — unit tests are pure; integration tests use the
 *   `@supabase/supabase-js` Node client directly (not the browser/SSR clients),
 *   so no DOM is required.
 * - `@/` alias mirrors tsconfig so tests can import the same app modules.
 * - Integration tests that touch the live Supabase project get a generous
 *   timeout (network round-trips are ~1–2s each).
 *
 * Pure-logic tests always run. Live integration tests self-gate: they skip
 * unless Supabase env is present (and, for the authenticated flow, RUN_E2E=1).
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts", "tests/**/*.test.ts"],
    testTimeout: 20000,
    hookTimeout: 20000,
  },
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "."),
    },
  },
});
