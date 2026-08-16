import { Card } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="h-4 w-16 rounded bg-background-muted" />
      <div className="flex items-start justify-between gap-4">
        <div className="h-8 w-48 rounded bg-background-muted" />
        <div className="h-10 w-56 rounded-lg bg-background-muted" />
      </div>
      <Card>
        <div className="h-24 p-6">
          <div className="h-4 w-24 rounded bg-background-muted" />
          <div className="mt-2 h-8 w-12 rounded bg-background-muted" />
        </div>
      </Card>
      <div className="h-6 w-20 rounded bg-background-muted" />
      <div className="h-64 rounded-xl border border-border bg-white" />
    </div>
  );
}
