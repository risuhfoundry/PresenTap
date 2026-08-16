"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Archive } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { archiveStudentAction } from "@/lib/students/actions";
import type { StudentWithClass } from "@/lib/types";

/**
 * Trigger + dialog wrapper for archiving a student. On success either refreshes
 * the current list (`redirectTo` omitted) or navigates back to the list.
 */
export function ArchiveStudentDialog({
  student,
  iconOnly = false,
  redirectTo,
}: {
  student: StudentWithClass;
  iconOnly?: boolean;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onArchive() {
    setPending(true);
    setError(null);
    const result = await archiveStudentAction(student.id);
    if (result.ok) {
      setOpen(false);
      if (redirectTo) router.push(redirectTo);
      else router.refresh();
      return;
    }
    setError(result.error);
    setPending(false);
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        aria-label={iconOnly ? `Archive ${student.full_name}` : undefined}
      >
        <Archive className="h-4 w-4" aria-hidden="true" />
        {iconOnly ? null : "Archive"}
      </Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Archive student"
        description={`This hides “${student.full_name}” from active lists.`}
      >
        {error ? (
          <Alert variant="error" className="mb-4">
            {error}
          </Alert>
        ) : null}
        <p className="text-sm text-foreground-muted">
          Archived students are excluded from the default list and class rosters
          but their record is kept.
        </p>
        <div className="mt-4 flex justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setOpen(false)}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            loading={pending}
            onClick={onArchive}
          >
            Archive student
          </Button>
        </div>
      </Dialog>
    </>
  );
}
