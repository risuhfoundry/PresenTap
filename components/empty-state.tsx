import * as React from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * EmptyState — centered placeholder for "nothing here yet" views (Design.md §6).
 * Used on the dashboard placeholder and any list with no rows. Presentational
 * only; pass `children` for an action (e.g. a button).
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  children,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-white px-6 py-16 text-center",
        className,
      )}
    >
      {Icon ? (
        <Icon
          className="mb-4 h-10 w-10 text-foreground-muted"
          aria-hidden="true"
        />
      ) : null}
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {description ? (
        <p className="mt-1 max-w-sm text-sm text-foreground-muted">
          {description}
        </p>
      ) : null}
      {children ? <div className="mt-6">{children}</div> : null}
    </div>
  );
}
