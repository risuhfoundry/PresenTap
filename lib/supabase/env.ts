/**
 * Centralized Supabase environment access.
 *
 * SECURITY: Only NEXT_PUBLIC_* values are read here. These are the Supabase
 * publishable/anon key, which are safe to expose to the browser by design. The
 * service-role key is intentionally NEVER imported into this client code. Phase
 * 2 organization creation uses a SECURITY DEFINER RPC invoked through the
 * authenticated client, so no secret ever reaches the browser or the bundle.
 */

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Throws a clear, safe error (no secrets) if the required public configuration
 * is missing. Call this from client factories so misconfiguration fails loudly
 * instead of producing cryptic 400s from the Supabase client.
 */
export function requireSupabaseEnv(): {
  url: string;
  anonKey: string;
} {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      "Supabase environment is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.",
    );
  }
  return { url: SUPABASE_URL, anonKey: SUPABASE_ANON_KEY };
}
