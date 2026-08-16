import { cookies } from "next/headers";

import { createServerClient, type CookieOptions } from "@supabase/ssr";

import { requireSupabaseEnv } from "./env";

/**
 * Server Supabase client (Server Components, Route Handlers, Server Actions).
 * Reads/writes the session cookie through Next's cookie store. The anon/
 * publishable key is used; RLS enforces per-tenant isolation. Writing cookies
 * from a Server Component is a no-op (the middleware owns the session refresh),
 * so we swallow that specific error.
 */
export function createClient() {
  const cookieStore = cookies();
  const { url, anonKey } = requireSupabaseEnv();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a Server Component where cookies are read-only. The
          // middleware already refreshed the session, so this is safe to skip.
        }
      },
    },
  });
}
