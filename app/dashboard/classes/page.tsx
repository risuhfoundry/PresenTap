import { GraduationCap } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { CreateClassDialog } from "@/components/classes/create-class-dialog";
import { ClassTable } from "@/components/classes/class-table";
import { listClassesWithStudentCounts } from "@/lib/classes/service";

/**
 * Classes list (Phase 3). Server Component — reads the org-scoped class list with
 * student counts and renders the table. `?archived=1` reveals archived classes.
 * Mutations happen in client dialogs that call Server Actions and then refresh.
 */
export default async function ClassesPage({
  searchParams,
}: {
  searchParams: { archived?: string };
}) {
  const includeArchived = searchParams.archived === "1";
  const classes = await listClassesWithStudentCounts(includeArchived);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Classes
          </h1>
          <p className="mt-1 text-sm text-foreground-muted">
            Manage your institution&apos;s classes.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={
              includeArchived
                ? "/dashboard/classes"
                : "/dashboard/classes?archived=1"
            }
            className="text-sm font-medium text-foreground-muted hover:text-foreground"
          >
            {includeArchived ? "Hide archived" : "Show archived"}
          </Link>
          <CreateClassDialog />
        </div>
      </header>

      {classes.length === 0 ? (
        includeArchived ? (
          <EmptyState
            icon={GraduationCap}
            title="No archived classes"
            description="When you archive a class it will appear here."
          />
        ) : (
          <EmptyState
            icon={GraduationCap}
            title="No classes yet"
            description="Create your first class to start organizing students."
          >
            <CreateClassDialog label="Create your first class" />
          </EmptyState>
        )
      ) : (
        <ClassTable classes={classes} />
      )}
    </div>
  );
}
