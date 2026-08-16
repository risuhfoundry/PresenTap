import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * Auth callback (Architecture.md §3.4, Phases.md Phase 2).
 *
 * Supabase redirects here after email confirmation or password-reset requests,
 * carrying a single-use `code`. We exchange it for a session (which sets the
 * auth cookies on the response) and forward the user to `next` (default
 * /dashboard). The `next` param is constrained to internal paths to prevent
 * open redirects.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const nextParam = url.searchParams.get("next");

  // Constrain redirect target to same-origin internal paths only.
  let next = "/dashboard";
  if (
    nextParam &&
    nextParam.startsWith("/") &&
    !nextParam.startsWith("//") &&
    !nextParam.startsWith("/\\")
  ) {
    next = nextParam;
  }

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${url.origin}${next}`);
    }
  }

  // Something went wrong (expired/invalid code). Send to login with a flag.
  return NextResponse.redirect(`${url.origin}/login?error=auth`);
}
