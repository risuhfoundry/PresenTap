import Link from "next/link";
import { notFound } from "next/navigation";
import { CreditCard, UserX } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EditStudentDialog } from "@/components/students/edit-student-dialog";
import { ArchiveStudentDialog } from "@/components/students/archive-student-dialog";
import { classDisplayName } from "@/lib/classes/format";
import { listClasses } from "@/lib/classes/service";
import { getStudentById } from "@/lib/students/service";
import { rfidStatus, rfidStatusLabel } from "@/lib/students/format";
import type { ClassOption } from "@/components/students/student-form";

function formatDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Student detail (Phase 3). Server Component. Shows all student attributes and
 * the RFID registration state — DISPLAY ONLY. RFID enrollment (writing `rfid_uid`)
 * is a Phase 7 workflow and is intentionally absent from this page (no input, no
 * action). Edit/Archive actions call Server Actions.
 */
export default async function StudentDetailPage({
  params,
}: {
  params: { studentId: string };
}) {
  const student = await getStudentById(params.studentId);
  if (!student) notFound();

  const classes = await listClasses(false);
  const classOptions: ClassOption[] = classes.map((c) => ({
    id: c.id,
    name: c.name,
    section: c.section,
  }));

  const rfid = rfidStatus(student);
  const className = student.class_name
    ? classDisplayName({ name: student.class_name, section: student.class_section })
    : null;

  return (
    <div className="flex flex-col gap-6">
      <nav className="text-sm">
        <Link
          href="/dashboard/students"
          className="text-foreground-muted hover:text-foreground"
        >
          ← Students
        </Link>
      </nav>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {student.full_name}
          </h1>
          <Badge variant={student.status === "active" ? "success" : "neutral"}>
            {student.status === "active" ? "Active" : "Archived"}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <EditStudentDialog student={student} classes={classOptions} />
          <ArchiveStudentDialog
            student={student}
            redirectTo="/dashboard/students"
          />
        </div>
      </header>

      <Card>
        <CardContent className="grid gap-6 p-6 sm:grid-cols-2">
          <DetailRow label="Roll number" value={student.roll_number?.trim() || "—"} />
          <DetailRow
            label="Student identifier"
            value={student.student_identifier?.trim() || "—"}
          />
          <DetailRow
            label="Class"
            value={
              className ? (
                <Link
                  href={`/dashboard/classes/${student.class_id}`}
                  className="font-medium text-foreground hover:text-accent hover:underline"
                >
                  {className}
                </Link>
              ) : (
                "—"
              )
            }
          />
          <DetailRow
            label="Created"
            value={formatDate(student.created_at)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              {rfid === "registered" ? (
                <CreditCard className="h-5 w-5 text-success" aria-hidden="true" />
              ) : (
                <UserX className="h-5 w-5 text-foreground-muted" aria-hidden="true" />
              )}
              <div>
                <p className="text-sm font-medium text-foreground">RFID card</p>
                <p className="text-sm text-foreground-muted">
                  {rfidStatusLabel(rfid)}
                </p>
              </div>
            </div>
            <Badge variant={rfid === "registered" ? "success" : "neutral"}>
              {rfidStatusLabel(rfid)}
            </Badge>
          </div>
          {rfid === "registered" && student.rfid_uid ? (
            <p className="mt-4 break-all font-mono text-sm text-foreground-muted">
              {student.rfid_uid}
            </p>
          ) : (
            <p className="mt-4 text-sm text-foreground-muted">
              This student has no RFID card yet. Card enrollment is available in a
              later step.
            </p>
          )}
        </CardContent>
      </Card>

      <details className="rounded-xl border border-border bg-white p-4 text-sm text-foreground-muted">
        <summary className="cursor-pointer select-none font-medium text-foreground">
          Advanced
        </summary>
        <dl className="mt-3 space-y-1">
          <div className="flex gap-2">
            <dt className="w-28 shrink-0">Student ID</dt>
            <dd className="break-all font-mono">{student.id}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-28 shrink-0">Last updated</dt>
            <dd>{formatDate(student.updated_at)}</dd>
          </div>
        </dl>
      </details>
    </div>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-foreground">{value}</dd>
    </div>
  );
}
