import * as React from "react";
import {
  AlertCircle,
  CheckCircle2,
  Info,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Alert — inline status/error banner with a colored left border and icon
 * (Design.md §6.10). Always carries an accessible role so screen readers
 * announce it. Never used to surface raw error text from the backend.
 */
export type AlertVariant = "error" | "success" | "warning" | "info";

const ICONS: Record<AlertVariant, LucideIcon> = {
  error: AlertCircle,
  success: CheckCircle2,
  warning: TriangleAlert,
  info: Info,
};

const VARIANTS: Record<AlertVariant, string> = {
  error: "border-l-danger bg-danger-soft text-danger",
  success: "border-l-success bg-success-soft text-success",
  warning: "border-l-warning bg-warning-soft text-warning",
  info: "border-l-border bg-background-muted text-foreground-muted",
};

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  title?: string;
}

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = "error", title, children, ...props }, ref) => {
    const Icon = ICONS[variant];
    return (
      <div
        ref={ref}
        role="alert"
        className={cn(
          "flex gap-3 rounded-lg border-l-4 p-4 text-sm",
          VARIANTS[variant],
          className,
        )}
        {...props}
      >
        <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <div className="min-w-0">
          {title ? <p className="font-semibold">{title}</p> : null}
          {children ? <div className={title ? "mt-0.5" : undefined}>{children}</div> : null}
        </div>
      </div>
    );
  },
);
Alert.displayName = "Alert";
