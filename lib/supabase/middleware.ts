import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { requireSupabaseEnv } from "./env";

/**
 * Supabase client for the middleware (Edge runtime). It refreshes the auth
 * session and forwards the updated cookies on the response so the browser
 * session survives reloads. Uses the anon/publishable key only.
 */
export function createMiddlewareClient(request: NextRequest): {
  response: NextResponse;
  supabase: ReturnType<typeof createServerClient>;
} {
  let response = NextResponse.next({ request });
  const { url, anonKey } = requireSupabaseEnv();

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  return { response, supabase };
}
