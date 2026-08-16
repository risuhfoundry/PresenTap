"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { ClassForm } from "@/components/classes/class-form";
import {
  createClassAction,
} from "@/lib/classes/actions";
import type { ClassValues } from "@/lib/classes/schemas";

const EMPTY: ClassValues = {
  name: "",
  section: "",
  academic_year: "",
  room: "",
};

/**
 * Trigger + dialog wrapper for creating a class. On success it closes and
 * refreshes the server-rendered list (the action already revalidated the route).
 */
export function CreateClassDialog({
  label = "Create Class",
}: {
  label?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" aria-hidden="true" />
        {label}
      </Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Create class"
        description="Add a class to your institution."
      >
        <ClassForm
          defaultValues={EMPTY}
          submitLabel="Create class"
          onCancel={() => setOpen(false)}
          submit={async (values) => {
            const result = await createClassAction(values);
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
