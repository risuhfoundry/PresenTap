import { Card } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="h-4 w-16 rounded bg-background-muted" />
      <div className="flex items-start justify-between gap-4">
        <div className="h-8 w-48 rounded bg-background-muted" />
        <div className="h-10 w-40 rounded-lg bg-background-muted" />
      </div>
      <Card>
        <div className="h-32 p-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="mb-4 h-4 w-40 rounded bg-background-muted" />
          ))}
        </div>
      </Card>
      <Card>
        <div className="h-24 p-6" />
      </Card>
    </div>
  );
}
