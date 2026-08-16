"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  classSchema,
  type ClassValues,
} from "@/lib/classes/schemas";

/**
 * Shared class create/edit form (Phase 3). Owns its React Hook Form state and
 * runs `classSchema` both client-side (here) and server-side (in the action). On
 * a successful submit it defers to `onSuccess`; on a failure it surfaces the
 * action's safe `error` string via an Alert. The parent owns the Dialog open
 * state and passes `onCancel` to wire up the Cancel button.
 */
export function ClassForm({
  defaultValues,
  submitLabel,
  submit,
  onCancel,
  onSuccess,
}: {
  defaultValues: ClassValues;
  submitLabel: string;
  submit: (values: ClassValues) => Promise<{ ok: true } | { ok: false; error: string }>;
  onCancel: () => void;
  onSuccess?: () => void;
}) {
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClassValues>({
    resolver: zodResolver(classSchema),
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
        <Label htmlFor="class-name">Name</Label>
        <Input
          id="class-name"
          placeholder="Grade 11"
          aria-invalid={Boolean(errors.name)}
          autoFocus
          {...register("name")}
        />
        {errors.name ? (
          <p className="text-sm text-danger">{errors.name.message}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="class-section">
          Section <span className="text-foreground-muted">(optional)</span>
        </Label>
        <Input
          id="class-section"
          placeholder="A"
          aria-invalid={Boolean(errors.section)}
          {...register("section")}
        />
        {errors.section ? (
          <p className="text-sm text-danger">{errors.section.message}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="class-year">
          Academic year <span className="text-foreground-muted">(optional)</span>
        </Label>
        <Input
          id="class-year"
          placeholder="2025-2026"
          aria-invalid={Boolean(errors.academic_year)}
          {...register("academic_year")}
        />
        {errors.academic_year ? (
          <p className="text-sm text-danger">{errors.academic_year.message}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="class-room">
          Room <span className="text-foreground-muted">(optional)</span>
        </Label>
        <Input
          id="class-room"
          placeholder="Room 204"
          aria-invalid={Boolean(errors.room)}
          {...register("room")}
        />
        {errors.room ? (
          <p className="text-sm text-danger">{errors.room.message}</p>
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
