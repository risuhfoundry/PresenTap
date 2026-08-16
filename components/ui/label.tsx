import * as React from "react";

import { cn } from "@/lib/utils";

/** Label — 13px / 600 (Design.md §6.2). Always associate with an input via htmlFor. */
export type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement>;

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn("text-[13px] font-semibold text-foreground", className)}
        {...props}
      />
    );
  },
);
Label.displayName = "Label";
