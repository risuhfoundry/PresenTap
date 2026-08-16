"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { StudentForm, type ClassOption } from "@/components/students/student-form";
import { createStudentAction } from "@/lib/students/actions";
import type { StudentValues } from "@/lib/students/schemas";

/**
 * Trigger + dialog wrapper for adding a student. `defaultClassId` pre-selects a
 * class (used on the class detail page). On success it closes and refreshes.
 */
export function CreateStudentDialog({
  classes,
  defaultClassId,
  label = "Add Student",
}: {
  classes: ClassOption[];
  defaultClassId?: string;
  label?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  const defaultValues: StudentValues = {
    full_name: "",
    class_id: defaultClassId ?? "",
    roll_number: "",
    student_identifier: "",
  };

  const noClasses = classes.length === 0;

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        title={noClasses ? "Create a class first" : undefined}
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        {label}
      </Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Add student"
        description={
          noClasses
            ? "Create a class before adding students."
            : "Add a student to your institution."
        }
      >
        {noClasses ? (
          <p className="text-sm text-foreground-muted">
            You need at least one class before you can add students.
          </p>
        ) : (
          <StudentForm
            defaultValues={defaultValues}
            classes={classes}
            submitLabel="Add student"
            onCancel={() => setOpen(false)}
            submit={async (values) => {
              const result = await createStudentAction(values);
              if (result.ok) {
                setOpen(false);
                router.refresh();
              }
              return result;
            }}
          />
        )}
      </Dialog>
    </>
  );
}
