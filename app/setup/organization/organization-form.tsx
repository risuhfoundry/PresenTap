"use client";

import * as React from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createOrganizationAction } from "@/lib/organization/actions";
import type { AuthActionState } from "@/lib/auth/action-state";
import {
  ORGANIZATION_TYPES,
  organizationSchema,
  type OrganizationValues,
} from "@/lib/auth/schemas";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

export function OrganizationForm() {
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OrganizationValues>({
    resolver: zodResolver(organizationSchema),
    defaultValues: { name: "", type: "school", logoUrl: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    setPending(true);
    try {
      const result: AuthActionState | void = await createOrganizationAction(
        values,
      );
      if (result && !result.ok) {
        setServerError(result.error);
        setPending(false);
      }
      // On success the action redirects; no further handling needed.
    } catch {
      setServerError("Something went wrong. Please try again.");
      setPending(false);
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tell us about your institution</CardTitle>
        <CardDescription>
          This is your organization in PresenTap. You can manage it later.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {serverError ? (
          <Alert variant="error" className="mb-4">
            {serverError}
          </Alert>
        ) : null}

        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Institution name</Label>
            <Input
              id="name"
              type="text"
              placeholder="Lincoln High School"
              aria-invalid={Boolean(errors.name)}
              {...register("name")}
            />
            {errors.name ? (
              <p className="text-sm text-danger">{errors.name.message}</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="type">Institution type</Label>
            <select
              id="type"
              aria-invalid={Boolean(errors.type)}
              className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              {...register("type")}
            >
              {ORGANIZATION_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t === "school" ? "School" : "College"}
                </option>
              ))}
            </select>
            {errors.type ? (
              <p className="text-sm text-danger">{errors.type.message}</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="logoUrl">
              Logo URL <span className="text-foreground-muted">(optional)</span>
            </Label>
            <Input
              id="logoUrl"
              type="url"
              placeholder="https://…/logo.png"
              aria-invalid={Boolean(errors.logoUrl)}
              {...register("logoUrl")}
            />
            {errors.logoUrl ? (
              <p className="text-sm text-danger">{errors.logoUrl.message}</p>
            ) : null}
          </div>

          <Button type="submit" loading={pending} className="mt-2 w-full">
            Continue
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
