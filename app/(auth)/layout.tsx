import { redirect } from "next/navigation";

import { Brand } from "@/components/brand";
import { createClient } from "@/lib/supabase/server";

/**
 * Shell for the unauthenticated area: a centered card column with the brand
 * mark on top. If a session already exists we bail to the app so an
 * authenticated user never sees a login form (the dashboard layout then routes
 * them by onboarding state). The middleware enforces the same rule as a backstop.
 */
export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background-subtle px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Brand />
        </div>
        {children}
      </div>
    </main>
  );
}
