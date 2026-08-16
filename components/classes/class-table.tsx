import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { EditClassDialog } from "@/components/classes/edit-class-dialog";
import { ArchiveClassDialog } from "@/components/classes/archive-class-dialog";
import { classDisplayName } from "@/lib/classes/format";
import type { ClassWithStudentCount } from "@/lib/types";

const EMPTY_CELL = "—";

/**
 * Presentational class list table (Phase 3). Server-rendered: it fetches the data
 * in the page and only embeds the client dialogs for row actions. Each row links
 * to the class detail page and shows the active student count.
 */
export function ClassTable({ classes }: { classes: ClassWithStudentCount[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white shadow-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-background-subtle text-left text-xs font-semibold uppercase tracking-wide text-foreground-muted">
            <th className="px-4 py-3">Class</th>
            <th className="px-4 py-3">Section</th>
            <th className="px-4 py-3">Academic year</th>
            <th className="px-4 py-3">Room</th>
            <th className="px-4 py-3 text-right">Students</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {classes.map((klass) => (
            <tr
              key={klass.id}
              className="border-b border-border last:border-0 hover:bg-background-subtle"
            >
              <td className="px-4 py-3">
                <Link
                  href={`/dashboard/classes/${klass.id}`}
                  className="font-medium text-foreground hover:text-accent hover:underline"
                >
                  {klass.name}
                </Link>
              </td>
              <td className="px-4 py-3 text-foreground-muted">
                {klass.section?.trim() || EMPTY_CELL}
              </td>
              <td className="px-4 py-3 text-foreground-muted">
                {klass.academic_year?.trim() || EMPTY_CELL}
              </td>
              <td className="px-4 py-3 text-foreground-muted">
                {klass.room?.trim() || EMPTY_CELL}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-foreground">
                {klass.studentCount}
              </td>
              <td className="px-4 py-3">
                <Badge variant={klass.status === "active" ? "success" : "neutral"}>
                  {klass.status === "active" ? "Active" : "Archived"}
                </Badge>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-1">
                  <EditClassDialog klass={klass} iconOnly />
                  <ArchiveClassDialog klass={klass} iconOnly />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
