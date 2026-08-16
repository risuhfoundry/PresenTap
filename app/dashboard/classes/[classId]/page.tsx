import Link from "next/link";
import { notFound } from "next/navigation";
import { Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { EditClassDialog } from "@/components/classes/edit-class-dialog";
import { ArchiveClassDialog } from "@/components/classes/archive-class-dialog";
import { CreateStudentDialog } from "@/components/students/create-student-dialog";
import { EditStudentDialog } from "@/components/students/edit-student-dialog";
import { ArchiveStudentDialog } from "@/components/students/archive-student-dialog";
import {
  getClassById,
  listClasses,
} from "@/lib/classes/service";
import { listStudentsForClass } from "@/lib/students/service";
import {
  classDisplayName,
  isClassArchived,
} from "@/lib/classes/format";
import { rfidStatus, rfidStatusLabel } from "@/lib/students/format";
import type { ClassOption } from "@/components/students/student-form";

/**
 * Class detail (Phase 3). Server Component. Shows the class header with its
 * active student count and the roster (DB-backed list scoped to this class). Row
 * actions add/edit/archive students; the class header actions edit/archive the
 * class. `?archived=1` reveals archived students in the roster. RFID state is
 * DISPLAY ONLY.
 */
export default async function ClassDetailPage({
  params,
  searchParams,
}: {
  params: { classId: string };
  searchParams: { archived?: string };
}) {
  const klass = await getClassById(params.classId);
  if (!klass) notFound();

  const includeArchived = searchParams.archived === "1";
  const [students, classes] = await Promise.all([
    listStudentsForClass(klass.id, includeArchived),
    listClasses(false),
  ]);

  const activeCount = students.filter((s) => s.status === "active").length;
  const classOptions: ClassOption[] = classes.map((c) => ({
    id: c.id,
    name: c.name,
    section: c.section,
  }));
  const display = classDisplayName(klass);

  return (
    <div className="flex flex-col gap-6">
      <nav className="text-sm">
        <Link
          href="/dashboard/classes"
          className="text-foreground-muted hover:text-foreground"
        >
          ← Classes
        </Link>
      </nav>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {display}
            </h1>
            <Badge variant={isClassArchived(klass) ? "neutral" : "success"}>
              {isClassArchived(klass) ? "Archived" : "Active"}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-foreground-muted">
            {klass.academic_year?.trim() ? `${klass.academic_year.trim()}` : null}
            {klass.academic_year?.trim() && klass.room?.trim() ? " · " : null}
            {klass.room?.trim() ? `Room ${klass.room.trim()}` : null}
            {!klass.academic_year?.trim() && !klass.room?.trim()
              ? "No additional details"
              : null}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!isClassArchived(klass) ? (
            <CreateStudentDialog classes={classOptions} defaultClassId={klass.id} />
          ) : null}
          <EditClassDialog klass={klass} />
          <ArchiveClassDialog klass={klass} redirectTo="/dashboard/classes" />
        </div>
      </header>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-foreground-muted">Active students</p>
              <p className="text-3xl font-semibold tabular-nums text-foreground">
                {activeCount}
              </p>
            </div>
            {!isClassArchived(klass) ? (
              <CreateStudentDialog
                classes={classOptions}
                defaultClassId={klass.id}
                label="Add Student"
              />
            ) : null}
          </div>
        </CardContent>
      </Card>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Roster</h2>
          {students.length > 0 ? (
            <Link
              href={
                includeArchived
                  ? `/dashboard/classes/${klass.id}`
                  : `/dashboard/classes/${klass.id}?archived=1`
              }
              className="text-sm font-medium text-foreground-muted hover:text-foreground"
            >
              {includeArchived ? "Hide archived" : "Show archived"}
            </Link>
          ) : null}
        </div>

        {students.length === 0 ? (
          isClassArchived(klass) ? (
            <EmptyState
              icon={Users}
              title="No students here"
              description="This archived class has no students to show."
            />
          ) : (
            <EmptyState
              icon={Users}
              title="No students in this class yet"
              description="Add students to start building the roster."
            >
              <CreateStudentDialog
                classes={classOptions}
                defaultClassId={klass.id}
                label="Add your first student"
              />
            </EmptyState>
          )
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-white shadow-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-background-subtle text-left text-xs font-semibold uppercase tracking-wide text-foreground-muted">
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Roll number</th>
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
      </section>
    </div>
  );
}
