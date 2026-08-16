import { Users } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { CreateStudentDialog } from "@/components/students/create-student-dialog";
import { EditStudentDialog } from "@/components/students/edit-student-dialog";
import { ArchiveStudentDialog } from "@/components/students/archive-student-dialog";
import { StudentFilters } from "@/components/students/student-filters";
import { classDisplayName } from "@/lib/classes/format";
import { listClasses } from "@/lib/classes/service";
import { listStudents } from "@/lib/students/service";
import { rfidStatus, rfidStatusLabel } from "@/lib/students/format";
import type { ClassOption } from "@/components/students/student-form";

/**
 * Students list (Phase 3). Server Component. Database-backed search + class filter
 * via `listStudents`. `?q`, `?classId`, `?archived` drive the query. RFID state is
 * display only. Mutations happen in client dialogs that call Server Actions.
 */
export default async function StudentsPage({
  searchParams,
}: {
  searchParams: { q?: string; classId?: string; archived?: string };
}) {
  const q = searchParams.q ?? "";
  const classId = searchParams.classId ?? "";
  const includeArchived = searchParams.archived === "1";
  const hasFilters = Boolean(q || classId || includeArchived);

  const [classes, students] = await Promise.all([
    listClasses(false),
    listStudents({ q, classId, includeArchived }),
  ]);

  const classOptions: ClassOption[] = classes.map((c) => ({
    id: c.id,
    name: c.name,
    section: c.section,
  }));

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Students
          </h1>
          <p className="mt-1 text-sm text-foreground-muted">
            Add and manage your students.
          </p>
        </div>
        <CreateStudentDialog classes={classOptions} />
      </header>

      <StudentFilters
        classes={classOptions}
        q={q}
        classId={classId}
        includeArchived={includeArchived}
      />

      {students.length === 0 ? (
        hasFilters ? (
          <EmptyState
            icon={Users}
            title="No students match your search"
            description="Try a different name, roll number, or class filter."
          >
            <Link
              href="/dashboard/students"
              className="text-sm font-medium text-accent hover:text-accent-hover hover:underline"
            >
              Clear filters
            </Link>
          </EmptyState>
        ) : (
          <EmptyState
            icon={Users}
            title="No students yet"
            description="Add your first student to get started."
          >
            <CreateStudentDialog classes={classOptions} label="Add your first student" />
          </EmptyState>
        )
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-white shadow-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-background-subtle text-left text-xs font-semibold uppercase tracking-wide text-foreground-muted">
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Roll number</th>
                <th className="px-4 py-3">Class</th>
                <th className="px-4 py-3">RFID</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => {
                const rfid = rfidStatus(student);
                return (
                  <tr
                    key={student.id}
                    className="border-b border-border last:border-0 hover:bg-background-subtle"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/students/${student.id}`}
                        className="font-medium text-foreground hover:text-accent hover:underline"
                      >
                        {student.full_name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-foreground-muted">
                      {student.roll_number?.trim() || "—"}
                    </td>
                    <td className="px-4 py-3 text-foreground-muted">
                      {student.class_name
                        ? classDisplayName({
                            name: student.class_name,
                            section: student.class_section,
                          })
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={rfid === "registered" ? "success" : "neutral"}
                      >
                        {rfidStatusLabel(rfid)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          student.status === "active" ? "success" : "neutral"
                        }
                      >
                        {student.status === "active" ? "Active" : "Archived"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <EditStudentDialog
                          student={student}
                          classes={classOptions}
                          iconOnly
                        />
                        <ArchiveStudentDialog student={student} iconOnly />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
