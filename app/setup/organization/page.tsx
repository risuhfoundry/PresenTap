import { redirect } from "next/navigation";

import { Brand } from "@/components/brand";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/profile";
import { OrganizationForm } from "./organization-form";

/**
 * Organization onboarding (Phases.md Phase 2). Reached immediately after a
 * user authenticates for the first time. Guarded: only authenticated users
 * without an organization may see it — already-onboarded users are sent to the
 * dashboard (the middleware also blocks unauthenticated access).
 */
export default async function SetupOrganizationPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await getCurrentProfile();
  if (profile?.organization_id) redirect("/dashboard");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background-subtle px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Brand />
        </div>
        <OrganizationForm />
      </div>
    </main>
  );
}
