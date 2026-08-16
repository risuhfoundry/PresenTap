"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { ClassForm } from "@/components/classes/class-form";
import { updateClassAction } from "@/lib/classes/actions";
import type { ClassValues } from "@/lib/classes/schemas";
import type { ClassRow } from "@/lib/types";

/**
 * Trigger + dialog wrapper for editing a class. The trigger renders as a quiet
 * ghost icon button when `iconOnly` (used inside table rows); otherwise a labelled
 * Button. On success it closes and refreshes the route.
 */
export function EditClassDialog({
  klass,
  iconOnly = false,
}: {
  klass: ClassRow;
  iconOnly?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  const defaultValues: ClassValues = {
    name: klass.name,
    section: klass.section ?? "",
    academic_year: klass.academic_year ?? "",
    room: klass.room ?? "",
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        aria-label={iconOnly ? `Edit ${klass.name}` : undefined}
      >
        <Pencil className="h-4 w-4" aria-hidden="true" />
        {iconOnly ? null : "Edit"}
      </Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Edit class"
        description="Update the class details."
      >
        <ClassForm
          defaultValues={defaultValues}
          submitLabel="Save changes"
          onCancel={() => setOpen(false)}
          submit={async (values) => {
            const result = await updateClassAction(klass.id, values);
            if (result.ok) {
              setOpen(false);
              router.refresh();
            }
            return result;
          }}
        />
      </Dialog>
    </>
  );
}
