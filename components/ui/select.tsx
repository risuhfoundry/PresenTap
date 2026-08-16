import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Select — styled native <select> (Design.md §6.3). Shares the Input metrics
 * (40px tall, 8px radius, accent focus ring) for a consistent form language.
 * Native elements keep it accessible and dependency-free; the chevron is provided
 * by the browser. Pair with <Label>.
 */
export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          "h-10 w-full rounded-lg border border-border bg-white px-3 text-sm text-foreground shadow-sm transition-colors",
          "focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-ring",
          "disabled:cursor-not-allowed disabled:opacity-60",
          className,
        )}
        {...props}
      >
        {children}
      </select>
    );
  },
);
Select.displayName = "Select";
