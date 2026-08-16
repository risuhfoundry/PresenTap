import { redirect } from "next/navigation";

import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrganization, getCurrentProfile } from "@/lib/auth/profile";
import { signOutAction } from "@/lib/auth/actions";

/**
 * Authenticated dashboard shell (Phases.md Phase 2). Guards every /dashboard/*
 * route: only signed-in users with a linked organization may view it. The
 * middleware enforces the unauthenticated case; this layout enforces the
 * onboarding-incomplete case (no organization → go set it up).
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await getCurrentProfile();
  if (!profile?.organization_id) redirect("/setup/organization");

  const organization = await getCurrentOrganization();

  return (
    <div className="min-h-screen bg-background-subtle">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Brand showWordmark={false} />
            <span className="text-sm font-medium text-foreground-muted">
              {organization?.name ?? "PresenTap"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-foreground-muted sm:inline">
              {profile?.full_name || user.email}
            </span>
            <form action={signOutAction}>
              <Button type="submit" variant="secondary" size="sm">
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
