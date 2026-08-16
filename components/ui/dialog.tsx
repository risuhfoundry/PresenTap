"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Accessible modal dialog (Design.md §6.7). Hand-rolled to avoid adding a UI
 * dependency: it renders an overlay + centered panel, closes on Esc and overlay
 * click, traps Tab focus within the panel, and exposes the panel via role=dialog
 * with aria-modal and a labelledby title. All content (including the form and its
 * footer buttons) is passed as `children`.
 */
export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

const FOCUSABLE =
  'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
}: DialogProps) {
  const panelRef = React.useRef<HTMLDivElement>(null);
  const titleId = React.useId();
  const descId = React.useId();

  React.useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onOpenChange(false);
        return;
      }
      if (e.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;
      const focusables = Array.from(
        panel.querySelectorAll<HTMLElement>(FOCUSABLE),
      );
      if (focusables.length === 0) {
        e.preventDefault();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (!first || !last) {
        e.preventDefault();
        return;
      }
      if (e.shiftKey && (active === first || !panel.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    const t = window.setTimeout(() => {
      const panel = panelRef.current;
      const first = panel?.querySelector<HTMLElement>(FOCUSABLE);
      first?.focus();
    }, 0);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      window.clearTimeout(t);
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
    >
      <div
        className="absolute inset-0 bg-[rgba(24,24,27,0.4)]"
        aria-hidden="true"
        onClick={() => onOpenChange(false)}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        className={cn(
          "relative z-10 w-full max-w-md rounded-xl border border-border bg-white p-6 shadow-[0_8px_24px_rgba(24,24,27,0.12)]",
          className,
        )}
      >
        <h2
          id={titleId}
          className="text-lg font-semibold tracking-tight text-foreground"
        >
          {title}
        </h2>
        {description ? (
          <p id={descId} className="mt-1 text-sm text-foreground-muted">
            {description}
          </p>
        ) : null}
        <div className={description ? "mt-4" : "mt-2"}>{children}</div>
      </div>
    </div>
  );
}
