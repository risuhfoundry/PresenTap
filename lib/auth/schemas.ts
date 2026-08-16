import { z } from "zod";

/**
 * Validation schemas for Phase 2 auth + onboarding forms.
 *
 * These run both client-side (React Hook Form) and can be reused server-side
 * in Server Actions to defend against tampered requests. Error messages are
 * user-facing and never echo raw input, SQL, or secrets.
 */

export const ORGANIZATION_TYPES = ["school", "college"] as const;

// Password policy: min 8 chars, at least one letter and one number. Mirrors a
// sensible Supabase default; kept explicit so the client can give instant
// feedback instead of a generic server error.
export const passwordSchema = z
  .string()
  .min(8, { message: "Password must be at least 8 characters." })
  .max(72, { message: "Password must be at most 72 characters." })
  .regex(/[A-Za-z]/, { message: "Password must contain a letter." })
  .regex(/[0-9]/, { message: "Password must contain a number." });

export const fullNameSchema = z
  .string()
  .trim()
  .min(1, { message: "Please enter your full name." })
  .max(120, { message: "Name must be 120 characters or fewer." });

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email({ message: "Please enter a valid email address." })
  .max(254, { message: "Email is too long." });

export const signupSchema = z
  .object({
    fullName: fullNameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { message: "Please enter your password." }),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const organizationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: "Please enter your institution name." })
    .max(120, { message: "Institution name is too long." }),
  type: z.enum(ORGANIZATION_TYPES, {
    errorMap: () => ({ message: "Select a valid institution type." }),
  }),
  logoUrl: z
    .string()
    .trim()
    .url({ message: "Enter a valid URL, or leave this blank." })
    .max(2048, { message: "Logo URL is too long." })
    .optional()
    .or(z.literal("")),
});

export type SignupValues = z.infer<typeof signupSchema>;
export type LoginValues = z.infer<typeof loginSchema>;
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
export type OrganizationValues = z.infer<typeof organizationSchema>;
