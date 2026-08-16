import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Input — single-line text field (Design.md §6.2). 40px tall, 8px radius,
 * accent focus ring. Pair with <Label> and the FieldError helper below.
 */
export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          "h-10 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground shadow-sm transition-colors",
          "placeholder:text-foreground-subtle",
          "focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-ring",
          "disabled:cursor-not-allowed disabled:opacity-60",
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";
