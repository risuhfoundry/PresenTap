"use client";

import * as React from "react";
import Link from "next/link";

import { Alert } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgotPasswordAction } from "@/lib/auth/actions";
import type { AuthActionState } from "@/lib/auth/action-state";
import { forgotPasswordSchema, type ForgotPasswordValues } from "@/lib/auth/schemas";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

export default function ForgotPasswordPage() {
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);
  const [sent, setSent] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    setPending(true);
    try {
      const result: AuthActionState | void = await forgotPasswordAction(values);
      if (result && !result.ok) {
        setServerError(result.error);
        setPending(false);
        return;
      }
      // Always show success to avoid account enumeration.
      setSent(true);
      setPending(false);
    } catch {
      setServerError("Something went wrong. Please try again.");
      setPending(false);
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reset your password</CardTitle>
        <CardDescription>
          Enter your account email and we&apos;ll send you a link to reset your
          password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {serverError ? (
          <Alert variant="error" className="mb-4">
            {serverError}
          </Alert>
        ) : null}

        {sent ? (
          <>
            <Alert variant="success" className="mb-4">
              If an account exists for that email, we&apos;ve sent password reset
              instructions.
            </Alert>
            <Link
              href="/login"
              className={buttonVariants({ className: "w-full" })}
            >
              Back to sign in
            </Link>
          </>
        ) : (
          <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@institution.edu"
                aria-invalid={Boolean(errors.email)}
                {...register("email")}
              />
              {errors.email ? (
                <p className="text-sm text-danger">{errors.email.message}</p>
              ) : null}
            </div>

            <Button type="submit" loading={pending} className="mt-2 w-full">
              Send reset link
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-foreground-muted">
          Remembered it?{" "}
          <Link href="/login" className="text-accent hover:underline">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
