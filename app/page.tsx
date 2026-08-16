import Link from "next/link";
import { redirect } from "next/navigation";

import { Brand } from "@/components/brand";
import { buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

/**
 * Public landing page (`/`, Phases.md Phase 2). Visible to anyone. If a session
 * exists we skip the marketing and send the user into the app — the dashboard
 * layout then routes them by onboarding state.
 */
export default async function HomePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-2xl text-center">
        <div className="mb-10 flex justify-center">
          <Brand showWordmark={false} className="scale-150" />
        </div>
        <h1 className="text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          Effortless attendance with a single tap
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-pretty text-lg text-foreground-muted">
          PresenTap turns RFID taps into accurate, real-time attendance for
          schools and colleges — no manual roll calls, no spreadsheets.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/signup"
            className={buttonVariants({ variant: "primary", size: "lg" })}
          >
            Get started
          </Link>
          <Link
            href="/login"
            className={buttonVariants({ variant: "secondary", size: "lg" })}
          >
            Sign in
          </Link>
        </div>

        <p className="mt-12 text-sm text-foreground-muted">
          Built for institutions that care about being on time.
        </p>
      </div>
    </main>
  );
}
