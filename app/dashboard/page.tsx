import { CalendarClock, GraduationCap, Users } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Dashboard placeholder (Phases.md Phase 2). Phase 2 delivers the authenticated
 * shell, accounts, and organization — analytical surfaces (classes, students,
 * attendance, realtime) are Phase 3+. This page confirms the shell works and
 * sets expectations without faking features.
 */
const COMING_SOON = [
  {
    icon: GraduationCap,
    title: "Classes",
    description: "Create and manage classes for attendance tracking.",
  },
  {
    icon: Users,
    title: "Students",
    description: "Enroll students and link their RFID tags.",
  },
  {
    icon: CalendarClock,
    title: "Attendance",
    description: "Tap-in attendance captured by your devices.",
  },
];

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Welcome to PresenTap. Your account and organization are set up — the
          features below arrive in the next phase.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {COMING_SOON.map((item) => (
          <Card key={item.title}>
            <CardHeader>
              <item.icon
                className="mb-2 h-6 w-6 text-accent"
                aria-hidden="true"
              />
              <CardTitle>{item.title}</CardTitle>
              <CardDescription>{item.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <span className="inline-flex items-center rounded-full bg-background-muted px-2.5 py-0.5 text-xs font-medium text-foreground-muted">
                Coming in Phase 3
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      <EmptyState
        icon={CalendarClock}
        title="No activity yet"
        description="Once classes and devices are configured, live attendance will appear here."
      />
    </div>
  );
}
