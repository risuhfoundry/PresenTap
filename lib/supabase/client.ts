"use client";

import { createBrowserClient } from "@supabase/ssr";

import { requireSupabaseEnv } from "./env";

/**
 * Browser Supabase client. Uses the anon/publishable key only. Session is
 * persisted in cookies and kept in sync with the server by the middleware.
 * NEVER pass a service-role key here.
 */
export function createBrowserClient_(): ReturnType<typeof createBrowserClient> {
  const { url, anonKey } = requireSupabaseEnv();
  return createBrowserClient(url, anonKey);
}
