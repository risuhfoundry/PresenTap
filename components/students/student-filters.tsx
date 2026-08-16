"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { classDisplayName } from "@/lib/classes/format";
import type { ClassOption } from "@/components/students/student-form";

/**
 * Search + class filter bar for the students list (Phase 3). Database-backed
 * search: submitting builds a `?q=&classId=&archived=` query that the server
 * component reads. The class picker is populated from org-scoped active classes.
 */
export function StudentFilters({
  classes,
  q = "",
  classId = "",
  includeArchived = false,
}: {
  classes: ClassOption[];
  q?: string;
  classId?: string;
  includeArchived?: boolean;
}) {
  const router = useRouter();
  const [query, setQuery] = React.useState(q);
  const [selectedClass, setSelectedClass] = React.useState(classId);
  const [archived, setArchived] = React.useState(includeArchived);

  const hasFilters = Boolean(q || classId || includeArchived);

  function buildHref(next: {
    q?: string;
    classId?: string;
    archived?: boolean;
  }): string {
    const params = new URLSearchParams();
    if (next.q) params.set("q", next.q);
    if (next.classId) params.set("classId", next.classId);
    if (next.archived) params.set("archived", "1");
    const qs = params.toString();
    return qs ? `/dashboard/students?${qs}` : "/dashboard/students";
  }

  function apply(next: {
    q?: string;
    classId?: string;
    archived?: boolean;
  }) {
    router.push(buildHref(next));
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
      <form
        className="flex flex-1 flex-col gap-2 sm:min-w-[240px]"
        onSubmit={(e) => {
          e.preventDefault();
          apply({ q: query.trim(), classId: selectedClass, archived });
        }}
      >
        <label htmlFor="student-search" className="sr-only">
          Search students
        </label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted"
            aria-hidden="true"
          />
          <Input
            id="student-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, roll number, or ID…"
            className="pl-9"
          />
        </div>
      </form>

      <div className="flex flex-col gap-2">
        <label htmlFor="filter-class" className="sr-only">
          Filter by class
        </label>
        <Select
          id="filter-class"
          value={selectedClass}
          onChange={(e) => {
            setSelectedClass(e.target.value);
            apply({ q: query.trim(), classId: e.target.value, archived });
          }}
          className="sm:w-48"
        >
          <option value="">All classes</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {classDisplayName(c)}
            </option>
          ))}
        </Select>
      </div>

      <label className="flex h-10 items-center gap-2 text-sm text-foreground-muted">
        <input
          type="checkbox"
          checked={archived}
          onChange={(e) => {
            setArchived(e.target.checked);
            apply({ q: query.trim(), classId: selectedClass, archived: e.target.checked });
          }}
          className="h-4 w-4 rounded border-border text-accent focus:ring-accent-ring"
        />
        Include archived
      </label>

      {hasFilters ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setQuery("");
            setSelectedClass("");
            setArchived(false);
            router.push("/dashboard/students");
          }}
        >
          <X className="h-4 w-4" aria-hidden="true" />
          Clear
        </Button>
      ) : null}
    </div>
  );
}
