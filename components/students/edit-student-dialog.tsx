"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { StudentForm, type ClassOption } from "@/components/students/student-form";
import { updateStudentAction } from "@/lib/students/actions";
import type { StudentValues } from "@/lib/students/schemas";
import type { StudentWithClass } from "@/lib/types";

/** Trigger + dialog wrapper for editing a student. */
export function EditStudentDialog({
  student,
  classes,
  iconOnly = false,
}: {
  student: StudentWithClass;
  classes: ClassOption[];
  iconOnly?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  const defaultValues: StudentValues = {
    full_name: student.full_name,
    class_id: student.class_id,
    roll_number: student.roll_number ?? "",
    student_identifier: student.student_identifier ?? "",
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        aria-label={iconOnly ? `Edit ${student.full_name}` : undefined}
      >
        <Pencil className="h-4 w-4" aria-hidden="true" />
        {iconOnly ? null : "Edit"}
      </Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Edit student"
        description="Update the student details."
      >
        <StudentForm
          defaultValues={defaultValues}
          classes={classes}
          submitLabel="Save changes"
          onCancel={() => setOpen(false)}
          submit={async (values) => {
            const result = await updateStudentAction(student.id, values);
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
