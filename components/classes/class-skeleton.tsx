/**
 * Loading skeleton for the class list (Phase 3). Mirrors the table shape so the
 * page doesn't shift when data arrives. Server-rendered by loading.tsx.
 */
export function ClassTableSkeleton() {
  return (
    <div
      className="overflow-hidden rounded-xl border border-border bg-white shadow-card"
      aria-hidden="true"
    >
      <div className="h-11 border-b border-border bg-background-subtle" />
      <div className="divide-y divide-border">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex h-[57px] items-center gap-4 px-4">
            <div className="h-4 w-32 rounded bg-background-muted" />
            <div className="h-4 w-12 rounded bg-background-muted" />
            <div className="h-4 w-20 rounded bg-background-muted" />
            <div className="h-4 w-16 rounded bg-background-muted" />
            <div className="ml-auto h-4 w-8 rounded bg-background-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
