import { cn } from "@/lib/utils";

/**
 * PresenTap brand mark + wordmark. The mark is an original "tap" emblem — a
 * center dot ringed by four arc segments suggesting a scan pulse — rendered in
 * the PresenTap indigo accent. No third-party logo dependency.
 */
export function Brand({
  className,
  showWordmark = true,
  wordmarkClassName,
}: {
  className?: string;
  showWordmark?: boolean;
  wordmarkClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className="text-accent"
      >
        <circle cx="12" cy="12" r="3" fill="currentColor" />
        <path
          d="M5 12a7 7 0 0 1 7-7"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.45"
        />
        <path
          d="M19 12a7 7 0 0 0-7-7"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.7"
        />
        <path
          d="M5 12a7 7 0 0 0 7 7"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.7"
        />
        <path
          d="M19 12a7 7 0 0 1-7 7"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.45"
        />
      </svg>
      {showWordmark ? (
        <span
          className={cn(
            "text-lg font-semibold tracking-[-0.01em] text-foreground",
            wordmarkClassName,
          )}
        >
          PresenTap
        </span>
      ) : null}
    </span>
  );
}
