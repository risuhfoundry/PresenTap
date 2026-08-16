"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap, LayoutDashboard, Users } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Dashboard navigation (Design.md §6.14 / §7). Vertical in the sidebar (md+) and
 * horizontal in the mobile top bar. Active state is derived from the current
 * pathname. Devices / Attendance / Reports are later phases, so they are not
 * linked yet.
 */
const LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/classes", label: "Classes", icon: GraduationCap },
  { href: "/dashboard/students", label: "Students", icon: Users },
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DashboardNav({
  orientation = "vertical",
}: {
  orientation?: "vertical" | "horizontal";
}) {
  const pathname = usePathname();

  if (orientation === "horizontal") {
    return (
      <nav className="flex items-center gap-1 overflow-x-auto" aria-label="Dashboard">
        {LINKS.map((link) => {
          const active = isActive(pathname, link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium",
                active
                  ? "bg-accent-soft text-accent"
                  : "text-foreground-muted hover:bg-background-muted hover:text-foreground",
              )}
            >
              <link.icon className="h-4 w-4" aria-hidden="true" />
              {link.label}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav className="flex flex-col gap-1" aria-label="Dashboard">
      {LINKS.map((link) => {
        const active = isActive(pathname, link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium",
              active
                ? "bg-accent-soft text-accent"
                : "text-foreground-muted hover:bg-background-muted hover:text-foreground",
            )}
          >
            <link.icon className="h-[18px] w-[18px]" aria-hidden="true" />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
