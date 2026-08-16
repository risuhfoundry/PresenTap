"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Archive } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { archiveClassAction } from "@/lib/classes/actions";
import { classDisplayName } from "@/lib/classes/format";
import type { ClassRow } from "@/lib/types";

/**
 * Trigger + dialog wrapper for archiving a class. Archiving hides the class from
 * active lists but keeps its record and students. On success it either refreshes
 * the current list (`redirectTo` omitted) or navigates back to the list
 * (`redirectTo` set, used on the detail page so the archived class disappears).
 */
export function ArchiveClassDialog({
  klass,
  iconOnly = false,
  redirectTo,
}: {
  klass: ClassRow;
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
    const result = await archiveClassAction(klass.id);
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
        aria-label={iconOnly ? `Archive ${klass.name}` : undefined}
      >
        <Archive className="h-4 w-4" aria-hidden="true" />
        {iconOnly ? null : "Archive"}
      </Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Archive class"
        description={`This hides “${classDisplayName(klass)}” from active lists. Its students are kept.`}
      >
        {error ? (
          <Alert variant="error" className="mb-4">
            {error}
          </Alert>
        ) : null}
        <p className="text-sm text-foreground-muted">
          You can bring the class back later. Archived classes are excluded from
          the default list view.
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
            Archive class
          </Button>
        </div>
      </Dialog>
    </>
  );
}
