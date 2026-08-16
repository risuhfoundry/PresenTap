import { NextResponse, type NextRequest } from "next/server";

import { createMiddlewareClient } from "@/lib/supabase/middleware";

/**
 * Auth boundary (Architecture.md §3.4, Phases.md Phase 2).
 *
 * Responsibilities:
 *  - Refresh the Supabase session cookie on every request so the browser
 *    session survives reloads (T4).
 *  - Redirect unauthenticated users away from protected routes
 *    (/dashboard/*, /setup/*) to /login (T5, T12).
 *  - Redirect already-authenticated users away from the auth pages
 *    (/login, /signup, /forgot-password) so they aren't shown a login they
 *    don't need; the dashboard layout then routes them by onboarding state.
 *
 * This is server-side enforcement — never rely on client checks alone.
 */
const PUBLIC_PATHS = [
  "/",
  "/login",
  "/signup",
  "/forgot-password",
  "/auth/callback",
  "/update-password",
];

export async function middleware(request: NextRequest) {
  const { response, supabase } = createMiddlewareClient(request);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  const isPublic = PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  // Unauthenticated → protected route: send to login, preserving where they
  // were headed so we can return them after sign-in.
  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectedFrom", pathname);
    return NextResponse.redirect(url);
  }

  // Authenticated → auth page: hand off to the app shell, which routes by
  // onboarding state (has organization?).
  if (
    user &&
    (pathname === "/login" ||
      pathname === "/signup" ||
      pathname === "/forgot-password")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static assets and image files so the
     * session refresh and route guards run for every app route.
     */
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt)$).*)",
  ],
};
