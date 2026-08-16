import { describe, it, expect } from "vitest";

/**
 * Phase 3 E2E — unauthenticated redirect (T21, T22).
 *
 * When not signed in, /dashboard/classes and /dashboard/students must redirect to
 * /login (the middleware enforces this before any DB access). This is checked at
 * the HTTP level against a RUNNING Next.js server.
 *
 * Gated on NEXT_PUBLIC_BASE_URL (e.g. http://localhost:3000 of a `next dev` started
 * for validation). Skips otherwise so `npm run test` never fails in CI without a
 * server. The middleware redirect happens with no session cookie, so no project
 * credentials are needed for this check.
 */
const base = process.env.NEXT_PUBLIC_BASE_URL ?? "";
const enabled = Boolean(base);

async function assertRedirectsToLogin(path: string) {
  const res = await fetch(`${base}${path}`, {
    method: "GET",
    redirect: "manual",
  });
  // Next middleware issues a 307 to /login for unauthenticated dashboard routes.
  expect([307, 308, 302, 301]).toContain(res.status);
  const location = res.headers.get("location") ?? "";
  expect(location).toContain("/login");
}

describe.skipIf(!enabled)("Phase 3 E2E — unauthenticated redirect (T21/T22)", () => {
  it("T21: GET /dashboard/classes redirects to /login when unauthenticated", async () => {
    await assertRedirectsToLogin("/dashboard/classes");
  });

  it("T22: GET /dashboard/students redirects to /login when unauthenticated", async () => {
    await assertRedirectsToLogin("/dashboard/students");
  });
});
