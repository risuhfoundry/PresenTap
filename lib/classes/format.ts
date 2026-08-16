import type { ClassRow } from "@/lib/types";

/**
 * Display name for a class: `name` joined with `section` as `name-section`
 * (e.g. "11-A"). When no section is set, returns just the name. Pure, no DB.
 */
export function classDisplayName(klass: {
  name: string;
  section: string | null | undefined;
}): string {
  const section = klass.section?.trim();
  if (section) return `${klass.name}-${section}`;
  return klass.name;
}

/** True when the class is archived (hidden from active lists). */
export function isClassArchived(klass: Pick<ClassRow, "status">): boolean {
  return klass.status === "archived";
}
