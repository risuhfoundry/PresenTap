import { ClassTableSkeleton } from "@/components/classes/class-skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <div className="h-7 w-28 rounded bg-background-muted" />
          <div className="mt-2 h-4 w-64 rounded bg-background-muted" />
        </div>
        <div className="h-10 w-32 rounded-lg bg-background-muted" />
      </header>
      <ClassTableSkeleton />
    </div>
  );
}
