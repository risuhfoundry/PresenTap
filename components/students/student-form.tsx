"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { classDisplayName } from "@/lib/classes/format";
import {
  studentSchema,
  type StudentValues,
} from "@/lib/students/schemas";

export interface ClassOption {
  id: string;
  name: string;
  section: string | null;
}

/**
 * Shared student create/edit form (Phase 3). Runs `studentSchema` client + server.
 * The class picker is populated from org-scoped active classes. `rfid_uid` is
 * deliberately absent — enrollment is a later phase (Phases.md Phase 3 scope).
 */
export function StudentForm({
  defaultValues,
  classes,
  submitLabel,
  submit,
  onCancel,
  onSuccess,
}: {
  defaultValues: StudentValues;
  classes: ClassOption[];
  submitLabel: string;
  submit: (values: StudentValues) => Promise<{ ok: true } | { ok: false; error: string }>;
  onCancel: () => void;
  onSuccess?: () => void;
}) {
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StudentValues>({
    resolver: zodResolver(studentSchema),
    defaultValues,
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    setPending(true);
    try {
      const result = await submit(values);
      if (result.ok) {
        onSuccess?.();
        return;
      }
      setServerError(result.error);
      setPending(false);
    } catch {
      setServerError("Something went wrong. Please try again.");
      setPending(false);
    }
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      {serverError ? (
        <Alert variant="error">{serverError}</Alert>
      ) : null}

      <div className="flex flex-col gap-2">
        <Label htmlFor="student-name">Full name</Label>
        <Input
          id="student-name"
          placeholder="Alex Johnson"
          aria-invalid={Boolean(errors.full_name)}
          autoFocus
          {...register("full_name")}
        />
        {errors.full_name ? (
          <p className="text-sm text-danger">{errors.full_name.message}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="student-class">Class</Label>
        <Select
          id="student-class"
          aria-invalid={Boolean(errors.class_id)}
          {...register("class_id")}
        >
          <option value="" disabled>
            Select a class
          </option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {classDisplayName(c)}
            </option>
          ))}
        </Select>
        {errors.class_id ? (
          <p className="text-sm text-danger">{errors.class_id.message}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="student-roll">
          Roll number <span className="text-foreground-muted">(optional)</span>
        </Label>
        <Input
          id="student-roll"
          placeholder="1"
          aria-invalid={Boolean(errors.roll_number)}
          {...register("roll_number")}
        />
        {errors.roll_number ? (
          <p className="text-sm text-danger">{errors.roll_number.message}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="student-identifier">
          Student identifier <span className="text-foreground-muted">(optional)</span>
        </Label>
        <Input
          id="student-identifier"
          placeholder="S-1024"
          aria-invalid={Boolean(errors.student_identifier)}
          {...register("student_identifier")}
        />
        {errors.student_identifier ? (
          <p className="text-sm text-danger">{errors.student_identifier.message}</p>
        ) : null}
      </div>

      <div className="mt-2 flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" loading={pending}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
