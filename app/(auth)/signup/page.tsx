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
import { signUpAction } from "@/lib/auth/actions";
import type { AuthActionState } from "@/lib/auth/action-state";
import { signupSchema, type SignupValues } from "@/lib/auth/schemas";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

export default function SignupPage() {
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);
  const [needsConfirmation, setNeedsConfirmation] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { fullName: "", email: "", password: "", confirmPassword: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    setPending(true);
    try {
      const result: AuthActionState | void = await signUpAction(values);
      if (result && result.ok) {
        if (result.needsConfirmation) {
          setNeedsConfirmation(true);
          setPending(false);
        }
        // If no needsConfirmation flag, the action already redirected.
        return;
      }
      if (result && !result.ok) {
        setServerError(result.error);
        setPending(false);
      }
    } catch {
      setServerError("Something went wrong. Please try again.");
      setPending(false);
    }
  });

  if (needsConfirmation) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Check your inbox</CardTitle>
          <CardDescription>
            We sent a confirmation link to your email. Open it to activate your
            account, then sign in.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="info" className="mb-4">
            You can close this tab once you have confirmed your email.
          </Alert>
          <Link href="/login" className={buttonVariants({ className: "w-full" })}>
            Go to sign in
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create your account</CardTitle>
        <CardDescription>
          Start by creating your PresenTap admin account for your institution.
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
            <Label htmlFor="fullName">Full name</Label>
            <Input
              id="fullName"
              type="text"
              autoComplete="name"
              placeholder="Jane Principal"
              aria-invalid={Boolean(errors.fullName)}
              {...register("fullName")}
            />
            {errors.fullName ? (
              <p className="text-sm text-danger">{errors.fullName.message}</p>
            ) : null}
          </div>

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

          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              aria-invalid={Boolean(errors.password)}
              {...register("password")}
            />
            {errors.password ? (
              <p className="text-sm text-danger">{errors.password.message}</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              aria-invalid={Boolean(errors.confirmPassword)}
              {...register("confirmPassword")}
            />
            {errors.confirmPassword ? (
              <p className="text-sm text-danger">
                {errors.confirmPassword.message}
              </p>
            ) : null}
          </div>

          <Button type="submit" loading={pending} className="mt-2 w-full">
            Create account
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-foreground-muted">
          Already have an account?{" "}
          <Link href="/login" className="text-accent hover:underline">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
