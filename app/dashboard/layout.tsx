import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";

import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrganization, getCurrentProfile } from "@/lib/auth/profile";
import { signOutAction } from "@/lib/auth/actions";
import { DashboardNav } from "@/components/dashboard/nav";

/**
 * Authenticated dashboard shell (Phases.md Phase 2, extended in Phase 3).
 *
 * Guards every /dashboard/* route: only signed-in users with a linked
 * organization may view it. The middleware enforces the unauthenticated case;
 * this layout enforces the onboarding-incomplete case (no organization → go set
 * it up). Phase 3 adds a reachable sidebar/top nav so the new Classes and
 * Students pages are one click away (Design.md §7).
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
    <div className="min-h-screen bg-background-subtle md:flex">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-white md:flex">
        <div className="flex h-16 items-center gap-2 border-b border-border px-5">
          <Brand showWordmark={false} />
          <span className="text-sm font-semibold text-foreground">PresenTap</span>
        </div>
        <div className="flex-1 p-3">
          <DashboardNav orientation="vertical" />
        </div>
        <div className="border-t border-border p-4">
          <p className="truncate text-sm font-medium text-foreground">
            {organization?.name ?? "PresenTap"}
          </p>
          <p className="truncate text-xs text-foreground-muted">
            {profile?.full_name || user.email}
          </p>
          <form action={signOutAction} className="mt-3">
            <Button type="submit" variant="secondary" size="sm" className="w-full">
              Sign out
            </Button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center gap-3 border-b border-border bg-white px-4">
          <div className="md:hidden">
            <Brand showWordmark={false} />
          </div>
          <div className="min-w-0 flex-1 md:hidden">
            <DashboardNav orientation="horizontal" />
          </div>
          <div className="ml-auto hidden text-sm text-foreground-muted md:block">
            {profile?.full_name || user.email}
          </div>
          <form action={signOutAction} className="md:hidden">
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
            </Button>
          </form>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
